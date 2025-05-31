import type { gEntities } from "@/gEntities";
import { createContext, useState, useContext, type ReactNode } from "react";

interface AuthContextType {
	user: gEntities.IUser;
	updateUser: (user: any) => void;
	userLogin: (user: any) => void;
	userLogout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState(() => {
		try {
			const storedUser = localStorage.getItem("user-info");
			return storedUser ? JSON.parse(storedUser) : null;
		} catch (error) {
			console.error("Failed to parse user from localStorage", error);
			return null;
		}
	});

	const updateUser = (newUser: gEntities.IUser) => {
		setUser(newUser);
	};

	const userLogout = () => {
		setUser(null);
	};

	const userLogin = (user: gEntities.IUser) => {
		setUser(user);
	};

	return (
		<AuthContext.Provider value={{ updateUser, userLogout, userLogin, user }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
