import { t as cn } from "./utils-C_uf36nf.mjs";
import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { A as Check, h as Minus, t as X } from "../_libs/lucide-react.mjs";
import { n as TONE_CLASSES, t as STAGE_STATE } from "./status-DxvecQa5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/verification-progress-DV9zgcpQ.js
var import_jsx_runtime = require_jsx_runtime();
/**
* The verification cascade: SCAN → VALIDATE → RESOLVE → ISSUER → STATUS →
* MATCH → CONFIRM → RECEIPT. Renders exactly the states it is given; it
* never assumes a later step succeeded.
*/
function VerificationProgress({ steps, compact = false, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		"aria-label": "Verification progress",
		className: cn("flex flex-col", className),
		children: steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationStep, {
			step,
			isLast: index === steps.length - 1,
			compact
		}, step.id))
	});
}
function VerificationStep({ step, isLast, compact }) {
	const state = STAGE_STATE[step.state];
	const tone = TONE_CLASSES[state.tone];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "relative flex gap-3",
		"aria-current": step.state === "current" ? "step" : void 0,
		children: [
			!isLast && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": "true",
				className: cn("absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px", step.state === "success" ? "bg-success/40" : "bg-border")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepNode, { state: step.state }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("min-w-0 pb-5", isLast && "pb-0"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-x-2 gap-y-0.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("text-body-sm font-medium leading-6", step.state === "pending" || step.state === "skipped" ? "text-foreground-subtle" : "text-foreground"),
						children: step.label
					}), !compact && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("text-metadata", tone.icon === "text-muted-foreground" ? "text-foreground-subtle" : tone.icon),
						children: state.label
					})]
				}), !compact && step.detail && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-metadata text-foreground-muted",
					children: step.detail
				})]
			})
		]
	});
}
function StepNode({ state }) {
	const tone = TONE_CLASSES[STAGE_STATE[state].tone];
	const base = "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-surface-strong";
	if (state === "success") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(base, "border-success/40 bg-success-soft"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
			className: "size-3.5 text-success",
			strokeWidth: 2.5,
			"aria-hidden": "true"
		})
	});
	if (state === "failure") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(base, "border-danger/40 bg-danger-soft"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
			className: "size-3.5 text-danger",
			strokeWidth: 2.5,
			"aria-hidden": "true"
		})
	});
	if (state === "warning") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(base, "border-warning/40 bg-warning-soft"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
			className: "size-3.5 text-warning",
			strokeWidth: 2.5,
			"aria-hidden": "true"
		})
	});
	if (state === "current") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn(base, tone.ring),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "size-2 rounded-full bg-accent motion-safe:animate-pulse",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "In progress"
		})]
	});
	if (state === "skipped") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(base, "border-border"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
			className: "size-3.5 text-foreground-subtle",
			"aria-hidden": "true"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(base, "border-border"),
		"aria-hidden": "true"
	});
}
//#endregion
export { VerificationProgress as t };
