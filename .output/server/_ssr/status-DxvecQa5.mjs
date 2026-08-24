import { D as Circle, E as Clock3, M as Ban, O as CircleDashed, S as Hourglass, a as TriangleAlert, c as ShieldQuestionMark, d as ScanFace, i as UserRoundX, j as CalendarX2, l as ShieldCheck, m as OctagonX, n as WifiOff, o as TimerOff, p as Radar, r as Users, u as ScanLine, w as FileXCorner } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-DxvecQa5.js
var VERIFICATION_STATUS = {
	idle: {
		label: "Idle",
		tone: "neutral",
		icon: Circle
	},
	ready: {
		label: "Ready",
		tone: "neutral",
		icon: CircleDashed
	},
	loading: {
		label: "Loading",
		tone: "active",
		icon: Hourglass
	},
	scanning: {
		label: "Scanning",
		tone: "active",
		icon: ScanLine
	},
	processing: {
		label: "Processing",
		tone: "active",
		icon: Radar
	},
	pending: {
		label: "Pending response",
		tone: "warning",
		icon: Clock3
	},
	verified: {
		label: "Verified",
		tone: "success",
		icon: ShieldCheck
	},
	rejected: {
		label: "Rejected",
		tone: "danger",
		icon: OctagonX
	},
	mismatch: {
		label: "Identity mismatch",
		tone: "danger",
		icon: UserRoundX
	},
	expired: {
		label: "Expired",
		tone: "warning",
		icon: CalendarX2
	},
	revoked: {
		label: "Revoked",
		tone: "danger",
		icon: Ban
	},
	invalid: {
		label: "Invalid credential",
		tone: "danger",
		icon: FileXCorner
	},
	no_face: {
		label: "No face detected",
		tone: "warning",
		icon: ScanFace
	},
	multiple_faces: {
		label: "Multiple faces",
		tone: "warning",
		icon: Users
	},
	requires_review: {
		label: "Needs review",
		tone: "info",
		icon: ShieldQuestionMark
	},
	timeout: {
		label: "Timed out",
		tone: "warning",
		icon: TimerOff
	},
	offline: {
		label: "Offline",
		tone: "neutral",
		icon: WifiOff
	},
	error: {
		label: "Something went wrong",
		tone: "danger",
		icon: TriangleAlert
	}
};
var STAGE_STATE = {
	pending: {
		label: "Pending",
		tone: "neutral"
	},
	current: {
		label: "In progress",
		tone: "active"
	},
	success: {
		label: "Complete",
		tone: "success"
	},
	failure: {
		label: "Failed",
		tone: "danger"
	},
	warning: {
		label: "Attention",
		tone: "warning"
	},
	skipped: {
		label: "Skipped",
		tone: "neutral"
	}
};
/** Tailwind class sets per tone — centralized so status color is never ad hoc. */
var TONE_CLASSES = {
	neutral: {
		badge: "bg-muted text-muted-foreground border-border",
		icon: "text-muted-foreground",
		dot: "bg-foreground-subtle",
		ring: "border-border-strong"
	},
	active: {
		badge: "bg-accent-soft text-accent-soft-foreground border-accent/25",
		icon: "text-accent",
		dot: "bg-accent",
		ring: "border-accent"
	},
	success: {
		badge: "bg-success-soft text-success-soft-foreground border-success/25",
		icon: "text-success",
		dot: "bg-success",
		ring: "border-success"
	},
	warning: {
		badge: "bg-warning-soft text-warning-soft-foreground border-warning/25",
		icon: "text-warning",
		dot: "bg-warning",
		ring: "border-warning"
	},
	danger: {
		badge: "bg-danger-soft text-danger-soft-foreground border-danger/25",
		icon: "text-danger",
		dot: "bg-danger",
		ring: "border-danger"
	},
	info: {
		badge: "bg-info-soft text-info-soft-foreground border-info/25",
		icon: "text-info",
		dot: "bg-info",
		ring: "border-info"
	}
};
//#endregion
export { TONE_CLASSES as n, VERIFICATION_STATUS as r, STAGE_STATE as t };
