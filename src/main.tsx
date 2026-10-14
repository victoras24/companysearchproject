import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import App from "./App.tsx";
import { reloadOnStaleBuild } from "./lib/staleBuild";

reloadOnStaleBuild();
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
