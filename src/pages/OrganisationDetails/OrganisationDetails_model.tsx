import { makeObservable, observable, action } from "mobx";
import CompaniesApi, {
	CompaniesApi as ICompaniesApi,
} from "../../api/CompaniesApi";
import OfficialsApi, {
	OfficialsApi as IOfficialsApi,
} from "../../api/OfficialsApi";
import type { gEntities } from "@/gEntities";

class OrganisationDetailsModel {
	@observable accessor isLoading: boolean = true;
	detailedData?: gEntities.IOrganisationDetails;
	@observable accessor detailedOfficialsData: any;
	CompaniesApi: ICompaniesApi;
	OfficialsApi: IOfficialsApi;
	registrationNo: number;

	constructor(registrationNo: number) {
		makeObservable(this);
		this.CompaniesApi = CompaniesApi;
		this.OfficialsApi = OfficialsApi;
		this.registrationNo = registrationNo;
	}

	@action
	onMount = async () => {
		await this.getDetailedOrganisation();
		await this.getDetailedOrganisationOfficial();
		this.setIsLoading(false);
	};

	@action
	getDetailedOrganisation = async () => {
		try {
			const res = await CompaniesApi.getDetailedOrganisation(
				this.registrationNo
			);
			if (res) {
				this.setDetailData(res);
			}
		} catch (error) {
			console.error("Error fetching detail data:", error);
		}
	};

	@action
	getDetailedOrganisationOfficial = async () => {
		try {
			const res = await OfficialsApi.getDetailedOfficial(this.registrationNo);
			this.setDetailOfficialsData(res);
		} catch (error) {
			console.error("Error fetching detail data:", error);
		}
	};

	@action
	setDetailData = (detailedData: gEntities.IOrganisationDetails) => {
		this.detailedData = detailedData;
	};

	@action
	setDetailOfficialsData = (detailedData: any) => {
		this.detailedOfficialsData = detailedData;
	};

	@action
	setIsLoading = (isLoading: boolean) => {
		this.isLoading = isLoading;
	};
}

export default OrganisationDetailsModel;
