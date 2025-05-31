import { useEffect, useState } from "react";
import { AccountaDetailsModel } from "./AccountDetails_model";
import { useAuth } from "../../context/AuthStoreContext";
import { observer } from "mobx-react";
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
import {
	User,
	Building2,
	Users,
	Mail,
	AtSign,
	Calendar,
	Lock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useLogout from "@/hooks/useLogout";
import moment from "moment";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router";

const AccountDetails = observer(() => {
	const [model] = useState(() => new AccountaDetailsModel());
	const { user } = useAuth();
	const navigate = useNavigate();
	const auth = getAuth();
	const { handleLogOut } = useLogout();
	const [activeTab, setActiveTab] = useState("overview");

	useEffect(() => {
		if (user?.uid) {
			model.calculateGroupCount(user.uid);
			model.calculateFavoritesCount(user.uid);
			// Additional data that could be fetched
			// model.getAccountActivity(user.uid);
		}
	}, [user?.uid]);

	if (model.isLoading) {
		return (
			<Card className="w-full max-w-3xl mx-auto mt-8">
				<CardHeader>
					<Skeleton className="h-8 w-1/3" />
					<Skeleton className="h-4 w-1/2" />
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-10 w-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="w-full max-w-4xl mx-auto py-8 px-4">
			<div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
				<div className="flex items-center justify-center bg-primary/10 rounded-full w-24 h-24">
					{auth.currentUser?.photoURL ? (
						<img
							src={auth.currentUser?.photoURL}
							alt="Profile"
							className="rounded-full w-20 h-20 object-cover"
						/>
					) : (
						<User size={40} className="text-primary" />
					)}
				</div>

				<div className="space-y-2">
					<h1 className="text-3xl font-bold">{user?.fullName || "User"}</h1>
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<AtSign size={16} />
						<span>{user?.username || "username"}</span>
					</div>
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<Mail size={16} />
						<span>{user?.email || "email@example.com"}</span>
					</div>
					<div className="flex gap-2 mt-2">
						<Badge variant="outline" className="flex items-center gap-1">
							<Building2 size={14} /> {model.favoriteCount} Companies
						</Badge>
						<Badge variant="outline" className="flex items-center gap-1">
							<Users size={14} /> {model.groupCount} Groups
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
							<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
								<div>
									<h3 className="text-sm font-medium text-muted-foreground mb-1">
										Full Name
									</h3>
									<p className="text-base">{user?.fullName || "Not set"}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-muted-foreground mb-1">
										Username
									</h3>
									<p className="text-base">{user?.username || "Not set"}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-muted-foreground mb-1">
										Email
									</h3>
									<p className="text-base">{user?.email || "Not set"}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-muted-foreground mb-1">
										Phone Number
									</h3>
									<p className="text-base">{user?.phoneNumber || "Not set"}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-muted-foreground mb-1">
										Member Since
									</h3>
									<p className="text-base flex items-center gap-1.5">
										<Calendar size={16} className="text-muted-foreground" />
										{moment(auth.currentUser?.metadata.creationTime).format(
											"LL"
										)}
									</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-muted-foreground mb-1">
										Last Login
									</h3>
									<p className="text-base flex items-center gap-1.5">
										<Calendar size={16} className="text-muted-foreground" />
										{moment(auth.currentUser?.metadata.lastSignInTime).format(
											"LL"
										)}
									</p>
								</div>
							</div>
						</CardContent>
						{/* <CardFooter className="flex justify-between border-t pt-6">
							<Button variant="outline">Download Data</Button>
							<Button>Update Profile</Button>
						</CardFooter> */}
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
										{model.favoriteCount}
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
										{model.groupCount}
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
										onClick={() => model.sendResetPassEmail(auth, user.email)}
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
