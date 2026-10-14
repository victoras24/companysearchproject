export interface ICompany {
	id: number;
	organisationName: string;
	organisationStatus: string;
	addressSeqNo: number;
	registrationDate: string;
	registrationNo: string;
	organisationTypeCode?: string | null;
	organisationType?: string | null;
	statusGroup?: string | null;
	statusText?: string | null;
	statusDate?: string | null;
	/** The NACE section letter CYSTAT lists the company in, or null when it lists it nowhere. */
	sector?: string | null;
}

export interface IRelatedCompany {
	organisationName: string;
	relatedCompany: string;
	officialPosition: string;
	registrationNo: string;
	organisationTypeCode?: string | null;
}

export interface ICartItem {
	organisationTypeCode: string;
	registrationNo: string;
	organisationName: string;
	/** Shown on the cart; missing for items added where they were not known. */
	statusGroup?: string | null;
	registrationDate?: string | null;
}

export interface IPaginatedSearchData {
	items: ICompany[];
	totalItemsCount: number;
}

export interface IOfficials {
	organisationName: string;
	registrationNo: string;
	organisationTypeCode: string;
	organisationType: string;
	personOrOrganisationName: string;
	officialPosition: string;
}
