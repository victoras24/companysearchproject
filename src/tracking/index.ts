import { reaction } from "mobx";
import { auth } from "@/auth";
import { SeenChanges } from "./SeenChanges";
import { Tracking } from "./Tracking";
import { trackingApi } from "./trackingApi";

export { changeTitle, checkedText, checkLine, dayText, shortDay } from "./Tracking";
export type {
	Change,
	Filing,
	PendingService,
	TrackableOrganisation,
	TrackedDetails,
	TrackedOrganisation,
} from "./Tracking";

/** The app's one tracking. Components read it inside an observer. */
export const tracking = new Tracking(trackingApi);

/** Which of the user's changes are new to them. Components read it inside an observer. */
export const seenChanges = new SeenChanges({ storage: localStorage });

// They live as long as the session: they load on sign-in and clear on sign-out.
reaction(
	() => (auth.state.status === "signed-in" ? auth.state.profile.id : null),
	(userId) => {
		tracking.followUser(userId);
		seenChanges.followUser(userId);
	},
	{ fireImmediately: true }
);
