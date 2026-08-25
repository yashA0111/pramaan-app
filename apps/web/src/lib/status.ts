import {
  BadgeCheck,
  Ban,
  CloudOff,
  FileCheck2,
  CalendarX2,
  Circle,
  CircleDashed,
  Clock3,
  FileX2,
  Hourglass,
  Radar,
  ScanFace,
  ScanLine,
  ShieldCheck,
  ShieldQuestion,
  TimerOff,
  TriangleAlert,
  UserX2,
  Users,
  WifiOff,
  XOctagon,
  type LucideIcon,
} from "lucide-react";

import type { StageState, VerificationStatus } from "@/types/verification";

/**
 * Status vocabulary — the single place where verification states map to
 * label, tone, and icon. Color alone is never the only signal: every status
 * ships a label and an icon.
 */

export type StatusTone = "neutral" | "active" | "success" | "warning" | "danger" | "info";

export interface StatusDescriptor {
  label: string;
  tone: StatusTone;
  icon: LucideIcon;
}

export const VERIFICATION_STATUS: Record<VerificationStatus, StatusDescriptor> = {
  idle: { label: "Idle", tone: "neutral", icon: Circle },
  ready: { label: "Ready", tone: "neutral", icon: CircleDashed },
  loading: { label: "Loading", tone: "active", icon: Hourglass },
  scanning: { label: "Scanning", tone: "active", icon: ScanLine },
  processing: { label: "Processing", tone: "active", icon: Radar },
  pending: { label: "Pending response", tone: "warning", icon: Clock3 },
  qr_decoded: { label: "QR decoded", tone: "active", icon: ScanLine },
  credential_valid: { label: "Credential valid", tone: "success", icon: FileCheck2 },
  identity_matched: { label: "Identity matched", tone: "success", icon: ScanFace },
  official_confirmed: { label: "Officially confirmed", tone: "success", icon: BadgeCheck },
  final_verified: { label: "Final verified", tone: "success", icon: ShieldCheck },
  unavailable: { label: "Service unavailable", tone: "warning", icon: CloudOff },
  verified: { label: "Verified", tone: "success", icon: ShieldCheck },
  rejected: { label: "Rejected", tone: "danger", icon: XOctagon },
  mismatch: { label: "Identity mismatch", tone: "danger", icon: UserX2 },
  expired: { label: "Expired", tone: "warning", icon: CalendarX2 },
  revoked: { label: "Revoked", tone: "danger", icon: Ban },
  invalid: { label: "Invalid credential", tone: "danger", icon: FileX2 },
  no_face: { label: "No face detected", tone: "warning", icon: ScanFace },
  multiple_faces: { label: "Multiple faces", tone: "warning", icon: Users },
  requires_review: { label: "Needs review", tone: "info", icon: ShieldQuestion },
  timeout: { label: "Timed out", tone: "warning", icon: TimerOff },
  offline: { label: "Offline", tone: "neutral", icon: WifiOff },
  error: { label: "Something went wrong", tone: "danger", icon: TriangleAlert },
};

export const STAGE_STATE: Record<StageState, { label: string; tone: StatusTone }> = {
  pending: { label: "Pending", tone: "neutral" },
  current: { label: "In progress", tone: "active" },
  success: { label: "Complete", tone: "success" },
  failure: { label: "Failed", tone: "danger" },
  warning: { label: "Attention", tone: "warning" },
  skipped: { label: "Skipped", tone: "neutral" },
};

/** Tailwind class sets per tone — centralized so status color is never ad hoc. */
export const TONE_CLASSES: Record<
  StatusTone,
  { badge: string; icon: string; dot: string; ring: string }
> = {
  neutral: {
    badge: "bg-muted text-muted-foreground border-border",
    icon: "text-muted-foreground",
    dot: "bg-foreground-subtle",
    ring: "border-border-strong",
  },
  active: {
    badge: "bg-accent-soft text-accent-soft-foreground border-accent/25",
    icon: "text-accent",
    dot: "bg-accent",
    ring: "border-accent",
  },
  success: {
    badge: "bg-success-soft text-success-soft-foreground border-success/25",
    icon: "text-success",
    dot: "bg-success",
    ring: "border-success",
  },
  warning: {
    badge: "bg-warning-soft text-warning-soft-foreground border-warning/25",
    icon: "text-warning",
    dot: "bg-warning",
    ring: "border-warning",
  },
  danger: {
    badge: "bg-danger-soft text-danger-soft-foreground border-danger/25",
    icon: "text-danger",
    dot: "bg-danger",
    ring: "border-danger",
  },
  info: {
    badge: "bg-info-soft text-info-soft-foreground border-info/25",
    icon: "text-info",
    dot: "bg-info",
    ring: "border-info",
  },
};
