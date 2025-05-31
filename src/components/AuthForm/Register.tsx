import { useState } from "react";
import { toast } from "sonner";
import useSignUpWithEmailAndPassword from "../../hooks/useSignUpWithEmailAndPassword";
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

import { Mail, Lock, User, ArrowRight, UserCircle } from "lucide-react";
import MicrosoftAuth from "./MicrosoftAuth";

interface RegisterProps {
	isRegister: (value: boolean) => void;
}

export default function Register({ isRegister }: RegisterProps) {
	const [inputs, setInputs] = useState({
		fullName: "",
		username: "",
		email: "",
		password: "",
	});

	const { loading, signup } = useSignUpWithEmailAndPassword();

	const handleSignup = async () => {
		try {
			await signup(inputs);
		} catch (error) {
			toast.error("An unexpected error occurred. Please try again.");
		}
	};

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
					{/* <MicrosoftAuth prefix={"Register"} /> */}
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
						<Label htmlFor="username">Username</Label>
						<div className="relative">
							<User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="username"
								type="text"
								placeholder="Username"
								className="pl-10"
								value={inputs.username}
								onChange={(e) =>
									setInputs({ ...inputs, username: e.target.value })
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
						!inputs.fullName ||
						!inputs.username
							? true
							: false
					}
				>
					{loading ? "Creating account..." : "Create account"}
					{!loading && <ArrowRight className="ml-2 h-4 w-4" />}
				</Button>
				<Button
					variant="link"
					className="text-sm text-muted-foreground hover:text-primary w-full"
					onClick={() => isRegister(false)}
				>
					Already have an account? Login
				</Button>
			</CardFooter>
		</Card>
	);
}
