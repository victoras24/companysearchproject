import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/auth";
import { normaliseEmail } from "@/auth/credentials";
import type { AccountForm } from "@/pages/Account/Account";

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
import { Mail } from "lucide-react";

export default function ForgotPassword({ show }: { show: (form: AccountForm) => void }) {
	const [email, setEmail] = useState("");
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);

	const send = async () => {
		if (!email.trim()) {
			toast.error("Please enter your email address");
			return;
		}

		setSending(true);
		const result = await auth.sendPasswordReset(normaliseEmail(email));
		setSending(false);

		if (!result.ok) {
			toast.error(result.message);
			return;
		}
		setSent(true);
	};

	return (
		<Card className="w-full max-w-md mx-auto shadow-lg">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl font-bold text-center">Forgot password</CardTitle>
				<CardDescription className="text-center">
					{sent
						? `If ${normaliseEmail(email)} has an account, a link to set a new password is on its way. Check your email.`
						: "Enter your email and we will send you a link to set a new password."}
				</CardDescription>
			</CardHeader>
			{!sent && (
				<CardContent>
					<div className="space-y-1">
						<Label htmlFor="reset-email">Email</Label>
						<div className="relative">
							<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="reset-email"
								type="email"
								autoComplete="email"
								placeholder="name@example.com"
								className="pl-10"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
					</div>
				</CardContent>
			)}
			<CardFooter className="flex flex-col space-y-4">
				{!sent && (
					<Button className="w-full" onClick={send} disabled={sending}>
						{sending ? "Sending..." : "Send reset link"}
					</Button>
				)}
				<Button
					variant="link"
					className="text-sm text-muted-foreground hover:text-primary w-full"
					onClick={() => show("login")}
				>
					Back to login
				</Button>
			</CardFooter>
		</Card>
	);
}
