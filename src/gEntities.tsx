export interface ICompany {
	id: number;
	organisationName: string;
	organisationStatus: string;
	addressSeqNo: number;
	registrationDate: string;
	registrationNo: string;
	organisationTypeCode?: string | null;
	organisationType?: string | null;
	// From the API; saved favourites written before status groups have none.
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

export interface IUser {
	uid: string;
	email: string;
	favorites: any[];
	fullName: string;
	groups: any[];
	savedCompanies: ISavedCompany[];
	username: string;
	phoneNumber: number;
}

export interface IGroup {
	id: string;
	name: string;
	isExtended: boolean;
	companies: ICompanyInGroup[];
}

export interface ICompanyInGroup {
	id: number;
	name: string;
	registrationNo?: string;
	organisationTypeCode?: string | null;
}

export interface ISavedCompany {
	id: number;
	addressSeqNo: number;
	nameStatus: string;
	organisationName: string;
	organisationStatus: string;
	organisationStatusDate: string;
	organisationSubType: string;
	organisationType: string;
	organisationTypeCode?: string | null;
	registrationDate: string;
	registrationNo: string;
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
