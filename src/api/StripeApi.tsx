import type { ICartItem } from "@/gEntities";
import axios from "axios";

export class StripeApi {
	controller: string = `${import.meta.env.VITE_API_URL}/api`;
	/**
	 *
	 */
	constructor() {}

	createCheckoutSession = async (orderItem: ICartItem[]) => {
		const res = await axios.post(`${this.controller}/create-checkout-session`, {
			orderItem,
		});
		return res.data;
	};

	getSessionStatus = async (sessionId: string) => {
		const res = axios.get(`${this.controller}/session-status`, {
			params: {
				session_id: sessionId,
			},
		});
		console.log(res);
		return res;
	};
}

const instance = new StripeApi();
export default instance;
