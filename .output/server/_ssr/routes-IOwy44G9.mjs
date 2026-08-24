import { n as __toESM } from "../_runtime.mjs";
import { t as useReducedMotion } from "../_libs/framer-motion+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { a as require_jsx_runtime, i as require_react, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { t as PramaanMark } from "./pramaan-mark-BP343r82.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as ArrowRight, I as ArrowDown, f as RotateCcw, u as ScanLine, y as Landmark } from "../_libs/lucide-react.mjs";
import { i as verificationQueries, n as DEMO_PROGRESS, r as Skeleton, t as CredentialStatusBadge } from "./mock-service-DO_4xYPI.mjs";
import { t as VerificationProgress } from "./verification-progress-DV9zgcpQ.mjs";
import { t as motion } from "../_libs/motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-IOwy44G9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MarketingHeader() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "flex items-center gap-2.5",
				"aria-label": "Pramaan home",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PramaanMark, { className: "size-7" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-card-title font-semibold tracking-tight",
					children: "Pramaan"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				"aria-label": "Marketing",
				className: "flex items-center gap-1 md:gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "#how-it-works",
						className: "hidden min-h-11 items-center rounded-md px-3 text-body-sm font-medium text-foreground-muted transition-colors hover:bg-muted hover:text-foreground sm:inline-flex",
						children: "How it works"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/official",
						className: "hidden min-h-11 items-center rounded-md px-3 text-body-sm font-medium text-foreground-muted transition-colors hover:bg-muted hover:text-foreground sm:inline-flex",
						children: "Official console"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/app",
						className: "inline-flex min-h-11 items-center gap-1.5 rounded-md bg-primary px-4 text-body-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: ["Open the app", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
							className: "size-4",
							"aria-hidden": "true"
						})]
					})
				]
			})]
		})
	});
}
function MarketingFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PramaanMark, { className: "size-5" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body-sm font-medium text-foreground",
						children: "Pramaan"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body-sm text-foreground-subtle",
						children: "— evidence becomes trust."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-metadata text-foreground-subtle",
				children: "Demonstration build. All identities, credentials, and registries are synthetic."
			})]
		})
	});
}
function formatDate(iso) {
	return new Intl.DateTimeFormat("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric"
	}).format(new Date(iso));
}
/**
* A government credential rendered as a digital document — evidence
* artifact, not a payment card. Hierarchy: identity → designation →
* provenance → identifiers → verification state.
*/
function CredentialCard({ credential, status, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		"aria-label": `Credential for ${credential.fullName}`,
		className: cn("relative overflow-hidden rounded-lg border border-border bg-surface-strong shadow-elev-1", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": "true",
				className: "absolute inset-y-0 left-0 w-1 bg-accent"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-3 border-b border-border py-2.5 pl-5 pr-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex min-w-0 items-center gap-1.5 text-label uppercase text-foreground-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, {
						className: "size-3.5 shrink-0",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate",
						children: "Government credential · demo registry"
					})]
				}), status && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CredentialStatusBadge, { status })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-4 pl-5 pr-4 pt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: credential.photoUrl,
					alt: credential.photoAlt,
					width: 640,
					height: 768,
					loading: "lazy",
					className: "aspect-[5/6] w-20 shrink-0 rounded-md border border-border object-cover"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-card-title text-foreground",
							children: credential.fullName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-body-sm font-medium text-foreground",
							children: credential.designation
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-body-sm text-foreground-muted",
							children: credential.department
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-metadata text-foreground-subtle",
							children: credential.posting
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CredentialField, {
						label: "Credential ID",
						value: credential.credentialId,
						mono: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CredentialField, {
						label: "Registry",
						value: registryLabel(credential)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CredentialField, {
						label: "Issued",
						value: formatDate(credential.issuedOn)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CredentialField, {
						label: "Valid until",
						value: formatDate(credential.validUntil)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "border-t border-border px-5 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-metadata text-foreground-muted",
					children: [
						"Issued by ",
						credential.issuer.name,
						" — ",
						credential.issuer.authority
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-metadata text-foreground-subtle",
					children: "Synthetic demo identity. No real government data."
				})]
			})
		]
	});
}
function registryLabel(credential) {
	switch (credential.registryStatus) {
		case "active": return "Active";
		case "expired": return "Expired";
		case "revoked": return "Revoked";
		case "unknown": return "Not found";
	}
}
function CredentialField({ label, value, mono = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "truncate text-label uppercase text-foreground-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: cn("mt-0.5 truncate text-foreground", mono ? "font-display text-credential tracking-wide" : "text-body-sm"),
			children: value
		})]
	});
}
/**
* Information resolving into a trusted credential: the document starts
* unfocused, a scan pass sweeps it, the content sharpens, and the
* verification seal stamps last. Reduced motion renders the final state.
*/
function CredentialReveal({ credential, status, replayKey = 0, className }) {
	const reduced = useReducedMotion();
	const [settled, setSettled] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setSettled(false);
		if (reduced) {
			setSettled(true);
			return;
		}
		const timer = setTimeout(() => setSettled(true), 2400);
		return () => clearTimeout(timer);
	}, [replayKey, reduced]);
	const t = (seconds) => reduced ? 0 : seconds;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				initial: reduced ? false : {
					opacity: .35,
					filter: "blur(7px)",
					y: 6
				},
				animate: {
					opacity: 1,
					filter: "blur(0px)",
					y: 0
				},
				transition: {
					duration: .9,
					delay: t(.55),
					ease: [
						.16,
						1,
						.3,
						1
					]
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CredentialCard, {
					credential,
					status: settled ? status : void 0
				})
			}),
			!reduced && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
				"aria-hidden": "true",
				className: "pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-accent/15 to-transparent",
				initial: {
					y: "-30%",
					opacity: 0
				},
				animate: {
					y: ["0%", "900%"],
					opacity: [
						0,
						1,
						1,
						0
					]
				},
				transition: {
					duration: 1.1,
					delay: .35,
					ease: "easeInOut"
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
				"aria-hidden": "true",
				className: "absolute -right-2 -top-2 flex size-9 items-center justify-center rounded-full border border-success/40 bg-success text-success-foreground shadow-elev-2",
				initial: reduced ? false : {
					scale: 1.6,
					opacity: 0,
					rotate: -12
				},
				animate: {
					scale: 1,
					opacity: 1,
					rotate: 0
				},
				transition: {
					delay: t(1.7),
					type: "spring",
					stiffness: 380,
					damping: 17
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					className: "size-4.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.path, {
						d: "M6 12.5l4 4L18 7.5",
						stroke: "currentColor",
						strokeWidth: "2.75",
						strokeLinecap: "round",
						strokeLinejoin: "round",
						initial: reduced ? false : { pathLength: 0 },
						animate: { pathLength: 1 },
						transition: {
							delay: t(1.85),
							duration: .35,
							ease: "easeOut"
						}
					})
				})
			})
		]
	}, replayKey);
}
/**
* EvidenceToTrustHero — the product thesis rendered as one artifact.
*
*   01 EVIDENCE      raw credential payload
*   02 VERIFICATION  ordered checks resolve
*   03 TRUST         sealed credential + receipt
*
* Composed as a single vertical ledger sheet so it holds its proportions
* from 360px to 1440px: no fixed-width panels, no truncated captions.
* The sequence plays once (~3.2s) then holds. Reduced motion renders the
* resolved state immediately.
*/
var EASE = [
	.16,
	1,
	.3,
	1
];
var EVIDENCE_CELLS = Array.from({ length: 49 }, (_, i) => {
	const n = (i * 37 + 11) % 9;
	return n === 0 || n === 2 || n === 5 || n === 7;
});
var RAIL_CHECKS = [
	{
		label: "Validate",
		detail: "Signature well-formed",
		at: 1
	},
	{
		label: "Issuer",
		detail: "Authority recognized",
		at: 1.3
	},
	{
		label: "Status",
		detail: "Active · not revoked",
		at: 1.6
	},
	{
		label: "Match",
		detail: "Identity compared",
		at: 1.9
	}
];
var FIELD_DELAY = 2.25;
var SEAL_DELAY = 2.75;
var PILL_DELAY = 2.95;
function EvidenceToTrustHero({ className }) {
	const reduced = useReducedMotion() ?? false;
	const [cycle, setCycle] = (0, import_react.useState)(0);
	const d = (seconds) => reduced ? 0 : seconds;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: cn("relative m-0", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "overflow-hidden rounded-xl border border-border bg-surface-strong shadow-elev-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5 sm:px-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-label uppercase text-foreground-muted",
					children: "Verification sheet · demo session"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "shrink-0 font-display text-[11px] tracking-[0.14em] text-foreground-subtle",
					children: "SES_9F42KDL1"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"aria-hidden": "true",
				className: "divide-y divide-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stage, {
						index: "01",
						title: "Evidence",
						detail: "Raw QR payload",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid w-24 shrink-0 grid-cols-7 gap-[3px] rounded-md border border-border bg-background p-2 sm:w-28",
								children: EVIDENCE_CELLS.map((filled, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
									className: cn("aspect-square rounded-[1.5px]", filled ? "bg-foreground" : "bg-border/60"),
									initial: reduced ? false : {
										opacity: 0,
										scale: .5
									},
									animate: {
										opacity: 1,
										scale: 1
									},
									transition: {
										delay: d(.06 + i * .012),
										duration: .22,
										ease: "easeOut"
									}
								}, i))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1 space-y-1.5",
								children: [[
									"82%",
									"64%",
									"46%"
								].map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
									className: "block h-1.5 rounded-full bg-border-strong/70",
									style: { width: w },
									initial: reduced ? false : {
										opacity: 0,
										scaleX: .3,
										originX: 0
									},
									animate: {
										opacity: 1,
										scaleX: 1
									},
									transition: {
										delay: d(.45 + i * .08),
										duration: .35,
										ease: EASE
									}
								}, w)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.p, {
									className: "pt-1 font-display text-[11px] tracking-[0.12em] text-foreground-subtle",
									initial: reduced ? false : { opacity: 0 },
									animate: { opacity: 1 },
									transition: {
										delay: d(.7),
										duration: .3
									},
									children: "PRM·DL·QR·v2"
								})]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stage, {
						index: "02",
						title: "Verification",
						detail: "Ordered checks",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "grid gap-2.5 sm:grid-cols-2",
							children: RAIL_CHECKS.map((check) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
									className: "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
									initial: reduced ? false : {
										borderColor: "var(--color-border-strong)",
										backgroundColor: "transparent"
									},
									animate: {
										borderColor: "color-mix(in oklab, var(--color-success) 45%, transparent)",
										backgroundColor: "var(--color-success-soft)"
									},
									transition: {
										delay: d(check.at),
										duration: .3
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.svg, {
										viewBox: "0 0 24 24",
										fill: "none",
										className: "size-2.5 text-success",
										initial: reduced ? false : { opacity: 0 },
										animate: { opacity: 1 },
										transition: {
											delay: d(check.at + .08),
											duration: .2
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
											d: "M5.5 12.5l4 4 9-9.5",
											stroke: "currentColor",
											strokeWidth: "3.5",
											strokeLinecap: "round",
											strokeLinejoin: "round"
										})
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.p, {
										className: "font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground",
										initial: reduced ? false : { opacity: .25 },
										animate: { opacity: 1 },
										transition: {
											delay: d(check.at),
											duration: .25
										},
										children: check.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.p, {
										className: "text-[11px] leading-4 text-foreground-subtle",
										initial: reduced ? false : { opacity: 0 },
										animate: { opacity: 1 },
										transition: {
											delay: d(check.at + .1),
											duration: .25
										},
										children: check.detail
									})]
								})]
							}, check.label))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stage, {
						index: "03",
						title: "Trust",
						detail: "Sealed + receipt",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative rounded-lg border border-border bg-background",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									className: "absolute inset-y-0 left-0 w-1 rounded-l-lg bg-accent"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 py-3 pl-5 pr-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
											className: "block aspect-[5/6] w-11 shrink-0 rounded-[4px] border border-border bg-surface-muted",
											initial: reduced ? false : { opacity: 0 },
											animate: { opacity: 1 },
											transition: {
												delay: d(FIELD_DELAY),
												duration: .3
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [["88%", "58%"].map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
												className: "mb-1.5 block h-2 rounded-full bg-foreground/80 last:mb-0 last:bg-foreground-subtle/60",
												style: { width: w },
												initial: reduced ? false : {
													opacity: 0,
													scaleX: .4,
													originX: 0
												},
												animate: {
													opacity: 1,
													scaleX: 1
												},
												transition: {
													delay: d(2.35 + i * .09),
													duration: .3,
													ease: EASE
												}
											}, w)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
												className: "mt-2 block h-1.5 w-3/5 rounded-full bg-foreground-subtle/40",
												initial: reduced ? false : {
													opacity: 0,
													scaleX: .4,
													originX: 0
												},
												animate: {
													opacity: 1,
													scaleX: 1
												},
												transition: {
													delay: d(2.55),
													duration: .3,
													ease: EASE
												}
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
											className: "flex size-9 shrink-0 items-center justify-center rounded-full border border-success/40 bg-success text-success-foreground",
											initial: reduced ? false : {
												scale: 1.7,
												opacity: 0,
												rotate: -14
											},
											animate: {
												scale: 1,
												opacity: 1,
												rotate: 0
											},
											transition: {
												delay: d(SEAL_DELAY),
												type: "spring",
												stiffness: 380,
												damping: 16
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
												viewBox: "0 0 24 24",
												fill: "none",
												className: "size-4.5",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.path, {
													d: "M6 12.5l4 4L18 7.5",
													stroke: "currentColor",
													strokeWidth: "2.75",
													strokeLinecap: "round",
													strokeLinejoin: "round",
													initial: reduced ? false : { pathLength: 0 },
													animate: { pathLength: 1 },
													transition: {
														delay: d(2.9),
														duration: .35,
														ease: "easeOut"
													}
												})
											})
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
									className: "flex flex-wrap items-center justify-between gap-2 border-t border-border py-2 pl-5 pr-4",
									initial: reduced ? false : { opacity: 0 },
									animate: { opacity: 1 },
									transition: {
										delay: d(2.6),
										duration: .3
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-display text-[11px] font-medium tracking-[0.14em] text-foreground-muted",
										children: "PRM-DL-2024-018457"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
										className: "inline-flex items-center gap-1 rounded-full border border-success/30 bg-success-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-success-soft-foreground",
										initial: reduced ? false : {
											opacity: 0,
											y: 3
										},
										animate: {
											opacity: 1,
											y: 0
										},
										transition: {
											delay: d(PILL_DELAY),
											duration: .25
										},
										children: "Verified"
									})]
								})
							]
						})
					})
				]
			})]
		}, cycle), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
			className: "mt-3 flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-metadata text-foreground-subtle",
				children: "Illustration of the verification pipeline. Synthetic data."
			}), !reduced && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setCycle((c) => c + 1),
				className: "-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-metadata font-medium text-foreground-muted transition-colors hover:bg-muted hover:text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
					className: "size-3.5",
					"aria-hidden": "true"
				}), "Replay"]
			})]
		})]
	});
}
function Stage({ index, title, detail, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "grid gap-3 px-4 py-4 sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-5 sm:px-5 sm:py-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-[11px] font-semibold tracking-[0.16em] text-accent",
					children: index
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 hidden text-[11px] leading-4 text-foreground-subtle sm:block",
					children: detail
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-w-0",
			children
		})]
	});
}
/** Certainty is layered, never collapsed into one green tick. */
var CERTAINTY_LEVELS = [
	{
		index: "I",
		title: "Credential valid",
		body: "The document resolves in the registry, the issuer is recognised, and it has not expired or been revoked.",
		tone: "text-success"
	},
	{
		index: "II",
		title: "Identity matched",
		body: "The person standing in front of you is compared against the photograph bound to that credential.",
		tone: "text-success"
	},
	{
		index: "III",
		title: "Officially confirmed",
		body: "The issuing office affirms, live, that this officer is on duty and this interaction is theirs.",
		tone: "text-accent"
	}
];
function LandingPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketingHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mx-auto w-full max-w-6xl px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-20",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-label uppercase text-foreground-muted",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "size-1.5 rounded-full bg-accent",
										"aria-hidden": "true"
									}), "Identity verification · demo build"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-6 font-display text-hero text-foreground md:text-display",
									children: "Evidence becomes trust."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-5 max-w-md text-body text-foreground-muted",
									children: "Pramaan verifies a government official's credential in seconds — scan, compare, confirm — and hands you a trust receipt. Built for the moments when trust is not a formality."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-8 flex flex-wrap items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/app",
										className: "inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-body-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanLine, {
											className: "size-4",
											"aria-hidden": "true"
										}), "Verify an official"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: "#how-it-works",
										className: "inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-5 py-2.5 text-body-sm font-medium text-foreground transition-colors hover:bg-muted",
										children: ["How verification works", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, {
											className: "size-4",
											"aria-hidden": "true"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
									className: "mt-12 grid max-w-md grid-cols-2 gap-4 sm:grid-cols-3 border-t border-border pt-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroStat, {
											term: "Pipeline stages",
											detail: "8 ordered"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroStat, {
											term: "Certainty levels",
											detail: "3 distinct"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroStat, {
											term: "Real data used",
											detail: "None"
										})
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EvidenceToTrustHero, { className: "min-w-0" })]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					id: "how-it-works",
					className: "border-y border-border bg-surface-muted/50",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:sticky lg:top-24 lg:self-start",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-label uppercase text-accent",
									children: "How verification works"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-3 max-w-md font-display text-section-title text-foreground md:text-page-title",
									children: "Eight steps. No shortcuts."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 max-w-md text-body text-foreground-muted",
									children: "A scan is not a verification. Pramaan walks an ordered pipeline — from raw QR payload to sealed receipt — and every step reports its own state. No step claims success before it happens."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 max-w-md text-body-sm text-foreground-subtle",
									children: "If a check fails, the pipeline stops there and says so. The interface never promotes a partial result to a verified one."
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border bg-surface-strong p-5 shadow-elev-1 md:p-7",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-3 border-b border-border pb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-label uppercase text-foreground-subtle",
									children: "Live pipeline"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-display text-[11px] tracking-[0.14em] text-foreground-subtle",
									children: "SES_9F42KDL1"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationProgress, {
								steps: DEMO_PROGRESS.steps,
								className: "mt-5"
							})]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mx-auto w-full max-w-6xl px-4 py-16 md:px-8 md:py-24",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-label uppercase text-accent",
							children: "Certainty is layered"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-3 max-w-xl font-display text-section-title text-foreground md:text-page-title",
							children: "Three kinds of sure, never collapsed into one."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-10 grid divide-y divide-border border-t border-border md:grid-cols-3 md:divide-x md:divide-y-0",
							children: CERTAINTY_LEVELS.map((level) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "py-6 md:px-6 md:py-7 md:first:pl-0 md:last:pr-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: `font-display text-[13px] tracking-[0.2em] ${level.tone}`,
										children: level.index
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-3 font-display text-card-title text-foreground",
										children: level.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-body-sm text-foreground-muted",
										children: level.body
									})
								]
							}, level.index))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "border-t border-border bg-surface-muted/50",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-16",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShowcaseCredential, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-label uppercase text-accent",
									children: "The result"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-3 max-w-md font-display text-section-title text-foreground md:text-page-title",
									children: "A document, not a toast."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 max-w-md text-body text-foreground-muted",
									children: "The outcome of a verification is an artifact you can read, keep and produce later: who was verified, by whose authority, under which credential, and exactly how far the certainty went."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 max-w-md text-body-sm text-foreground-subtle",
									children: "Every field is rendered from the verification response. The interface never invents authenticity of its own."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/app",
									className: "mt-8 inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-strong px-5 py-2.5 text-body-sm font-semibold text-foreground transition-colors hover:bg-muted",
									children: ["Open the demo app", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
										className: "size-4",
										"aria-hidden": "true"
									})]
								})
							]
						})]
					})
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketingFooter, {})
		]
	});
}
function HeroStat({ term, detail }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-label uppercase text-foreground-subtle",
			children: term
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 font-display text-body-sm font-semibold text-foreground",
			children: detail
		})]
	});
}
function ShowcaseCredential() {
	const credential = useQuery(verificationQueries.demoCredential());
	if (credential.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		"aria-label": "Loading demo credential",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-40" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "aspect-[5/6] w-20 rounded-md" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-3/4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-1/2" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-3 w-2/3" })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-full" })
		]
	});
	if (credential.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-body-sm text-foreground-muted",
		children: "The demo credential could not be loaded."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CredentialReveal, {
		credential: credential.data,
		status: "verified",
		className: "min-w-0"
	});
}
//#endregion
export { LandingPage as component };
