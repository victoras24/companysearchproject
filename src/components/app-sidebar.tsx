import {
	FileText,
	Group,
	Heart,
	Home,
	ScanFace,
	Search,
	ShoppingCart,
} from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthStoreContext";
import { NavUser } from "./sidebar-user";
import { getAuth } from "firebase/auth";

export function AppSidebar() {
	const { user } = useAuth();
	const auth = getAuth();

	const items = [
		{
			title: "Home",
			url: "/",
			icon: Home,
		},
		{
			title: "Search",
			url: "/search",
			icon: Search,
		},
		{
			title: "Favorites",
			url: "/favorites",
			icon: Heart,
		},
		{
			title: "Organiser",
			url: "/organiser",
			icon: Group,
		},
		{
			title: `${user ? "Account" : "Login"}`,
			url: "/account",
			icon: ScanFace,
		},
		{
			title: "Blog",
			url: "/blog",
			icon: FileText,
		},
		,
		{
			title: "Cart",
			url: "/cart",
			icon: ShoppingCart,
		},
	];

	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="my-5 p-0">
						<img
							src="/fullGroup.svg"
							alt="Company search cyprus logo"
							className="w-50 h-56"
						/>
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="mt-5">
							{items.map((item) => {
								return (
									item && (
										<SidebarMenuItem key={item.title}>
											<SidebarMenuButton asChild>
												<a href={item.url}>
													<item.icon />
													<span>{item.title}</span>
												</a>
											</SidebarMenuButton>
										</SidebarMenuItem>
									)
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			{user ? (
				<NavUser
					user={{
						name: user.username,
						email: user.email,
						avatar: auth.currentUser?.photoURL ?? "",
					}}
				/>
			) : (
				""
			)}
		</Sidebar>
	);
}
