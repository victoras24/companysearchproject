import axios from "axios";

export class CompaniesApi {
	controller: string = `${import.meta.env.VITE_API_URL}/api/company`;

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

	getDetailedOrganisation = async (registrationNo: number) => {
		const req = await axios.get(
			`${this.controller}/${registrationNo}/detailed`
		);
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
