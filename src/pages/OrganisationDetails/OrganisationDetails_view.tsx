import React, { useEffect, useState } from "react";
import { library } from "@/library";
import { toggleSaved } from "@/library/saveCompany";
import { observer } from "mobx-react";
import { OrganisationRecordLoader } from "./OrganisationRecordLoader";
import PersonOrOrganisationModel from "../PersonOrOrganisation/PersonOrOrganisation_model";
import { lookup } from "@/api/organisationApi";
import {
	detailsPath,
	registeredAddressText,
	registrationDateText,
	statusGroupOf,
	statusLabel,
	statusLine,
} from "@/organisation/organisation";
import { BackToSearchLink } from "@/components/BackToSearchLink";

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
	RotateCw,
} from "lucide-react";

import { useCartStore } from "@/context/CartStore";
import { checkout, formatPrice } from "@/checkout";
import { NavLink, useParams } from "react-router";
import type { ICartItem } from "@/gEntities";
import type { OrganisationSummary } from "@/organisation/organisation";

const OrganisationDetails: React.FC = observer(() => {
	const { typeCode = "", registrationNo = "" } = useParams();
	const [loader] = useState(() => new OrganisationRecordLoader({ lookup }));
	const [activeTab, setActiveTab] = useState("overview");

	const cartStore = useCartStore();

	useEffect(() => {
		loader.load(typeCode, registrationNo);
	}, [loader, typeCode, registrationNo]);

	useEffect(() => () => loader.dispose(), [loader]);

	useEffect(() => checkout.loadPrice(), []);

	const view = loader.view;
	const organisationName =
		view.status === "loaded" ? view.record.organisation.organisationName : null;

	// Appointments are found by name, so they load once the record has given the name.
	const [appointments, setAppointments] = useState<PersonOrOrganisationModel | null>(null);
	useEffect(() => {
		if (!organisationName) {
			setAppointments(null);
			return;
		}
		const model = new PersonOrOrganisationModel(organisationName);
		setAppointments(model);
		model.onMount();
	}, [organisationName]);

	const handleOrderReport = (company: OrganisationSummary) => {
		const cartItem: ICartItem = {
			organisationTypeCode: company.organisationTypeCode ?? typeCode,
			registrationNo: company.registrationNo,
			organisationName: company.organisationName ?? "",
		};

		cartStore.addItem(cartItem);
	};

	if (view.status === "loading") {
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

	if (view.status === "not-found") {
		return (
			<div className="container mx-auto max-w-4xl p-6 space-y-4">
				<Alert>
					<Info className="h-4 w-4" />
					<AlertDescription>
						No company found for {view.typeCode} {view.registrationNo}.
					</AlertDescription>
				</Alert>
				<BackToSearchLink />
			</div>
		);
	}

	if (view.status === "error") {
		return (
			<div className="container mx-auto max-w-4xl p-6 space-y-4">
				<Alert variant="destructive">
					<Info className="h-4 w-4" />
					<AlertDescription>
						Something went wrong while loading this company.
					</AlertDescription>
				</Alert>
				<Button variant="outline" onClick={loader.retry}>
					<RotateCw className="mr-2 h-4 w-4" />
					Retry
				</Button>
			</div>
		);
	}

	const { organisation, address, officials } = view.record;

	const isSaved = library.isSaved(organisation);
	const registrationDate = registrationDateText(organisation.registrationDate);
	const fullAddress = registeredAddressText(address);
	const status = statusLine(organisation);

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
						{organisation.organisationName}
					</h1>
					<p className="text-muted-foreground flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						Incorporated on {registrationDate}
					</p>
					{status && <p className="text-muted-foreground">{status}</p>}
					<BackToSearchLink />
				</div>
				<div className="flex items-center gap-3">
					<Badge variant={statusGroupOf(organisation)} className="text-md">
						{statusLabel(organisation)}
					</Badge>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									disabled={library.isBusy(organisation)}
									onClick={(e) => {
										e.preventDefault();
										toggleSaved(organisation);
									}}
								>
									{isSaved ? (
										<Bookmark className="h-4 w-4" />
									) : (
										<BookmarkPlus className="h-4 w-4" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{isSaved ? "Remove from saved" : "Save company"}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
									<p>{organisation.registrationNo || "Not available"}</p>
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
							</CardTitle>
							<CardDescription>
								Officials and key individuals involved with the company.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-[400px] pr-4">
								{officials.length > 0 ? (
									<div className="space-y-4">
										{officials.map((person, index) => (
											<NavLink
												key={index}
												className="flex items-start space-x-4 py-4"
												to={`/official/${encodeURIComponent(person.personOrOrganisationName)}`}
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
														Address:
														<Lock className="h-3 w-3 ml-1 text-muted-foreground/70" />
													</p>
													<p className="text-sm text-muted-foreground flex items-center">
														Country:
														<Lock className="h-3 w-3 ml-1 text-muted-foreground/70" />
													</p>
													<p className="text-sm text-muted-foreground flex items-center">
														Date of Appointment:
														<Lock className="h-3 w-3 ml-1 text-muted-foreground/70" />
													</p>
													<p className="text-sm text-muted-foreground flex items-center">
														Previous Address:
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
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value={"related"} className="pt-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Link className="h-5 w-5" />
								Potentially Related Entities
								{appointments?.isLoading && (
									<Loader2 className="h-4 w-4 animate-spin ml-2" />
								)}
							</CardTitle>
							<CardDescription>
								Related companies with {organisation.organisationName}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{!appointments || appointments.isLoading ? (
								<TabLoadingSkeleton />
							) : (
								<ScrollArea className="h-[400px] pr-4">
									{appointments.relatedCompanies.length > 0 ? (
										<div className="space-y-0">
											{appointments.relatedCompanies.map((relatedCompany, index) => {
												const path = detailsPath(relatedCompany);
												const content = (
													<>
														<Avatar className="h-10 w-10 border">
															<AvatarFallback className="bg-primary/10">
																{getInitials(relatedCompany.organisationName)}
															</AvatarFallback>
														</Avatar>
														<div className="space-y-1">
															<p className="font-medium leading-none">
																{relatedCompany.organisationName}
															</p>
															<p className="text-sm text-muted-foreground">
																Official position:
																{relatedCompany.officialPosition}
															</p>
														</div>
													</>
												);
												return path ? (
													<NavLink
														key={index}
														to={path}
														className="flex items-start space-x-4 py-4"
													>
														{content}
													</NavLink>
												) : (
													<div key={index} className="flex items-start space-x-4 py-4">
														{content}
													</div>
												);
											})}
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
								Professional analysis within one business day
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
						onClick={() => handleOrderReport(organisation)}
					>
						<FileText className="mr-2 h-4 w-4" />
						Order Full Company Report
						{checkout.price && ` · ${formatPrice(checkout.price)}`}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
});

export default OrganisationDetails;
