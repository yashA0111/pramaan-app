import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as PramaanMark } from "./pramaan-mark-BP343r82.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { b as Inbox } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/official-DKvHUIhZ.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Minimal official-side shell. Same product family, but the chrome makes
* the different role obvious: inverted ink header, console framing.
*/
function OfficialShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border bg-primary text-primary-foreground",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/official",
					className: "flex items-center gap-2.5",
					"aria-label": "Pramaan official console",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PramaanMark, { className: "size-6 [&_rect]:stroke-primary-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display text-body-sm font-semibold tracking-tight",
						children: ["Pramaan ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-normal opacity-70",
							children: "· Official console"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full border border-primary-foreground/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] opacity-80",
					children: "Demo"
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:py-12",
			children
		})]
	});
}
function OfficialEntry() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficialShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-md",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-page-title text-foreground",
				children: "Official console"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-body text-foreground-muted",
				children: "When a citizen asks for live confirmation, the request lands here — with what is being asked, what will be shared, and how long it stands."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 rounded-lg border border-border bg-surface-strong p-6 text-center shadow-elev-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mx-auto flex size-12 items-center justify-center rounded-full bg-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, {
						className: "size-5 text-foreground-muted",
						"aria-hidden": "true"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-card-title font-semibold text-foreground",
					children: "No pending requests"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 text-body-sm text-foreground-muted",
					children: "The request inbox, approval flow, and expiry handling arrive in the official-interface phase."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: true,
					className: "mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-5 text-body-sm font-medium text-primary-foreground opacity-60",
					children: "Continue as demo official"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2.5 text-metadata text-foreground-subtle",
					children: "Demo console — synthetic requests only."
				})
			]
		})]
	}) });
}
//#endregion
export { OfficialEntry as component };
