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
}

export interface IRelatedCompany {
	organisationName: string;
	relatedCompany: string;
	officialPosition: string;
	registrationNo: string;
	organisationTypeCode?: string | null;
}

export interface ICartItem {
	companyName: string;
	companyRegNo: string;
	unitPrice: number;
}

export interface ICart {
	items: ICartItem[];
	subtotal: number;
	total: number;
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
