import Layout from "./layout";
import "../global.css";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router";
import { RequireUser } from "./auth/RequireUser";
import OrganisationDetails from "./pages/OrganisationDetails/OrganisationDetails_view";
import Favorites from "./pages/Favorites/Favorites_view";
import Organiser from "./pages/Organiser/Organiser_view";
import Tracking from "./pages/Tracking/Tracking_view";
import Plans from "./pages/Plans/Plans_view";
import Unsubscribe from "./pages/Alerts/Unsubscribe_view";
import AuthCallback from "./pages/Account/AuthCallback";
import AuthPage from "./pages/Auth/Auth_view";
import SonnerToastProvider from "./context/SonnerToastProvider";
import AccountDetails from "./pages/AccountDeatails/AccountDetails_view";
import { ThemeProvider } from "./components/theme-provider";
import Cart from "./pages/Cart/Cart_view";
import { CartStoreProvider } from "./context/CartStore";
import ReturnForm from "./pages/ReturnForm/ReturnForm_view";
import { lazy, Suspense, useEffect } from "react";
import PersonOrOrganisation from "./pages/PersonOrOrganisation/PersonOrOrganisation_view";
import LegalPage from "./pages/Legal/Legal_view";
import Blog from "./pages/Blog/Blog_view";
import BlogPost from "./pages/Blog/BlogPosts_view";
import { ScrollToTop } from "./site/ScrollToTop";
import { NotFound } from "./site/NotFound";
import { setNavigator } from "./lib/navigation";

const Home = lazy(() => import("./pages/Home/Home"));

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

					{/* The web app: a signed-in user's pages, beside the sidebar. */}
					<Route element={<Layout />}>
						<Route
							path="favorites"
							element={
								<RequireUser>
									<Favorites />
								</RequireUser>
							}
						/>
						<Route
							path="organiser"
							element={
								<RequireUser>
									<Organiser />
								</RequireUser>
							}
						/>
						<Route
							path="tracking"
							element={
								<RequireUser>
									<Tracking />
								</RequireUser>
							}
						/>
						<Route
							path="account"
							element={
								<RequireUser>
									<AccountDetails />
								</RequireUser>
							}
						/>
						<Route path="plans" element={<Plans />} />
						<Route path="alerts/unsubscribe" element={<Unsubscribe />} />
					</Route>

					<Route path="*" element={<NotFound />} />
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
}

export default App;
