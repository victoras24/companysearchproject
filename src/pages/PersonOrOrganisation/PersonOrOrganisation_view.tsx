import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import PersonOrOrganisationModel from "./PersonOrOrganisation_model";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { observer } from "mobx-react";

const PersonOrOrganisation: React.FC = observer(() => {
	const { personOrOrganisationName } = useParams();

	if (!personOrOrganisationName) {
		return <div>No data available</div>;
	}

	const [model] = useState(
		() => new PersonOrOrganisationModel(personOrOrganisationName)
	);

	useEffect(() => {
		model.onMount();
	}, [model]);

	const getInitials = (name: string) => {
		return name
			? name
					.split(" ")
					.map((n) => n[0])
					.slice(0, 2)
					.join("")
			: "CO";
	};

	return (
		<div className="container mx-auto max-w-4xl p-6 space-y-8">
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold tracking-tight md:text-4xl">
						{personOrOrganisationName}
					</h1>
				</div>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Link className="h-5 w-5" />
						Potentially Related Entities
					</CardTitle>
					<CardDescription>
						Disclaimer: The related companies listed are identified based solely
						on name matching. We cannot confirm that individuals with similar or
						identical names are the same person.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ScrollArea className="h-[400px] pr-4">
						{model.isLoading ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<Loader2 className="h-12 w-12 animate-spin text-muted-foreground/30 mb-3" />
								<p className="text-muted-foreground">Loading related data...</p>
							</div>
						) : Array.isArray(model.relatedCompanies) &&
						  model.relatedCompanies.length > 0 ? (
							<div className="space-y-0">
								{model.relatedCompanies.map((relatedCompany, index) => (
									<div key={index}>
										<div className="flex items-start space-x-4 py-4">
											<Avatar className="h-10 w-10 border">
												<AvatarFallback className="bg-primary/10">
													{getInitials(relatedCompany.relatedCompany)}
												</AvatarFallback>
											</Avatar>
											<div className="space-y-1">
												<p className="font-medium leading-none">
													{relatedCompany.relatedCompany}
												</p>
												<p className="text-sm text-muted-foreground">
													Official position: {relatedCompany.officialPosition}
												</p>
											</div>
										</div>
										{index < model.relatedCompanies.length - 1 && <Separator />}
									</div>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<Link className="h-12 w-12 text-muted-foreground/30 mb-3" />
								<p className="text-muted-foreground">
									No related data available
								</p>
							</div>
						)}
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	);
});

export default PersonOrOrganisation;
