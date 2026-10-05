import React from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react";
import { toast } from "sonner";
import { OptionalLink } from "@/components/OptionalLink";
import { detailsPath } from "@/organisation/organisation";
import { companyId, library, type LibraryCompany, type LibraryGroup } from "@/library";
import { RegistryNote } from "@/library/RegistryNote";
import { useLocalOrder } from "@/library/useLocalOrder";

// Shadcn Components
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import { Plus, X, GripVertical, FolderPlus, Trash2, RotateCw } from "lucide-react";

// Drag and Drop Library
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface SortableTableRowProps {
	company: LibraryCompany;
	groups: LibraryGroup[];
	id: string;
}

const addToGroup = async (company: LibraryCompany, group: LibraryGroup) => {
	const result = await library.addToGroup(group.id, company);
	if (!result.ok) {
		toast.error("Failed to add company to group");
	} else if (result.added) {
		toast.success(`${company.organisationName} added to group "${group.name}"`);
	} else {
		toast.error(`${company.organisationName} is already in group "${group.name}"`);
	}
};

const removeFavourite = async (company: LibraryCompany) => {
	const result = await library.removeFavourite(company);
	if (!result.ok) toast.error("Failed to update saved companies");
};

const SortableTableRow: React.FC<SortableTableRowProps> = ({ company, groups, id }) => {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const navigate = useNavigate();

	return (
		<TableRow ref={setNodeRef} style={style} className="hover:bg-accent">
			<TableCell className="w-10">
				<div {...attributes} {...listeners} className="cursor-grab">
					<GripVertical className="h-4 w-4 text-muted-foreground" />
				</div>
			</TableCell>
			<TableCell className="font-medium">
				<OptionalLink to={company.inRegistry ? detailsPath(company) : null}>
					{company.organisationName}
					<RegistryNote company={company} />
				</OptionalLink>
			</TableCell>
			<TableCell>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm">
							<Plus className="h-4 w-4 mr-1" />
							Add to Group
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuLabel>Select Group</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{groups.length > 0 ? (
							groups.map((group) => (
								<DropdownMenuItem
									key={group.id}
									onClick={() => addToGroup(company, group)}
								>
									{group.name}
								</DropdownMenuItem>
							))
						) : (
							<DropdownMenuItem disabled>No groups created</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => navigate("/organiser")}>
							<FolderPlus className="h-4 w-4 mr-2" />
							Create New Group
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
			<TableCell className="text-right">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => removeFavourite(company)}
					className="text-red-500 hover:text-red-700 hover:bg-red-50"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</TableCell>
		</TableRow>
	);
};

const Favorites = observer(() => {
	const navigate = useNavigate();
	// Dragging reorders the list for this visit only.
	const [items, moveItem] = useLocalOrder(library.favourites, companyId);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (over) moveItem(String(active.id), String(over.id));
	};

	if (library.status === "idle" || library.status === "loading") {
		return (
			<Card className="w-full max-w-4xl mx-auto mt-8">
				<CardHeader>
					<CardTitle>Favorites</CardTitle>
					<CardDescription>Loading your favorite companies...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (library.status === "error") {
		return (
			<Card className="w-full max-w-4xl mx-auto mt-8">
				<CardHeader>
					<CardTitle>Favorites</CardTitle>
					<CardDescription>
						Something went wrong while loading your favorite companies.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" onClick={library.reload}>
						<RotateCw className="mr-2 h-4 w-4" />
						Retry
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-4xl mx-auto mt-8">
			<CardHeader>
				<CardTitle className="text-2xl font-bold">Favorites</CardTitle>
				<CardDescription>
					View and manage all your marked favorite companies in one place.
					Easily add, remove, or explore details about your top choices.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{items.length > 0 ? (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
						modifiers={[restrictToVerticalAxis]}
					>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10"></TableHead>
									<TableHead>Company Name</TableHead>
									<TableHead>Groups</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								<SortableContext
									items={items.map(companyId)}
									strategy={verticalListSortingStrategy}
								>
									{items.map((company) => (
										<SortableTableRow
											key={companyId(company)}
											id={companyId(company)}
											company={company}
											groups={library.groups}
										/>
									))}
								</SortableContext>
							</TableBody>
						</Table>
					</DndContext>
				) : (
					<Alert variant="default" className="bg-muted">
						<AlertDescription className="flex flex-col items-center justify-center py-6 text-center">
							<div className="mb-4 rounded-full bg-muted-foreground/20 p-3">
								<X className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="mb-1 text-lg font-semibold">No favorites saved</h3>
							<p className="text-sm text-muted-foreground mb-4">
								You haven't added any companies to your favorites yet.
							</p>
							<Button
								onClick={() => navigate("/cyprus-company-search")}
								className="mt-2"
							>
								Browse Companies
							</Button>
						</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
});

export default Favorites;
