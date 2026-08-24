import { n as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as require_react, r as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { _ as useRouter, c as HeadContent, d as Outlet, f as lazyRouteComponent, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-9JFfcMPa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-BRIWahMD.css";
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		theme: "light",
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-label uppercase tracking-widest text-foreground-subtle",
					children: "Pramaan"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 font-display text-display text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-3 text-card-title font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-body-sm text-foreground-muted",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-body-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-page-title tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-body-sm text-foreground-muted",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-body-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-5 py-2.5 text-body-sm font-medium text-foreground transition-colors hover:bg-muted",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$7 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Pramaan — Evidence becomes trust" },
			{
				name: "description",
				content: "Pramaan is an identity-verification and public-safety platform. Scan an official's credential, confirm their identity, and hold a trust receipt — evidence becomes trust."
			},
			{
				name: "author",
				content: "Pramaan"
			},
			{
				property: "og:title",
				content: "Pramaan — Evidence becomes trust"
			},
			{
				property: "og:description",
				content: "Verify government officials in seconds: credential scanning, identity matching, official confirmation, and public-safety tools."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700&family=Space+Grotesk:wght@400..700&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$7.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})]
	});
}
var $$splitComponentImporter$6 = () => import("./routes-IOwy44G9.mjs");
var Route$6 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Pramaan — Evidence becomes trust" },
		{
			name: "description",
			content: "Verify a government official's credential in seconds: scan the QR, compare the identity, request official confirmation, and keep the trust receipt."
		},
		{
			property: "og:title",
			content: "Pramaan — Evidence becomes trust"
		},
		{
			property: "og:description",
			content: "Identity verification and public safety: credential scanning, identity matching, official confirmation, trust receipts."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
/** Certainty is layered, never collapsed into one green tick. */
var $$splitComponentImporter$5 = () => import("./app-Df5FtQay.mjs");
var Route$5 = createFileRoute("/app")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./official-DKvHUIhZ.mjs");
var Route$4 = createFileRoute("/official")({
	head: () => ({ meta: [
		{ title: "Official console — Pramaan" },
		{
			name: "description",
			content: "Where government officials receive and answer citizen verification requests."
		},
		{
			property: "og:title",
			content: "Official console — Pramaan"
		},
		{
			property: "og:description",
			content: "Where government officials receive and answer citizen verification requests."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./app.index--XEVywpZ.mjs");
var Route$3 = createFileRoute("/app/")({
	head: () => ({ meta: [
		{ title: "Home — Pramaan" },
		{
			name: "description",
			content: "Verify an official, reach safety tools, and review recent verifications."
		},
		{
			property: "og:title",
			content: "Home — Pramaan"
		},
		{
			property: "og:description",
			content: "Verify an official, reach safety tools, and review recent verifications."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./app.activity-B3LaOrOR.mjs");
var Route$2 = createFileRoute("/app/activity")({
	head: () => ({ meta: [
		{ title: "Activity — Pramaan" },
		{
			name: "description",
			content: "Your verification history and session states."
		},
		{
			property: "og:title",
			content: "Activity — Pramaan"
		},
		{
			property: "og:description",
			content: "Your verification history and session states."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./app.safety-AjOHtx3Z.mjs");
var Route$1 = createFileRoute("/app/safety")({
	head: () => ({ meta: [
		{ title: "Safety tools — Pramaan" },
		{
			name: "description",
			content: "SOS assistance, nearest police stations, scam detection, and incident reporting."
		},
		{
			property: "og:title",
			content: "Safety tools — Pramaan"
		},
		{
			property: "og:description",
			content: "SOS assistance, nearest police stations, scam detection, and incident reporting."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./app.verify-CU0WA-xS.mjs");
var Route = createFileRoute("/app/verify")({
	head: () => ({ meta: [
		{ title: "Verify an official — Pramaan" },
		{
			name: "description",
			content: "Scan a government credential QR code and walk the verification pipeline."
		},
		{
			property: "og:title",
			content: "Verify an official — Pramaan"
		},
		{
			property: "og:description",
			content: "Scan a government credential QR code and walk the verification pipeline."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$6.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$7
});
var AppRoute = Route$5.update({
	id: "/app",
	path: "/app",
	getParentRoute: () => Route$7
});
var OfficialRoute = Route$4.update({
	id: "/official",
	path: "/official",
	getParentRoute: () => Route$7
});
var AppIndexRoute = Route$3.update({
	id: "/",
	path: "/",
	getParentRoute: () => AppRoute
});
var AppRouteChildren = {
	AppActivityRoute: Route$2.update({
		id: "/activity",
		path: "/activity",
		getParentRoute: () => AppRoute
	}),
	AppSafetyRoute: Route$1.update({
		id: "/safety",
		path: "/safety",
		getParentRoute: () => AppRoute
	}),
	AppVerifyRoute: Route.update({
		id: "/verify",
		path: "/verify",
		getParentRoute: () => AppRoute
	}),
	AppIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AppRoute: AppRoute._addFileChildren(AppRouteChildren),
	OfficialRoute
};
var routeTree = Route$7._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
