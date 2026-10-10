import { checkoutApi } from "@/api/checkoutApi";
import { Checkout, formatPrice } from "./Checkout";
import { ReturningSession } from "./ReturningSession";

export { formatPrice, formatVatIncluded } from "./Checkout";
export type { CheckoutState, Price } from "./Checkout";

/** The app's one checkout. Components read it inside an observer. */
export const checkout = new Checkout({
	port: checkoutApi,
	redirect: (url) => window.location.assign(url),
});

// Back from the payment page, the browser may show this page as it was left, still pending.
window.addEventListener("pageshow", (event) => {
	if (event.persisted) checkout.reset();
});

/** A buyer's return from the payment page; one per visit to the return page. */
export const returningSession = (emptyCart: () => void) =>
	new ReturningSession({ port: checkoutApi, emptyCart });

/** What a report costs when the backend has not said yet, for text that cannot wait for it. */
const USUAL_PRICE = "€39.99";

/** One report's price as text. Read it inside an observer: it follows the backend's price once loaded. */
export const reportPrice = () => (checkout.price ? formatPrice(checkout.price) : USUAL_PRICE);
