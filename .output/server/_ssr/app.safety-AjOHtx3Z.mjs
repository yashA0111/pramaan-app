import { t as cn } from "./utils-C_uf36nf.mjs";
import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { T as FilePlusCorner, _ as MapPin, g as MessageSquareWarning, s as Siren } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.safety-AjOHtx3Z.js
var import_jsx_runtime = require_jsx_runtime();
var TOOLS = [
	{
		icon: Siren,
		name: "SOS — Emergency assistance",
		description: "Share your location with emergency contacts. Press-and-hold to activate.",
		danger: true
	},
	{
		icon: MapPin,
		name: "Nearest police station",
		description: "Locate the closest station, with distance, contact, and directions."
	},
	{
		icon: MessageSquareWarning,
		name: "Scam detection",
		description: "Paste a suspicious message and get a risk reading with the reasons behind it."
	},
	{
		icon: FilePlusCorner,
		name: "Report an incident",
		description: "File a structured report — details, evidence, review, submit."
	}
];
function SafetyHub() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-page-title text-foreground",
			children: "Safety tools"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-body text-foreground-muted",
			children: "Verification is one part of feeling safe. These tools cover the rest of the moment."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-7 space-y-3",
			children: TOOLS.map((tool) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				"aria-disabled": "true",
				className: cn("flex items-start gap-4 rounded-lg border bg-surface-strong p-4 shadow-elev-1", tool.danger ? "border-danger/30" : "border-border"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("flex size-11 shrink-0 items-center justify-center rounded-md", tool.danger ? "bg-danger-soft text-danger" : "bg-muted text-foreground-muted"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(tool.icon, {
							className: "size-5",
							"aria-hidden": "true"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-body-sm font-semibold text-foreground",
							children: tool.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block text-body-sm text-foreground-muted",
							children: tool.description
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground-subtle",
						children: "Next phase"
					})
				]
			}, tool.name))
		})]
	});
}
//#endregion
export { SafetyHub as component };
