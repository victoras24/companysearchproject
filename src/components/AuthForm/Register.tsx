import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/auth";
import { checkSignUp, normaliseEmail } from "@/auth/credentials";
import type { AccountForm } from "@/pages/Account/Account";
import GoogleAuth from "./GoogleAuth";

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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

import { Mail, Lock, ArrowRight, UserCircle, MailCheck } from "lucide-react";

interface RegisterProps {
	show: (form: AccountForm) => void;
}

export default function Register({ show }: RegisterProps) {
	const [inputs, setInputs] = useState({
		fullName: "",
		email: "",
		password: "",
	});

	const [loading, setLoading] = useState(false);
	const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

	const handleSignup = async () => {
		const problem = checkSignUp(inputs);
		if (problem) {
			toast.error(problem);
			return;
		}

		const email = normaliseEmail(inputs.email);
		setLoading(true);
		const result = await auth.signUp({
			email,
			password: inputs.password,
			fullName: inputs.fullName.trim(),
		});
		setLoading(false);

		if (!result.ok) {
			toast.error(`Signup failed: ${result.message}`);
		} else if (result.confirmationNeeded) {
			setConfirmationSentTo(email);
		}
	};

	if (confirmationSentTo) {
		return (
			<Card className="w-full max-w-md mx-auto shadow-lg">
				<CardHeader className="space-y-3">
					<MailCheck className="h-10 w-10 mx-auto text-primary" />
					<CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
					<CardDescription className="text-center">
						We sent a link to {confirmationSentTo}. Open it to confirm your account, then
						log in.
					</CardDescription>
				</CardHeader>
				<CardFooter>
					<Button className="w-full" onClick={() => show("login")}>
						Back to login
					</Button>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-md mx-auto shadow-lg">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl font-bold text-center">
					Register
				</CardTitle>
				<CardDescription className="text-center">
					Create an account to unlock personalized features that help you stay
					organized and streamline your search experience.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<GoogleAuth prefix="Register" />
				</div>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<Separator className="w-full" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							OR CONTINUE WITH EMAIL
						</span>
					</div>
				</div>

				<div className="space-y-3">
					<div className="space-y-1">
						<Label htmlFor="fullName">Full Name</Label>
						<div className="relative">
							<UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="fullName"
								type="text"
								placeholder="Full Name"
								className="pl-10"
								value={inputs.fullName}
								onChange={(e) =>
									setInputs({ ...inputs, fullName: e.target.value })
								}
							/>
						</div>
					</div>

					<div className="space-y-1">
						<Label htmlFor="email">Email</Label>
						<div className="relative">
							<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="email"
								type="email"
								placeholder="name@example.com"
								className="pl-10"
								value={inputs.email}
								onChange={(e) =>
									setInputs({ ...inputs, email: e.target.value })
								}
							/>
						</div>
					</div>

					<div className="space-y-1">
						<Label htmlFor="password">Password</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								className="pl-10"
								value={inputs.password}
								onChange={(e) =>
									setInputs({ ...inputs, password: e.target.value })
								}
							/>
						</div>
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex flex-col space-y-4">
				<Button
					className="w-full"
					onClick={handleSignup}
					disabled={
						loading ||
						!inputs.email ||
						!inputs.password ||
						!inputs.fullName
					}
				>
					{loading ? "Creating account..." : "Create account"}
					{!loading && <ArrowRight className="ml-2 h-4 w-4" />}
				</Button>
				<Button
					variant="link"
					className="text-sm text-muted-foreground hover:text-primary w-full"
					onClick={() => show("login")}
				>
					Already have an account? Login
				</Button>
			</CardFooter>
		</Card>
	);
}
