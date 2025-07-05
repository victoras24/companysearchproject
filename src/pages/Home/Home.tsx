import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Archive, Clock, Users } from "lucide-react";
import "./_home.css";

// Import ShadcN components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Footer from "./Footer";

const Home: React.FC = () => {
	const navigate = useNavigate();

	return (
		<div className="home-container">
			<div className="w-full py-12">
				{/* Hero Section */}
				<div className="text-center space-y-6 mb-16">
					<h1 className="text-4xl font-bold tracking-tight md:text-5xl">
						Save time <span className="text-primary">searching</span> for Cyprus
						companies
					</h1>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Save hours of time for you and your team when searching for Cyprus
						company information so you can focus on what matters most.
					</p>
					<div>
						<Button
							size="lg"
							onClick={() => navigate("/search")}
							className="background-primary mt-4"
						>
							<Search className="mr-2 h-4 w-4" />
							Begin Search
						</Button>
					</div>
				</div>

				{/* Features Section */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
					<Card className="transition-all hover:shadow-md">
						<CardHeader className="text-center pb-2">
							<div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
								<Users className="h-6 w-6 text-primary" />
							</div>
							<CardTitle>Ownership Intelligence</CardTitle>
						</CardHeader>
						<CardContent className="text-center text-muted-foreground">
							Uncover complete ownership structures, shareholder histories, and
							registered address changes over time.
						</CardContent>
					</Card>

					<Card className="transition-all hover:shadow-md">
						<CardHeader className="text-center pb-2">
							<div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
								<Clock className="h-6 w-6 text-primary" />
							</div>
							<CardTitle>Real-time Data</CardTitle>
						</CardHeader>
						<CardContent className="text-center text-muted-foreground">
							Access the most current information directly from official Cyprus
							government registry sources.
						</CardContent>
					</Card>

					<Card className="transition-all hover:shadow-md">
						<CardHeader className="text-center pb-2">
							<div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
								<Archive className="h-6 w-6 text-primary" />
							</div>
							<CardTitle>Historical Records</CardTitle>
						</CardHeader>
						<CardContent className="text-center text-muted-foreground">
							Track company evolution with previous names, addresses, and
							comprehensive change histories.
						</CardContent>
					</Card>
				</div>

				{/* Testimonial Section */}
				<Card className="mb-16 border-none bg-muted/50">
					<CardContent className="pt-6">
						<blockquote className="text-xl italic text-center relative px-8">
							<span className="text-4xl text-primary/20 absolute top-0 left-0">
								"
							</span>
							Company Search Cyprus is a tool that has revolutionized our due
							diligence process. It's indispensable for our business operations
							in Cyprus.
							<span className="text-4xl text-primary/20 absolute bottom-0 right-0">
								"
							</span>
						</blockquote>
					</CardContent>
				</Card>

				{/* Updates Section */}
				<Card className="mb-16">
					<CardHeader>
						<div className="flex items-center">
							<CardTitle>Platform Updates</CardTitle>
							<Badge variant="outline" className="ml-auto">
								Latest
							</Badge>
						</div>
						<Separator />
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-4 items-start">
							<div className="h-2 w-2 mt-2 rounded-full bg-primary"></div>
							<p className="text-sm text-muted-foreground">
								Enhanced related company discovery for comprehensive business
								network analysis
							</p>
						</div>
						<div className="flex gap-4 items-start">
							<div className="h-2 w-2 mt-2 rounded-full bg-primary"></div>
							<p className="text-sm text-muted-foreground">
								Direct official company name search for precise, targeted
								results
							</p>
						</div>
						<div className="flex gap-4 items-start">
							<div className="h-2 w-2 mt-2 rounded-full bg-primary"></div>
							<p className="text-sm text-muted-foreground">
								Weekly database synchronization with official Cyprus government
								registry
							</p>
						</div>
						<div className="flex gap-4 items-start">
							<div className="h-2 w-2 mt-2 rounded-full bg-primary"></div>
							<p className="text-sm text-muted-foreground">
								Optimized search algorithms delivering faster, more accurate
								results
							</p>
						</div>
					</CardContent>
				</Card>

				{/* FAQ Section */}
				<div className="mb-16">
					<h2 className="text-2xl font-semibold mb-6 text-center">
						Frequently Asked Questions
					</h2>
					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="item-1">
							<AccordionTrigger>
								How current is the company information?
							</AccordionTrigger>
							<AccordionContent>
								Our database is synchronized weekly with the official Cyprus
								government registry, ensuring you receive the most up-to-date
								information available.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-2">
							<AccordionTrigger>
								What information is included in detailed reports?
							</AccordionTrigger>
							<AccordionContent>
								Comprehensive reports include current shareholders and
								addresses, all company documents, historical information on
								company changes, previous names, registered address history, and
								mortgage records where applicable.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-3">
							<AccordionTrigger>
								Can I integrate this data into my systems?
							</AccordionTrigger>
							<AccordionContent>
								Yes, we offer API access for seamless integration into your
								existing workflows. Contact our support team for technical
								documentation and implementation guidance.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-4">
							<AccordionTrigger>
								How quickly are reports delivered?
							</AccordionTrigger>
							<AccordionContent>
								Detailed company reports are typically delivered within 6 hours
								of your request, complete with professional analysis and summary
								prepared by our research experts.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default Home;
