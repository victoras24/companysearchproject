import { useEffect, useState } from "react";
import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import { observer } from "mobx-react";
import SearchModel, { api_config } from "./Search_model";
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
import { PaginationDemo } from "@/components/pagination-demo";
import type { ICompany, IOfficials } from "@/gEntities";

export const Search = observer(() => {
	const [searchParams, setSearchParams] = useSearchParams();
	const location = useLocation();
	const { user } = useAuth();
	const currentPage = searchParams.get("page") || "";

	const [model] = useState(
		() => new SearchModel(searchParams, setSearchParams, +currentPage)
	);
	const { handleSaveCompany, isLoading } = useSaveCompany();
	const [statusFilter, setStatusFilter] = useState<string>("all");

	useEffect(() => {
		const debounceSearch = setTimeout(() => {
			model.handlePaginatedSearch();
		}, 233);

		return () => clearTimeout(debounceSearch);
	}, [model, model.searchQuery, statusFilter]);

	useEffect(() => {
		const q = searchParams.get("q");
		const filter = searchParams.get("filter") as keyof typeof api_config;
		const status = searchParams.get("status");

		if (typeof q === "string") model.setSearchQuery(q);

		if (filter) model.setSelectedOption(filter);

		if (status) setStatusFilter(status);
	}, [model, searchParams]);

	// useEffect(() => {
	// 	if (location.state?.organisationName) {
	// 		model.handleInputChange(location.state.organisationName);
	// 		model.handlePaginatedSearch();
	// 		console.log(model.paginatedSearchData);
	// 	}
	// }, [model, location]);

	const handleSelectOption = (filter: keyof typeof api_config) => {
		model.setSelectedOption(filter);
		setStatusFilter("all");
		setSearchParams({ filter: filter });

		model.setSearchData([]);
		if (model.searchQuery.trim() !== "") {
			model.setLoading(true);
		}
	};

	const handleStatusFilter = (value: string) => {
		setStatusFilter(value);
		setSearchParams({
			filter: model.selectedOption,
			...(value !== "all" && { status: value }),
		});
	};

	const isCompanySaved = (companyId: number) => {
		if (!user || !user.savedCompanies) return false;
		return user.savedCompanies.some((saved) => saved.id === companyId);
	};

	const filteredResults = model.paginatedSearchData.items.filter((data) => {
		if (model.selectedOption !== "Organisation" || statusFilter === "all") {
			return true;
		}

		if (statusFilter === "active") {
			return data.organisationStatus === "Εγγεγραμμένη";
		}

		if (statusFilter === "inactive") {
			return data.organisationStatus !== "Εγγεγραμμένη";
		}

		return true;
	});

	const getState = (
		selectedOption: "Organisation" | "Official",
		data: ICompany | IOfficials
	) => {
		if (selectedOption === "Official" && "officialPosition" in data) {
			return {
				officialPosition: data.officialPosition,
				organisationName: data.organisationName,
				personOrOrganisationName: data.personOrOrganisationName,
				registrationNo: data.registrationNo,
				filter: location.search,
				searchInput: model.searchQuery,
			};
		} else if (
			selectedOption === "Organisation" &&
			!("officialPosition" in data)
		) {
			return {
				organisationName: data.organisationName,
				registrationNo: data.registrationNo,
				registrationDate: data.registrationDate,
				organisationStatus: data.organisationStatus,
				addressSeqNo: data.addressSeqNo,
				filter: location.search,
				searchInput: model.searchQuery,
			};
		}
	};

	const getName = (
		selectedOption: "Organisation" | "Official",
		data: ICompany | IOfficials
	) => {
		if (selectedOption === "Official" && "officialPosition" in data) {
			return data.personOrOrganisationName;
		}

		return data.organisationName;
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

				<div className="search-content">
					{/* Search Input */}
					<div className="search-input-container mb-4">
						<div className="search-input-wrapper relative">
							<Input
								className="pl-10 pr-10"
								placeholder={`Enter ${model.selectedOption}'s name`}
								value={model.searchQuery}
								onChange={(e) => model.handleInputChange(e.target.value)}
							/>
							<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
								<SearchIcon className="h-4 w-4 text-muted-foreground" />
							</div>

							{model.searchQuery && (
								<div className="absolute inset-y-0 right-0 flex items-center">
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => model.cleanInput()}
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
							value={model.selectedOption}
							onValueChange={handleSelectOption}
							className="w-full"
						>
							<TabsList className="grid w-full grid-cols-2 h-10">
								<TabsTrigger value="Organisation" className="text-sm">
									<Building className="h-4 w-4 mr-2" />
									Companies
								</TabsTrigger>
								<TabsTrigger value="Official" className="text-sm">
									<User className="h-4 w-4 mr-2" />
									Officials
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{/* Status Filter - Only show for Organisation */}
					{model.selectedOption === "Organisation" && (
						<div className="mb-6">
							<Tabs
								value={statusFilter}
								onValueChange={handleStatusFilter}
								className="w-full"
							>
								<TabsList className="grid w-full grid-cols-3 h-9">
									<TabsTrigger value="all" className="text-sm">
										All Companies
									</TabsTrigger>
									<TabsTrigger value="active" className="text-sm">
										Active
									</TabsTrigger>
									<TabsTrigger value="inactive" className="text-sm">
										Inactive
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>
					)}

					{/* Results */}
					{model.isLoading ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							{model.searchQuery.length > 2 ? (
								<>
									<Loader2 className="h-12 w-12 animate-spin text-muted-foreground/30 mb-3" />
									<p className="text-muted-foreground">
										Searching for {model.searchQuery}
									</p>
								</>
							) : (
								<p className="text-muted-foreground">
									Enter at least 3 characters.
								</p>
							)}
						</div>
					) : filteredResults.length === 0 &&
					  model.searchQuery.trim() === "" ? (
						<Card className="search-tips-card">
							<CardContent className="p-6">
								<div className="flex items-start gap-4">
									<Info className="h-5 w-5 mt-1" />
									<div>
										<h2 className="font-semibold text-lg mb-2">Search Tips:</h2>
										<ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
											<li>Enter the full or partial name of the company</li>
											<li>
												Results will show company name, status, and address
											</li>
											<li>Click on a result to view more details</li>
											<li>Use the filters above to refine your search</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>
					) : filteredResults.length === 0 ? (
						<Alert variant="default" className="bg-muted">
							<AlertDescription className="text-center py-8">
								No results found for "{model.searchQuery}". Try a different
								search term or adjust your filters.
							</AlertDescription>
						</Alert>
					) : (
						<div className="search-results space-y-3">
							{filteredResults.map((data: ICompany | IOfficials, index) => (
								<Card
									key={index}
									className="search-result-card hover:shadow-md transition-shadow"
								>
									<NavLink
										to={
											model.selectedOption === "Official" &&
											"officialPosition" in data
												? `/official/${data.personOrOrganisationName}`
												: `/cyprus-company-search/${data.registrationNo}`
										}
										state={getState(model.selectedOption, data)}
										className="no-underline text-foreground"
									>
										<CardContent className="p-4">
											<div className="flex justify-between items-start">
												<div className="space-y-1">
													<h4 className="font-medium">
														{getName(model.selectedOption, data)}
													</h4>
													{model.selectedOption === "Organisation" && (
														<p className="text-sm text-muted-foreground">
															Reg No: {data.registrationNo}
														</p>
													)}
												</div>

												<div className="flex items-center gap-2">
													{model.selectedOption === "Organisation" &&
														!("officialPosition" in data) && (
															<Badge
																variant={
																	data.organisationStatus === "Εγγεγραμμένη"
																		? "active"
																		: "inactive"
																}
															>
																{data.organisationStatus === "Εγγεγραμμένη"
																	? "Active"
																	: "Inactive"}
															</Badge>
														)}
													{model.selectedOption === "Organisation" && (
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
															{!("officialPosition" in data) &&
															isCompanySaved(data.id) ? (
																<Bookmark className="h-4 w-4 text-primary" />
															) : (
																<BookmarkPlus className="h-4 w-4" />
															)}
														</Button>
													)}
												</div>
											</div>
										</CardContent>
									</NavLink>
								</Card>
							))}
							{model.paginatedSearchData.totalItemsCount > 5 && (
								<PaginationDemo
									query={model.searchQuery}
									currentPage={model.currentPage}
									dataSize={model.paginatedSearchData.totalItemsCount}
									pageDataSize={model.paginatedSearchData.items.length}
								/>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
});
