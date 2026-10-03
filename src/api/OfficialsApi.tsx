import axios from "axios";

export class OfficialsApi {
  controller: string = `${import.meta.env.VITE_API_URL}/api/company/officials`;

  /**
   *
   */
  constructor() {}

  getOfficial = async (officialName: string, signal?: AbortSignal) => {
    const req = await axios.get(
      `${this.controller}/${encodeURIComponent(officialName)}`,
      { signal }
    );
    return req.data;
  };
}

const instance = new OfficialsApi();
export default instance;
