import { makeObservable, observable, action } from "mobx";
import CompaniesApi, {
  CompaniesApi as ICompaniesApi,
} from "../../api/CompaniesApi";
import OfficialsApi, {
  OfficialsApi as IOfficialsApi,
} from "../../api/OfficialsApi";
import type { gEntities } from "@/gEntities";

class OrganisationDetailsModel {
  @observable accessor isLoading: boolean = true;
  @observable accessor isLoadingOfficials: boolean = false;
  @observable accessor isLoadingRelated: boolean = false;
  @observable accessor activeTab: string;
  companyAddressData?: gEntities.ICompanyAddress;
  @observable accessor detailedOfficialsData: any;
  @observable accessor addressData: any;
  @observable accessor officialsData: any;
  @observable accessor relatedCompanies: gEntities.IRelatedCompany[] = [];

  @observable accessor officialsLoaded: boolean = false;
  @observable accessor relatedLoaded: boolean = false;

  CompaniesApi: ICompaniesApi;
  OfficialsApi: IOfficialsApi;
  addressSeqNo: number;

  constructor(addressSeqNo: number, activeTab: string) {
    makeObservable(this);
    this.CompaniesApi = CompaniesApi;
    this.OfficialsApi = OfficialsApi;
    this.addressSeqNo = addressSeqNo;
    this.activeTab = activeTab;
  }

  @action
  onMount = async () => {
    await this.getCompanyAddress();
    this.setIsLoading(false);
    // await this.backgroundLoading();
  };

  //   @action
  //   backgroundLoading = () => {
  //     this.loadOfficials();
  //     this.loadRelatedCompanies();
  //   };

  @action
  getCompanyAddress = async () => {
    try {
      const res = await CompaniesApi.getOrganisationAddress(this.addressSeqNo);
      if (res) {
        this.setCompanyAddress(res);
      }
    } catch (error) {
      console.error("Error fetching detail data:", error);
    }
  };

  //   @action
  //   loadOfficials = async () => {
  //     if (this.officialsLoaded || this.isLoadingOfficials) return;

  //     this.setIsLoadingOfficials(true);
  //     try {
  //       const officialRes = await CompaniesApi.getOrganisationOfficials(
  //         this.registrationNo
  //       );
  //       if (officialRes) {
  //         this.setOfficialsData(officialRes);
  //       }
  //       this.officialsLoaded = true;
  //     } catch (error) {
  //       console.error("Error fetching officials data:", error);
  //     } finally {
  //       this.setIsLoadingOfficials(false);
  //     }
  //   };

  //   @action
  //   loadRelatedCompanies = async () => {
  //     if (this.relatedLoaded || this.isLoadingRelated || !this.detailedData)
  //       return;

  //     this.setIsLoadingRelated(true);
  //     try {
  //       const relatedCompanies = await CompaniesApi.getRelatedCompanies(
  //         this.detailedData.organisationName
  //       );
  //       if (relatedCompanies) {
  //         this.setRelatedCompanies(relatedCompanies);
  //       }
  //       this.relatedLoaded = true;
  //     } catch (error) {
  //       console.error("Error fetching related companies:", error);
  //     } finally {
  //       this.setIsLoadingRelated(false);
  //     }
  //   };

  @action
  setCompanyAddress = (companyAddress: gEntities.ICompanyAddress) => {
    this.companyAddressData = companyAddress;
  };

  @action
  setDetailOfficialsData = (detailedData: gEntities.ICompany) => {
    this.detailedOfficialsData = detailedData;
  };

  @action
  setAddressData = (addressData: gEntities.ICompanyAddress) => {
    this.addressData = addressData;
  };

  @action
  setRelatedCompanies = (relatedCompanies: gEntities.IRelatedCompany[]) => {
    this.relatedCompanies = relatedCompanies;
  };

  @action
  setOfficialsData = (officialsData: gEntities.ICompanyAddress) => {
    this.officialsData = officialsData;
  };

  @action
  setIsLoading = (isLoading: boolean) => {
    this.isLoading = isLoading;
  };

  @action
  setIsLoadingOfficials = (isLoading: boolean) => {
    this.isLoadingOfficials = isLoading;
  };

  @action
  setIsLoadingRelated = (isLoading: boolean) => {
    this.isLoadingRelated = isLoading;
  };

  @action
  setActiveTab = (activeTab: string) => {
    this.activeTab = activeTab;
  };
}

export default OrganisationDetailsModel;
