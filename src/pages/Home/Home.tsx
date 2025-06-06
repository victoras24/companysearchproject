import React from "react";
import { useNavigate } from "react-router-dom";
import { Database, Search, Zap, Shield } from "lucide-react";
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

export const Home: React.FC = () => {
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
							className="mt-4"
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
								<Database className="h-6 w-6 text-primary" />
							</div>
							<CardTitle>Comprehensive Database</CardTitle>
						</CardHeader>
						<CardContent className="text-center text-muted-foreground">
							Access detailed information on all registered Cyprus companies
						</CardContent>
					</Card>

					<Card className="transition-all hover:shadow-md">
						<CardHeader className="text-center pb-2">
							<div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
								<Zap className="h-6 w-6 text-primary" />
							</div>
							<CardTitle>Real-time Updates</CardTitle>
						</CardHeader>
						<CardContent className="text-center text-muted-foreground">
							Stay informed with the latest company data and changes
						</CardContent>
					</Card>

					<Card className="transition-all hover:shadow-md">
						<CardHeader className="text-center pb-2">
							<div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
								<Shield className="h-6 w-6 text-primary" />
							</div>
							<CardTitle>Verified Information</CardTitle>
						</CardHeader>
						<CardContent className="text-center text-muted-foreground">
							Trust in our accurate and officially sourced data
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
							This tool has revolutionized our due diligence process. It's
							indispensable for our business operations in Cyprus.
							<span className="text-4xl text-primary/20 absolute bottom-0 right-0">
								"
							</span>
						</blockquote>
					</CardContent>
				</Card>

				{/* CTA Section */}
				{/* <Card className="mb-16 bg-primary text-primary-foreground">
					<CardHeader>
						<CardTitle className="text-2xl text-center">
							Need More Comprehensive Tools?
						</CardTitle>
						<CardDescription className="text-center text-primary-foreground/90">
							Discover our advanced features for in-depth analysis and
							reporting.
						</CardDescription>
					</CardHeader>
					<CardFooter className="flex justify-center pb-6">
						<Button variant="secondary" size="lg">
							Explore Premium Features
							<ChevronRight className="ml-2 h-4 w-4" />
						</Button>
					</CardFooter>
				</Card> */}

				{/* Updates Section */}
				<Card className="mb-16">
					<CardHeader>
						<div className="flex items-center">
							<CardTitle>Latest Updates</CardTitle>
							<Badge variant="outline" className="ml-auto">
								New
							</Badge>
						</div>
						<Separator />
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-4 items-start">
							<div className="h-2 w-2 mt-2 rounded-full bg-primary"></div>
							<p className="text-sm text-muted-foreground">
								New feature: Export search results to CSV
							</p>
						</div>
						<div className="flex gap-4 items-start">
							<div className="h-2 w-2 mt-2 rounded-full bg-primary"></div>
							<p className="text-sm text-muted-foreground">
								Database updated with Q2 2024 company registrations
							</p>
						</div>
						<div className="flex gap-4 items-start">
							<div className="h-2 w-2 mt-2 rounded-full bg-primary"></div>
							<p className="text-sm text-muted-foreground">
								Improved search algorithm for faster results
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
								How often is the database updated?
							</AccordionTrigger>
							<AccordionContent>
								Our database is updated daily with the latest information from
								official sources.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-2">
							<AccordionTrigger>
								Can I integrate this data into my own systems?
							</AccordionTrigger>
							<AccordionContent>
								Yes, we offer API access for seamless integration. Contact our
								support team for details.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
					{/* <div className="text-center mt-6">
						<Button variant="link" className="gap-1">
							View all FAQs
							<ExternalLink className="h-4 w-4" />
						</Button>
					</div> */}
				</div>
			</div>
		</div>
	);
};
