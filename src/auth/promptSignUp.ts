import { toast } from "sonner";
import { go } from "@/lib/navigation";

/** Tells a signed-out user what a free account would let them do, with the way to make one. */
export function promptSignUp(message: string) {
	toast(message, {
		action: { label: "Create free account", onClick: () => go("/signup") },
	});
}
