import Layout from "./layout";
import "../global.css";
import { BrowserRouter, Route, Routes } from "react-router";
import { Search } from "./pages/Search/Search_view";
import { RequireUser } from "./auth/RequireUser";
import OrganisationDetails from "./pages/OrganisationDetails/OrganisationDetails_view";
import Favorites from "./pages/Favorites/Favorites_view";
import Organiser from "./pages/Organiser/Organiser_view";
import Tracking from "./pages/Tracking/Tracking_view";
import AuthCallback from "./pages/Account/AuthCallback";
import ResetPassword from "./pages/Account/ResetPassword";
import SonnerToastProvider from "./context/SonnerToastProvider";
import AccountDetails from "./pages/AccountDeatails/AccountDetails_view";
import { ThemeProvider } from "./components/theme-provider";
import Cart from "./pages/Cart/Cart_view";
import { CartStoreProvider } from "./context/CartStore";
import ReturnForm from "./pages/ReturnForm/ReturnForm_view";
import { lazy, Suspense } from "react";
import PersonOrOrganisation from "./pages/PersonOrOrganisation/PersonOrOrganisation_view";
import LegalDisclaimer from "./pages/Legal/LegalDisclaimer_view";
import TermsOfService from "./pages/Legal/TermsOfService_view";
import Blog from "./pages/Blog/Blog_view";
import BlogPost from "./pages/Blog/BlogPosts_view";

const Home = lazy(() => import("./pages/Home/Home"));

const PageLoader = () => (
	<div className="flex items-center justify-center min-h-[200px]">
		<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
	</div>
);

function App() {
	console.log("App rendered");

	return (
		<CartStoreProvider>
			<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
				<SonnerToastProvider />
				<AppRoutes />
			</ThemeProvider>
		</CartStoreProvider>
	);
}

function AppRoutes() {
	return (
		<BrowserRouter>
			<Suspense fallback={<PageLoader />}>
				<Routes>
					<Route path="/" element={<Layout />}>
						<Route index element={<Home />} />
						<Route path="cyprus-company-search" element={<Search />} />
						<Route
							path="cyprus-company-search/:typeCode/:registrationNo"
							element={<OrganisationDetails />}
						/>
						<Route
							path="favorites"
							element={
								<RequireUser>
									<Favorites />
								</RequireUser>
							}
						/>
						<Route
							path="official/:personOrOrganisationName"
							element={<PersonOrOrganisation />}
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
						<Route path="auth/callback" element={<AuthCallback />} />
						<Route path="reset-password" element={<ResetPassword />} />
						<Route path="cart" element={<Cart />} />
						<Route path="blog" element={<Blog />} />
						<Route path="/blog/:slug" element={<BlogPost />} />

						<Route path="/payment-result" element={<ReturnForm />} />
						<Route path="/legal-disclaimer" element={<LegalDisclaimer />} />
						<Route path="/terms" element={<TermsOfService />} />
					</Route>
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
}

export default App;
