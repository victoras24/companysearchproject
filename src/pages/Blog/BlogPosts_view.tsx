import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "./_blog.css";

interface BlogPostMeta {
	title: string;
	date: string;
	readTime: string;
	category: string;
	description: string;
}

// Blog post metadata - you can move this to a separate config file
const blogPostsMetadata: Record<string, BlogPostMeta> = {
	"cyprus-company-search-guide": {
		title:
			"How to Find Cyprus Company Information Online: Registrar Search & Audit Files",
		date: "2025-01-15",
		readTime: "8 min read",
		category: "Guides",
		description:
			"A comprehensive step-by-step guide on accessing Cyprus company information through official registrar channels.",
	},
	// Add more blog post metadata here
};

const BlogPost: React.FC = () => {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const [htmlContent, setHtmlContent] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const postInfo = slug ? blogPostsMetadata[slug] : null;

	useEffect(() => {
		const loadBlogPost = async () => {
			if (!slug || !postInfo) {
				setError("Blog post not found");
				setLoading(false);
				return;
			}

			try {
				// Load the HTML file from the public folder
				const response = await fetch(`/blog-posts/${slug}.html`);

				if (!response.ok) {
					throw new Error("Failed to load blog post");
				}

				const html = await response.text();

				// Extract only the content inside the <article> tag
				// This removes the full HTML structure and keeps only the content
				const parser = new DOMParser();
				const doc = parser.parseFromString(html, "text/html");
				const articleContent = doc.querySelector("article");

				if (articleContent) {
					// Remove the header section since we'll create our own
					const header = articleContent.querySelector("header");
					if (header) {
						header.remove();
					}

					// Remove the footer section
					const footer = articleContent.querySelector("footer");
					if (footer) {
						footer.remove();
					}

					setHtmlContent(articleContent.innerHTML);
				} else {
					// Fallback: use the entire body content
					const bodyContent = doc.querySelector("body");
					setHtmlContent(bodyContent?.innerHTML || html);
				}
			} catch (err) {
				setError("Failed to load blog post content");
				console.error("Error loading blog post:", err);
			} finally {
				setLoading(false);
			}
		};

		loadBlogPost();
	}, [slug, postInfo]);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading article...</p>
				</div>
			</div>
		);
	}

	if (error || !postInfo) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
					<p className="text-muted-foreground mb-6">
						The blog post you're looking for doesn't exist.
					</p>
					<Button onClick={() => navigate("/blog")}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Blog
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="blog-post-container">
			<div className="max-w-4xl mx-auto px-4 py-8">
				{/* Back Button */}
				<Button
					variant="ghost"
					onClick={() => navigate("/blog")}
					className="mb-8 hover:bg-muted"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Blog
				</Button>

				{/* Article Header */}
				<div className="mb-12">
					<div className="flex items-center gap-4 mb-6">
						<Badge variant="secondary">{postInfo.category}</Badge>
						<div className="flex items-center text-sm text-muted-foreground">
							<Calendar className="h-4 w-4 mr-1" />
							{formatDate(postInfo.date)}
						</div>
						<div className="flex items-center text-sm text-muted-foreground">
							<Clock className="h-4 w-4 mr-1" />
							{postInfo.readTime}
						</div>
					</div>

					<h1 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
						{postInfo.title}
					</h1>

					<p className="text-xl text-muted-foreground leading-relaxed">
						{postInfo.description}
					</p>
				</div>

				{/* Article Content */}
				<Card className="p-8">
					<div
						className="blog-content prose prose-lg max-w-none"
						dangerouslySetInnerHTML={{ __html: htmlContent }}
						style={
							{
								// Override some styles to match your design system
								"--tw-prose-body": "hsl(var(--foreground))",
								"--tw-prose-headings": "hsl(var(--foreground))",
								"--tw-prose-links": "hsl(var(--primary))",
								"--tw-prose-bold": "hsl(var(--foreground))",
								"--tw-prose-counters": "hsl(var(--muted-foreground))",
								"--tw-prose-bullets": "hsl(var(--muted-foreground))",
							} as React.CSSProperties
						}
					/>
				</Card>

				{/* Call to Action */}
				<Card className="mt-12 border-none bg-muted/50">
					<div className="p-8 text-center">
						<h3 className="text-xl font-semibold mb-2">
							Ready to Search Cyprus Companies?
						</h3>
						<p className="text-muted-foreground mb-6">
							Use our platform to quickly find detailed company information and
							save hours of research time.
						</p>
						<Button
							size="lg"
							onClick={() => navigate("/search")}
							className="background-primary"
						>
							Start Your Search
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
};

export default BlogPost;
