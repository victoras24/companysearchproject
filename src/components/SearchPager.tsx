import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import type { Pager } from "@/pages/Search/SearchSession";

export const SearchPager: React.FC<{
	pager: Pager;
	onNavigate?: () => void;
}> = ({ pager, onNavigate }) => {
	return (
		<Pagination>
			<PaginationContent>
				{pager.previous !== null && (
					<PaginationItem>
						<PaginationPrevious to={pager.previous} onClick={onNavigate} />
					</PaginationItem>
				)}
				{pager.pages.map((page, index) =>
					page === "gap" ? (
						<PaginationItem key={`gap-${index}`}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={page.number}>
							<PaginationLink
								to={page.href}
								isActive={page.current}
								onClick={onNavigate}
							>
								{page.number}
							</PaginationLink>
						</PaginationItem>
					)
				)}
				{pager.next !== null && (
					<PaginationItem>
						<PaginationNext to={pager.next} onClick={onNavigate} />
					</PaginationItem>
				)}
			</PaginationContent>
		</Pagination>
	);
};
