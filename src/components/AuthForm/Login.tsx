import { useState } from "react";
import { toast } from "sonner";
import useLogin from "../../hooks/useLogin";
import GoogleAuth from "./GoogleAuth";

// Shadcn Components
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

// Icons
import { Mail, Lock, ArrowRight } from "lucide-react";
import MicrosoftAuth from "./MicrosoftAuth";

interface LoginProps {
	isRegister: (value: boolean) => void;
}

export default function Login({ isRegister }: LoginProps) {
	const [inputs, setInputs] = useState({
		email: "",
		password: "",
	});

	const { loading, login } = useLogin();

	const handleLogin = async () => {
		try {
			await login(inputs);
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	return (
		<Card className="w-full max-w-md mx-auto shadow-lg">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl font-bold text-center">Log in</CardTitle>
				<CardDescription className="text-center">
					Login to save and organize the companies you search for, making it
					easier to track, manage, and revisit important information.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<GoogleAuth prefix="Login" />
					{/* <MicrosoftAuth prefix={"Login"} /> */}
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
					onClick={handleLogin}
					disabled={loading || !inputs.email || !inputs.password ? true : false}
				>
					{loading ? "Signing in..." : "Sign in"}
					{!loading && <ArrowRight className="ml-2 h-4 w-4" />}
				</Button>
				<Button
					variant="link"
					className="text-sm text-muted-foreground hover:text-primary w-full"
					onClick={() => isRegister(true)}
				>
					Don't have an account? Create one now!
				</Button>
			</CardFooter>
		</Card>
	);
}
