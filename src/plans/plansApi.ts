import { isAxiosError } from "axios";
import { userApi } from "@/api/userApi";
import type { PlanOffer, PlansPort } from "./Plans";

/** A refusal carries the backend's own words; any other failure is passed on. */
async function saying<T>(request: Promise<{ data: T }>): Promise<T> {
	try {
		return (await request).data;
	} catch (error) {
		const said = isAxiosError(error) ? error.response?.data : null;
		if (typeof said === "string" && said) throw new Error(said);
		throw error;
	}
}

/** The backend's plan routes. */
export const plansApi: PlansPort = {
	list: async () => (await userApi.get<PlanOffer[]>("/plans")).data,
	start: (plan) => saying(userApi.post<{ url: string }>("/plans/checkout", { plan })),
	portal: (to) => saying(userApi.post<{ url: string }>("/plans/portal", to ? { plan: to } : undefined)),
};
