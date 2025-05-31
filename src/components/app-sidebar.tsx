import {
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
import { ModeToggle } from "./mode-toggle";

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
		title: "Account",
		url: "/account",
		icon: ScanFace,
	},
	{
		title: "Cart",
		url: "/cart",
		icon: ShoppingCart,
	},
];

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>KYCy</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<a href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<ModeToggle />
		</Sidebar>
	);
}
