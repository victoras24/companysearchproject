import { useState } from "react";
import { observer } from "mobx-react";
import { toast } from "sonner";
import { auth } from "@/auth";
import { library } from "@/library";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Building2, Users, Mail, Lock, Pencil } from "lucide-react";
import { useNavigate } from "react-router";

const AccountDetails = observer(() => {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("overview");
	const [draft, setDraft] = useState<{ fullName: string; phoneNumber: string } | null>(null);
	const [saving, setSaving] = useState(false);

	// The route only shows this page to a signed-in user.
	if (auth.state.status !== "signed-in") return null;
	const user = auth.state.profile;

	const handleLogOut = async () => {
		await auth.signOut();
		toast.success("User logged out successfully");
	};

	const saveProfile = async () => {
		if (!draft) return;
		setSaving(true);
		const result = await auth.updateProfile({
			fullName: draft.fullName.trim(),
			phoneNumber: draft.phoneNumber.trim(),
		});
		setSaving(false);

		if (!result.ok) {
			toast.error("Failed to update your details");
			return;
		}
		setDraft(null);
		toast.success("Your details have been updated");
	};

	const sendResetEmail = async () => {
		const result = await auth.sendPasswordReset(user.email);
		if (result.ok) toast.success("Reset password email is sent!");
		else toast.error(result.message);
	};

	return (
		<div className="w-full max-w-4xl mx-auto py-8 px-4">
			<div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
				<div className="flex items-center justify-center bg-primary/10 rounded-full w-24 h-24">
					<User size={40} className="text-primary" />
				</div>

				<div className="space-y-2">
					<h1 className="text-3xl font-bold">{user.fullName || "User"}</h1>
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<Mail size={16} />
						<span>{user.email || "email@example.com"}</span>
					</div>
					<div className="flex gap-2 mt-2">
						<Badge variant="outline" className="flex items-center gap-1">
							<Building2 size={14} /> {library.favouriteCount} Companies
						</Badge>
						<Badge variant="outline" className="flex items-center gap-1">
							<Users size={14} /> {library.groupCount} Groups
						</Badge>
					</div>
				</div>

				{/* <div className="ml-auto">
					<Button variant="outline">Edit Profile</Button>
				</div> */}
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid grid-cols-2 w-full max-w-md">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					{/* <TabsTrigger value="activity">Activity</TabsTrigger> */}
					<TabsTrigger value="security">Security</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4 mt-6">
					<Card>
						<CardHeader>
							<CardTitle>Account Overview</CardTitle>
							<CardDescription>
								Manage your account details and preferences
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{draft ? (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
									<div className="space-y-1">
										<Label htmlFor="account-full-name">Full Name</Label>
										<Input
											id="account-full-name"
											value={draft.fullName}
											maxLength={200}
											onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
										/>
									</div>
									<div className="space-y-1">
										<Label htmlFor="account-phone">Phone Number</Label>
										<Input
											id="account-phone"
											type="tel"
											value={draft.phoneNumber}
											maxLength={30}
											onChange={(e) => setDraft({ ...draft, phoneNumber: e.target.value })}
										/>
									</div>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
									<div>
										<h3 className="text-sm font-medium text-muted-foreground mb-1">
											Full Name
										</h3>
										<p className="text-base">{user.fullName || "Not set"}</p>
									</div>
									<div>
										<h3 className="text-sm font-medium text-muted-foreground mb-1">
											Email
										</h3>
										<p className="text-base">{user.email || "Not set"}</p>
									</div>
									<div>
										<h3 className="text-sm font-medium text-muted-foreground mb-1">
											Phone Number
										</h3>
										<p className="text-base">{user.phoneNumber || "Not set"}</p>
									</div>
								</div>
							)}
						</CardContent>
						<CardFooter className="flex justify-end gap-2 border-t pt-6">
							{draft ? (
								<>
									<Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>
										Cancel
									</Button>
									<Button onClick={saveProfile} disabled={saving}>
										{saving ? "Saving..." : "Save"}
									</Button>
								</>
							) : (
								<Button
									variant="outline"
									className="flex items-center gap-1.5"
									onClick={() =>
										setDraft({ fullName: user.fullName, phoneNumber: user.phoneNumber })
									}
								>
									<Pencil size={16} />
									Edit details
								</Button>
							)}
						</CardFooter>
					</Card>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-lg flex items-center gap-2">
									<Building2 size={18} /> Saved Companies
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between py-2">
									<span>Total companies saved</span>
									<Badge variant="secondary" className="text-lg font-semibold">
										{library.favouriteCount}
									</Badge>
								</div>
							</CardContent>
							<CardFooter className="pt-0">
								<Button
									variant="ghost"
									className="w-full"
									onClick={() => navigate("/favorites")}
								>
									View All Saved Companies
								</Button>
							</CardFooter>
						</Card>

						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-lg flex items-center gap-2">
									<Users size={18} /> Created Groups
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between py-2">
									<span>Total groups created</span>
									<Badge variant="secondary" className="text-lg font-semibold">
										{library.groupCount}
									</Badge>
								</div>
							</CardContent>
							<CardFooter className="pt-0">
								<Button
									variant="ghost"
									className="w-full"
									onClick={() => navigate("/organiser")}
								>
									Manage Groups
								</Button>
							</CardFooter>
						</Card>
						<Button variant="destructive" onClick={handleLogOut}>
							Log out
						</Button>
					</div>
				</TabsContent>
				<TabsContent value="security" className="mt-6">
					<Card>
						<CardHeader>
							<CardTitle>Security Settings</CardTitle>
							<CardDescription>
								Manage your account security preferences
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<h3 className="text-base font-medium">Password</h3>
										<p className="text-sm text-muted-foreground">
											Send reset password email
										</p>
									</div>
									<Button
										variant="outline"
										className="flex items-center gap-1.5"
										onClick={sendResetEmail}
									>
										<Lock size={16} />
										Change Password
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
});

export default AccountDetails;
