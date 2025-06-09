import Layout from "./layout";
import "../global.css";
import { BrowserRouter, Route, Routes } from "react-router";
import { Search } from "./pages/Search/Search_view";
import { AuthProvider, useAuth } from "./context/AuthStoreContext";
import { SavedCompanyProvider } from "./context/SaveCompanyContext";
import OrganisationDetails from "./pages/OrganisationDetails/OrganisationDetails_view";
import Favorites from "./pages/Favorites/Favorites_view";
import Organiser from "./pages/Organiser/Organiser_view";
import Account from "./pages/Account/Account";
import SonnerToastProvider from "./context/SonnerToastProvider";
import AccountDetails from "./pages/AccountDeatails/AccountDetails_view";
import { ThemeProvider } from "./components/theme-provider";
import Cart from "./pages/Cart/Cart_view";
import { CartStoreProvider } from "./context/CartStore";
import ReturnForm from "./pages/ReturnForm/ReturnForm_view";
import { lazy, Suspense } from "react";
import PersonOrOrganisation from "./pages/PersonOrOrganisation/PersonOrOrganisation_view";
const Home = lazy(() => import("./pages/Home/Home"));

const PageLoader = () => (
	<div className="flex items-center justify-center min-h-[200px]">
		<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
	</div>
);

function App() {
	return (
		<AuthProvider>
			<SavedCompanyProvider>
				<CartStoreProvider>
					<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
						<SonnerToastProvider />
						<AppRoutes />
					</ThemeProvider>
				</CartStoreProvider>
			</SavedCompanyProvider>
		</AuthProvider>
	);
}

function AppRoutes() {
	const { user } = useAuth();
	return (
		<BrowserRouter>
			<Suspense fallback={<PageLoader />}>
				<Routes>
					<Route path="/" element={<Layout />}>
						<Route index element={<Home />} />
						<Route path="search" element={<Search />} />
						<Route path="search/:companyId" element={<OrganisationDetails />} />
						<Route
							path="favorites"
							element={user ? <Favorites /> : <Account />}
						/>
						<Route
							path="official/:personOrOrganisationName"
							element={<PersonOrOrganisation />}
						/>

						<Route
							path="organiser"
							element={user ? <Organiser /> : <Account />}
						/>
						<Route
							path="account"
							element={user ? <AccountDetails /> : <Account />}
						/>
						<Route path="cart" element={<Cart />} />

						<Route path="/payment-result" element={<ReturnForm />} />
					</Route>
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
}

export default App;
