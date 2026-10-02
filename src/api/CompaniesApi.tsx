import axios from "axios";

export class CompaniesApi {
	controller: string = `${import.meta.env.VITE_API_URL}/api/company`;

	/**
	 *
	 */
	constructor() {}

	getOrganisationAddress = async (addressSeqNo: number) => {
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
			`${this.controller}/${registrationNo}/key-people`
		);
		return req.data;
	};

	getRelatedCompanies = async (companyName: string) => {
		const req = await axios.get(`${this.controller}/${companyName}/related`);
		return req.data;
	};

}

const instance = new CompaniesApi();
export default instance;
