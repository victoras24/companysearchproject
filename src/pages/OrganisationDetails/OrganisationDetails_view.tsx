import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSaveCompany from "@/hooks/useSaveCompany";
import { useAuth } from "@/context/AuthStoreContext";
import { observer } from "mobx-react";
import OrganisationDetailsModel from "./OrganisationDetails_model";
import moment from "moment";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import {
	BookmarkPlus,
	Bookmark,
	Building,
	Calendar,
	MapPin,
	Users,
	User,
	Info,
	Lock,
	FileText,
} from "lucide-react";
import type { gEntities } from "@/gEntities";
import { useCartStore } from "@/context/CartStore";

const OrganisationDetails: React.FC = observer(() => {
	const { companyId, entryId } = useParams();
	const id = parseInt(entryId || "", 10);
	const { user } = useAuth();
	const { handleSaveCompany } = useSaveCompany();
	const [model] = useState(
		() => new OrganisationDetailsModel(`${companyId}`, id)
	);
	const cartStore = useCartStore();

	const handleOrderReport = (company: gEntities.IOrganisationDetails) => {
		if (!company) return;

		const cartItem: gEntities.ICartItem = {
			id: company?.id,
			name: company?.organisationName,
			price: 39.99,
		};

		cartStore.addItem(cartItem);
	};

	useEffect(() => {
		model.onMount();
	}, [model]);

	if (model.isLoading) {
		return (
			<div className="container mx-auto max-w-4xl p-6 space-y-6">
				<div className="space-y-2">
					<Skeleton className="h-12 w-3/4" />
					<Skeleton className="h-6 w-1/2" />
				</div>
				<Skeleton className="h-[200px] w-full rounded-lg" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-1/4" />
					<Skeleton className="h-32 w-full rounded-lg" />
				</div>
			</div>
		);
	}

	if (!model.detailedData)
		return (
			<div className="container mx-auto max-w-4xl p-6">
				<Alert>
					<Info className="h-4 w-4" />
					<AlertDescription>No data found for this company.</AlertDescription>
					<Button
						onClick={() => {
							if (model.detailedData) {
								handleOrderReport(model.detailedData);
							}
						}}
						className="w-full"
					>
						<FileText className="mr-2 h-4 w-4" />
						Order Full Company Report
					</Button>
				</Alert>
			</div>
		);

	const fullAddress =
		model.addressData?.street ||
		model.addressData?.territory ||
		model.addressData?.building
			? [
					model.addressData?.street,
					model.addressData?.building,
					model.addressData?.territory,
			  ]
					.filter(Boolean)
					.join(", ")
			: "Address not available";

	const isSaved = (company: gEntities.ICompany) => {
		return user?.savedCompanies.some(
			(saved: gEntities.ISavedCompany) => saved.id === company.id
		);
	};

	const officials = model.officialsData;
	const registrationDate = model.detailedData?.registrationDate
		? moment(model.detailedData.registrationDate, "DD/MM/YYYY").format(
				"MMMM D, YYYY"
		  )
		: "Not available";

	console.log(registrationDate);

	const isActive = model.detailedData?.organisationStatus === "Εγγεγραμμένη";

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
						{model.detailedData?.organisationName}
					</h1>
					<p className="text-muted-foreground flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						Incorporated on {registrationDate}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Badge variant={isActive ? "default" : "outline"} className="text-sm">
						{isActive ? "Active" : "Inactive"}
					</Badge>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									onClick={(e) => {
										e.preventDefault();
										handleSaveCompany(model.detailedData);
									}}
								>
									{isSaved(model.detailedData) ? (
										<Bookmark className="h-4 w-4" />
									) : (
										<BookmarkPlus className="h-4 w-4" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{isSaved(model.detailedData)
									? "Remove from saved"
									: "Save company"}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>

			<Tabs defaultValue="overview" className="w-full">
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="people">Key People</TabsTrigger>
				</TabsList>
				<TabsContent value="overview" className="space-y-6 pt-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Building className="h-5 w-5" /> Company Information
							</CardTitle>
							<CardDescription>
								Comprehensive information about the company structure and
								registration.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground">
										Registration Number
									</h3>
									<p>{model.detailedData?.registrationNo || "Not available"}</p>
								</div>
								<div className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground">
										Registration Date
									</h3>
									<p>{registrationDate}</p>
								</div>
							</div>

							<Separator />

							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<MapPin className="h-4 w-4" /> Registered Address
								</h3>
								<p>{fullAddress}</p>
							</div>
						</CardContent>
						<CardFooter>
							<Button
								className="w-full"
								onClick={() => {
									if (model.detailedData) {
										handleOrderReport(model.detailedData);
									}
								}}
							>
								<FileText className="mr-2 h-4 w-4" />
								Order Full Company Report
							</Button>
						</CardFooter>
					</Card>
				</TabsContent>

				<TabsContent value="people" className="pt-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" /> Key People
							</CardTitle>
							<CardDescription>
								Officials and key individuals involved with the company.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-[400px] pr-4">
								{Array.isArray(officials) && officials.length > 0 ? (
									<div className="space-y-4">
										{officials.map((person, index) => (
											<div
												key={index}
												className="flex items-start space-x-4 py-4"
											>
												<Avatar className="h-10 w-10 border">
													<AvatarFallback className="bg-primary/10">
														{getInitials(person.personOrOrganisationName)}
													</AvatarFallback>
												</Avatar>
												<div className="space-y-1">
													<p className="font-medium leading-none">
														{person.personOrOrganisationName}
													</p>
													<p className="text-sm text-muted-foreground">
														Official position: {person.officialPosition}
													</p>
													<p className="text-sm text-muted-foreground flex items-center">
														Address:{" "}
														<Lock className="h-3 w-3 ml-1 text-muted-foreground/70" />
													</p>
													<p className="text-sm text-muted-foreground flex items-center">
														Country:{" "}
														<Lock className="h-3 w-3 ml-1 text-muted-foreground/70" />
													</p>
													<p className="text-sm text-muted-foreground flex items-center">
														Date of Appointment:{" "}
														<Lock className="h-3 w-3 ml-1 text-muted-foreground/70" />
													</p>
													<p className="text-sm text-muted-foreground flex items-center">
														Previous Address:{" "}
														<Lock className="h-3 w-3 ml-1 text-muted-foreground/70" />
													</p>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="flex flex-col items-center justify-center py-12 text-center">
										<User className="h-12 w-12 text-muted-foreground/30 mb-3" />
										<p className="text-muted-foreground">
											No officials data available
										</p>
									</div>
								)}
							</ScrollArea>
						</CardContent>
						<CardFooter>
							<Button
								onClick={() => {
									if (model.detailedData) {
										handleOrderReport(model.detailedData);
									}
								}}
								className="w-full"
							>
								<FileText className="mr-2 h-4 w-4" />
								Order Full Company Report
							</Button>
						</CardFooter>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
});

export default OrganisationDetails;
