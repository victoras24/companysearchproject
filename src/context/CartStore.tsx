import { createContext, useContext, useRef, type ReactNode } from "react";
import { CartModel } from "@/pages/Cart/Cart_model";

const CartStoreContext = createContext<CartModel | null>(null);

interface CartStoreProps {
	children: ReactNode;
}

export const CartStoreProvider: React.FC<CartStoreProps> = ({ children }) => {
	// Using useRef ensures we create only one instance of CartModel
	// This prevents the cart from being reset when components re-render
	const storeRef = useRef<CartModel | null>(null);

	if (!storeRef.current) {
		storeRef.current = new CartModel();
	}

	return (
		<CartStoreContext.Provider value={storeRef.current}>
			{children}
		</CartStoreContext.Provider>
	);
};

export const useCartStore = () => {
	const store = useContext(CartStoreContext);
	if (!store) {
		throw new Error("useCartStore must be used within a CartStoreProvider");
	}
	return store;
};
