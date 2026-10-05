import type { ReactNode } from "react";
import { observer } from "mobx-react";
import Account from "@/pages/Account/Account";
import { auth } from "./index";
import { routeFor } from "./credentials";

export const SessionLoader = () => (
	<div className="flex items-center justify-center min-h-[200px]">
		<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
	</div>
);

/** A page that needs a user: the sign-in page stands in for it until someone is signed in. */
export const RequireUser = observer(({ children }: { children: ReactNode }) => {
	const route = routeFor(auth.state);
	if (route === "loading") return <SessionLoader />;
	if (route === "sign-in") return <Account />;
	return <>{children}</>;
});
