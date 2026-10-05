import { userApi } from "@/api/userApi";
import type { LibraryContents, LibraryGroup, LibraryPort } from "./Library";

const path = (key: { organisationTypeCode: string; registrationNo: string }) =>
	`${encodeURIComponent(key.organisationTypeCode)}/${encodeURIComponent(key.registrationNo)}`;

/** The backend's library routes. */
export const libraryApi: LibraryPort = {
	load: async () => (await userApi.get<LibraryContents>("/library")).data,
	addFavourite: async (key) => {
		await userApi.put(`/library/favourites/${path(key)}`);
	},
	removeFavourite: async (key) => {
		await userApi.delete(`/library/favourites/${path(key)}`);
	},
	createGroup: async (name) => (await userApi.post<LibraryGroup>("/library/groups", { name })).data,
	deleteGroup: async (groupId) => {
		await userApi.delete(`/library/groups/${groupId}`);
	},
	addToGroup: async (groupId, key) => {
		await userApi.put(`/library/groups/${groupId}/companies/${path(key)}`);
	},
	removeFromGroup: async (groupId, key) => {
		await userApi.delete(`/library/groups/${groupId}/companies/${path(key)}`);
	},
};
