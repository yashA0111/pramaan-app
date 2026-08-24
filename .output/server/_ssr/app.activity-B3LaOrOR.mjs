import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { C as History } from "../_libs/lucide-react.mjs";
import { i as verificationQueries, r as Skeleton, t as CredentialStatusBadge } from "./mock-service-DO_4xYPI.mjs";
import { t as StateView } from "./state-view-BjtfytkU.mjs";
import { t as formatDistanceToNow } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.activity-B3LaOrOR.js
var import_jsx_runtime = require_jsx_runtime();
var METHOD_LABELS = {
	qr: "QR scan",
	qr_face: "QR + face match",
	qr_official: "QR + official confirmation"
};
function ActivityPage() {
	const recent = useQuery(verificationQueries.recent());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-page-title text-foreground",
			children: "Activity"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-body text-foreground-muted",
			children: "Every verification leaves a receipt. Nothing is verified quietly."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-7",
			children: [
				recent.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					"aria-label": "Loading activity",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full rounded-lg" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full rounded-lg" })]
				}),
				recent.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateView, {
					icon: History,
					title: "Couldn't load activity",
					body: "Check your connection and try again.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => recent.refetch(),
						className: "inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-body-sm font-medium text-foreground hover:bg-muted",
						children: "Retry"
					})
				}),
				recent.data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg border border-border bg-surface-strong p-4 shadow-elev-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-card-title text-foreground",
									children: recent.data.subjectName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CredentialStatusBadge, { status: recent.data.outcome })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-body-sm text-foreground-muted",
								children: [
									recent.data.subjectDesignation,
									" · ",
									METHOD_LABELS[recent.data.method]
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-metadata text-foreground-subtle",
								children: [
									formatDistanceToNow(new Date(recent.data.occurredAt), { addSuffix: true }),
									" · session ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-display tracking-wide",
										children: recent.data.sessionId
									})
								]
							})
						]
					})
				})
			]
		})]
	});
}
//#endregion
export { ActivityPage as component };
