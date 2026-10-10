import { describe, expect, it } from "vitest";
import { CartModel } from "./Cart_model";

const CART_STORAGE_KEY = "user_cart_items";

const adminico = {
	organisationTypeCode: "C",
	registrationNo: "60580",
	organisationName: "ADMINICO MANAGEMENT SERVICES LIMITED",
};
const sweets = { organisationTypeCode: "B", registrationNo: "60580", organisationName: "2 ALPHA SWEETS" };
const beta = { organisationTypeCode: "C", registrationNo: "11", organisationName: "BETA HOLDINGS LTD" };

/** The browser's storage in memory, optionally holding a cart saved earlier. */
function memoryStorage(savedCart?: unknown) {
	const data = new Map<string, string>();
	if (savedCart !== undefined) data.set(CART_STORAGE_KEY, JSON.stringify(savedCart));
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => {
			data.set(key, value);
		},
	};
}

const names = (cart: CartModel) => cart.cartItems.map((item) => item.organisationName);

describe("CartModel", () => {
	it("holds one report per organisation", () => {
		const cart = new CartModel(memoryStorage());

		cart.addItem(adminico);
		cart.addItem(adminico);
		cart.addItem({ ...adminico, organisationTypeCode: "c", registrationNo: " 60580 " });

		expect(names(cart)).toEqual(["ADMINICO MANAGEMENT SERVICES LIMITED"]);
		expect(cart.itemCount).toBe(1);
	});

	it("takes the same registration number under another type as a different organisation", () => {
		const cart = new CartModel(memoryStorage());

		cart.addItem(adminico);
		cart.addItem(sweets);

		expect(names(cart)).toEqual(["ADMINICO MANAGEMENT SERVICES LIMITED", "2 ALPHA SWEETS"]);
	});

	it("removes the organisation named by type code and registration number, and no other", () => {
		const cart = new CartModel(memoryStorage());
		cart.addItem(adminico);
		cart.addItem(sweets);
		cart.addItem(beta);

		cart.removeItem({ organisationTypeCode: "C", registrationNo: "60580" });

		expect(names(cart)).toEqual(["2 ALPHA SWEETS", "BETA HOLDINGS LTD"]);
	});

	it("keeps its items for the next visit", () => {
		const storage = memoryStorage();
		const cart = new CartModel(storage);
		cart.addItem(adminico);
		cart.addItem(sweets);
		cart.removeItem(adminico);

		const next = new CartModel(storage);

		expect(next.cartItems).toEqual([sweets]);
	});

	it("drops stored items that have no type code when it loads", () => {
		const storage = memoryStorage([
			{ companyName: "OLD CART LIMITED", companyRegNo: "123", unitPrice: 39.99 },
			beta,
			{ registrationNo: "77", organisationName: "NO TYPE LTD" },
		]);

		const cart = new CartModel(storage);

		expect(cart.cartItems).toEqual([beta]);
	});

	it("starts empty when what is stored is not a list", () => {
		expect(new CartModel(memoryStorage({ items: [] })).cartItems).toEqual([]);
		expect(new CartModel(memoryStorage("nonsense")).cartItems).toEqual([]);
	});

	it("is empty after it is cleared, and stays empty on the next visit", () => {
		const storage = memoryStorage();
		const cart = new CartModel(storage);
		cart.addItem(adminico);

		cart.clearCart();

		expect(cart.cartItems).toEqual([]);
		expect(new CartModel(storage).cartItems).toEqual([]);
	});

	it("says whether an organisation's report is in it, whatever the case and spacing of its key", () => {
		const cart = new CartModel(memoryStorage());
		cart.addItem(adminico);

		expect(cart.has(adminico)).toBe(true);
		expect(cart.has({ organisationTypeCode: "c", registrationNo: " 60580 " })).toBe(true);
		expect(cart.has(sweets)).toBe(false);
		expect(cart.has({ organisationTypeCode: null, registrationNo: "60580" })).toBe(false);
	});

	it("keeps what it was told about an organisation's status and registration date", () => {
		const storage = memoryStorage();
		new CartModel(storage).addItem({ ...adminico, statusGroup: "at-risk", registrationDate: "04/03/2014" });

		const [item] = new CartModel(storage).cartItems;
		expect(item.statusGroup).toBe("at-risk");
		expect(item.registrationDate).toBe("04/03/2014");
	});
});
