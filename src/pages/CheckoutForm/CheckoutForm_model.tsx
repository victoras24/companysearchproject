import { action } from "mobx";
import StripeApi, { StripeApi as IStripeApi } from "../../api/StripeApi";
import { toast } from "sonner";

export class CheckoutFormModel {
	options: any;
	StripeApi: IStripeApi;
	/**
	 *
	 */
	constructor() {
		this.StripeApi = StripeApi;
	}

	@action
	createCheckoutSession = async (totalAmount: number, quantiy: number) => {
		const res = await this.StripeApi.createCheckoutSession(
			totalAmount,
			quantiy
		);
		return res;
	};

	@action
	checkSessionStatus = async (sessionId: string) => {
		try {
			const res = await this.StripeApi.getSessionStatus(sessionId);
			console.log("Session Status:", res.data.status);
			console.log("Customer Email:", res.data.customer_email);
			if (res.data.status === "complete") {
				toast.success("You have succesfully ordered!");
			} else if (res.data.status === "open") {
				toast.error("Please try again");
			}
		} catch (error) {
			console.error("Failed to get session status:", error);
		}
	};
}
