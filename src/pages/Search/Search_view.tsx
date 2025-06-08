import { useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { observer } from "mobx-react";
import SearchModel from "./Search_model";
import { useAuth } from "../../context/AuthStoreContext";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useSaveCompany from "@/hooks/useSaveCompany";
import {
	Search as SearchIcon,
	X,
	SlidersHorizontal,
	Bookmark,
	BookmarkPlus,
	Building,
	User,
	Info,
	Loader2,
} from "lucide-react";

import "./_search.css";

export const Search = observer(() => {
	const [searchParams, setSearchParams] = useSearchParams();
	const { user } = useAuth();
	const [model] = useState(() => new SearchModel());
	const { handleSaveCompany, isLoading } = useSaveCompany();
	useEffect(() => {
		const debounceSearch = setTimeout(() => {
			model.handleSearch();
		}, 666);

		return () => clearTimeout(debounceSearch);
	}, [model.searchQuery, model.selectedOption]);

	useEffect(() => {
		const filter = searchParams.get("filter");
		if (filter) {
			model.setSelectedOption(filter);
		}
	}, [searchParams]);

	const handleSelectOption = (value: string) => {
		model.setSelectedOption(value);
		setSearchParams({ filter: value });
	};

	const isCompanySaved = (companyId: number) => {
		if (!user || !user.savedCompanies) return false;

		return user.savedCompanies.some(
			(saved: any) => saved.entryId === companyId
		);
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
					<div className="search-input-container flex gap-2 mb-6">
						<div className="search-input-wrapper relative flex-1">
							<Input
								className="pl-10 pr-10" // Add right padding for the X button
								placeholder={`Enter ${model.selectedOption}'s name`}
								value={model.searchQuery}
								onChange={(e) => model.handleInputChange(e.target.value)}
							/>
							<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
								{model.isLoading ? (
									<Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
								) : (
									<SearchIcon className="h-4 w-4 text-muted-foreground" />
								)}
							</div>
							{model.searchQuery && (
								<div className="absolute inset-y-0 right-0 flex items-center pr-2">
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

						<Sheet open={model.isFilterOpen} onOpenChange={model.setFilterOpen}>
							<SheetTrigger asChild>
								<Button variant="outline" size="icon">
									<SlidersHorizontal className="h-4 w-4" />
								</Button>
							</SheetTrigger>
							<SheetContent>
								<SheetHeader>
									<SheetTitle>Search Filters</SheetTitle>
									<SheetDescription>
										Refine your search results.
									</SheetDescription>
								</SheetHeader>
								<div className="flex flex-col gap-4 p-4">
									<div className="space-y-2">
										<h3 className="text-sm font-medium">Search Type</h3>
										<Tabs
											defaultValue={model.selectedOption}
											value={model.selectedOption}
											onValueChange={handleSelectOption}
											className="w-full"
										>
											<TabsList className="grid w-full grid-cols-2">
												<TabsTrigger value="Organisation">
													<Building className="h-4 w-4 mr-2" />
													Companies
												</TabsTrigger>
												<TabsTrigger value="Official">
													<User className="h-4 w-4 mr-2" />
													Officials
												</TabsTrigger>
											</TabsList>
										</Tabs>
									</div>

									{/* <div className="space-y-2">
										<h3 className="text-sm font-medium">Filter By</h3>
										<Select
											value={model.selectedFilter}
											onValueChange={(e: any) => model.handleSelectFilter(e)}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select filter" />
											</SelectTrigger>
											<SelectContent>
												{model.selectedOption === "Organisation" ? (
													<>
														<SelectItem value="name">Company Name</SelectItem>
														<SelectItem value="reg_no">
															Registration Number
														</SelectItem>
														<SelectItem value="status">Status</SelectItem>
													</>
												) : (
													<>
														<SelectItem value="name">Official Name</SelectItem>
														<SelectItem value="position">Position</SelectItem>
														<SelectItem value="company">
															Associated Company
														</SelectItem>
													</>
												)}
											</SelectContent>
										</Select>
									</div> */}

									<Button
										variant="default"
										className="mt-4"
										onClick={() => model.closeFilter()}
									>
										Apply Filters
									</Button>
								</div>
							</SheetContent>
						</Sheet>
					</div>

					{model.isLoading ? (
						<div className="search-results-loading space-y-4">
							{[1, 2, 3].map((i) => (
								<Card key={i} className="search-result-skeleton">
									<CardContent className="p-4">
										<div className="flex justify-between items-start">
											<div className="space-y-2">
												<Skeleton className="h-4 w-[250px]" />
												<Skeleton className="h-3 w-[200px]" />
											</div>
											<Skeleton className="h-8 w-16 rounded-full" />
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : model.searchData.length === 0 &&
					  model.searchQuery.trim() === "" ? (
						<Card className="search-tips-card">
							<CardContent className="p-6">
								<div className="flex items-start gap-4">
									<Info className="h-5 w-5  mt-1" />
									<div>
										<h2 className="font-semibold text-lg mb-2">Search Tips:</h2>
										<ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
											<li>Enter the full or partial name of the company</li>
											<li>
												Results will show company name, status, and address
											</li>
											<li>Click on a result to view more details</li>
											<li>Use the filter icon to refine your search</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>
					) : model.searchData.length === 0 ? (
						<Alert variant="default" className="bg-muted">
							<AlertDescription className="text-center py-8">
								No results found for "{model.searchQuery}". Try a different
								search term.
							</AlertDescription>
						</Alert>
					) : (
						<div className="search-results space-y-3">
							{model.searchData.map((data) => (
								<Card
									key={data.registrationNo}
									className="search-result-card hover:shadow-md transition-shadow"
								>
									<NavLink
										to={`/search/${data.registrationNo}/${data.entryId}`}
										state={{ registrationNo: data.registrationNo }}
										className="no-underline text-foreground"
									>
										<CardContent className="p-4">
											<div className="flex justify-between items-start">
												<div className="space-y-1">
													<h4 className="font-medium">
														{model.selectedOption === "Organisation"
															? data.organisationName
															: data.personOrOrganisationName}
													</h4>
													{model.selectedOption === "Organisation" && (
														<p className="text-sm text-muted-foreground">
															Reg No: {data.registrationNo}
														</p>
													)}
												</div>

												<div className="flex items-center gap-2">
													{model.selectedOption === "Organisation" && (
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
														{isCompanySaved(data.entryId) ? (
															<Bookmark className="h-4 w-4 text-primary" />
														) : (
															<BookmarkPlus className="h-4 w-4" />
														)}
													</Button>
												</div>
											</div>
										</CardContent>
									</NavLink>
								</Card>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
});
