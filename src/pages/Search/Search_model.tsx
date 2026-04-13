import { action, makeObservable, observable } from "mobx";
import CompaniesApi from "../../api/CompaniesApi";
import OfficialsApi from "../../api/OfficialsApi";
import { paginationConfig } from "@/constants/pagination";

const api_config = {
	Organisation: {
		method: CompaniesApi.getOrganisation,
		paginatedMethod: CompaniesApi.getOrganisationPaginated,
		dataField: "organisationData",
	},
	Official: {
		method: OfficialsApi.getOfficial,
		paginatedMethod: CompaniesApi.getOrganisationPaginated,
		dataField: "officialData",
	},
};

class SearchModel {
	@observable.ref accessor searchData: any[] = [];
	@observable accessor searchQuery: string = "";
	@observable accessor isLoading: boolean = false;
	@observable accessor isFilterOpen: boolean = false;
	@observable accessor selectedFilter: any = 3;
	@observable accessor selectedOption: keyof typeof api_config = "Organisation";
	@observable accessor selectedPage: number = 1;

	@observable accessor currentPage: number = 1;

	readonly pageLimit: number = paginationConfig.defaultLimit;

	constructor() {
		makeObservable(this);
	}

	@action
	handleSearch = async () => {
		if (this.searchQuery.length <= 2) return;

		if (!this.searchQuery.trim()) {
			this.setSearchData([]);
			return;
		}

		try {
			this.setLoading(true);
			const config = api_config[this.selectedOption];
			const res = await config.method(this.searchQuery, this.selectedFilter);
			this.setSearchData(Array.isArray(res) ? res : []);
		} catch (error) {
			console.error("Search error:", error);
			this.setSearchData([]);
		} finally {
			this.setLoading(false);
		}
	};

	@action
	handlePaginatedSearch = async () => {
		if (this.searchQuery.length <= 2) return;

		if (!this.searchQuery.trim()) {
			this.setSearchData([]);
			return;
		}

		try {
			this.setLoading(true);
			const config = api_config[this.selectedOption];
			const res = await config.paginatedMethod(
				this.searchQuery,
				this.currentPage
			);
			this.setSearchData(Array.isArray(res) ? res : []);
		} catch (error) {
			console.error("Search error:", error);
			this.setSearchData([]);
		} finally {
			this.setLoading(false);
		}
	};

	@action
	setSearchData = (searchData: any[]) => {
		this.searchData = searchData;
	};

	@action
	handleInputChange = (value: string) => {
		this.setSearchQuery(value);
		if (value.trim()) {
			this.setLoading(true);
		}
	};

	@action
	setSearchQuery = (input: string) => {
		this.searchQuery = input;
	};

	@action
	setLoading = (isLoading: boolean) => {
		this.isLoading = isLoading;
	};

	@action
	handleSelectFilter = (value: number) => {
		this.setSelectedFilter(value);
	};

	@action
	setSelectedFilter = (id: number) => {
		this.selectedFilter = id;
	};

	@action
	setSelectedOption = (option: any) => {
		this.selectedOption = option;
	};

	@action
	setPage = (page: number) => {
		this.selectedPage = page;
	};

	@action
	closeFilter = () => {
		this.isFilterOpen = false;
	};

	@action
	setFilterOpen = (isOpen: boolean) => {
		this.isFilterOpen = isOpen;
	};

	@action
	cleanInput = () => {
		this.setSearchQuery("");
		this.searchData = [];
	};
}

export default SearchModel;
