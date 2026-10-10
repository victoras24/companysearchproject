import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { observer } from "mobx-react";
import { search } from "@/api/searchApi";
import { SearchSession } from "@/pages/Search/SearchSession";
import { SiteHeader, type NavId } from "@/site/SiteHeader";
import { HomeFooter } from "@/site/SiteFooter";
import { HeroSearch } from "./HeroSearch";
import { StorySection } from "./StorySection";
import { AppBand, FaqSection, PlansSection, ReportsSection } from "./sections";

const SECTIONS: NavId[] = ["search", "app", "reports", "plans"];

// How far above each section a scroll to it stops, to clear the sticky header.
const OFFSET: Record<NavId, number> = { search: 72, app: 0, reports: 64, plans: 64 };

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The website's home page, and its search: the search session lives in the hero, so a search's
 * address (`?q=`) opens this page with the results showing.
 */
const Home = observer(() => {
	const location = useLocation();
	const navigate = useNavigate();
	const navigateRef = useRef(navigate);

	const [session] = useState(
		() =>
			new SearchSession({
				search,
				navigate: (search, { replace }) => navigateRef.current({ search }, { replace }),
			})
	);
	const [inView, setInView] = useState<NavId | null>(null);
	const [scrolled, setScrolled] = useState(false);
	const frame = useRef(0);

	useLayoutEffect(() => {
		navigateRef.current = navigate;
	}, [navigate]);

	useLayoutEffect(() => {
		session.urlChanged(location.search);
	}, [session, location.search]);

	useEffect(() => () => session.dispose(), [session]);

	// The section in view, for the header; none at the very top.
	useEffect(() => {
		const follow = () => {
			if (window.scrollY > 60) setScrolled(true);
			let current: NavId | null = null;
			for (const id of SECTIONS) {
				const section = document.getElementById(id);
				if (section && section.getBoundingClientRect().top <= 140) current = id;
			}
			setInView(window.scrollY < 40 ? null : current);
		};
		follow();
		window.addEventListener("scroll", follow, { passive: true });
		return () => window.removeEventListener("scroll", follow);
	}, []);

	const scrollToSection = (id: NavId) => {
		const section = document.getElementById(id);
		if (!section) return;
		const start = window.scrollY;
		const target = Math.max(0, section.getBoundingClientRect().top + start - OFFSET[id]);
		cancelAnimationFrame(frame.current);

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			window.scrollTo(0, target);
			return;
		}
		const distance = target - start;
		const duration = Math.min(1300, 550 + Math.abs(distance) * 0.25);
		const began = performance.now();
		const tick = (now: number) => {
			const t = Math.min(1, (now - began) / duration);
			window.scrollTo(0, start + distance * easeInOutCubic(t));
			if (t < 1) frame.current = requestAnimationFrame(tick);
		};
		frame.current = requestAnimationFrame(tick);
	};

	useEffect(() => () => cancelAnimationFrame(frame.current), []);

	// A link from another page to one of the sections, e.g. /#plans.
	useEffect(() => {
		const id = location.hash.slice(1) as NavId;
		if (!SECTIONS.includes(id)) return;
		const timer = setTimeout(() => scrollToSection(id), 60);
		return () => clearTimeout(timer);
	}, [location.hash, location.key]);

	return (
		<div className="min-h-screen bg-background">
			<SiteHeader current={inView} onNavigate={scrollToSection} />
			<main>
				<HeroSearch session={session} scrolled={scrolled} onCue={() => scrollToSection("app")} />
				<StorySection />
				<ReportsSection onNavigate={scrollToSection} />
				<PlansSection />
				<FaqSection />
				<AppBand />
			</main>
			<HomeFooter />
		</div>
	);
});

export default Home;
