import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { observer } from "mobx-react";
import { useAuth } from "../../context/AuthStoreContext";
import { FavoritesModel } from "./Favorites_model";
import { OrganiserModel } from "../Organiser/Organiser_model";

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
import { Plus, X, GripVertical, FolderPlus, Trash2 } from "lucide-react";

// Drag and Drop Library
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface IGroup {
	id: string;
	name: string;
}

interface ICompany {
	id: string;
	organisationName: string;
	registrationNo: string;
	entryId: string;
	[key: string]: any;
}

interface SortableTableRowProps {
	company: ICompany;
	groupModel: {
		groups: IGroup[];
		[key: string]: any;
	};
	model: any;
	user: {
		uid: string;
		[key: string]: any;
	};
	id: string;
}

const SortableTableRow: React.FC<SortableTableRowProps> = ({
	company,
	groupModel,
	model,
	id,
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const navigate = useNavigate();

	const groups = groupModel?.groups || [];

	// `/search/${company.registrationNo}/${company.entryId}`

	return (
		<TableRow ref={setNodeRef} style={style} className="hover:bg-accent">
			<TableCell className="w-10">
				<div {...attributes} {...listeners} className="cursor-grab">
					<GripVertical className="h-4 w-4 text-muted-foreground" />
				</div>
			</TableCell>
			<TableCell className="font-medium">
				<Link to={`/search/${company.registrationNo}/${company.entryId}`}>
					{company.organisationName}
				</Link>
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
									onClick={() => model.addCompanyInGroup(company, group.id)}
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
					onClick={() => model.deleteCompanyFromFavorites(company)}
					className="text-red-500 hover:text-red-700 hover:bg-red-50"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</TableCell>
		</TableRow>
	);
};

const Favorites = observer(() => {
	const { user } = useAuth();
	const [model] = useState(() => new FavoritesModel(user));
	const [groupModel] = useState(() => new OrganiserModel(user));
	const navigate = useNavigate();
	const [items, setItems] = useState<ICompany[]>([]);
	const [isGroupModelLoaded, setIsGroupModelLoaded] = useState(false);

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

	useEffect(() => {
		const loadData = async () => {
			try {
				// Load models sequentially to ensure groups are loaded before rendering table rows
				await model.onMount();
				await groupModel.onMount();
				setIsGroupModelLoaded(true);
			} catch (error) {
				console.error("Error loading data:", error);
			}
		};

		loadData();
	}, []);

	useEffect(() => {
		if (model.favorites) {
			setItems(model.favorites);
		}
	}, [model.favorites]);

	const handleDragEnd = (event: any) => {
		const { active, over } = event;

		if (active.id !== over.id) {
			setItems((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				// Here you would also update the order in your database
				const newItems = arrayMove(items, oldIndex, newIndex);
				// model.updateFavoritesOrder(newItems, user.uid); // Example function to update order

				return newItems;
			});
		}
	};

	if (model.isLoading || !isGroupModelLoaded) {
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
									items={items.map((item) => item.id)}
									strategy={verticalListSortingStrategy}
								>
									{items.map((company) => (
										<SortableTableRow
											key={company.id}
											id={company.id}
											company={company}
											groupModel={groupModel}
											model={model}
											user={user}
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
							<Button onClick={() => navigate("/search")} className="mt-2">
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
