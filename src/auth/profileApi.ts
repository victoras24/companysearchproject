import { userApi } from "@/api/userApi";
import type { Profile, ProfilePort } from "./AuthSession";

/** The backend's profile routes. The first load of a new user also creates their profile. */
export const profileApi: ProfilePort = {
	load: async () => (await userApi.get<Profile>("/me")).data,
	update: async (changes) => (await userApi.patch<Profile>("/me", changes)).data,
};
