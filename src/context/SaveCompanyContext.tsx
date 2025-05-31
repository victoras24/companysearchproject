import React, {
	createContext,
	useState,
	useContext,
	type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "./AuthStoreContext";
import type { gEntities } from "@/gEntities";
import { toast } from "sonner";

interface SaveCompanyContext {
	setGroups: any;
	groups: gEntities.IGroup[];
	savedCompanies: any;
	setSavedCompanies: any;
	createGroup: any;
	addCompanyToGroup: any;
	saveCompany: any;
}

const SavedCompanyContext = createContext<SaveCompanyContext | null>(null);

export function SavedCompanyProvider({ children }: { children: ReactNode }) {
	const [groups, setGroups] = useState<gEntities.IGroup[]>([]);
	const [savedCompanies, setSavedCompanies] = useState([]);
	const { user } = useAuth();

	const saveCompany = (company: any) => {
		{
			user
				? setSavedCompanies((prevState: any) =>
						prevState.some((saved: any) => saved.entry_id === company.entry_id)
							? prevState.filter(
									(saved: any) => saved.entry_id !== company.entry_id
							  )
							: [company, ...prevState]
				  )
				: toast.warning(
						"Please register or login if you already an account, to save and organise companies"
				  );
		}
	};

	const addCompanyToGroup = (company: any, groupId: string) =>
		setGroups((prevState: any) =>
			prevState.map((previousGroup: any) => {
				return previousGroup.id === groupId
					? {
							...previousGroup,
							isExtended: true,
							companies: [
								...previousGroup.companies.filter(
									(prevCompany: any) =>
										prevCompany.entry_id !== company.entry_id
								),
								company,
							],
					  }
					: previousGroup;
			})
		);

	const createGroup = (groupName: any) =>
		setGroups((prevState: any[]) => [
			...prevState,
			{
				id: `group-${uuidv4()}`,
				name: groupName,
				isExtended: false,
				companies: [],
			},
		]);

	return (
		<SavedCompanyContext.Provider
			value={{
				groups,
				setGroups,
				savedCompanies,
				setSavedCompanies,
				createGroup,
				addCompanyToGroup,
				saveCompany,
			}}
		>
			{children}
		</SavedCompanyContext.Provider>
	);
}

export function useCompanyContext() {
	return useContext(SavedCompanyContext);
}
