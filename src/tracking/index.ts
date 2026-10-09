import { reaction } from "mobx";
import { auth } from "@/auth";
import { Tracking } from "./Tracking";
import { trackingApi } from "./trackingApi";

export { checkLine, dayText } from "./Tracking";
export type { Change, Filing, PendingService, TrackedDetails, TrackedOrganisation } from "./Tracking";

/** The app's one tracking. Components read it inside an observer. */
export const tracking = new Tracking(trackingApi);

// It lives as long as the session: it loads on sign-in and clears on sign-out.
reaction(
	() => (auth.state.status === "signed-in" ? auth.state.profile.id : null),
	(userId) => tracking.followUser(userId),
	{ fireImmediately: true }
);
