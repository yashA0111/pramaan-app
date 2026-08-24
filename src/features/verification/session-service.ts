/**
 * Verification session service (mock implementation of the eventual backend).
 *
 * Everything that decides verification truth lives here. The UI calls these
 * functions, receives typed view models, and renders exactly what it is told.
 *
 * The session is the single state machine for the Phase-B journey:
 *   SCAN → VALIDATE → RESOLVE → ISSUER → STATUS → MATCH → CONFIRM → RECEIPT
 */

import { queryOptions } from "@tanstack/react-query";

import { ApiError, mockRequest } from "@/lib/api/client";
import type {
  RecentVerificationSummary,
  VerificationCheck,
  VerificationStage,
  VerificationStatus,
  VerificationStepModel,
} from "@/types/verification";
import type {
  CredentialOutcome,
  IdentityVerificationInput,
  IdentityVerificationResult,
  QrScanResult,
  TrustReceiptViewModel,
  VerificationMethodResult,
  VerificationSession,
} from "@/types/verification-session";

import { findScenario, type DemoScenario } from "./demo-registry";
import { parseQrPayload } from "./qr";

const MODEL_VERSION = "pramaan-face-mock-0.3.1";
const SESSION_TTL_MS = 10 * 60 * 1000;

const STAGE_LABELS: Record<VerificationStage, string> = {
  scan: "Scan",
  validate: "Validate",
  resolve: "Resolve",
  issuer: "Issuer",
  status: "Status",
  match: "Match",
  confirm: "Confirm",
  receipt: "Receipt",
};

const CREDENTIAL_STAGES = ["validate", "resolve", "issuer", "status"] as const;
export type CredentialStage = (typeof CREDENTIAL_STAGES)[number];

/* -------------------------------------------------------------- store */

const sessions = new Map<string, VerificationSession>();
const completed: RecentVerificationSummary[] = [];

function newSessionId(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ses_${suffix}`;
}

function clone(session: VerificationSession): VerificationSession {
  return structuredClone(session);
}

function isExpired(session: VerificationSession): boolean {
  return Date.now() > new Date(session.expiresAt).getTime();
}

/* ------------------------------------------------------------ QR intake */

export interface DecodeQrOptions {
  demo?: boolean;
  offline?: boolean;
  latencyMs?: number;
}

/** Resolves a raw QR payload into a structured, typed scan result. */
export function decodeQr(raw: string, options: DecodeQrOptions = {}): Promise<QrScanResult> {
  return mockRequest(
    () => {
      const scannedAt = new Date().toISOString();
      const base = { rawValue: raw, demo: options.demo ?? false, scannedAt };

      if (options.offline) {
        return {
          ...base,
          outcome: "offline" as const,
          credentialReference: null,
          message: "You appear to be offline. Pramaan could not reach the registry.",
        };
      }

      const parsed = parseQrPayload(raw);
      if (parsed.kind === "unrecognized") {
        return {
          ...base,
          outcome: "unrecognized_qr" as const,
          credentialReference: null,
          message: "That QR code was read, but it is not a Pramaan credential.",
        };
      }
      if (parsed.kind === "invalid") {
        return {
          ...base,
          outcome: "invalid_qr" as const,
          credentialReference: null,
          message: "This looks like a Pramaan code, but the reference is malformed.",
        };
      }

      const scenario = findScenario(parsed.reference);
      if (!scenario) {
        return {
          ...base,
          outcome: "expired_reference" as const,
          credentialReference: parsed.reference,
          message: "This reference is no longer active in the demo registry.",
        };
      }
      if (scenario.serviceFailure) {
        return {
          ...base,
          outcome: "service_unavailable" as const,
          credentialReference: parsed.reference,
          message: "The verification service did not respond. Nothing has been verified.",
        };
      }

      return {
        ...base,
        outcome: "qr_decoded" as const,
        credentialReference: parsed.reference,
        message: "Credential reference decoded. Nothing is verified yet.",
      };
    },
    { latencyMs: options.latencyMs ?? 450 },
  );
}

/* ------------------------------------------------------ session creation */

export function createSession(
  credentialReference: string,
  options: { demo?: boolean } = {},
): Promise<VerificationSession> {
  return mockRequest(
    () => {
      const now = Date.now();
      const session: VerificationSession = {
        sessionId: newSessionId(),
        credentialReference: credentialReference.toUpperCase(),
        demo: options.demo ?? false,
        currentStage: "validate",
        state: "validating",
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
        error: null,
        credentialOutcome: "unknown",
        credentialStatus: "processing",
        credential: null,
        checks: [],
        identity: null,
        confirmation: {
          state: "request_ready",
          routedTo: null,
          requestedAt: null,
          respondedAt: null,
          reason: null,
        },
        steps: [],
        limitations: [
          "Synthetic demo registry — no real government system was contacted.",
          "Identity matching runs against a mocked biometric service.",
        ],
      };
      session.steps = projectSteps(session);
      sessions.set(session.sessionId, session);
      return clone(session);
    },
    { latencyMs: 350 },
  );
}

export function getSession(sessionId: string): Promise<VerificationSession> {
  return mockRequest(
    () => {
      const session = sessions.get(sessionId);
      if (!session) throw new ApiError("session_expired", "This verification session no longer exists.");
      if (isExpired(session) && session.state !== "final_verified") {
        session.state = "session_expired";
        session.error = { kind: "session_expired", message: "This session expired. Start a new verification." };
        session.steps = projectSteps(session);
      }
      return clone(session);
    },
    { latencyMs: 220 },
  );
}

function require_(sessionId: string): VerificationSession {
  const session = sessions.get(sessionId);
  if (!session) throw new ApiError("session_expired", "This verification session no longer exists.");
  if (isExpired(session)) {
    session.state = "session_expired";
    session.error = { kind: "session_expired", message: "This session expired. Start a new verification." };
    session.steps = projectSteps(session);
  }
  return session;
}

/* -------------------------------------------------- credential pipeline */

/**
 * Advances the credential leg by exactly one stage so the UI can show real
 * progression. Returns the session snapshot after that stage.
 */
export function advanceCredentialStage(sessionId: string): Promise<VerificationSession> {
  return mockRequest(
    () => {
      const session = require_(sessionId);
      if (session.state === "session_expired") return clone(session);

      const scenario = findScenario(session.credentialReference);
      if (!scenario) {
        return fail(session, "unavailable", "validate", "Reference not present in the registry.");
      }
      if (scenario.serviceFailure) {
        session.state = "service_unavailable";
        session.credentialOutcome = "unavailable";
        session.credentialStatus = "error";
        session.error = {
          kind: "service_unavailable",
          message: "The verification service is unavailable. No conclusion can be drawn.",
        };
        session.currentStage = "validate";
        session.steps = projectSteps(session);
        return clone(session);
      }

      const next = nextCredentialStage(session);
      if (!next) return clone(session);

      switch (next) {
        case "validate":
          if (scenario.credentialOutcome === "invalid") {
            return fail(session, "invalid", "validate", "Credential signature failed validation.");
          }
          pass(session, "validate", "Signature well-formed and verifiable.");
          break;
        case "resolve":
          if (!scenario.credential) {
            return fail(session, "unavailable", "resolve", "Credential could not be resolved in the registry.");
          }
          session.credential = scenario.credential;
          pass(session, "resolve", "Credential located in the demo registry.");
          break;
        case "issuer":
          pass(session, "issuer", `Issuer recognized — ${scenario.credential?.issuer.name ?? "unknown"}.`);
          break;
        case "status":
          if (scenario.credentialOutcome === "expired") {
            return fail(session, "expired", "status", "Credential validity period has ended.");
          }
          if (scenario.credentialOutcome === "revoked") {
            return fail(session, "revoked", "status", "Credential was revoked by the issuing authority.");
          }
          pass(session, "status", "Active in the registry · not revoked.");
          session.credentialOutcome = "valid";
          session.credentialStatus = "verified";
          session.state = "credential_resolved";
          session.currentStage = "match";
          break;
      }

      session.steps = projectSteps(session);
      return clone(session);
    },
    { latencyMs: 620 },
  );
}

function nextCredentialStage(session: VerificationSession): CredentialStage | null {
  for (const stage of CREDENTIAL_STAGES) {
    if (!session.checks.some((check) => check.id === stage)) return stage;
  }
  return null;
}

function pass(session: VerificationSession, stage: CredentialStage, detail: string) {
  session.checks.push({ id: stage, label: STAGE_LABELS[stage], state: "success", detail });
  const upcoming = nextCredentialStage(session);
  session.currentStage = upcoming ?? "match";
  session.state = upcoming ? "validating" : session.state;
}

function fail(
  session: VerificationSession,
  outcome: Exclude<CredentialOutcome, "unknown" | "valid">,
  stage: CredentialStage,
  detail: string,
): VerificationSession {
  session.checks.push({ id: stage, label: STAGE_LABELS[stage], state: "failure", detail });
  session.credentialOutcome = outcome;
  session.credentialStatus =
    outcome === "invalid" ? "invalid" : outcome === "expired" ? "expired" : outcome === "revoked" ? "revoked" : "error";
  session.state = "credential_failed";
  session.currentStage = stage;
  session.steps = projectSteps(session);
  recordCompletion(session);
  return clone(session);
}

/* ------------------------------------------------------------- identity */

/**
 * The biometric boundary. A real service will replace this implementation;
 * the response shape and the UI stay the same.
 */
export function verifyIdentity(
  sessionId: string,
  input: IdentityVerificationInput,
): Promise<VerificationSession> {
  return mockRequest(
    () => {
      const session = require_(sessionId);
      if (session.state === "session_expired") return clone(session);
      if (session.credentialOutcome !== "valid") {
        throw new ApiError("forbidden", "Identity matching requires a valid credential.");
      }

      const scenario = findScenario(session.credentialReference);
      const result = evaluateIdentity(scenario, input);
      session.identity = result;

      if (result.matchResult === "match") {
        session.state = "identity_resolved";
        session.currentStage = "confirm";
        session.steps = projectSteps(session);
        return clone(session);
      }
      if (result.matchResult === "inconclusive") {
        session.state = "identity_resolved";
        session.currentStage = "confirm";
        session.steps = projectSteps(session);
        return clone(session);
      }
      if (result.matchResult === "mismatch") {
        session.state = "identity_failed";
        session.currentStage = "match";
        session.steps = projectSteps(session);
        recordCompletion(session);
        return clone(session);
      }

      // not_performed — transient condition (no face, offline, error, timeout)
      session.state = "identity_pending";
      session.currentStage = "match";
      session.steps = projectSteps(session);
      return clone(session);
    },
    { latencyMs: 1400 },
  );
}

function evaluateIdentity(
  scenario: DemoScenario | null,
  input: IdentityVerificationInput,
): IdentityVerificationResult {
  const timestamp = new Date().toISOString();
  const base = { modelVersion: MODEL_VERSION, timestamp };

  if (input.observation === "no_face") {
    return {
      ...base,
      status: "no_face",
      matchResult: "not_performed",
      confidence: null,
      reason: "No face was detected in the captured frames.",
    };
  }
  if (input.observation === "multiple_faces") {
    return {
      ...base,
      status: "multiple_faces",
      matchResult: "not_performed",
      confidence: null,
      reason: "More than one face was present — capture a single subject.",
    };
  }
  if (!scenario) {
    return {
      ...base,
      status: "error",
      matchResult: "not_performed",
      confidence: null,
      reason: "The matching service could not process this session.",
    };
  }
  if (scenario.identity.status === "offline") {
    return {
      ...base,
      status: "offline",
      matchResult: "not_performed",
      confidence: null,
      reason: "The matching service could not be reached.",
    };
  }

  const reason =
    scenario.identity.matchResult === "match"
      ? "The presented face matched the credential reference photograph."
      : scenario.identity.matchResult === "mismatch"
        ? "The presented face did not match the credential reference photograph."
        : "The comparison was inconclusive and needs a human decision.";

  return { ...base, ...scenario.identity, reason };
}

/* ------------------------------------------------- official confirmation */

export function requestOfficialConfirmation(sessionId: string): Promise<VerificationSession> {
  return mockRequest(
    () => {
      const session = require_(sessionId);
      if (session.state === "session_expired") return clone(session);
      if (!session.identity || session.identity.matchResult === "mismatch") {
        throw new ApiError("forbidden", "Confirmation requires the identity stage to be resolved.");
      }
      session.confirmation = {
        state: "pending",
        routedTo: "District Control Room · Duty Officer desk",
        requestedAt: new Date().toISOString(),
        respondedAt: null,
        reason: null,
      };
      session.state = "confirmation_pending";
      session.currentStage = "confirm";
      session.steps = projectSteps(session);
      return clone(session);
    },
    { latencyMs: 700 },
  );
}

/** Polled by the citizen UI while the request is pending. */
export function pollOfficialConfirmation(sessionId: string): Promise<VerificationSession> {
  return mockRequest(
    () => {
      const session = require_(sessionId);
      if (session.state === "session_expired") return clone(session);
      if (session.confirmation.state !== "pending") return clone(session);

      const requestedAt = session.confirmation.requestedAt
        ? new Date(session.confirmation.requestedAt).getTime()
        : Date.now();
      const waited = Date.now() - requestedAt;
      const scenario = findScenario(session.credentialReference);
      const outcome = scenario?.confirmation ?? "failed";

      // Timeout scenarios stay pending until the wait window elapses.
      if (waited < (outcome === "timeout" ? 9000 : 4000)) return clone(session);

      session.confirmation.respondedAt = new Date().toISOString();
      switch (outcome) {
        case "accepted":
          session.confirmation.state = "accepted";
          session.confirmation.reason = "Duty officer confirmed the posting and the request.";
          session.state = session.identity?.matchResult === "match"
            ? "final_verified"
            : "confirmation_resolved";
          session.currentStage = "receipt";
          break;
        case "rejected":
          session.confirmation.state = "rejected";
          session.confirmation.reason = "Duty officer declined to confirm this request.";
          session.state = "confirmation_failed";
          session.currentStage = "confirm";
          break;
        case "timeout":
          session.confirmation.state = "timeout";
          session.confirmation.reason = "No official responded within the request window.";
          session.state = "confirmation_failed";
          session.currentStage = "confirm";
          break;
        case "expired":
          session.confirmation.state = "expired";
          session.confirmation.reason = "The confirmation request expired before it was opened.";
          session.state = "confirmation_failed";
          break;
        default:
          session.confirmation.state = "failed";
          session.confirmation.reason = "The confirmation request could not be delivered.";
          session.state = "confirmation_failed";
      }
      session.steps = projectSteps(session);
      recordCompletion(session);
      return clone(session);
    },
    { latencyMs: 400 },
  );
}

/** Citizen chooses to finish without official confirmation. */
export function skipOfficialConfirmation(sessionId: string): Promise<VerificationSession> {
  return mockRequest(
    () => {
      const session = require_(sessionId);
      if (session.state === "session_expired") return clone(session);
      session.confirmation.state = "request_ready";
      session.state = "confirmation_resolved";
      session.currentStage = "receipt";
      session.steps = projectSteps(session);
      recordCompletion(session);
      return clone(session);
    },
    { latencyMs: 300 },
  );
}

/* ---------------------------------------------------------- projections */

function projectSteps(session: VerificationSession): VerificationStepModel[] {
  const steps: VerificationStepModel[] = [
    { id: "scan", label: "Scan", state: "success", detail: "Credential reference decoded" },
  ];

  for (const stage of CREDENTIAL_STAGES) {
    const check = session.checks.find((entry) => entry.id === stage);
    if (check) {
      steps.push({
        id: stage,
        label: STAGE_LABELS[stage],
        state: check.state,
        ...(check.detail ? { detail: check.detail } : {}),
      });
      continue;
    }
    const failedEarlier = session.checks.some((entry) => entry.state === "failure");
    if (failedEarlier) {
      steps.push({ id: stage, label: STAGE_LABELS[stage], state: "skipped", detail: "Not attempted" });
    } else if (session.state === "service_unavailable") {
      steps.push({ id: stage, label: STAGE_LABELS[stage], state: "warning", detail: "Service unavailable" });
    } else {
      steps.push({
        id: stage,
        label: STAGE_LABELS[stage],
        state: session.currentStage === stage ? "current" : "pending",
      });
    }
  }

  steps.push(identityStep(session));
  steps.push(confirmStep(session));
  steps.push({
    id: "receipt",
    label: "Receipt",
    state:
      session.state === "final_verified" || session.state === "confirmation_resolved"
        ? "success"
        : isTerminal(session)
          ? "warning"
          : "pending",
    ...(isTerminal(session) ? { detail: "Receipt available" } : {}),
  });

  return steps;
}

function identityStep(session: VerificationSession): VerificationStepModel {
  if (session.credentialOutcome !== "valid") {
    return { id: "match", label: "Match", state: "skipped", detail: "Not attempted" };
  }
  const identity = session.identity;
  if (!identity) {
    return {
      id: "match",
      label: "Match",
      state: session.currentStage === "match" ? "current" : "pending",
      detail: "Identity match not performed yet",
    };
  }
  if (identity.matchResult === "match") {
    return { id: "match", label: "Match", state: "success", detail: "Presented identity matched the credential" };
  }
  if (identity.matchResult === "mismatch") {
    return { id: "match", label: "Match", state: "failure", detail: identity.reason };
  }
  if (identity.matchResult === "inconclusive") {
    return { id: "match", label: "Match", state: "warning", detail: identity.reason };
  }
  return { id: "match", label: "Match", state: "current", detail: identity.reason };
}

function confirmStep(session: VerificationSession): VerificationStepModel {
  const { state } = session.confirmation;
  if (session.credentialOutcome !== "valid" || session.state === "identity_failed") {
    return { id: "confirm", label: "Confirm", state: "skipped", detail: "Not attempted" };
  }
  switch (state) {
    case "accepted":
      return { id: "confirm", label: "Confirm", state: "success", detail: "An authorized official confirmed this" };
    case "pending":
    case "request_sent":
      return { id: "confirm", label: "Confirm", state: "current", detail: "Awaiting an official response" };
    case "rejected":
      return { id: "confirm", label: "Confirm", state: "failure", detail: "Official declined to confirm" };
    case "timeout":
    case "expired":
    case "failed":
      return { id: "confirm", label: "Confirm", state: "warning", detail: session.confirmation.reason ?? "No response" };
    default:
      return {
        id: "confirm",
        label: "Confirm",
        state: session.currentStage === "confirm" ? "current" : "pending",
        detail: "Optional — request live confirmation",
      };
  }
}

function isTerminal(session: VerificationSession): boolean {
  return (
    session.state === "final_verified" ||
    session.state === "credential_failed" ||
    session.state === "identity_failed" ||
    session.state === "confirmation_failed" ||
    session.state === "confirmation_resolved" ||
    session.state === "service_unavailable"
  );
}

/* -------------------------------------------------------- trust receipt */

export function getTrustReceipt(sessionId: string): Promise<TrustReceiptViewModel> {
  return mockRequest(
    () => {
      const session = require_(sessionId);
      return buildReceipt(session);
    },
    { latencyMs: 380 },
  );
}

export function buildReceipt(session: VerificationSession): TrustReceiptViewModel {
  const credentialValid = session.credentialOutcome === "valid";
  const identityMatched = session.identity?.matchResult === "match";
  const officiallyConfirmed = session.confirmation.state === "accepted";

  const finalState: TrustReceiptViewModel["finalState"] = officiallyConfirmed && identityMatched && credentialValid
    ? "final_verified"
    : credentialValid && identityMatched
      ? "identity_matched_only"
      : credentialValid
        ? "credential_valid_only"
        : "not_verified";

  const status: VerificationStatus =
    finalState === "final_verified"
      ? "verified"
      : session.state === "identity_failed"
        ? "mismatch"
        : session.credentialOutcome === "expired"
          ? "expired"
          : session.credentialOutcome === "revoked"
            ? "revoked"
            : session.credentialOutcome === "invalid"
              ? "invalid"
              : session.state === "service_unavailable"
                ? "error"
                : session.identity?.matchResult === "inconclusive"
                  ? "requires_review"
                  : session.confirmation.state === "rejected"
                    ? "rejected"
                    : session.confirmation.state === "timeout"
                      ? "timeout"
                      : "pending";

  const methods: VerificationMethodResult[] = [
    method("credential_validation", "Credential validation", session.checks.find((c) => c.id === "validate")),
    method("issuer_validation", "Issuer validation", session.checks.find((c) => c.id === "issuer")),
    method("status_validation", "Registry status validation", session.checks.find((c) => c.id === "status")),
    {
      id: "identity_match",
      label: "Identity match",
      outcome:
        session.identity?.matchResult === "match"
          ? "passed"
          : session.identity?.matchResult === "mismatch"
            ? "failed"
            : session.identity?.matchResult === "inconclusive"
              ? "inconclusive"
              : "not_performed",
      detail: session.identity?.reason ?? "Face comparison was not performed in this session.",
    },
    {
      id: "official_confirmation",
      label: "Official confirmation",
      outcome:
        session.confirmation.state === "accepted"
          ? "passed"
          : session.confirmation.state === "rejected"
            ? "failed"
            : session.confirmation.state === "timeout" ||
                session.confirmation.state === "expired" ||
                session.confirmation.state === "failed"
              ? "inconclusive"
              : "not_performed",
      detail: session.confirmation.reason ?? "No live confirmation was requested from an official.",
    },
  ];

  const headline =
    finalState === "final_verified"
      ? "Final verified"
      : finalState === "identity_matched_only"
        ? "Identity matched — not officially confirmed"
        : finalState === "credential_valid_only"
          ? "Credential valid — identity not established"
          : "Not verified";

  const summary =
    finalState === "final_verified"
      ? "The credential passed registry validation, the presented person matched the reference identity, and an authorized official confirmed this request."
      : finalState === "identity_matched_only"
        ? "The credential is valid and the presented person matched the reference identity. No official confirmed this request, so authority was not independently established."
        : finalState === "credential_valid_only"
          ? "The credential itself passed validation. No identity comparison concluded, so this does not establish who is holding it."
          : "This verification did not establish credential validity. Treat the credential as unproven.";

  const limitations = [...session.limitations];
  if (finalState !== "final_verified") {
    limitations.push("Not all trust conditions were satisfied — see the methods above.");
  }
  if (session.demo) {
    limitations.push("The credential reference came from the labelled demo fallback, not a camera scan.");
  }

  return {
    sessionId: session.sessionId,
    credentialReference: session.credentialReference,
    subject: session.credential,
    finalState,
    headline,
    summary,
    status,
    methods,
    occurredAt: session.confirmation.respondedAt ?? session.createdAt,
    limitations,
    demo: true,
  };
}

function method(
  id: VerificationMethodResult["id"],
  label: string,
  check: VerificationCheck | undefined,
): VerificationMethodResult {
  if (!check) {
    return { id, label, outcome: "not_performed", detail: "Not attempted in this session." };
  }
  return {
    id,
    label,
    outcome: check.state === "success" ? "passed" : check.state === "failure" ? "failed" : "inconclusive",
    detail: check.detail ?? "",
  };
}

/* ---------------------------------------------------------- history */

function recordCompletion(session: VerificationSession) {
  const receipt = buildReceipt(session);
  const entry: RecentVerificationSummary = {
    sessionId: session.sessionId,
    subjectName: session.credential?.fullName ?? "Unresolved credential",
    subjectDesignation: session.credential?.designation ?? session.credentialReference,
    outcome: receipt.status,
    occurredAt: new Date().toISOString(),
    method:
      session.confirmation.state === "accepted"
        ? "qr_official"
        : session.identity
          ? "qr_face"
          : "qr",
  };
  const existing = completed.findIndex((item) => item.sessionId === session.sessionId);
  if (existing >= 0) completed[existing] = entry;
  else completed.unshift(entry);
}

export function listCompletedVerifications(): Promise<RecentVerificationSummary[]> {
  return mockRequest(() => completed.map((entry) => ({ ...entry })), { latencyMs: 320 });
}

/* ---------------------------------------------------------- query keys */

export const sessionQueries = {
  session: (sessionId: string) =>
    queryOptions({
      queryKey: ["verification", "session", sessionId],
      queryFn: () => getSession(sessionId),
      retry: false,
    }),
  receipt: (sessionId: string) =>
    queryOptions({
      queryKey: ["verification", "receipt", sessionId],
      queryFn: () => getTrustReceipt(sessionId),
      retry: false,
    }),
  history: () =>
    queryOptions({
      queryKey: ["verification", "history"],
      queryFn: listCompletedVerifications,
    }),
};

/** Test/demo helper — clears in-memory state. */
export function __resetSessionStore() {
  sessions.clear();
  completed.length = 0;
}
