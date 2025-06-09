import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { motion, AnimatePresence } from "framer-motion";
import { doc } from "firebase/firestore";
import { firestore } from "../../Firebase/firebase";
import { useAuth } from "../../context/AuthStoreContext";
import { OrganiserModel } from "./Organiser_model";

// Shadcn Components
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Icons
import {
	ChevronDown,
	ChevronUp,
	Trash2,
	GripVertical,
	PlusCircle,
	FolderOpen,
	X,
} from "lucide-react";

// Drag and Drop
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragOverlay,
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
import type { gEntities } from "@/gEntities";
import { Link } from "react-router-dom";

interface SortableGroupTableRowProps {
	group: any;
	model: any;
	docRef: any;
	children: any;
}

interface ICompany {
	id: string;
	organisationName: string;
	registrationNo: string;
	entryId: string;
	[key: string]: any;
}

interface SortableCompanyProps {
	company: ICompany;
	groupId: number;
	model: any;
	user: gEntities.IUser;
}

// Sortable Group Component
const SortableGroup: React.FC<SortableGroupTableRowProps> = ({
	group,
	model,
	docRef,
	children,
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: group.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<Card
			ref={setNodeRef}
			style={style}
			className="mb-4 border shadow-sm hover:shadow"
		>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div {...attributes} {...listeners} className="cursor-grab">
							<GripVertical className="h-5 w-5 text-muted-foreground" />
						</div>
						<CardTitle className="text-lg font-medium">{group.name}</CardTitle>
						<Badge variant="outline" className="ml-2">
							{group.companies?.length || 0} companies
						</Badge>
					</div>
					<div className="flex items-center gap-1">
						<CollapsibleTrigger className="group">
							<Button variant="ghost" size="icon" className="h-8 w-8">
								{model.expandedGroups[group.id] ? (
									<ChevronUp className="h-4 w-4" />
								) : (
									<ChevronDown className="h-4 w-4" />
								)}
							</Button>
						</CollapsibleTrigger>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
							onClick={() => model.deleteGroup(docRef, group)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CollapsibleContent>
				<CardContent className="pt-0">{children}</CardContent>
			</CollapsibleContent>
		</Card>
	);
};

// Sortable Company Component
const SortableCompany: React.FC<SortableCompanyProps> = ({
	company,
	groupId,
	model,
	user,
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: company.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<TableRow ref={setNodeRef} style={style} className="hover:bg-accent">
			<TableCell className="w-12 pl-2">
				<div {...attributes} {...listeners} className="cursor-grab">
					<GripVertical className="h-4 w-4 text-muted-foreground" />
				</div>
			</TableCell>
			<TableCell className="font-medium py-2">
				<Link to={`/search/${company.registrationNo}`}>{company.name}</Link>
			</TableCell>
			<TableCell className="w-12 text-right">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
					onClick={() =>
						model.deleteCompanyAssignedInGroup(user.uid, company, groupId)
					}
				>
					<X className="h-4 w-4" />
				</Button>
			</TableCell>
		</TableRow>
	);
};

const Organiser: React.FC = observer(() => {
	const { user } = useAuth();

	const [model] = useState(() => new OrganiserModel(user));

	const docRef = doc(firestore, "users", user.uid);
	const [activeGroupId, setActiveGroupId] = useState(null);
	const [, setActiveCompanyId] = useState(null);

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
		model.onMount();
	}, []);

	const handleGroupDragEnd = (event: any) => {
		const { active, over } = event;
		setActiveGroupId(null);

		if (active.id !== over.id) {
			const oldIndex = model.groups.findIndex(
				(group) => group.id === active.id
			);
			const newIndex = model.groups.findIndex((group) => group.id === over.id);

			const updatedGroups = arrayMove(model.groups, oldIndex, newIndex);
			model.setGroups(updatedGroups);
		}
	};

	const handleGroupDragStart = (event: any) => {
		setActiveGroupId(event.active.id);
	};

	const handleCompanyDragEnd = (event: any, groupId: string) => {
		const { active, over } = event;
		setActiveCompanyId(null);

		if (!over) return;

		if (active.id !== over.id) {
			const group = model.groups.find((g) => g.id === groupId);
			if (!group) return;

			const oldIndex = group.companies.findIndex(
				(company: ICompany) => company.id === active.id
			);
			const newIndex = group.companies.findIndex(
				(company: ICompany) => company.id === over.id
			);

			const updatedCompanies = arrayMove(group.companies, oldIndex, newIndex);

			const updatedGroups = model.groups.map((g) =>
				g.id === groupId ? { ...g, companies: updatedCompanies } : g
			);

			model.setGroups(updatedGroups);
		}
	};

	const handleCompanyDragStart = (event: any) => {
		setActiveCompanyId(event.active.id);
	};

	return (
		<Card className="w-full max-w-4xl mx-auto mt-8">
			<CardHeader>
				<CardTitle className="text-2xl font-bold">Company Organiser</CardTitle>
				<CardDescription>
					Create and manage groups to efficiently organize your saved companies.
					Categorize your favorites for easy access and streamlined management.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<AnimatePresence>
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
						className="mb-8"
					>
						<Card className="bg-accent/50">
							<CardHeader className="pb-2">
								<CardTitle className="text-lg">Create New Group</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex gap-4">
									<Input
										placeholder="Enter group name"
										value={model.groupName}
										onChange={model.handleInputChange}
										className="flex-1"
									/>
									<Button
										onClick={() => model.createGroup(docRef)}
										disabled={!model.groupName.trim()}
									>
										<PlusCircle className="h-4 w-4 mr-2" />
										Create Group
									</Button>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</AnimatePresence>

				{model.isLoading ? (
					<div className="space-y-3">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				) : model.groups && model.groups.length > 0 ? (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={handleGroupDragStart}
						onDragEnd={handleGroupDragEnd}
						modifiers={[restrictToVerticalAxis]}
					>
						<SortableContext
							items={model.groups.map((group) => group.id)}
							strategy={verticalListSortingStrategy}
						>
							{model.groups.map((group) => (
								<Collapsible
									key={group.id}
									open={model.expandedGroups[group.id]}
									onOpenChange={() => model.extendGroup(group.id)}
									className="w-full"
								>
									<SortableGroup group={group} model={model} docRef={docRef}>
										{group.companies && group.companies.length > 0 ? (
											<DndContext
												sensors={sensors}
												collisionDetection={closestCenter}
												onDragStart={handleCompanyDragStart}
												onDragEnd={(event) =>
													handleCompanyDragEnd(event, group.id)
												}
												modifiers={[restrictToVerticalAxis]}
											>
												<Table>
													<TableBody>
														<SortableContext
															items={group.companies.map(
																(company: any) => company.id
															)}
															strategy={verticalListSortingStrategy}
														>
															{group.companies.map((company: any) => (
																<SortableCompany
																	key={company.id}
																	company={company}
																	groupId={group.id}
																	model={model}
																	user={user}
																/>
															))}
														</SortableContext>
													</TableBody>
												</Table>
											</DndContext>
										) : (
											<div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
												<FolderOpen className="h-8 w-8 mb-2" />
												<p>No companies in this group yet.</p>
												<p className="text-sm">
													Add companies from your favorites page.
												</p>
											</div>
										)}
									</SortableGroup>
								</Collapsible>
							))}
						</SortableContext>

						<DragOverlay>
							{activeGroupId && (
								<Card className="shadow-md w-full opacity-80 border-2 border-primary">
									<CardHeader>
										<CardTitle className="text-lg font-medium">
											{model.groups.find((g) => g.id === activeGroupId)?.name}
										</CardTitle>
									</CardHeader>
								</Card>
							)}
						</DragOverlay>
					</DndContext>
				) : (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 rounded-full bg-muted-foreground/20 p-4">
							<FolderOpen className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="mb-2 text-lg font-semibold">
							No groups created yet
						</h3>
						<p className="text-sm text-muted-foreground mb-6 max-w-md">
							Create your first group above to start organizing your favorite
							companies.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
});

export default Organiser;
