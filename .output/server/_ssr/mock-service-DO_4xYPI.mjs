import { t as cn } from "./utils-C_uf36nf.mjs";
import { a as require_jsx_runtime, t as queryOptions } from "../_libs/react+tanstack__react-query.mjs";
import { n as TONE_CLASSES, r as VERIFICATION_STATUS } from "./status-DxvecQa5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/mock-service-DO_4xYPI.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Pill badge for any verification lifecycle state. Label + icon + tone —
* color is never the only signal.
*/
function CredentialStatusBadge({ status, className }) {
	const descriptor = VERIFICATION_STATUS[status];
	const tone = TONE_CLASSES[descriptor.tone];
	const Icon = descriptor.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		role: "status",
		"aria-label": `Status: ${descriptor.label}`,
		className: cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label uppercase", tone.badge, className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-3.5",
			"aria-hidden": "true",
			strokeWidth: 2.25
		}), descriptor.label]
	});
}
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-md bg-primary/10", className),
		...props
	});
}
var ApiError = class extends Error {
	kind;
	constructor(kind, message) {
		super(message);
		this.name = "ApiError";
		this.kind = kind;
	}
};
function jitteredLatency() {
	return 350 + Math.floor(Math.random() * 550);
}
function mockRequest(produce, options = {}) {
	const latency = options.latencyMs ?? jitteredLatency();
	return new Promise((resolve, reject) => {
		if (options.signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}
		const timer = setTimeout(() => {
			cleanup();
			if (options.failWith) {
				reject(new ApiError(options.failWith, `Mock request failed: ${options.failWith}`));
				return;
			}
			resolve(produce());
		}, latency);
		const onAbort = () => {
			clearTimeout(timer);
			cleanup();
			reject(new DOMException("Aborted", "AbortError"));
		};
		const cleanup = () => {
			options.signal?.removeEventListener("abort", onAbort);
		};
		options.signal?.addEventListener("abort", onAbort);
	});
}
/**
* Synthetic demo registry. All identities are fictional and internally
* consistent; no real government data exists anywhere in this build.
*/
var DEMO_CREDENTIAL = {
	credentialId: "PRM-DL-2024-018457",
	fullName: "Arjun Mehta",
	designation: "Sub-Inspector",
	department: "Delhi Police · Crime Branch",
	posting: "District Unit III, New Delhi",
	photoUrl: "/assets/persona-arjun-mehta-BqF--Zin.jpg",
	photoAlt: "Illustrated portrait of the credential holder (synthetic demo identity)",
	issuedOn: "2024-03-11",
	validUntil: "2027-03-10",
	issuer: {
		name: "Directorate of Coordination, Police Wireless",
		authority: "Ministry of Home Affairs (demo registry)",
		registry: "demo"
	},
	registryStatus: "active",
	synthetic: true
};
var DEMO_RECENT_VERIFICATION = {
	sessionId: "ses_9F42KDL1",
	subjectName: DEMO_CREDENTIAL.fullName,
	subjectDesignation: DEMO_CREDENTIAL.designation,
	outcome: "verified",
	occurredAt: (/* @__PURE__ */ new Date(Date.now() - 252e4)).toISOString(),
	method: "qr_face"
};
/**
* A mid-flight pipeline snapshot used by the home screen and showcase:
* scan→status have succeeded, identity match is current, confirmation and
* receipt are still pending. Later stages never claim success early.
*/
var DEMO_PROGRESS = {
	sessionId: "ses_9F42KDL1",
	steps: [
		{
			id: "scan",
			label: "Scan",
			state: "success",
			detail: "QR payload decoded"
		},
		{
			id: "validate",
			label: "Validate",
			state: "success",
			detail: "Signature well-formed"
		},
		{
			id: "resolve",
			label: "Resolve",
			state: "success",
			detail: "Credential located in registry"
		},
		{
			id: "issuer",
			label: "Issuer",
			state: "success",
			detail: "Issuing authority recognized"
		},
		{
			id: "status",
			label: "Status",
			state: "success",
			detail: "Active · not revoked"
		},
		{
			id: "match",
			label: "Match",
			state: "current",
			detail: "Comparing presented identity"
		},
		{
			id: "confirm",
			label: "Confirm",
			state: "pending",
			detail: "Official confirmation if needed"
		},
		{
			id: "receipt",
			label: "Receipt",
			state: "pending"
		}
	]
};
var latency = { latencyMs: 600 };
function getDemoCredential() {
	return mockRequest(() => DEMO_CREDENTIAL, latency);
}
function getRecentVerification() {
	return mockRequest(() => DEMO_RECENT_VERIFICATION, latency);
}
function getSessionProgress() {
	return mockRequest(() => DEMO_PROGRESS, latency);
}
var verificationQueries = {
	demoCredential: () => queryOptions({
		queryKey: ["verification", "demo-credential"],
		queryFn: getDemoCredential
	}),
	recent: () => queryOptions({
		queryKey: ["verification", "recent"],
		queryFn: getRecentVerification
	}),
	progress: () => queryOptions({
		queryKey: ["verification", "progress"],
		queryFn: getSessionProgress
	})
};
//#endregion
export { verificationQueries as i, DEMO_PROGRESS as n, Skeleton as r, CredentialStatusBadge as t };
