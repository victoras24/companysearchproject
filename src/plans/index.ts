import { Plans } from "./Plans";
import { plansApi } from "./plansApi";

export { arrivalNote, arrivalOf, planLabel, priceText } from "./Plans";
export type { PlanName, PlanOffer } from "./Plans";

/** The app's one plans. Components read it inside an observer. */
export const plans = new Plans({
	port: plansApi,
	redirect: (url) => window.location.assign(url),
});

// Back from the payment provider, the browser may show the page as it was left, still pending.
window.addEventListener("pageshow", (event) => {
	if (event.persisted) plans.reset();
});
