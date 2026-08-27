/**
 * Phase B — citizen verification session contract.
 *
 * These types describe the state machine that the (currently mocked)
 * verification service owns. The UI renders these models; it never derives
 * verification truth. In particular the trust ladder is explicit:
 *
 *   QR_DECODED ≠ CREDENTIAL_VALID ≠ IDENTITY_MATCHED
 *              ≠ OFFICIAL_CONFIRMED ≠ FINAL_VERIFIED
 */

import type {
  CredentialSummary,
  VerificationCheck,
  VerificationStage,
  VerificationStatus,
  VerificationStepModel,
} from "./verification";

/* ------------------------------------------------------------------ camera */

export type CameraState =
  | "idle"
  | "requesting_permission"
  | "permission_denied"
  | "camera_unavailable"
  | "camera_ready"
  | "scanning";

/* ---------------------------------------------------------------------- QR */

export type QrOutcome =
  | "qr_decoded"
  | "invalid_qr"
  | "unrecognized_qr"
  | "expired_reference"
  | "offline"
  | "service_unavailable";

export interface QrScanResult {
  outcome: QrOutcome;
  /** Present only when outcome === "qr_decoded". */
  credentialReference: string | null;
  /** Raw decoded payload, kept for diagnostics only. */
  rawValue: string | null;
  /** Human explanation for the non-decoded outcomes. */
  message: string;
  /** True when the reference came from the labelled demo fallback. */
  demo: boolean;
  scannedAt: string;
}

/* ---------------------------------------------------- credential + identity */

export type CredentialOutcome =
  | "unknown"
  | "valid"
  | "invalid"
  | "expired"
  | "revoked"
  | "unavailable";

export type FaceState =
  | "ready"
  | "camera_initializing"
  | "detecting"
  | "no_face"
  | "multiple_faces"
  | "matching"
  | "match"
  | "mismatch"
  | "requires_review"
  | "timeout"
  | "offline"
  | "error";

export type IdentityMatchResult = "match" | "mismatch" | "inconclusive" | "not_performed";

/** Structured response shape a real biometric service will eventually return. */
export interface IdentityVerificationResult {
  status: FaceState;
  matchResult: IdentityMatchResult;
  /** 0–1, or null when the service could not produce a score. */
  confidence: number | null;
  modelVersion: string;
  timestamp: string;
  reason: string;
}

export interface IdentityVerificationInput {
  /** Frames observed by the client, used by the mock to simulate detection. */
  observation: "single_face" | "no_face" | "multiple_faces";
  /** Client-side capture quality hint, 0–1. */
  quality?: number | undefined;
  /** Captured live video frame as base64 JPEG data URL */
  capturedFrameBase64?: string | undefined;
}

/* ------------------------------------------------- official confirmation */

export type ConfirmationState =
  | "request_ready"
  | "request_sent"
  | "pending"
  | "accepted"
  | "rejected"
  | "expired"
  | "timeout"
  | "failed";

/**
 * The subset of confirmation states an official desk can *settle* on.
 * `request_ready`, `request_sent` and `pending` are in-flight states owned by
 * the session, never a scenario's declared outcome.
 */
export type ConfirmationResolution = Extract<
  ConfirmationState,
  "accepted" | "rejected" | "expired" | "timeout" | "failed"
>;

export interface OfficialConfirmation {
  state: ConfirmationState;
  /** Which desk the request was routed to (synthetic). */
  routedTo: string | null;
  requestedAt: string | null;
  respondedAt: string | null;
  reason: string | null;
}

/* -------------------------------------------------------- session machine */

export type SessionState =
  | "created"
  | "validating"
  | "credential_resolved"
  | "credential_failed"
  | "identity_pending"
  | "identity_resolved"
  | "identity_failed"
  | "confirmation_pending"
  | "confirmation_resolved"
  | "confirmation_failed"
  | "final_verified"
  | "service_unavailable"
  | "session_expired";

export interface SessionError {
  kind: "offline" | "service_unavailable" | "session_expired" | "unexpected";
  message: string;
}

/** The one source of truth for a verification in flight. */
export interface VerificationSession {
  sessionId: string;
  credentialReference: string;
  /** True when the reference came from the demo fallback path. */
  demo: boolean;
  currentStage: VerificationStage;
  state: SessionState;
  createdAt: string;
  expiresAt: string;
  error: SessionError | null;

  /** Credential leg. */
  credentialOutcome: CredentialOutcome;
  credentialStatus: VerificationStatus;
  credential: CredentialSummary | null;
  checks: VerificationCheck[];

  /** Identity leg. */
  identity: IdentityVerificationResult | null;

  /** Authority leg. */
  confirmation: OfficialConfirmation;

  /** Pipeline projection for VerificationProgress. */
  steps: VerificationStepModel[];

  /** Honest demo limitations, always rendered on the receipt. */
  limitations: string[];
}

export type VerificationMethodId =
  | "credential_validation"
  | "issuer_validation"
  | "status_validation"
  | "identity_match"
  | "official_confirmation";

export interface VerificationMethodResult {
  id: VerificationMethodId;
  label: string;
  /** What this method actually established — never overstated. */
  outcome: "passed" | "failed" | "inconclusive" | "not_performed";
  detail: string;
}

export type FinalTrustState =
  | "final_verified"
  | "identity_matched_only"
  | "credential_valid_only"
  | "not_verified";

export interface TrustReceiptViewModel {
  receiptId?: string;
  receiptHash?: string;
  signature?: string;
  signingKeyId?: string;
  signingAlgorithm?: string;
  sessionId: string;
  credentialReference: string;
  subject: CredentialSummary | null;
  finalState: FinalTrustState;
  headline: string;
  summary: string;
  status: VerificationStatus;
  methods: VerificationMethodResult[];
  occurredAt: string;
  limitations: string[];
  demo: boolean;
}
