import { useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";

/**
 * The order a list was dragged into, kept for this visit only: the library does not store an
 * order. Items the user has not placed yet come first, in the order given.
 */
export function useLocalOrder<T>(items: T[], idOf: (item: T) => string) {
	const [placed, setPlaced] = useState<string[]>([]);

	const ordered = useMemo(() => {
		const rank = new Map(placed.map((id, index) => [id, index]));
		return items
			.map((item, index) => ({ item, index }))
			.sort((a, b) => {
				const rankA = rank.get(idOf(a.item)) ?? -1;
				const rankB = rank.get(idOf(b.item)) ?? -1;
				return rankA - rankB || a.index - b.index;
			})
			.map(({ item }) => item);
		// idOf is a plain function of the item; it is not part of what changes the order.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items, placed]);

	const move = (activeId: string, overId: string) => {
		const ids = ordered.map(idOf);
		const from = ids.indexOf(activeId);
		const to = ids.indexOf(overId);
		if (from === -1 || to === -1 || from === to) return;
		setPlaced(arrayMove(ids, from, to));
	};

	return [ordered, move] as const;
}
