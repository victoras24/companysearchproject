import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, ArrowRight, FileText } from "lucide-react";
import "./_blog.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthStoreContext";

interface BlogPost {
	id: string;
	title: string;
	excerpt: string;
	date: string;
	readTime: string;
	category: string;
	slug: string;
	featured?: boolean;
}

const Blog: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const blogPosts: BlogPost[] = [
		{
			id: "1",
			title:
				"How to Find Cyprus Company Information Online: Registrar Search & Audit Files",
			excerpt:
				"A comprehensive step-by-step guide on accessing Cyprus company information through official registrar channels, including due diligence processes and competitive research.",
			date: "2025-09-15",
			readTime: "8 min read",
			category: "Guides",
			slug: "cyprus-company-search-guide",
			featured: true,
		},
	];

	const handleReadMore = (slug: string) => {
		navigate(`/blog/${slug}`);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const featuredPost = blogPosts.find((post) => post.featured);

	return (
		<div className="blog-container">
			<div className="w-full p-5 lg:p-12">
				{/* Hero Section */}
				<div className="text-center space-y-6 mb-16">
					<h1 className="text-4xl font-bold tracking-tight md:text-5xl">
						Cyprus Business <span className="text-primary">Insights</span>
					</h1>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Expert guides, insights, and updates on Cyprus company research, due
						diligence, and business intelligence.
					</p>
				</div>

				{/* Featured Post */}
				{featuredPost && (
					<div className="mb-16">
						<div className="flex items-center mb-6">
							<h2 className="text-2xl font-semibold">Featured Article</h2>
							<Badge variant="outline" className="ml-3">
								Latest
							</Badge>
						</div>
						<Card className="transition-all hover:shadow-lg border-primary/20">
							<CardHeader className="pb-4">
								<div className="flex items-center gap-2 mb-2">
									<Badge variant="secondary">{featuredPost.category}</Badge>
									<div className="flex items-center text-sm text-muted-foreground">
										<Calendar className="h-4 w-4 mr-1" />
										{formatDate(featuredPost.date)}
									</div>
									<div className="flex items-center text-sm text-muted-foreground">
										<Clock className="h-4 w-4 mr-1" />
										{featuredPost.readTime}
									</div>
								</div>
								<CardTitle className="text-2xl leading-tight">
									{featuredPost.title}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-6 leading-relaxed">
									{featuredPost.excerpt}
								</p>
								<Button
									onClick={() => handleReadMore(featuredPost.slug)}
									className="group"
								>
									Read Full Article
									<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Button>
							</CardContent>
						</Card>
					</div>
				)}

				<Separator className="mb-16" />

				{/* All Articles */}
				<div className="mb-16">
					<h2 className="text-2xl font-semibold mb-8">All Articles</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{blogPosts.map((post) => (
							<Card
								key={post.id}
								className="transition-all hover:shadow-md cursor-pointer group"
								onClick={() => handleReadMore(post.slug)}
							>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between mb-2">
										<Badge variant="outline" className="text-xs">
											{post.category}
										</Badge>
										<div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
											<FileText className="h-4 w-4 text-primary" />
										</div>
									</div>
									<CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
										{post.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground text-sm mb-4 line-clamp-3">
										{post.excerpt}
									</p>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<div className="flex items-center">
											<Calendar className="h-3 w-3 mr-1" />
											{formatDate(post.date)}
										</div>
										<div className="flex items-center">
											<Clock className="h-3 w-3 mr-1" />
											{post.readTime}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				{/* Newsletter Signup */}
				<Card className="mb-16 border-none bg-muted/50">
					<CardContent className="pt-6 text-center">
						<h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
						<p className="text-muted-foreground mb-6 max-w-md mx-auto">
							Get the latest insights on Cyprus business intelligence and
							company research delivered to your inbox.
						</p>
						<Button
							onClick={() => navigate("/account")}
							size="lg"
							className="background-primary"
						>
							{user
								? "Thank you for subscribing"
								: "Create account for updates"}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default Blog;
