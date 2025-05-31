import axios from "axios";

export class StripeApi {
	controller: string = `${import.meta.env.VITE_API_URL}/api`;
	/**
	 *
	 */
	constructor() {}

	createCheckoutSession = async (totalAmount: number, quantity: number) => {
		const res = await axios.post(`${this.controller}/create-checkout-session`, {
			totalAmount,
			quantity,
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
