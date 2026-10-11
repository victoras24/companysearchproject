// What the app's Save, Track and Report buttons do, wherever they are: the change itself, the
// question before one that is final or costs a swap, and the line that says what happened.

import { toast } from "sonner";
import { reportPrice } from "@/checkout";
import type { ICartItem } from "@/gEntities";
import { go } from "@/lib/navigation";
import { library, toLibraryCompany, type LibraryCompany, type SavableOrganisation } from "@/library";
import type { CartModel } from "@/pages/Cart/Cart_model";
import { planLabel } from "@/plans";
import { tracking, type TrackableOrganisation } from "@/tracking";
import { ask } from "./dialog";
import { APP, organisationId, trackedPath } from "./routes";

type Action = { label: string; onClick: () => void };

/** One line at the bottom of the screen, with at most one thing to do about it. */
export function flash(message: string, action?: Action) {
	toast(message, { duration: 4200, action });
}

const seePlans: Action = { label: "See plans", onClick: () => go(APP.plans) };

const nameOf = (organisation: { organisationName?: string | null }) => organisation.organisationName ?? "this company";

/** Saves a company, or takes it out of the saved ones. */
export async function toggleSave(organisation: SavableOrganisation) {
	const company = toLibraryCompany(organisation);
	if (library.isSaved(company)) return removeSaved(company);

	const result = await library.toggleFavourite(company);
	if (!result.ok) return toast.error("That company could not be saved. Please try again.");

	const id = organisationId(company);
	flash(`Saved ${nameOf(company)}.`, {
		label: "Add to group",
		onClick: () => go(id ? `${APP.saved}?group=${encodeURIComponent(id)}` : APP.saved),
	});
}

/** Takes a company out of the saved ones, with a way to put it back. */
export async function removeSaved(company: LibraryCompany) {
	const result = await library.removeFavourite(company);
	if (!result.ok) return toast.error("That company could not be removed. Please try again.");

	flash(`Removed ${nameOf(company)}.`, {
		label: "Undo",
		onClick: async () => {
			if (library.isSaved(company)) return;
			const restored = await library.toggleFavourite(company);
			if (!restored.ok) toast.error("That company could not be saved again.");
		},
	});
}

/** Tracks a company, or stops tracking it, asking first where the plan makes it final or a swap. */
export function toggleTrack(organisation: TrackableOrganisation) {
	const availability = tracking.availability(organisation);
	if (availability === "unknown") return;
	if (availability === "tracked") return stopTracking(organisation);

	const name = nameOf(organisation);
	const plan = planLabel(tracking.plan);

	if (availability === "no-swap") return flash("No swaps left this month.", seePlans);
	if (availability === "no-slot") {
		return flash(
			tracking.plan === "free" ? "Free tracks one company. Upgrade to track more." : `No slots left on ${plan}.`,
			seePlans
		);
	}

	const start = async () => {
		const result = await tracking.track(organisation);
		if (!result.ok) return toast.error(result.message);
		flash(`Tracking ${name}. First check is running.`, { label: "View", onClick: () => go(trackedPath(organisation)) });
	};

	if (availability === "swap") {
		const full = tracking.slotsUsed >= tracking.slots ? `All ${tracking.slots} slots are used. ` : "";
		return ask(
			{
				title: `Use a swap for ${name}?`,
				body: `${full}Tracking this company uses 1 of your ${tracking.swapsLeft} swaps left this month.`,
				confirm: "Use a swap",
			},
			start
		);
	}

	// With no swaps a slot is used for good, so the user agrees to it first.
	if (tracking.swapsAMonth === 0) {
		const unused = tracking.slots - tracking.slotsUsed;
		return ask(
			{
				title: `Track ${name}?`,
				body:
					tracking.plan === "free"
						? "This is your one free tracked company and can't be changed."
						: `This uses ${unused === 1 ? "your last unused slot" : `1 of your ${unused} unused slots`} for good: ${plan} has no swaps.`,
				confirm: "Track",
			},
			start
		);
	}

	void start();
}

/** Stops tracking, where the plan lets a tracked company go. */
export function stopTracking(organisation: TrackableOrganisation) {
	const name = nameOf(organisation);

	if (tracking.untrackRefusal) {
		return flash(
			tracking.plan === "free"
				? "Your one free tracked company can't be changed."
				: `${planLabel(tracking.plan)} has no swaps, so a tracked company can't be changed.`,
			seePlans
		);
	}

	ask(
		{
			title: `Stop tracking ${name}?`,
			body: `Its slot stays used. Tracking another company into it counts as a swap (${tracking.swapsLeft} left this month).`,
			confirm: "Stop tracking",
			danger: true,
		},
		async () => {
			const result = await tracking.untrack(organisation);
			if (result.ok) flash(`Stopped tracking ${name}.`);
			else toast.error(result.message);
		}
	);
}

/** Puts a company's report in the cart; for one already there, opens the cart. */
export function orderReport(cart: CartModel, item: ICartItem) {
	if (cart.has(item)) return go(APP.cart);

	cart.addItem(item, { announce: false });
	flash(`Full Company Report added to cart · ${reportPrice()}`, { label: "Checkout", onClick: () => go(APP.cart) });
}
