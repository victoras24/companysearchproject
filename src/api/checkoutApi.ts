import axios from "axios";
import type { CheckoutPort, Price } from "@/checkout/Checkout";
import type { SessionAnswer, SessionPort } from "@/checkout/ReturningSession";
import { userApi } from "./userApi";

/**
 * The backend's checkout routes. They go through `userApi` so that a signed-in buyer's order
 * carries their token; a guest's request carries none.
 */
export const checkoutApi: CheckoutPort & SessionPort = {
	price: async () => (await userApi.get<Price>("/checkout/price")).data,
	start: async (items) => (await userApi.post<{ url: string }>("/checkout", { items })).data,
	session: async (sessionId) => {
		try {
			return (await userApi.get<SessionAnswer>(`/checkout/sessions/${encodeURIComponent(sessionId)}`)).data;
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 404) return null;
			throw error;
		}
	},
};
