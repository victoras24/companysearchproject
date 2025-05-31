import { useState } from "react";
import Login from "@/components/AuthForm/Login";
import Register from "@/components/AuthForm/Register";

export default function Account() {
	const [isRegister, setIsRegister] = useState(false);
	return (
		<div className="account-page-container">
			{isRegister ? (
				<Register isRegister={setIsRegister} />
			) : (
				<Login isRegister={setIsRegister} />
			)}
		</div>
	);
}
