import { reaction } from "mobx";
import { auth } from "@/auth";
import { RecentSearches } from "./RecentSearches";

/** The user's latest searches. Components read it inside an observer. */
export const recentSearches = new RecentSearches({ storage: localStorage });

reaction(
	() => (auth.state.status === "signed-in" ? auth.state.profile.id : null),
	(userId) => recentSearches.followUser(userId),
	{ fireImmediately: true }
);
