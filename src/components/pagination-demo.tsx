import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { paginationConfig } from "@/constants/pagination";

export const PaginationDemo: React.FC<{
	query: string;
	currentPage: number;
	dataSize: number;
}> = ({ query, currentPage, dataSize }) => {
	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						href={`/cyprus-company-search?q=${query}&page=${currentPage - 1}`}
					/>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink
						isActive={currentPage === (currentPage === 1 ? 1 : currentPage - 1)}
						href={`/cyprus-company-search?q=${query}&page=${currentPage - 1}`}
					>
						{currentPage === 1 ? 1 : currentPage - 1}
					</PaginationLink>
				</PaginationItem>
				{dataSize > paginationConfig.defaultLimit && (
					<PaginationItem>
						<PaginationLink
							isActive={currentPage === (currentPage === 1 ? 2 : currentPage)}
							href={`/cyprus-company-search?q=${query}&page=${
								currentPage === 1 ? 2 : currentPage
							}`}
						>
							{currentPage === 1 ? 2 : currentPage}
						</PaginationLink>
					</PaginationItem>
				)}
				{dataSize > paginationConfig.defaultLimit * 2 && (
					<PaginationItem>
						<PaginationLink
							isActive={
								currentPage === (currentPage === 1 ? 3 : currentPage + 1)
							}
							href={`/cyprus-company-search?q=${query}&page=${
								currentPage === 1 ? 3 : currentPage + 1
							}`}
						>
							{currentPage === 1 ? 3 : currentPage + 1}
						</PaginationLink>
					</PaginationItem>
				)}
				{dataSize > paginationConfig.defaultLimit * 3 && (
					<PaginationItem>
						<PaginationEllipsis />
					</PaginationItem>
				)}
				<PaginationItem>
					<PaginationNext
						href={`/cyprus-company-search?q=${query}&page=${currentPage + 1}`}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
};
