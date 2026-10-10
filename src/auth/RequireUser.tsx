import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { observer } from "mobx-react";
import { auth } from "./index";
import { routeFor } from "./credentials";

export const SessionLoader = () => (
	<div className="flex items-center justify-center min-h-[200px]">
		<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
	</div>
);

/** A page that needs a user: anyone else is sent to log in, and comes back to it afterwards. */
export const RequireUser = observer(({ children }: { children: ReactNode }) => {
	const location = useLocation();
	const route = routeFor(auth.state);
	if (route === "loading") return <SessionLoader />;
	if (route === "sign-in") {
		return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
	}
	return <>{children}</>;
});
