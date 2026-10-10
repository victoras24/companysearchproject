import type { ICartItem } from "@/gEntities";
import { makeObservable, observable, action, computed } from "mobx";
import { toast } from "sonner";

const CART_STORAGE_KEY = "user_cart_items";

type CartStorage = Pick<Storage, "getItem" | "setItem">;

/** What names an organisation in the cart: its type code together with its registration number. */
type CartKey = Pick<ICartItem, "organisationTypeCode" | "registrationNo">;

const idOf = (key: CartKey) =>
	`${key.organisationTypeCode.trim().toUpperCase()}/${key.registrationNo.trim()}`;

// Items saved before the cart knew organisation types have no type code and cannot be ordered.
const isCartItem = (item: unknown): item is ICartItem => {
	const candidate = item as Partial<ICartItem> | null;
	return (
		typeof candidate?.organisationTypeCode === "string" &&
		candidate.organisationTypeCode.trim() !== "" &&
		typeof candidate.registrationNo === "string" &&
		candidate.registrationNo.trim() !== ""
	);
};

export class CartModel {
	@observable accessor cartItems: ICartItem[] = [];
	@observable accessor isLoading: boolean = false;

	private readonly storage: CartStorage;

	constructor(storage: CartStorage = localStorage) {
		this.storage = storage;
		makeObservable(this);
		this.isLoading = false;
		this.loadCartFromStorage();
	}

	@action
	loadCartFromStorage = () => {
		try {
			const savedCart = this.storage.getItem(CART_STORAGE_KEY);
			if (savedCart) {
				const items: unknown = JSON.parse(savedCart);
				this.cartItems = Array.isArray(items) ? items.filter(isCartItem) : [];
			}
		} catch (error) {
			console.error("Failed to load cart from localStorage:", error);
			this.cartItems = [];
		}
	};

	@action
	saveCartToStorage = () => {
		try {
			this.storage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cartItems));
		} catch (error) {
			console.error("Failed to save cart to localStorage:", error);
			toast.error("Failed to save your cart. Please try again.");
		}
	};

	@action
	addItem = (item: ICartItem) => {
		const id = idOf(item);
		const existingItem = this.cartItems.find((cartItem) => idOf(cartItem) === id);
		if (existingItem) {
			toast.warning(
				`The report for ${item.organisationName} is already in the cart`
			);
		} else {
			this.cartItems.push(item);
			this.saveCartToStorage(); // Save to localStorage after adding
			toast.success("Full Company Report added to cart", { description: item.organisationName });
		}
	};

	@action
	removeItem = (key: CartKey) => {
		const id = idOf(key);
		const itemToRemove = this.cartItems.find((item) => idOf(item) === id);
		this.cartItems = this.cartItems.filter((item) => idOf(item) !== id);
		this.saveCartToStorage(); // Save to localStorage after removing

		if (itemToRemove) {
			toast.success(`Removed ${itemToRemove.organisationName} from your cart`);
		}
	};

	@action
	clearCart = () => {
		this.cartItems = [];
		this.saveCartToStorage();
	};

	/** Whether this organisation's report is in the cart. */
	has = (key: { organisationTypeCode?: string | null; registrationNo?: string | null }): boolean => {
		if (!key.organisationTypeCode || !key.registrationNo) return false;
		const id = idOf({ organisationTypeCode: key.organisationTypeCode, registrationNo: key.registrationNo });
		return this.cartItems.some((item) => idOf(item) === id);
	};

	@computed
	get itemCount() {
		return this.cartItems.length;
	}
}
