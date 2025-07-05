import React, { useEffect, useState } from "react";
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
	Link,
	Loader2,
} from "lucide-react";

import type { gEntities } from "@/gEntities";
import { useCartStore } from "@/context/CartStore";
import { NavLink, useLocation } from "react-router";

const OrganisationDetails: React.FC = observer(() => {
	const location = useLocation();
	const companyData = location.state;
	const { user } = useAuth();
	const { handleSaveCompany } = useSaveCompany();
	const [model, setModel] = useState<OrganisationDetailsModel | null>(null);

	const cartStore = useCartStore();

	const handleOrderReport = (company: gEntities.IOrganisationDetails) => {
		if (!company) return;

		const cartItem: gEntities.ICartItem = {
			entryId: company?.entryId,
			name: company?.organisationName,
			price: 39.99,
		};

		cartStore.addItem(cartItem);
	};

	const handleTabChange = (value: string) => {
		model?.setActiveTab(value);
	};

	useEffect(() => {
		if (companyData) {
			const newModel = new OrganisationDetailsModel(companyData, "overview");
			setModel(newModel);
		}
	}, [companyData.addressSeqNo, companyData.registrationNo]);

	useEffect(() => {
		model?.onMount();
	}, [model]);

	if (model?.isLoading) {
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

	if (!companyData)
		return (
			<div className="container mx-auto max-w-4xl p-6">
				<Alert>
					<Info className="h-4 w-4" />
					<AlertDescription>No data found for this company.</AlertDescription>
				</Alert>
			</div>
		);

	const fullAddress =
		model?.companyAddressData?.street ||
		model?.companyAddressData?.territory ||
		model?.companyAddressData?.building
			? [
					model?.companyAddressData?.street,
					model?.companyAddressData?.building,
					model?.companyAddressData?.territory,
			  ]
					.filter(Boolean)
					.join(" ")
			: "Address not available";

	const isSaved = (company: gEntities.ICompany) => {
		return user?.savedCompanies.some(
			(saved: gEntities.ISavedCompany) => saved.id === company.id
		);
	};

	const officials = model?.officialsData;
	const registrationDate = companyData?.registrationDate
		? moment(companyData.registrationDate, "DD/MM/YYYY").format("MMMM D, YYYY")
		: "Not available";

	const isActive = companyData?.organisationStatus === "Εγγεγραμμένη";

	const getInitials = (name: string) => {
		return name
			? name
					.split(" ")
					.map((n) => n[0])
					.slice(0, 2)
					.join("")
			: "CO";
	};

	const TabLoadingSkeleton = () => (
		<div className="space-y-4 p-6">
			<div className="flex items-center space-x-4">
				<Skeleton className="h-12 w-12 rounded-full" />
				<div className="space-y-2">
					<Skeleton className="h-4 w-[200px]" />
					<Skeleton className="h-4 w-[160px]" />
				</div>
			</div>
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-3/4" />
		</div>
	);

	return (
		<div className="container mx-auto max-w-4xl p-6 space-y-8">
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold tracking-tight md:text-4xl">
						{companyData?.organisationName}
					</h1>
					<p className="text-muted-foreground flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						Incorporated on {registrationDate}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Badge variant={isActive ? "active" : "inactive"} className="text-md">
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
										handleSaveCompany(companyData);
									}}
								>
									{isSaved(companyData) ? (
										<Bookmark className="h-4 w-4" />
									) : (
										<BookmarkPlus className="h-4 w-4" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{isSaved(companyData) ? "Remove from saved" : "Save company"}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>

			<Tabs
				value={model?.activeTab}
				onValueChange={handleTabChange}
				className="w-full"
			>
				<TabsList className="grid w-full max-w-xxl grid-cols-3">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="people">Key People</TabsTrigger>
					<TabsTrigger value="related">Related</TabsTrigger>
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
									<p>{companyData?.registrationNo || "Not available"}</p>
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
					</Card>
				</TabsContent>

				<TabsContent value="people" className="pt-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" /> Key People
								{model?.isLoadingOfficials && (
									<Loader2 className="h-4 w-4 animate-spin ml-2" />
								)}
							</CardTitle>
							<CardDescription>
								Officials and key individuals involved with the company.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{model?.isLoadingOfficials ? (
								<TabLoadingSkeleton />
							) : (
								<ScrollArea className="h-[400px] pr-4">
									{Array.isArray(officials) && officials.length > 0 ? (
										<div className="space-y-4">
											{officials.map((person, index) => (
												<NavLink
													key={index}
													state={{
														organisationName: companyData.organisationName,
														registrationNo: companyData.registrationNo,
														registrationDate: companyData.registrationDate,
														organisationStatus: companyData.organisationStatus,
														addressSeqNo: companyData.addressSeqNo,
													}}
													className="flex items-start space-x-4 py-4"
													to={`/official/${person.personOrOrganisationName}`}
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
												</NavLink>
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
							)}
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value={"related"} className="pt-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Link className="h-5 w-5" />
								Potentially Related Entities
								{model?.isLoadingRelated && (
									<Loader2 className="h-4 w-4 animate-spin ml-2" />
								)}
							</CardTitle>
							<CardDescription>
								Related companies with {companyData?.organisationName}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{model?.isLoadingRelated ? (
								<TabLoadingSkeleton />
							) : (
								<ScrollArea className="h-[400px] pr-4">
									{Array.isArray(model?.relatedCompanies) &&
									model?.relatedCompanies.length > 0 ? (
										<div className="space-y-0">
											{model?.relatedCompanies.map((relatedCompany, index) => (
												<NavLink
													key={index}
													to={`/search/${relatedCompany.registrationNo}`}
												>
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
																Official position:{" "}
																{relatedCompany.officialPosition}
															</p>
														</div>
													</div>
													{index < model?.relatedCompanies.length - 1 && (
														<Separator />
													)}
												</NavLink>
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
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Comprehensive Reports Section */}
			<Card className="bg-primary/5 border-primary/20">
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="bg-primary/10 p-2 rounded-lg">
							<FileText className="h-5 w-5 text-primary" />
						</div>
						<div>
							<CardTitle className="text-xl">Comprehensive Reports</CardTitle>
							<CardDescription>
								Professional analysis within 6 hours
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground mb-4">
						Receive detailed reports with current information from the official
						registry, including comprehensive data gathering and professional
						summaries prepared by our experts.
					</p>
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-sm">
							<div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
							<span>Current and historical shareholders with addresses</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
							<span>Complete company documents and filings</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
							<span>Historical changes, previous names, and mortgages</span>
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						className="w-full"
						onClick={() => {
							if (companyData) {
								handleOrderReport(companyData);
							}
						}}
					>
						<FileText className="mr-2 h-4 w-4" />
						Order Full Company Report
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
});

export default OrganisationDetails;
