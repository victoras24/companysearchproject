import axios from "axios";

export class CompaniesApi {
	controller: string = `${import.meta.env.VITE_API_URL}/api/company`;

	/**
	 *
	 */
	constructor() {}

	getRelatedCompanies = async (companyName: string) => {
		const req = await axios.get(`${this.controller}/${companyName}/related`);
		return req.data;
	};

}

const instance = new CompaniesApi();
export default instance;
