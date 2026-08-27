import { CredentialSummary } from "../credentials/credential.types";
import { FaceState, IdentityMatchResult } from "../identity/identity.types";
import { ConfirmationState } from "../confirmation/confirmation.types";

export const VERIFICATION_STAGES = [
  "scan",
  "validate",
  "resolve",
  "issuer",
  "status",
  "match",
  "confirm",
  "receipt",
] as const;

export type VerificationStage = (typeof VERIFICATION_STAGES)[number];
export type StageState = "pending" | "current" | "success" | "failure" | "warning" | "skipped";

export type VerificationStatus =
  | "idle"
  | "ready"
  | "loading"
  | "scanning"
  | "processing"
  | "pending"
  | "qr_decoded"
  | "credential_valid"
  | "identity_matched"
  | "official_confirmed"
  | "final_verified"
  | "verified"
  | "rejected"
  | "mismatch"
  | "expired"
  | "revoked"
  | "invalid"
  | "unavailable"
  | "no_face"
  | "multiple_faces"
  | "requires_review"
  | "timeout"
  | "offline"
  | "error";

export interface VerificationCheck {
  id: string;
  label: string;
  state: StageState;
  detail?: string;
}

export interface VerificationStepModel {
  id: VerificationStage;
  label: string;
  state: StageState;
  detail?: string;
}

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

export interface IdentityVerificationResult {
  status: FaceState;
  matchResult: IdentityMatchResult;
  confidence: number | null;
  modelVersion: string;
  timestamp: string;
  reason: string;
}

export interface OfficialConfirmation {
  state: ConfirmationState;
  routedTo: string | null;
  requestedAt: string | null;
  respondedAt: string | null;
  reason: string | null;
}

export interface VerificationSession {
  sessionId: string;
  credentialReference: string;
  demo: boolean;
  currentStage: VerificationStage;
  state: SessionState;
  createdAt: string;
  expiresAt: string;
  error: SessionError | null;
  credentialOutcome: string;
  credentialStatus: VerificationStatus;
  credential: CredentialSummary | null;
  checks: VerificationCheck[];
  identity: IdentityVerificationResult | null;
  confirmation: OfficialConfirmation;
  steps: VerificationStepModel[];
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

export interface RecentVerificationSummary {
  sessionId: string;
  subjectName: string;
  subjectDesignation: string;
  outcome: VerificationStatus;
  occurredAt: string;
  method: "qr" | "qr_face" | "qr_official";
}

export interface QrScanResult {
  outcome:
    | "qr_decoded"
    | "invalid_qr"
    | "unrecognized_qr"
    | "expired_reference"
    | "offline"
    | "service_unavailable";
  credentialReference: string | null;
  rawValue: string | null;
  message: string;
  demo: boolean;
  scannedAt: string;
  /**
   * Diagnostic discriminant indicating the QR format that was scanned.
   * - permanent_credential: pramaan://credential/<ref> — printed on physical ID cards, stable
   * - ephemeral_presentation: pramaan://verify/v1/<token> — server-generated, short-lived
   * - legacy_reference: pramaan://verify/<ref> or bare ref — legacy/dev path
   */
  qrFormat?: "permanent_credential" | "ephemeral_presentation" | "legacy_reference";
}
