import React from "react";
import { NavLink } from "react-router-dom";
import { Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Footer: React.FC = () => {
	return (
		<footer className="bg-background border-t">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
					<div className="space-y-3">
						<h3 className="text-lg font-medium">Cyprus Company Search</h3>
						<p className="text-sm text-muted-foreground">
							Comprehensive Cyprus company intelligence and business research.
						</p>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Mail className="h-4 w-4" />
							<span>companysearchcy@gmail.com</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-3">
							<h4 className="text-sm font-medium">Pages</h4>
							<nav className="flex flex-col space-y-2">
								<NavLink
									to="/search"
									className="text-xs text-muted-foreground hover:text-primary transition-colors"
								>
									Company Search
								</NavLink>
								<NavLink
									to="/favorites"
									className="text-xs text-muted-foreground hover:text-primary transition-colors"
								>
									Favorites
								</NavLink>
								<NavLink
									to="/organiser"
									className="text-xs text-muted-foreground hover:text-primary transition-colors"
								>
									Organiser
								</NavLink>
							</nav>
						</div>

						<div className="space-y-3">
							<h4 className="text-sm font-medium">Legal</h4>
							<nav className="flex flex-col space-y-2">
								<NavLink
									to="/legal-disclaimer"
									className="text-xs text-muted-foreground hover:text-primary transition-colors"
								>
									Disclaimer
								</NavLink>
								<NavLink
									to="/terms"
									className="text-xs text-muted-foreground hover:text-primary transition-colors"
								>
									Terms
								</NavLink>
							</nav>
						</div>
					</div>
				</div>

				<Separator className="mb-4" />

				<div className="flex flex-col md:flex-row justify-between items-center gap-2">
					<div className="text-xs text-muted-foreground">
						© 2025 Cyprus Company Search
					</div>
					<div className="text-xs text-muted-foreground text-center md:text-right">
						Data sourced from official Cyprus government registry
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
