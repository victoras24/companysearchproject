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

export const PaginationDemo: React.FC<{ dataSize: number }> = ({
	dataSize,
}) => {
	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious href="#" />
				</PaginationItem>
				<PaginationItem>
					<PaginationLink isActive href="/1">
						1
					</PaginationLink>
				</PaginationItem>
				{dataSize > paginationConfig.defaultLimit && (
					<PaginationItem>
						<PaginationLink href="#">2</PaginationLink>
					</PaginationItem>
				)}
				{dataSize > paginationConfig.defaultLimit * 2 && (
					<PaginationItem>
						<PaginationLink href="#">3</PaginationLink>
					</PaginationItem>
				)}
				{dataSize > paginationConfig.defaultLimit * 3 && (
					<PaginationItem>
						<PaginationEllipsis />
					</PaginationItem>
				)}
				<PaginationItem>
					<PaginationNext href="#" />
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
};
