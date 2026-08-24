import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as ArrowUpRight, T as FilePlusCorner, _ as MapPin, g as MessageSquareWarning, s as Siren, u as ScanLine } from "../_libs/lucide-react.mjs";
import { i as verificationQueries, n as DEMO_PROGRESS, r as Skeleton, t as CredentialStatusBadge } from "./mock-service-DO_4xYPI.mjs";
import { t as StateView } from "./state-view-BjtfytkU.mjs";
import { t as formatDistanceToNow } from "../_libs/date-fns.mjs";
import { t as VerificationProgress } from "./verification-progress-DV9zgcpQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.index--XEVywpZ.js
var import_jsx_runtime = require_jsx_runtime();
function greeting() {
	const hour = (/* @__PURE__ */ new Date()).getHours();
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
}
var METHOD_LABELS = {
	qr: "QR scan",
	qr_face: "QR + face match",
	qr_official: "QR + official confirmation"
};
function CitizenHome() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-label uppercase text-foreground-subtle",
		children: "Citizen session · demo"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
		className: "mt-2 font-display text-page-title text-foreground",
		children: [greeting(), ", Ananya"]
	})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-7 grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/app/verify",
				className: "group flex items-center justify-between gap-4 rounded-xl bg-accent p-5 text-accent-foreground shadow-elev-2 transition-colors hover:bg-accent-strong",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent-foreground/12",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanLine, {
							className: "size-6",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block font-display text-card-title font-semibold",
						children: "Verify an official"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-0.5 block text-body-sm opacity-85",
						children: "Scan a government credential QR code"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
					className: "size-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
					"aria-hidden": "true"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-3 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickTool, {
						to: "/app/safety",
						icon: MessageSquareWarning,
						label: "Scam check"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickTool, {
						to: "/app/safety",
						icon: MapPin,
						label: "Police stations"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickTool, {
						to: "/app/safety",
						icon: FilePlusCorner,
						label: "Report"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/app/safety",
				className: "mt-4 flex min-h-14 items-center gap-3 rounded-xl border border-danger/35 bg-danger-soft/60 px-5 py-3.5 text-danger-soft-foreground transition-colors hover:bg-danger-soft",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Siren, {
					className: "size-5 shrink-0 text-danger",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-body-sm font-semibold",
						children: "SOS — Emergency assistance"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-metadata text-danger-soft-foreground/80",
						children: "Press-and-hold activation inside · demo, no real dispatch"
					})]
				})]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecentVerification, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					"aria-label": "Last session pipeline",
					className: "rounded-lg border border-border bg-surface-strong p-5 shadow-elev-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-label uppercase text-foreground-subtle",
							children: "Session pipeline"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-[11px] tracking-[0.14em] text-foreground-subtle",
							children: DEMO_PROGRESS.sessionId.toUpperCase()
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationProgress, {
						steps: DEMO_PROGRESS.steps,
						compact: true,
						className: "mt-4"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border bg-surface p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-label uppercase text-foreground-subtle",
						children: "Three kinds of sure"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-3 space-y-2.5 text-body-sm text-foreground-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-2 size-1.5 shrink-0 rounded-full bg-success",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "font-medium text-foreground",
									children: "Credential valid"
								}), " — the document is authentic and current."] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-2 size-1.5 shrink-0 rounded-full bg-success",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "font-medium text-foreground",
									children: "Identity matched"
								}), " — the person matches the credential."] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-2 size-1.5 shrink-0 rounded-full bg-accent",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "font-medium text-foreground",
									children: "Officially confirmed"
								}), " — the issuer affirmed it live."] })]
							})
						]
					})]
				})
			]
		})]
	})] });
}
function QuickTool({ to, icon: Icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "flex min-h-20 flex-col items-start justify-between gap-2 rounded-lg border border-border bg-surface-strong p-3.5 shadow-elev-1 transition-colors hover:bg-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-5 text-foreground-muted",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-body-sm font-medium text-foreground",
			children: label
		})]
	});
}
function RecentVerification() {
	const recent = useQuery(verificationQueries.recent());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-label": "Most recent verification",
		className: "rounded-lg border border-border bg-surface-strong p-5 shadow-elev-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-label uppercase text-foreground-subtle",
				children: "Most recent verification"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/app/activity",
				className: "text-metadata font-medium text-accent transition-colors hover:text-accent-strong",
				children: "View activity"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [
				recent.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2.5",
					"aria-label": "Loading recent verification",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-2/3" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-1/3" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-1/2" })
					]
				}),
				recent.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateView, {
					icon: ScanLine,
					title: "Couldn't load activity",
					body: "Check your connection and try again.",
					className: "border-none bg-transparent py-6",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => recent.refetch(),
						className: "inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-body-sm font-medium text-foreground hover:bg-muted",
						children: "Retry"
					})
				}),
				recent.data && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-x-3 gap-y-2",
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
						className: "mt-1.5 text-metadata text-foreground-subtle",
						children: [
							formatDistanceToNow(new Date(recent.data.occurredAt), { addSuffix: true }),
							" · session",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display tracking-wide",
								children: recent.data.sessionId
							})
						]
					})
				] })
			]
		})]
	});
}
//#endregion
export { CitizenHome as component };
