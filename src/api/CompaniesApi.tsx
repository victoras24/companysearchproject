import axios from "axios";

export class CompaniesApi {
	controller: string = `${import.meta.env.VITE_API_URL}/api/organisation`;

	/**
	 *
	 */
	constructor() {}

	getOrganisation = async (organisationName: string, filter: number) => {
		const req = await axios.get(
			`${
				this.controller
			}/${organisationName}${this.handleSelectedFilterForTheOrganisationApiCall(
				filter
			)}`
		);
		return req.data;
	};

	getOrganisationAddress = async (addressSeqNo: string) => {
		const req = await axios.get(`${this.controller}/${addressSeqNo}/address`);
		return req.data;
	};

	getDetailedOrganisation = async (registrationNo: string) => {
		const req = await axios.get(
			`${this.controller}/${registrationNo}/detailed`
		);
		return req.data;
	};

	getOrganisationOfficials = async (registrationNo: string) => {
		const req = await axios.get(
			`${this.controller}/${registrationNo}/officials`
		);
		return req.data;
	};

	getRelatedCompanies = async (companyName: string) => {
		const req = await axios.get(`${this.controller}/related/${companyName}`);
		return req.data;
	};

	handleSelectedFilterForTheOrganisationApiCall = (filter: number) => {
		if (filter == 1) {
			return "/active";
		} else if (filter == 2) {
			return "/inactive";
		} else {
			return "";
		}
	};
}

const instance = new CompaniesApi();
export default instance;
