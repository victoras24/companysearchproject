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
	@observable accessor addressData: any;
	@observable accessor officialsData: any;
	CompaniesApi: ICompaniesApi;
	OfficialsApi: IOfficialsApi;
	registrationNo: string;
	entryId: number;

	constructor(registrationNo: string, entryId: number) {
		makeObservable(this);
		this.CompaniesApi = CompaniesApi;
		this.OfficialsApi = OfficialsApi;
		this.registrationNo = registrationNo;
		this.entryId = entryId;
	}

	@action
	onMount = async () => {
		await this.getDetailedOrganisation();
		this.setIsLoading(false);
	};

	@action
	getDetailedOrganisation = async () => {
		try {
			const res = await CompaniesApi.getDetailedOrganisation(
				this.registrationNo,
				this.entryId
			);
			if (res) {
				this.setDetailData(res);
			}
			const addressRes = await CompaniesApi.getOrganisationAddress(
				res.addressSeqNo
			);
			if (addressRes) {
				this.setAddressData(addressRes);
			}
			const officialRes = await CompaniesApi.getOrganisationOfficials(
				this.registrationNo
			);
			if (officialRes) {
				this.setOfficialsData(officialRes);
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
	setDetailOfficialsData = (detailedData: gEntities.ICompany) => {
		this.detailedOfficialsData = detailedData;
	};

	@action
	setAddressData = (addressData: gEntities.ICompanyAddress) => {
		this.addressData = addressData;
	};

	@action
	setOfficialsData = (officialsData: gEntities.ICompanyAddress) => {
		this.officialsData = officialsData;
	};

	@action
	setIsLoading = (isLoading: boolean) => {
		this.isLoading = isLoading;
	};
}

export default OrganisationDetailsModel;
