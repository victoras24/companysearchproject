/** A blog post as the index lists it. Its body is a page of its own. */
export type BlogPostMeta = {
	slug: string;
	title: string;
	/** A shorter title for the top of the post itself. */
	heading: string;
	standfirst: string;
	excerpt: string;
	category: string;
	date: string;
	readTime: string;
	cover: { src: string; alt: string };
};

export const POSTS: BlogPostMeta[] = [
	{
		slug: "cyprus-company-search-guide",
		title: "How to Find Cyprus Company Information Online: Registrar Search & Audit Files",
		heading: "How to Find Cyprus Company Information Online",
		standfirst: "Registrar search and audit files: a complete step-by-step guide.",
		excerpt:
			"A step-by-step guide to accessing Cyprus company information through official registrar channels, including due diligence and competitive research.",
		category: "Guides",
		date: "2025-09-15",
		readTime: "8 min read",
		cover: { src: "/blog-posts/images/cyprus-company-search-guide/step-6.png", alt: "Registry search results" },
	},
];

export const formatPostDate = (date: string) =>
	new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
