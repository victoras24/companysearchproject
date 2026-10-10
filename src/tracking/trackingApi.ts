import { isAxiosError } from "axios";
import { userApi } from "@/api/userApi";
import { SLOT_USED, type TrackedDetails, type TrackingContents, type TrackingPort } from "./Tracking";

const path = (key: { organisationTypeCode: string; registrationNo: string }) =>
	`${encodeURIComponent(key.organisationTypeCode)}/${encodeURIComponent(key.registrationNo)}`;

/** The backend's tracking routes. */
export const trackingApi: TrackingPort = {
	load: async () => (await userApi.get<TrackingContents>("/tracking")).data,
	track: async (key) => {
		try {
			await userApi.put(`/tracking/${path(key)}`);
		} catch (error) {
			// 409: the plan has no slot left, or no swap; the backend says which.
			if (isAxiosError(error) && error.response?.status === 409) {
				const reason = error.response.data;
				throw new Error(typeof reason === "string" && reason ? reason : SLOT_USED);
			}
			throw error;
		}
	},
	untrack: async (key) => {
		await userApi.delete(`/tracking/${path(key)}`);
	},
	activate: async (key, inPlaceOf) => {
		await userApi.put(`/tracking/${path(key)}/active`, inPlaceOf ? { inPlaceOf } : undefined);
	},
	details: async (key) => (await userApi.get<TrackedDetails>(`/tracking/${path(key)}`)).data,
};
