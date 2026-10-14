import "../global.css";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { RequireUser } from "./auth/RequireUser";
import SonnerToastProvider from "./context/SonnerToastProvider";
import { ThemeProvider } from "./components/theme-provider";
import { CartStoreProvider } from "./context/CartStore";
import { lazy, Suspense, useEffect } from "react";
import { ScrollToTop } from "./site/ScrollToTop";
import { NotFound } from "./site/NotFound";
import { setNavigator } from "./lib/navigation";

// Each page is loaded when it is first opened, so the home page does not download the rest.
const Home = lazy(() => import("./pages/Home/Home"));
const OrganisationDetails = lazy(() => import("./pages/OrganisationDetails/OrganisationDetails_view"));
const Favorites = lazy(() => import("./pages/Favorites/Favorites_view"));
const Organiser = lazy(() => import("./pages/Organiser/Organiser_view"));
const Tracking = lazy(() => import("./pages/Tracking/Tracking_view"));
const Plans = lazy(() => import("./pages/Plans/Plans_view"));
const Unsubscribe = lazy(() => import("./pages/Alerts/Unsubscribe_view"));
const AuthCallback = lazy(() => import("./pages/Account/AuthCallback"));
const AuthPage = lazy(() => import("./pages/Auth/Auth_view"));
const AccountDetails = lazy(() => import("./pages/AccountDeatails/AccountDetails_view"));
const Cart = lazy(() => import("./pages/Cart/Cart_view"));
const ReturnForm = lazy(() => import("./pages/ReturnForm/ReturnForm_view"));
const PersonOrOrganisation = lazy(() => import("./pages/PersonOrOrganisation/PersonOrOrganisation_view"));
const LegalPage = lazy(() => import("./pages/Legal/Legal_view"));
const Blog = lazy(() => import("./pages/Blog/Blog_view"));
const BlogPost = lazy(() => import("./pages/Blog/BlogPosts_view"));
const AppShell = lazy(() => import("./app/AppShell"));
const Overview = lazy(() => import("./pages/Overview/Overview_view"));
const AppSearch = lazy(() => import("./pages/AppSearch/AppSearch_view"));
const AppCompany = lazy(() => import("./pages/AppCompany/AppCompany_view"));
const AppOfficial = lazy(() => import("./pages/AppOfficial/AppOfficial_view"));
const AppCart = lazy(() => import("./pages/AppCart/AppCart_view"));

const PageLoader = () => (
	<div className="flex items-center justify-center min-h-[200px]">
		<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
	</div>
);

function App() {
	return (
		<CartStoreProvider>
			<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
				<SonnerToastProvider />
				<AppRoutes />
			</ThemeProvider>
		</CartStoreProvider>
	);
}

/** Lets code outside a component, such as a toast's button, go to a page. */
function NavigationBridge() {
	const navigate = useNavigate();
	useEffect(() => {
		setNavigator((path) => navigate(path));
		return () => setNavigator(null);
	}, [navigate]);
	return null;
}

/** An old address of one of the app's screens: goes to the new one, keeping what followed the "?". */
function MovedTo({ to }: { to: string }) {
	const { search } = useLocation();
	return <Navigate to={to + search} replace />;
}

function AppRoutes() {
	return (
		<BrowserRouter>
			<NavigationBridge />
			<ScrollToTop />
			<Suspense fallback={<PageLoader />}>
				<Routes>
					{/* The website: public pages under the site header. The search lives on the home page. */}
					<Route index element={<Home />} />
					<Route path="cyprus-company-search" element={<Home />} />
					<Route
						path="cyprus-company-search/:typeCode/:registrationNo"
						element={<OrganisationDetails />}
					/>
					<Route
						path="official/:personOrOrganisationName"
						element={<PersonOrOrganisation />}
					/>
					<Route path="cart" element={<Cart />} />
					<Route path="payment-result" element={<ReturnForm />} />
					<Route path="blog" element={<Blog />} />
					<Route path="blog/:slug" element={<BlogPost />} />
					<Route path="legal-disclaimer" element={<LegalPage doc="disclaimer" />} />
					<Route path="terms" element={<LegalPage doc="terms" />} />

					<Route path="login" element={<AuthPage form="login" />} />
					<Route path="signup" element={<AuthPage form="signup" />} />
					<Route path="forgot-password" element={<AuthPage form="forgot" />} />
					<Route path="reset-password" element={<AuthPage form="reset" />} />
					<Route path="auth/callback" element={<AuthCallback />} />

					{/* The web app: a signed-in user's screens, inside its own shell. */}
					<Route
						path="app"
						element={
							<RequireUser>
								<AppShell />
							</RequireUser>
						}
					>
						<Route index element={<Overview />} />
						<Route path="search" element={<AppSearch />} />
						<Route path="company/:typeCode/:registrationNo" element={<AppCompany />} />
						<Route path="official/:name" element={<AppOfficial />} />
						<Route path="saved" element={<Favorites />} />
						<Route path="groups" element={<Organiser />} />
						<Route path="tracking" element={<Tracking />} />
						<Route path="plans" element={<Plans />} />
						<Route path="account" element={<AccountDetails />} />
						<Route path="cart" element={<AppCart />} />
					</Route>

					{/* Where the app's screens used to live: emails and the payment provider still send users there. */}
					<Route path="favorites" element={<MovedTo to="/app/saved" />} />
					<Route path="organiser" element={<MovedTo to="/app/groups" />} />
					<Route path="tracking" element={<MovedTo to="/app/tracking" />} />
					<Route path="plans" element={<MovedTo to="/app/plans" />} />
					<Route path="account" element={<MovedTo to="/app/account" />} />
					<Route path="alerts/unsubscribe" element={<Unsubscribe />} />

					<Route path="*" element={<NotFound />} />
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
}

export default App;
