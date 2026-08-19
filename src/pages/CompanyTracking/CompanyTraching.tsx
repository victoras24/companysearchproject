import React from "react";
import { useNavigate } from "react-router-dom";
import {
	Building2,
	RefreshCw,
	FileText,
	Archive,
	UserCog,
	MapPin,
	Check,
	Crown,
	Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import Footer from "../Home/Footer";

const alertTypes = [
	{ icon: Building2, label: "Company name change" },
	{ icon: RefreshCw, label: "Company type change" },
	{ icon: FileText, label: "Organisation status" },
	{ icon: Archive, label: "New registry filings" },
	{ icon: UserCog, label: "Director changes" },
	{ icon: MapPin, label: "Registered office" },
	{ icon: FileText, label: "HE32 archive updates" },
];

type Plan = {
	name: string;
	price: string;
	companies: string;
	perCompany: string;
	highlighted?: boolean;
	description: string;
};

const plans: Plan[] = [
	{
		name: "Starter",
		price: "€4.99",
		companies: "Track up to 5 companies",
		perCompany: "€1.00 / company / month",
		description: "For individuals keeping an eye on a handful of companies.",
	},
	{
		name: "Business",
		price: "€9.99",
		companies: "Track up to 20 companies",
		perCompany: "€0.50 / company / month",
		highlighted: true,
		description: "For agents and SMEs monitoring an active portfolio.",
	},
	{
		name: "Professional",
		price: "€19.99",
		companies: "Track up to 50 companies",
		perCompany: "€0.40 / company / month",
		description: "For law firms and compliance teams running bulk monitoring.",
	},
];

const CompanyTracking: React.FC = () => {
	const navigate = useNavigate();

	return (
		<div className="home-container">
			<div className="w-full py-12">
				{/* Hero */}
				<div className="text-center space-y-6 mb-16">
					<Badge className="bg-primary text-primary-foreground gap-1 mx-auto">
						<Crown className="h-3 w-3" />
						Premium feature
					</Badge>
					<h1 className="text-4xl font-bold tracking-tight md:text-5xl">
						Know the moment a company{" "}
						<span className="text-primary">changes</span>
					</h1>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Add any Cyprus company to your watchlist. We check the registry for
						you and email you the moment something changes no manual
						re-checking, ever.
					</p>
				</div>

				{/* Alert types */}
				<div className="mb-16">
					<h2 className="text-2xl font-semibold mb-6 text-center">
						What we watch for
					</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{alertTypes.map(({ icon: Icon, label }) => (
							<Card
								key={label}
								className="text-center hover:shadow-md transition-all"
							>
								<CardContent className="pt-6 flex flex-col items-center gap-3">
									<div className="bg-primary/10 p-3 rounded-full">
										<Icon className="h-5 w-5 text-primary" />
									</div>
									<span className="text-sm font-medium">{label}</span>
								</CardContent>
							</Card>
						))}
					</div>
					<p className="text-center text-sm text-muted-foreground mt-6">
						Every plan tracks all 7 change types on every company you add
						there's no picking and choosing.
					</p>
				</div>

				<Separator className="mb-16" />

				{/* Pricing */}
				<div className="mb-16">
					<h2 className="text-2xl font-semibold mb-2 text-center">
						Pick your plan
					</h2>
					<p className="text-muted-foreground text-center mb-10">
						Monthly billing. Change or cancel anytime.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
						{plans.map((plan) => (
							<Card
								key={plan.name}
								className={
									plan.highlighted
										? "border-primary shadow-lg relative"
										: "relative"
								}
							>
								{plan.highlighted && (
									<Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
										Most popular
									</Badge>
								)}
								<CardHeader className="text-center pb-2">
									<CardTitle>{plan.name}</CardTitle>
									<div className="mt-2">
										<span className="text-3xl font-bold">{plan.price}</span>
										<span className="text-muted-foreground">/month</span>
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{plan.perCompany}
									</p>
								</CardHeader>
								<CardContent className="space-y-4">
									<p className="text-sm text-muted-foreground text-center">
										{plan.description}
									</p>
									<Separator />
									<ul className="space-y-2 text-sm">
										<li className="flex items-center gap-2">
											<Check className="h-4 w-4 text-primary shrink-0" />
											{plan.companies}
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-4 w-4 text-primary shrink-0" />
											All 7 alert types included
										</li>
										<li className="flex items-center gap-2">
											<Mail className="h-4 w-4 text-primary shrink-0" />
											Daily email notifications
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-4 w-4 text-primary shrink-0" />
											20% off every Company Report
										</li>
									</ul>
									<Button
										className="w-full mt-2"
										variant={plan.highlighted ? "default" : "outline"}
										onClick={() =>
											navigate(
												`/company-tracking/checkout?plan=${plan.name.toLowerCase()}`
											)
										}
									>
										Choose {plan.name}
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				{/* Report discount callout */}
				<Card className="mb-16 border-none bg-muted/50">
					<CardContent className="pt-6 flex flex-col md:flex-row items-center gap-4 justify-between">
						<div className="flex items-center gap-4">
							<div className="bg-primary/10 p-3 rounded-full">
								<FileText className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="font-medium">
									Already tracking a company? Get its full report cheaper.
								</p>
								<p className="text-sm text-muted-foreground">
									Every plan includes 20% off Company Reports normally €39.99,
									from €31.99 for subscribers.
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							onClick={() => navigate("/cyprus-company-search")}
						>
							Order a report
						</Button>
					</CardContent>
				</Card>

				{/* FAQ */}
				<div className="mb-16">
					<h2 className="text-2xl font-semibold mb-6 text-center">
						Frequently Asked Questions
					</h2>
					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="item-1">
							<AccordionTrigger>How will I be notified?</AccordionTrigger>
							<AccordionContent>
								By email, sent to the address on your account as soon as we
								detect a change. SMS and webhook delivery are on our roadmap.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-2">
							<AccordionTrigger>
								Can I choose which changes to be alerted about?
							</AccordionTrigger>
							<AccordionContent>
								Not yet every tracked company is monitored for all 7 change
								types by default, so you never miss something important.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-3">
							<AccordionTrigger>
								What happens if I go over my company limit?
							</AccordionTrigger>
							<AccordionContent>
								You won't be charged extra automatically you'll be prompted to
								upgrade to the next tier before adding more companies than your
								plan allows.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-4">
							<AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
							<AccordionContent>
								Yes. Cancel anytime and you'll keep access until the end of your
								current billing period, with no further charges after that.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-5">
							<AccordionTrigger>
								Does the report discount apply to every plan equally?
							</AccordionTrigger>
							<AccordionContent>
								Yes all three plans include a flat 20% discount on every Company
								Report you order while subscribed.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default CompanyTracking;
