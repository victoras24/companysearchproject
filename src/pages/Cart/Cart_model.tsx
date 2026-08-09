import type { ICartItem } from "@/gEntities";
import { makeObservable, observable, action, computed } from "mobx";
import { toast } from "sonner";

const CART_STORAGE_KEY = "user_cart_items";

export class CartModel {
	@observable accessor cartItems: ICartItem[] = [];
	@observable accessor isLoading: boolean = false;

	constructor() {
		makeObservable(this);
		this.isLoading = false;
		this.loadCartFromStorage();
	}

	@action
	loadCartFromStorage = () => {
		try {
			const savedCart = localStorage.getItem(CART_STORAGE_KEY);
			if (savedCart) {
				this.cartItems = JSON.parse(savedCart);
			}
		} catch (error) {
			console.error("Failed to load cart from localStorage:", error);
			this.cartItems = [];
		}
	};

	@action
	saveCartToStorage = () => {
		try {
			localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cartItems));
		} catch (error) {
			console.error("Failed to save cart to localStorage:", error);
			toast.error("Failed to save your cart. Please try again.");
		}
	};

	@action
	subtotal = () => {
		return this.cartItems.reduce(
			(total: number, item: ICartItem) => total + item.unitPrice,
			0
		);
	};

	@action
	addItem = (item: ICartItem) => {
		window.console.log(item);
		const existingItem = this.cartItems.find(
			(cartItem) => cartItem.companyRegNo === item.companyRegNo
		);
		window.console.log(existingItem);
		if (existingItem) {
			toast.warning(
				`The report for ${item.companyName} is already in the cart`
			);
		} else {
			this.cartItems.push(item);
			this.saveCartToStorage(); // Save to localStorage after adding
			toast.success(`Added ${item.companyName} to your cart`);
		}
	};

	@action
	removeItem = (id: number | string) => {
		const itemToRemove = this.cartItems.find(
			(item) => item.companyRegNo === id
		);
		this.cartItems = this.cartItems.filter((item) => item.companyRegNo !== id);
		this.saveCartToStorage(); // Save to localStorage after removing

		if (itemToRemove) {
			toast.success(`Removed ${itemToRemove.companyName} from your cart`);
		}
	};

	@action
	clearCart = () => {
		this.cartItems = [];
		this.saveCartToStorage();
		toast.success("Cart cleared");
	};

	@computed
	get itemCount() {
		return this.cartItems.length;
	}
}
