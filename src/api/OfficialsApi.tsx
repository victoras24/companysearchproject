import axios from "axios";

export class OfficialsApi {
	controller: string = `${import.meta.env.VITE_API_URL}/api/officials`;

	/**
	 *
	 */
	constructor() {}

	getOfficial = async (officialName: string) => {
		const req = await axios.get(`${this.controller}/${officialName}`);
		return req.data;
	};

	getDetailedOfficial = async (registrationNo: string) => {
		const req = await axios.get(
			`${this.controller}/${registrationNo}/detailed`
		);
		return req.data;
	};
}

const instance = new OfficialsApi();
export default instance;
