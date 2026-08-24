import { t as cn } from "./utils-C_uf36nf.mjs";
import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { N as BadgeCheck, O as CircleDashed, k as CircleAlert, l as ShieldCheck, u as ScanLine } from "../_libs/lucide-react.mjs";
import { t as VerificationProgress } from "./verification-progress-DV9zgcpQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.verify-CU0WA-xS.js
var import_jsx_runtime = require_jsx_runtime();
var LEVEL_PRESENTATION = {
	officially_confirmed: {
		icon: BadgeCheck,
		classes: "border-success/35 bg-success-soft text-success-soft-foreground",
		iconClasses: "text-success"
	},
	verified: {
		icon: ShieldCheck,
		classes: "border-success/35 bg-success-soft text-success-soft-foreground",
		iconClasses: "text-success"
	},
	provisional: {
		icon: CircleDashed,
		classes: "border-warning/35 bg-warning-soft text-warning-soft-foreground",
		iconClasses: "text-warning"
	},
	unverified: {
		icon: CircleAlert,
		classes: "border-border bg-muted text-foreground-muted",
		iconClasses: "text-foreground-subtle"
	}
};
/**
* Compact provenance row: how much trust this view carries and why.
* Distinguishes verified / matched / officially confirmed explicitly.
*/
function TrustSignal({ signal, className }) {
	const presentation = LEVEL_PRESENTATION[signal.level];
	const Icon = presentation.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-start gap-3 rounded-lg border px-3.5 py-3", presentation.classes, className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: cn("mt-0.5 size-4.5 shrink-0", presentation.iconClasses),
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-body-sm font-semibold leading-5",
				children: signal.label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-metadata leading-4 opacity-90",
				children: signal.detail
			})]
		})]
	});
}
/**
* Pramaan verification view models.
*
* These types are the contract between the (currently mocked) backend and
* the presentation layer. Components consume these models only — they never
* derive verification truth themselves.
*/
/** The canonical verification pipeline. Order is meaningful. */
var VERIFICATION_STAGES = [
	"scan",
	"validate",
	"resolve",
	"issuer",
	"status",
	"match",
	"confirm",
	"receipt"
];
var STAGE_LABELS = {
	scan: "Scan",
	validate: "Validate",
	resolve: "Resolve",
	issuer: "Issuer",
	status: "Status",
	match: "Match",
	confirm: "Confirm",
	receipt: "Receipt"
};
var PIPELINE_PREVIEW = VERIFICATION_STAGES.map((id) => ({
	id,
	label: STAGE_LABELS[id],
	state: "pending"
}));
var CERTAINTY_LEVELS = [
	{
		name: "Credential valid",
		detail: "The QR payload is well-formed, signed, found in the registry, and not revoked."
	},
	{
		name: "Identity matched",
		detail: "The person in front of you matches the photo and details on the credential."
	},
	{
		name: "Officially confirmed",
		detail: "The issuing department confirmed this posting live during your session."
	}
];
function VerifyEntry() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-page-title text-foreground",
					children: "Verify an official"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-body text-foreground-muted",
					children: "Ask the official to show the QR code on their credential. Pramaan resolves it against the registry, checks the issuer and status, and — if you want more certainty — compares the person in front of you or requests live confirmation."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: true,
					className: "mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-accent px-5 text-body font-semibold text-accent-foreground opacity-60 sm:w-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanLine, {
						className: "size-5",
						"aria-hidden": "true"
					}), "Scan a credential"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2.5 text-metadata text-foreground-subtle",
					children: "The camera scanner arrives in the next build phase."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustSignal, {
					className: "mt-8",
					signal: {
						level: "provisional",
						label: "A scan alone is not a verification",
						detail: "Pramaan separates credential validity, identity match, and official confirmation. You always see which level of certainty you hold."
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					"aria-label": "Levels of certainty",
					className: "mt-10 border-t border-border pt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-label uppercase text-foreground-subtle",
						children: "Levels of certainty"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
						className: "mt-4 divide-y divide-border",
						children: CERTAINTY_LEVELS.map((level) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-1 py-3.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "font-display text-body-sm font-semibold text-foreground",
								children: level.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "text-body-sm text-foreground-muted",
								children: level.detail
							})]
						}, level.name))
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			"aria-label": "Verification pipeline",
			className: "h-fit rounded-lg border border-border bg-surface-strong p-5 shadow-elev-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-label uppercase text-foreground-subtle",
					children: "Every verification walks this pipeline"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationProgress, {
					steps: PIPELINE_PREVIEW,
					compact: true,
					className: "mt-4"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 border-t border-border pt-3 text-metadata text-foreground-subtle",
					children: "All stages idle — no session has been started."
				})
			]
		})]
	});
}
//#endregion
export { VerifyEntry as component };
