import { queryOptions } from "@tanstack/react-query";

import { mockRequest } from "@/lib/api/client";
import type {
  CredentialSummary,
  RecentVerificationSummary,
  VerificationProgressViewModel,
} from "@/types/verification";

import personaArjunMehta from "@/assets/persona-arjun-mehta.jpg";

/**
 * Synthetic demo registry. All identities are fictional and internally
 * consistent; no real government data exists anywhere in this build.
 */

export const DEMO_CREDENTIAL: CredentialSummary = {
  credentialId: "PRM-DL-2024-018457",
  fullName: "Arjun Mehta",
  designation: "Sub-Inspector",
  department: "Delhi Police · Crime Branch",
  posting: "District Unit III, New Delhi",
  photoUrl: personaArjunMehta,
  photoAlt: "Illustrated portrait of the credential holder (synthetic demo identity)",
  issuedOn: "2024-03-11",
  validUntil: "2027-03-10",
  issuer: {
    name: "Directorate of Coordination, Police Wireless",
    authority: "Ministry of Home Affairs (demo registry)",
    registry: "demo",
  },
  registryStatus: "active",
  synthetic: true,
};

const DEMO_RECENT_VERIFICATION: RecentVerificationSummary = {
  sessionId: "ses_9F42KDL1",
  subjectName: DEMO_CREDENTIAL.fullName,
  subjectDesignation: DEMO_CREDENTIAL.designation,
  outcome: "verified",
  occurredAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  method: "qr_face",
};

/**
 * A mid-flight pipeline snapshot used by the home screen and showcase:
 * scan→status have succeeded, identity match is current, confirmation and
 * receipt are still pending. Later stages never claim success early.
 */
export const DEMO_PROGRESS: VerificationProgressViewModel = {
  sessionId: "ses_9F42KDL1",
  steps: [
    { id: "scan", label: "Scan", state: "success", detail: "QR payload decoded" },
    { id: "validate", label: "Validate", state: "success", detail: "Signature well-formed" },
    { id: "resolve", label: "Resolve", state: "success", detail: "Credential located in registry" },
    { id: "issuer", label: "Issuer", state: "success", detail: "Issuing authority recognized" },
    { id: "status", label: "Status", state: "success", detail: "Active · not revoked" },
    { id: "match", label: "Match", state: "current", detail: "Comparing presented identity" },
    { id: "confirm", label: "Confirm", state: "pending", detail: "Official confirmation if needed" },
    { id: "receipt", label: "Receipt", state: "pending" },
  ],
};

const latency = { latencyMs: 600 };

export function getDemoCredential() {
  return mockRequest(() => DEMO_CREDENTIAL, latency);
}

export function getRecentVerification() {
  return mockRequest(() => DEMO_RECENT_VERIFICATION, latency);
}

export function getSessionProgress() {
  return mockRequest(() => DEMO_PROGRESS, latency);
}

export const verificationQueries = {
  demoCredential: () =>
    queryOptions({ queryKey: ["verification", "demo-credential"], queryFn: getDemoCredential }),
  recent: () =>
    queryOptions({ queryKey: ["verification", "recent"], queryFn: getRecentVerification }),
  progress: () =>
    queryOptions({ queryKey: ["verification", "progress"], queryFn: getSessionProgress }),
};
