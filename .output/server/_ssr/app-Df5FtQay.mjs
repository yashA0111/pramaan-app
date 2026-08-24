import { t as cn } from "./utils-C_uf36nf.mjs";
import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as PramaanMark } from "./pramaan-mark-BP343r82.mjs";
import { d as Outlet, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as History, u as ScanLine, v as LifeBuoy, x as House } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-Df5FtQay.js
var import_jsx_runtime = require_jsx_runtime();
var NAV_ITEMS = [
	{
		to: "/app",
		label: "Home",
		icon: House,
		exact: true
	},
	{
		to: "/app/verify",
		label: "Verify",
		icon: ScanLine
	},
	{
		to: "/app/safety",
		label: "Safety",
		icon: LifeBuoy
	},
	{
		to: "/app/activity",
		label: "Activity",
		icon: History
	}
];
/**
* Citizen application shell. Mobile-first: top brand bar + thumb-reachable
* bottom navigation. Desktop: composed left rail — same hierarchy, wider
* canvas. Exactly one <main> per page lives here.
*/
function CitizenShell() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background md:grid md:grid-cols-[248px_minmax(0,1fr)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "sticky top-0 hidden h-screen flex-col border-r border-border bg-surface px-4 py-6 md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-2.5 px-2",
						"aria-label": "Pramaan home",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PramaanMark, { className: "size-7" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-card-title font-semibold tracking-tight",
							children: "Pramaan"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						"aria-label": "Primary",
						className: "mt-8 flex flex-col gap-1",
						children: NAV_ITEMS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							activeOptions: { exact: item.exact ?? false },
							className: "flex min-h-11 items-center gap-3 rounded-md px-3 text-body-sm font-medium text-foreground-muted transition-colors hover:bg-muted hover:text-foreground",
							activeProps: { className: "bg-muted text-foreground" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
								className: "size-4.5 shrink-0",
								"aria-hidden": "true"
							}), item.label]
						}, item.to))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-auto rounded-md border border-dashed border-border-strong px-3 py-2.5 text-metadata text-foreground-subtle",
						children: "Demo build — synthetic identities only. No real police or government systems are contacted."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2",
					"aria-label": "Pramaan home",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PramaanMark, { className: "size-6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-body-sm font-semibold tracking-tight",
						children: "Pramaan"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground-muted",
					children: "Demo"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto w-full max-w-2xl px-4 pb-28 pt-6 md:max-w-4xl md:px-10 md:pb-16 md:pt-10 lg:max-w-5xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				"aria-label": "Primary",
				className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-strong/95 backdrop-blur md:hidden",
				style: { paddingBottom: "env(safe-area-inset-bottom)" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-4",
					children: NAV_ITEMS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: item.to,
						activeOptions: { exact: item.exact ?? false },
						"aria-label": item.label,
						className: "relative flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium text-foreground-subtle transition-colors",
						activeProps: { className: "text-accent" },
						children: ({ isActive }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
								className: "size-5",
								strokeWidth: isActive ? 2.25 : 1.75,
								"aria-hidden": "true"
							}),
							item.label,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": "true",
								className: cn("absolute top-0 h-0.5 w-8 rounded-full transition-colors", isActive ? "bg-accent" : "bg-transparent")
							})
						] })
					}, item.to))
				})
			})
		]
	});
}
var SplitComponent = CitizenShell;
//#endregion
export { SplitComponent as component };
