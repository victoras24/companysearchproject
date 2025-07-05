export namespace gEntities {
	export interface IOrganisationDetails {
		building: string;
		entryId: string;
		nameStatus: string;
		officials: string;
		organisationName: string;
		organisationStatus: string;
		organisationStatusDate: string;
		organisationType: string;
		organisationTypeCode: string;
		registrationDate: string;
		registrationNo: string;
		street: string;
		territory: string;
	}

	export interface ICompany {
		id: number;
		organisationName: string;
		organisationStatus: string;
		addressSeqNo: number;
		registrationDate: string;
		registrationNo: string;
	}

	export interface IRelatedCompany {
		organisationName: string;
		relatedCompany: string;
		officialPosition: string;
		registrationNo: string;
	}

	export interface ICompanyAddress {
		addressSeqNo: number;
		street: string;
		territory: string;
		building: string;
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
		registrationDate: string;
		registrationNo: string;
	}

	export interface ICartItem {
		entryId: string | string;
		name: string;
		price: number;
	}

	export interface ICart {
		items: ICartItem[];
		subtotal: number;
		total: number;
	}
}
