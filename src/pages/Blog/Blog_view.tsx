import React from "react";
import { Link } from "react-router";
import { observer } from "mobx-react";
import { auth } from "@/auth";
import { Reveal, Rise } from "@/site/motion";
import { SitePage } from "@/site/SitePage";
import { eyebrow, primaryPill } from "@/site/ui";
import { POSTS, formatPostDate } from "./posts";

const Blog: React.FC = observer(() => {
	const signedIn = auth.state.status === "signed-in";

	return (
		<SitePage className="w-full">
			<section className="mx-auto max-w-[1200px] px-[clamp(16px,4vw,28px)] pt-[clamp(56px,9vw,96px)] pb-10">
				<Rise>
					<div className={`${eyebrow} text-[13.5px]`}>Blog</div>
				</Rise>
				<Rise delay={60}>
					<h1 className="mt-3.5 mb-0 max-w-[820px] font-display text-[clamp(40px,6vw,72px)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
						Guides to the Cyprus company registry.
					</h1>
				</Rise>
				<Rise delay={120}>
					<p className="mt-5 mb-0 max-w-[560px] text-[19px] leading-normal text-pretty text-muted-foreground">
						Due diligence, registry filings and company research, explained step by step.
					</p>
				</Rise>
			</section>

			<section className="mx-auto max-w-[1200px] px-[clamp(16px,4vw,28px)] pb-[100px]">
				<div className="flex flex-col gap-5">
					{POSTS.map((post, i) => (
						<Reveal key={post.slug} delay={120 + i * 90}>
							<Link
								to={`/blog/${post.slug}`}
								className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] overflow-hidden rounded-[28px] border border-border bg-surface text-ink transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_80px_-30px_rgba(15,31,25,0.3)]"
							>
								<div className="flex min-h-[340px] items-end bg-tint p-8">
									<img
										src={post.cover.src}
										alt={post.cover.alt}
										className="block w-full rounded-[14px] shadow-[0_20px_50px_-20px_rgba(15,31,25,0.35)]"
									/>
								</div>
								<div className="flex flex-col p-[clamp(24px,4vw,44px)]">
									<div className="flex flex-wrap items-center gap-3.5 text-[14px] text-muted-foreground">
										<span className="rounded-full bg-tint px-3 py-[5px] font-semibold text-primary-text">{post.category}</span>
										<span>{formatPostDate(post.date)}</span>
										<span>{post.readTime}</span>
									</div>
									<h2 className="mt-[22px] mb-0 font-display text-[clamp(26px,3vw,36px)] leading-[1.12] font-semibold tracking-[-0.025em] text-balance">
										{post.title}
									</h2>
									<p className="mt-4 mb-0 flex-1 text-[16.5px] leading-[1.6] text-pretty text-muted-foreground">
										{post.excerpt}
									</p>
									<div className="mt-7 flex items-center gap-2 text-[15.5px] font-semibold text-primary-text">
										Read the guide <span>→</span>
									</div>
								</div>
							</Link>
						</Reveal>
					))}
				</div>

				{!signedIn && (
					<Reveal className="mt-5 flex flex-wrap items-center justify-between gap-7 rounded-[28px] bg-tint px-[clamp(24px,4vw,40px)] py-14">
						<div>
							<h3 className="m-0 font-display text-[clamp(24px,2.6vw,32px)] font-semibold tracking-[-0.025em]">
								Get new guides by email.
							</h3>
							<p className="mt-2 mb-0 text-[16px] text-text2">Included with every free account.</p>
						</div>
						<Link to="/signup" className={`${primaryPill} px-[26px] py-3.5 text-[15.5px]`}>
							Create free account
						</Link>
					</Reveal>
				)}
			</section>
		</SitePage>
	);
});

export default Blog;
