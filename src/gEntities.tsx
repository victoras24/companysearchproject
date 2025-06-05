export namespace gEntities {
	export interface IOrganisationDetails {
		building: string;
		entryId: number;
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
		entryId: number;
		organisationName: string;
		organisationStatus: string;
		organisationType: string;
		registrationDate: string;
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
		companies: ICompany[];
	}

	export interface ISavedCompany {
		entryId: number;
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
		entryId: number | string;
		name: string;
		price: number;
	}

	export interface ICart {
		items: ICartItem[];
		subtotal: number;
		total: number;
	}
}
