import React, { useState } from "react";
import { observer } from "mobx-react";
import { motion, AnimatePresence } from "framer-motion";
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
	RotateCw,
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
	type DragEndEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

const groupId = (group: LibraryGroup) => group.id;

const report = (result: { ok: boolean }, failure: string) => {
	if (!result.ok) toast.error(failure);
};

const dragSensorOptions = { activationConstraint: { distance: 5 } };

// A company in a group: a row that can be dragged within its group.
const SortableCompany: React.FC<{ company: LibraryCompany; group: LibraryGroup }> = ({
	company,
	group,
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: companyId(company) });
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
				<OptionalLink to={company.inRegistry ? detailsPath(company) : null}>
					{company.organisationName}
					<RegistryNote company={company} />
				</OptionalLink>
			</TableCell>
			<TableCell className="w-12 text-right">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
					onClick={async () =>
						report(
							await library.removeFromGroup(group.id, company),
							"Failed to remove the company from the group"
						)
					}
				>
					<X className="h-4 w-4" />
				</Button>
			</TableCell>
		</TableRow>
	);
};

// A group: a card that can be dragged among the groups, with its companies inside.
const SortableGroup: React.FC<{ group: LibraryGroup }> = ({ group }) => {
	const [expanded, setExpanded] = useState(false);
	// Dragging reorders the companies for this visit only.
	const [companies, moveCompany] = useLocalOrder(group.companies, companyId);
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: group.id });

	const sensors = useSensors(
		useSensor(PointerSensor, dragSensorOptions),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<Collapsible open={expanded} onOpenChange={setExpanded} className="w-full">
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
								{group.companies.length} companies
							</Badge>
						</div>
						<div className="flex items-center gap-1">
							<CollapsibleTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									{expanded ? (
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
								onClick={async () =>
									report(await library.deleteGroup(group.id), "Failed to delete the group")
								}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardHeader>
				<CollapsibleContent>
					<CardContent className="pt-0">
						{companies.length > 0 ? (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={({ active, over }: DragEndEvent) => {
									if (over) moveCompany(String(active.id), String(over.id));
								}}
								modifiers={[restrictToVerticalAxis]}
							>
								<Table>
									<TableBody>
										<SortableContext
											items={companies.map(companyId)}
											strategy={verticalListSortingStrategy}
										>
											{companies.map((company) => (
												<SortableCompany
													key={companyId(company)}
													company={company}
													group={group}
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
								<p className="text-sm">Add companies from your favorites page.</p>
							</div>
						)}
					</CardContent>
				</CollapsibleContent>
			</Card>
		</Collapsible>
	);
};

const Organiser: React.FC = observer(() => {
	const [groupName, setGroupName] = useState("");
	const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
	// Dragging reorders the groups for this visit only.
	const [groups, moveGroup] = useLocalOrder(library.groups, groupId);

	const sensors = useSensors(
		useSensor(PointerSensor, dragSensorOptions),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const createGroup = async () => {
		const result = await library.createGroup(groupName);
		if (result.ok) setGroupName("");
		else toast.error("Failed to create the group");
	};

	const handleGroupDragStart = (event: DragStartEvent) => {
		setActiveGroupId(String(event.active.id));
	};

	const handleGroupDragEnd = ({ active, over }: DragEndEvent) => {
		setActiveGroupId(null);
		if (over) moveGroup(String(active.id), String(over.id));
	};

	const isLoading = library.status === "idle" || library.status === "loading";

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
										value={groupName}
										maxLength={100}
										onChange={(e) => setGroupName(e.target.value)}
										className="flex-1"
									/>
									<Button onClick={createGroup} disabled={!groupName.trim()}>
										<PlusCircle className="h-4 w-4 mr-2" />
										Create Group
									</Button>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</AnimatePresence>

				{isLoading ? (
					<div className="space-y-3">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				) : library.status === "error" ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<p className="text-sm text-muted-foreground mb-4">
							Something went wrong while loading your groups.
						</p>
						<Button variant="outline" onClick={library.reload}>
							<RotateCw className="mr-2 h-4 w-4" />
							Retry
						</Button>
					</div>
				) : groups.length > 0 ? (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={handleGroupDragStart}
						onDragEnd={handleGroupDragEnd}
						modifiers={[restrictToVerticalAxis]}
					>
						<SortableContext
							items={groups.map(groupId)}
							strategy={verticalListSortingStrategy}
						>
							{groups.map((group) => (
								<SortableGroup key={group.id} group={group} />
							))}
						</SortableContext>

						<DragOverlay>
							{activeGroupId && (
								<Card className="shadow-md w-full opacity-80 border-2 border-primary">
									<CardHeader>
										<CardTitle className="text-lg font-medium">
											{groups.find((g) => g.id === activeGroupId)?.name}
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
