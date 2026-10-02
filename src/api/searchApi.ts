import axios from "axios";
import OfficialsApi from "./OfficialsApi";
import type { IOfficials, IPaginatedSearchData } from "@/gEntities";
import type { SearchFn } from "@/pages/Search/SearchSession";

const controller = `${import.meta.env.VITE_API_URL}/api/company`;

export const search: SearchFn = async ({
	entityType,
	query,
	statusFilter,
	page,
	pageSize,
	signal,
}) => {
	if (entityType === "official") {
		// The officials endpoint is not paginated and returns no total.
		const officials: IOfficials[] = await OfficialsApi.getOfficial(
			query,
			signal
		);
		return { items: officials, total: officials.length };
	}

	const req = await axios.get<IPaginatedSearchData>(`${controller}/search`, {
		params: {
			q: query,
			page,
			pageSize,
			...(statusFilter !== "all" && { status: statusFilter }),
		},
		signal,
	});
	return { items: req.data.items, total: req.data.totalItemsCount };
};
