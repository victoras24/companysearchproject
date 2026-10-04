import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { observer } from "mobx-react";
import {
	SearchSession,
	STATUS_FILTERS,
	type EntityType,
	type StatusFilter,
} from "./SearchSession";
import { search } from "@/api/searchApi";
import { useAuth } from "../../context/AuthStoreContext";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useSaveCompany from "@/hooks/useSaveCompany";
import {
	Search as SearchIcon,
	X,
	Bookmark,
	BookmarkPlus,
	Building,
	User,
	Info,
	Loader2,
} from "lucide-react";

import "./_search.css";
import { SearchPager } from "@/components/SearchPager";
import { OptionalLink } from "@/components/OptionalLink";
import {
	detailsPath,
	statusGroupOf,
	statusLabel,
	statusLine,
} from "@/organisation/organisation";
import type { ICompany, IOfficials } from "@/gEntities";

const entityTypeLabel: Record<EntityType, string> = {
	organisation: "Organisation",
	official: "Official",
};

// The same colours as the status badges in components/ui/badge.tsx.
const statusDotClass: Record<(typeof STATUS_FILTERS)[number], string> = {
	registered: "bg-green-700",
	"at-risk": "bg-amber-400",
	"in-liquidation": "bg-orange-600",
	dissolved: "bg-red-500",
};

const statusChipClass =
	"h-8 flex-none rounded-full border-border px-3 font-normal text-muted-foreground hover:bg-muted data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground";

export const Search = observer(() => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user } = useAuth();

	const navigateRef = useRef(navigate);
	const resultsRef = useRef<HTMLDivElement>(null);

	const [session] = useState(
		() =>
			new SearchSession({
				search,
				navigate: (search, { replace }) =>
					navigateRef.current({ search }, { replace }),
			})
	);

	const { handleSaveCompany, isLoading } = useSaveCompany();

	useLayoutEffect(() => {
		navigateRef.current = navigate;
	}, [navigate]);

	useLayoutEffect(() => {
		session.urlChanged(location.search);
	}, [session, location.search]);

	useEffect(() => () => session.dispose(), [session]);

	const scrollToResults = () => {
		resultsRef.current?.scrollIntoView({ block: "start" });
	};

	const isOfficial = session.entityType === "official";

	// On a phone the chips scroll sideways; keep the selected one in sight, e.g. after a link.
	const statusChipsRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		statusChipsRef.current
			?.querySelector('[data-state="active"]')
			?.scrollIntoView({ block: "nearest", inline: "nearest" });
	}, [session.statusFilter]);

	const isCompanySaved =(companyId: number) => {
		if (!user || !user.savedCompanies) return false;
		return user.savedCompanies.some((saved) => saved.id === companyId);
	};

	const renderOrganisation = (data: ICompany) => {
		const status = statusLine(data);
		return (
			<Card
				key={data.id}
				className="search-result-card hover:shadow-md transition-shadow"
			>
				<OptionalLink
					to={detailsPath(data)}
					className="no-underline text-foreground"
				>
					<CardContent className="p-4">
						<div className="flex justify-between items-start">
							<div className="space-y-1">
								<h4 className="font-medium">{data.organisationName}</h4>
								<p className="text-sm text-muted-foreground">
									Reg No: {data.registrationNo}
								</p>
								{status && (
									<p className="text-sm text-muted-foreground">{status}</p>
								)}
							</div>

							<div className="flex items-center gap-2">
								<Badge variant={statusGroupOf(data)}>
									{statusLabel(data)}
								</Badge>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										handleSaveCompany(data);
									}}
									disabled={isLoading}
								>
									{isCompanySaved(data.id) ? (
										<Bookmark className="h-4 w-4 text-primary" />
									) : (
										<BookmarkPlus className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>
					</CardContent>
				</OptionalLink>
			</Card>
		);
	};

	const renderOfficial = (data: IOfficials, index: number) => (
		<Card
			key={index}
			className="search-result-card hover:shadow-md transition-shadow"
		>
			<NavLink
				to={`/official/${encodeURIComponent(data.personOrOrganisationName)}`}
				className="no-underline text-foreground"
			>
				<CardContent className="p-4">
					<div className="flex justify-between items-start">
						<div className="space-y-1">
							<h4 className="font-medium">{data.personOrOrganisationName}</h4>
						</div>
					</div>
				</CardContent>
			</NavLink>
		</Card>
	);

	const renderResults = () => {
		const view = session.view;

		switch (view.status) {
			case "idle":
				return (
					<Card className="search-tips-card">
						<CardContent className="p-6">
							<div className="flex items-start gap-4">
								<Info className="h-5 w-5 mt-1" />
								<div>
									<h2 className="font-semibold text-lg mb-2">Search Tips:</h2>
									<ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
										<li>Enter the full or partial name of the company</li>
										<li>Results will show company name, status, and address</li>
										<li>Click on a result to view more details</li>
										<li>Use the filters above to refine your search</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				);
			case "too-short":
				return (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<p className="text-muted-foreground">
							Enter at least 3 characters.
						</p>
					</div>
				);
			case "loading":
				return (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<Loader2 className="h-12 w-12 animate-spin text-muted-foreground/30 mb-3" />
						<p className="text-muted-foreground">
							Searching for {session.draft}
						</p>
					</div>
				);
			case "empty":
				return (
					<Alert variant="default" className="bg-muted">
						<AlertDescription className="text-center py-8">
							No results found for "{view.query}". Try a different search term
							or adjust your filters.
						</AlertDescription>
					</Alert>
				);
			case "error":
				return (
					<Alert variant="default" className="bg-muted">
						<AlertDescription className="flex flex-col items-center gap-4 text-center py-8">
							Something went wrong while searching. Please try again.
							<Button variant="outline" onClick={() => session.retry()}>
								Retry
							</Button>
						</AlertDescription>
					</Alert>
				);
			case "results":
				return (
					<div className="search-results space-y-3">
						{view.entityType === "organisation"
							? view.items.map(renderOrganisation)
							: view.items.map(renderOfficial)}
						{view.entityType === "official" && view.truncated && (
							<p className="text-sm text-muted-foreground text-center">
								Showing the first {view.items.length} matches; refine your
								search.
							</p>
						)}
						{view.pager && (
							<SearchPager pager={view.pager} onNavigate={scrollToResults} />
						)}
					</div>
				);
		}
	};

	return (
		<div className="search-page-container">
			<div className="search-inner-container">
				<div className="search-header">
					<h1 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
						Cyprus Company Search
					</h1>
					<p className="text-muted-foreground mb-8">
						Find detailed information about companies registered in Cyprus.
					</p>
				</div>

				<div className="search-content" ref={resultsRef}>
					{/* Search Input */}
					<div className="search-input-container mb-4">
						<div className="search-input-wrapper relative">
							<Input
								className="pl-10 pr-10"
								placeholder={`Enter ${
									entityTypeLabel[session.entityType]
								}'s name`}
								value={session.draft}
								onChange={(e) => session.typeQuery(e.target.value)}
							/>
							<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
								<SearchIcon className="h-4 w-4 text-muted-foreground" />
							</div>

							{session.draft && (
								<div className="absolute inset-y-0 right-0 flex items-center">
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => session.clearQuery()}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							)}
						</div>
					</div>

					{/* Search Type Filter */}
					<div className="mb-4">
						<Tabs
							value={session.entityType}
							onValueChange={(value) =>
								session.selectEntityType(value as EntityType)
							}
							className="w-full"
						>
							<TabsList className="grid w-full grid-cols-2 h-10">
								<TabsTrigger value="organisation" className="text-sm">
									<Building className="h-4 w-4 mr-2" />
									Companies
								</TabsTrigger>
								<TabsTrigger value="official" className="text-sm">
									<User className="h-4 w-4 mr-2" />
									Officials
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{/* Status Filter - officials have no status, so it stays in place but disabled */}
					<div className="mb-6 flex items-center gap-3">
						<span className="text-sm text-muted-foreground shrink-0">
							Status
						</span>
						<Tabs
							value={session.statusFilter}
							onValueChange={(value) =>
								session.selectStatusFilter(value as StatusFilter)
							}
							className="min-w-0 flex-1"
						>
							<TabsList
								ref={statusChipsRef}
								className="h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0.5 [scrollbar-width:none]">
								<TabsTrigger
									value="all"
									disabled={isOfficial}
									className={statusChipClass}
								>
									All
								</TabsTrigger>
								{STATUS_FILTERS.map((group) => (
									<TabsTrigger
										key={group}
										value={group}
										disabled={isOfficial}
										className={statusChipClass}
									>
										<span
											aria-hidden
											className={`size-2 rounded-full ${statusDotClass[group]}`}
										/>
										{statusLabel({ statusGroup: group })}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>
					</div>

					{/* Results */}
					{renderResults()}
				</div>
			</div>
		</div>
	);
});
