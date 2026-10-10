// The router's navigate, for code outside a component such as a toast's button. The app sets it
// once the router is up; until then there is nowhere to go.

let navigator: ((path: string) => void) | null = null;

export const setNavigator = (navigate: ((path: string) => void) | null) => {
	navigator = navigate;
};

export const go = (path: string) => {
	if (navigator) navigator(path);
	else window.location.assign(path);
};
