import { useState } from "react";
import Login from "@/components/AuthForm/Login";
import Register from "@/components/AuthForm/Register";
import ForgotPassword from "@/components/AuthForm/ForgotPassword";

export type AccountForm = "login" | "register" | "forgot-password";

export default function Account() {
	const [form, setForm] = useState<AccountForm>("login");
	return (
		<div className="account-page-container">
			{form === "register" && <Register show={setForm} />}
			{form === "login" && <Login show={setForm} />}
			{form === "forgot-password" && <ForgotPassword show={setForm} />}
		</div>
	);
}
