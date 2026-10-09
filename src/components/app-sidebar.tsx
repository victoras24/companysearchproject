import {
	FileText,
	Group,
	Heart,
	Home,
	Radar,
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
import { auth } from "@/auth";
import { NavUser } from "./sidebar-user";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/context/CartStore";
import { observer } from "mobx-react";

export const AppSidebar = observer(() => {
	const state = auth.state;
	const cartStore = useCartStore();

	const items = [
		{
			title: "Home",
			url: "/",
			icon: Home,
		},
		{
			title: "Search",
			url: "/cyprus-company-search",
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
			title: "Tracking",
			url: "/tracking",
			icon: Radar,
		},
		{
			title: state.status === "signed-out" ? "Login" : "Account",
			url: "/account",
			icon: ScanFace,
		},
		{
			title: "Blog",
			url: "/blog",
			icon: FileText,
		},
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
													{item.title === "Cart" ? (
														<span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-foreground text-xs font-semibold text-secondary">
															{cartStore.itemCount}
														</span>
													) : (
														""
													)}
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
			{state.status === "signed-in" && (
				<NavUser
					user={{
						name: state.profile.fullName || state.profile.email,
						email: state.profile.email,
						avatar: "",
					}}
				/>
			)}
			{state.status === "checking" && <Skeleton className="h-12 mx-2 mb-3" />}
		</Sidebar>
	);
});
