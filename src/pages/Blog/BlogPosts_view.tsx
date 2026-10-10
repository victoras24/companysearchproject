import React from "react";
import { Link, useParams } from "react-router";
import { observer } from "mobx-react";
import { auth } from "@/auth";
import { Reveal, Rise } from "@/site/motion";
import { SitePage } from "@/site/SitePage";
import { primaryPill } from "@/site/ui";
import { POSTS, formatPostDate } from "./posts";

// The registrar's own way to a company's files, a step at a time. All but the last has a screenshot.
const STEPS = [
	'Search for the official Cyprus company registrar by typing "Company Search Cyprus".',
	'On the registrar\'s official page, click the "e-search" button.',
	'Click "Study File" in the top navigation bar.',
	"Log in to Cyprus Government e-Services, or follow the steps to create an account.",
	"You'll be taken to the search page. Enter the name of the company you want files for.",
	'Search, for example, for "TEST". Choose the company from the results table and click "More details".',
	'On the details page, choose the "study file" option and click "Submit" at the top right.',
	'On the next page, click "E-search Basket".',
	'Confirm the correct company is in the basket and click "Submit". If the basket doesn\'t load, refresh.',
	"Choose your preferred payment method and pay.",
	"You'll land in the workspace, where you can access the HE32, audit files (XACC) and other documents.",
];
const SCREENSHOTS = 10;

const h2 = "font-display text-[28px] font-semibold tracking-[-0.02em]";
const paragraph = "mt-0 mb-5 text-[18px] leading-[1.75] text-pretty text-body2";

const BlogPost: React.FC = observer(() => {
	const { slug } = useParams<{ slug: string }>();
	const post = POSTS.find((candidate) => candidate.slug === slug);
	const signedIn = auth.state.status === "signed-in";

	if (!post) {
		return (
			<SitePage>
				<div className="mx-auto mt-[clamp(40px,10vw,100px)] max-w-[520px] text-center">
					<h1 className="m-0 font-display text-[clamp(28px,4vw,38px)] font-semibold tracking-[-0.03em]">Article not found</h1>
					<p className="mt-2.5 mb-0 text-[15.5px] leading-[1.55] text-muted-foreground">
						The blog post you're looking for doesn't exist.
					</p>
					<Link to="/blog" className={`${primaryPill} mt-6 px-[22px] py-[13px] text-[15px]`}>
						All articles
					</Link>
				</div>
			</SitePage>
		);
	}

	return (
		<SitePage className="w-full">
			<article className="mx-auto max-w-[760px] px-[clamp(16px,4vw,28px)] pt-[clamp(40px,7vw,72px)] pb-[100px]">
				<Rise>
					<Link to="/blog" className="text-[14.5px] text-muted-foreground hover:text-ink">
						← All articles
					</Link>
				</Rise>
				<Rise delay={60} className="mt-9 flex flex-wrap items-center gap-3.5 text-[14px] text-muted-foreground">
					<span className="rounded-full bg-tint px-3 py-[5px] font-semibold text-primary-text">{post.category}</span>
					<span>{formatPostDate(post.date)}</span>
					<span>{post.readTime}</span>
				</Rise>
				<Rise delay={120}>
					<h1 className="mt-[22px] mb-0 font-display text-[clamp(36px,5vw,56px)] leading-[1.05] font-semibold tracking-[-0.035em] text-balance">
						{post.heading}
					</h1>
					<p className="mt-[18px] mb-0 text-[20px] leading-normal text-muted-foreground">{post.standfirst}</p>
				</Rise>
				<div className="my-11 h-px bg-border" />

				<Rise delay={180}>
					<h2 className={`${h2} mt-0 mb-[18px]`}>Why search for a Cyprus company?</h2>
					<p className={paragraph}>
						One of the most common reasons is <strong>due diligence</strong>: investigating a business or
						individual before entering into a formal agreement. Reviewing a company's financial statements, key
						personnel and official filings helps assess its stability and credibility before an investment or
						partnership.
					</p>
					<p className={paragraph}>
						The registry is also valuable for <strong>competitive research</strong>. Filings and financial data of
						companies in the same industry give insight into their structure, performance and strategic direction.
					</p>

					<h2 className={`${h2} mt-14 mb-2.5`}>How to find Cyprus company information</h2>
					<p className="mt-0 mb-8 text-[18px] leading-[1.75] text-body2">
						Anyone can find Cyprus company information online within minutes.
					</p>
				</Rise>

				<div className="flex flex-col gap-10">
					{STEPS.map((text, i) => (
						<Reveal key={i} className="grid grid-cols-[44px_minmax(0,1fr)] gap-[18px]">
							<div className="grid size-9 place-items-center rounded-full bg-primary font-mono text-[13px] font-medium text-white">
								{i + 1}
							</div>
							<div>
								<p className="mt-1.5 mb-0 text-[17px] leading-[1.65] text-pretty text-body2">{text}</p>
								{i < SCREENSHOTS && (
									<img
										src={`/blog-posts/images/${post.slug}/step-${i + 1}.png`}
										alt={`Registrar step ${i + 1}`}
										loading="lazy"
										className="mt-[18px] block w-full rounded-2xl border border-border"
									/>
								)}
							</div>
						</Reveal>
					))}
				</div>

				<div className="mt-10 flex gap-3.5 rounded-[18px] border border-warn-border bg-warn-bg px-[22px] py-5">
					<span className="mt-[9px] size-2 flex-none rounded-full bg-[#B7791F]" />
					<p className="m-0 text-[16.5px] leading-[1.6] text-warn-fg">
						<strong>Important:</strong> you only have access for 24 hours, so download every document you need.
						After that, the workspace closes.
					</p>
				</div>

				<Reveal className="mt-16 rounded-[28px] bg-primary p-[clamp(24px,5vw,40px)] text-white">
					<div className="text-[13px] font-semibold tracking-[0.06em] text-on-primary-muted uppercase">Or skip the steps</div>
					<h3 className="mt-3 mb-0 font-display text-[30px] leading-[1.1] font-semibold tracking-[-0.025em] text-balance">
						Search the registry and order a Full Company Report in minutes.
					</h3>
					<div className="mt-[26px] flex flex-wrap gap-2.5">
						<Link to="/" className="rounded-full bg-white px-6 py-3.5 text-[15.5px] font-semibold text-[#0A3B2C]">
							Search companies
						</Link>
						{!signedIn && (
							<Link to="/signup" className="rounded-full border-[1.5px] border-[#5FA488] px-6 py-3.5 text-[15.5px] font-semibold text-white">
								Create free account
							</Link>
						)}
					</div>
				</Reveal>
			</article>
		</SitePage>
	);
});

export default BlogPost;
