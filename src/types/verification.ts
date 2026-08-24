/**
 * Pramaan verification view models.
 *
 * These types are the contract between the (currently mocked) backend and
 * the presentation layer. Components consume these models only — they never
 * derive verification truth themselves.
 */

/** The canonical verification pipeline. Order is meaningful. */
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

/**
 * Full lifecycle vocabulary. Never collapse these into one generic state.
 * QR_DECODED ≠ CREDENTIAL_VALID ≠ IDENTITY_MATCHED ≠ OFFICIAL_CONFIRMED ≠ FINAL_VERIFIED
 */
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

export type CredentialRegistryStatus = "active" | "expired" | "revoked" | "unknown";

export interface IssuerSummary {
  /** Display name of the issuing authority, e.g. a police directorate. */
  name: string;
  /** Governing body above the issuer, shown for provenance. */
  authority: string;
  /** Demo registry marker — keeps the UI honest about synthetic data. */
  registry: "demo";
}

export interface CredentialSummary {
  credentialId: string;
  fullName: string;
  designation: string;
  department: string;
  posting: string;
  photoUrl: string;
  photoAlt: string;
  issuedOn: string; // ISO date
  validUntil: string; // ISO date
  issuer: IssuerSummary;
  registryStatus: CredentialRegistryStatus;
  /** Always true in this build — no real government data exists here. */
  synthetic: true;
}

export interface VerificationStepModel {
  id: VerificationStage;
  label: string;
  state: StageState;
  /** Short human detail, e.g. "Issuer signature valid". */
  detail?: string;
}

export interface VerificationProgressViewModel {
  sessionId: string;
  steps: VerificationStepModel[];
}

export type TrustLevel = "officially_confirmed" | "verified" | "provisional" | "unverified";

export interface TrustSignalViewModel {
  level: TrustLevel;
  label: string;
  detail: string;
}

export interface VerificationCheck {
  id: string;
  label: string;
  state: StageState;
  detail?: string;
}

export interface CredentialVerificationViewModel {
  status: VerificationStatus;
  credential: CredentialSummary | null;
  checks: VerificationCheck[];
  sessionId: string;
  /** ISO timestamp — sessions expire, and the UI must show that. */
  expiresAt: string;
  /** Honest limitation, e.g. "Face match not performed". */
  limitation?: string;
}

/** Compact record for the home screen "recent verification" slot. */
export interface RecentVerificationSummary {
  sessionId: string;
  subjectName: string;
  subjectDesignation: string;
  outcome: VerificationStatus;
  occurredAt: string; // ISO
  method: "qr" | "qr_face" | "qr_official";
}

export type QrDecodeOutcome = "decoded" | "invalid" | "unrecognized";

export type FaceMatchOutcome =
  | "match"
  | "mismatch"
  | "no_face"
  | "multiple_faces"
  | "requires_review"
  | "unavailable"
  | "timeout"
  | "error";

export type FaceMatchUiState =
  | "READY"
  | "CAMERA_INITIALIZING"
  | "DETECTING"
  | "MULTIPLE_FACES"
  | "NO_FACE"
  | "MATCHING"
  | "MATCH"
  | "MISMATCH"
  | "REVIEW_REQUIRED"
  | "TIMEOUT"
  | "OFFLINE"
  | "ERROR";

export type OfficialConfirmationStatus =
  | "not_required"
  | "not_requested"
  | "request_sent"
  | "pending"
  | "accepted"
  | "rejected"
  | "expired"
  | "timeout";

export type VerificationMethodId =
  | "credential_validation"
  | "issuer_validation"
  | "status_validation"
  | "identity_match"
  | "official_confirmation";

export type ScannerUiState =
  | "permission_required"
  | "permission_denied"
  | "camera_unavailable"
  | "ready"
  | "scanning"
  | "decoded"
  | "invalid_qr"
  | "unrecognized_qr"
  | "offline"
  | "unavailable"
  | "error";

export interface QrScanRecord {
  payload: string;
  outcome: QrDecodeOutcome;
  decodedAt: string;
}

export interface IdentityMatchViewModel {
  uiState: FaceMatchUiState;
  outcome: FaceMatchOutcome | null;
  comparedAt: string | null;
  /** Honest caption — never a fake certainty percentage. */
  summary: string | null;
  limitation: string | null;
}

export interface OfficialConfirmationViewModel {
  status: OfficialConfirmationStatus;
  requestId: string | null;
  requestedAt: string | null;
  resolvedAt: string | null;
  expiresAt: string | null;
  note: string | null;
}

export interface SessionError {
  kind: "network" | "timeout" | "unavailable" | "session_expired" | "offline" | "error";
  message: string;
}

/**
 * Authoritative verification session. The UI renders this model;
 * it never infers a later trust level from an earlier stage.
 */
export interface VerificationSessionViewModel {
  sessionId: string;
  credentialRef: string | null;
  credential: CredentialSummary | null;
  currentStage: VerificationStage;
  createdAt: string;
  expiresAt: string;
  result: VerificationStatus;
  error: SessionError | null;
  progress: VerificationProgressViewModel;
  qr: QrScanRecord | null;
  checks: VerificationCheck[];
  identityMatch: IdentityMatchViewModel;
  officialConfirmation: OfficialConfirmationViewModel;
  methods: VerificationMethodId[];
  limitation: string | null;
  receiptIssued: boolean;
}

export interface TrustReceiptViewModel {
  sessionId: string;
  issuedAt: string;
  result: VerificationStatus;
  subjectName: string | null;
  designation: string | null;
  issuerName: string | null;
  issuerAuthority: string | null;
  credentialId: string | null;
  methods: Array<{
    id: VerificationMethodId;
    label: string;
    state: StageState;
    detail: string;
  }>;
  limitation: string;
  synthetic: true;
}

export interface VerificationHistoryItem {
  sessionId: string;
  occurredAt: string;
  displayName: string | null;
  designation: string | null;
  outcome: VerificationStatus;
  methodsSummary: string;
}
