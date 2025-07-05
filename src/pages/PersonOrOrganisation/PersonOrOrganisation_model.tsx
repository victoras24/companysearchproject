import { makeObservable, observable, action } from "mobx";
import CompaniesApi, {
  CompaniesApi as ICompaniesApi,
} from "../../api/CompaniesApi";
import type { gEntities } from "@/gEntities";

class PersonOrOrganisationModel {
  @observable accessor isLoading: boolean = true;
  @observable accessor relatedCompanies: gEntities.IRelatedCompany[] = [];
  CompaniesApi: ICompaniesApi;
  personOrOrganisationName: string;

  constructor(personOrOrganisationName: string) {
    makeObservable(this);
    this.CompaniesApi = CompaniesApi;
    this.personOrOrganisationName = personOrOrganisationName;
  }

  @action
  onMount = async () => {
    await this.getRelated();
    this.setIsLoading(false);
  };

  @action
  getRelated = async () => {
    try {
      const res = await CompaniesApi.getRelatedCompanies(
        this.personOrOrganisationName
      );
      if (res) {
        this.setRelatedCompanies(res);
      }
    } catch (error) {
      console.error("Error fetching detail data:", error);
    }
  };

  @action
  setRelatedCompanies = (relatedCompanies: gEntities.IRelatedCompany[]) => {
    this.relatedCompanies = relatedCompanies;
  };

  @action
  setIsLoading = (isLoading: boolean) => {
    this.isLoading = isLoading;
  };
}

export default PersonOrOrganisationModel;
