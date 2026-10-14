// A tab opened before a deploy still runs the old build, whose page files the deploy removed:
// opening a page it has not loaded yet fails. Reloading picks up the new build.

const LAST_RELOAD = "stale-build-reload";
/** A file still missing this soon after the reload is not a deploy's doing; reloading would loop. */
const LOOP_GUARD_MS = 10_000;

type Ports = {
	storage: Pick<Storage, "getItem" | "setItem">;
	reload: () => void;
	now: () => number;
};

export function handlePreloadError(event: { preventDefault: () => void }, ports: Ports) {
	const last = Number(ports.storage.getItem(LAST_RELOAD) ?? 0);
	if (ports.now() - last < LOOP_GUARD_MS) return;

	ports.storage.setItem(LAST_RELOAD, String(ports.now()));
	event.preventDefault();
	ports.reload();
}

/** Vite raises vite:preloadError when a page's file cannot be fetched. */
export function reloadOnStaleBuild() {
	window.addEventListener("vite:preloadError", (event) =>
		handlePreloadError(event, {
			storage: sessionStorage,
			reload: () => window.location.reload(),
			now: Date.now,
		})
	);
}
