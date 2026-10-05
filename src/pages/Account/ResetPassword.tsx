import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { observer } from "mobx-react";
import { toast } from "sonner";
import { auth } from "@/auth";
import { checkNewPassword } from "@/auth/credentials";
import { SessionLoader } from "@/auth/RequireUser";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

/** The page a password reset link opens. The link signs the user in, so they can set a new one. */
const ResetPassword = observer(() => {
	const navigate = useNavigate();
	const [password, setPassword] = useState("");
	const [repeated, setRepeated] = useState("");
	const [saving, setSaving] = useState(false);

	if (auth.state.status === "checking") return <SessionLoader />;

	if (auth.state.status === "signed-out") {
		return (
			<div className="account-page-container">
				<Card className="w-full max-w-md mx-auto shadow-lg">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl font-bold text-center">Reset password</CardTitle>
						<CardDescription className="text-center">
							This reset link is invalid or has expired. Ask for a new one from the login
							page.
						</CardDescription>
					</CardHeader>
					<CardFooter>
						<Button asChild className="w-full">
							<NavLink to="/account">Back to login</NavLink>
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	const save = async () => {
		const problem = checkNewPassword(password, repeated);
		if (problem) {
			toast.error(problem);
			return;
		}

		setSaving(true);
		const result = await auth.setPassword(password);
		setSaving(false);

		if (!result.ok) {
			toast.error(result.message);
			return;
		}
		toast.success("Your password has been changed");
		navigate("/account", { replace: true });
	};

	return (
		<div className="account-page-container">
			<Card className="w-full max-w-md mx-auto shadow-lg">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">Set a new password</CardTitle>
					<CardDescription className="text-center">
						Choose a new password for {auth.state.profile.email}.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="space-y-1">
						<Label htmlFor="new-password">New password</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="new-password"
								type="password"
								autoComplete="new-password"
								placeholder="••••••••"
								className="pl-10"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
					</div>
					<div className="space-y-1">
						<Label htmlFor="repeat-password">Repeat the password</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="repeat-password"
								type="password"
								autoComplete="new-password"
								placeholder="••••••••"
								className="pl-10"
								value={repeated}
								onChange={(e) => setRepeated(e.target.value)}
							/>
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<Button className="w-full" onClick={save} disabled={saving}>
						{saving ? "Saving..." : "Save password"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
});

export default ResetPassword;
