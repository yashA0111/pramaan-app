/**
 * Synthetic demo registry for Phase B.
 *
 * Deterministic scenarios keyed by credential reference so every failure
 * path is reachable in a demo. This file is service-layer data — visual
 * components must never import it directly to fake a state.
 */

import type { CredentialSummary } from "@/types/verification";
import type {
  ConfirmationState,
  CredentialOutcome,
  FaceState,
  IdentityMatchResult,
} from "@/types/verification-session";

import { DEMO_CREDENTIAL } from "./mock-service";

export interface DemoScenario {
  reference: string;
  label: string;
  credentialOutcome: CredentialOutcome;
  credential: CredentialSummary | null;
  /** Outcome the biometric mock reports for a clean single-face observation. */
  identity: { status: FaceState; matchResult: IdentityMatchResult; confidence: number | null };
  /** Final resolution of the official confirmation request. */
  confirmation: Exclude<ConfirmationState, "request_ready" | "request_sent" | "pending">;
  /** Set when the credential leg should fail at the service boundary. */
  serviceFailure?: boolean;
}

function credential(overrides: Partial<CredentialSummary>): CredentialSummary {
  return { ...DEMO_CREDENTIAL, ...overrides };
}

const MATCHED = { status: "match" as FaceState, matchResult: "match" as IdentityMatchResult, confidence: 0.94 };

export const DEMO_SCENARIOS: Record<string, DemoScenario> = {
  "PRM-DEMO-0001": {
    reference: "PRM-DEMO-0001",
    label: "Valid credential · identity match · confirmation accepted",
    credentialOutcome: "valid",
    credential: credential({ credentialId: "PRM-DEMO-0001", registryStatus: "active" }),
    identity: MATCHED,
    confirmation: "accepted",
  },
  "PRM-DEMO-0002": {
    reference: "PRM-DEMO-0002",
    label: "Invalid credential · signature fails validation",
    credentialOutcome: "invalid",
    credential: null,
    identity: MATCHED,
    confirmation: "failed",
  },
  "PRM-DEMO-0003": {
    reference: "PRM-DEMO-0003",
    label: "Expired credential",
    credentialOutcome: "expired",
    credential: credential({
      credentialId: "PRM-DEMO-0003",
      fullName: "Ravi Iyer",
      designation: "Head Constable",
      posting: "District Unit VII, New Delhi",
      issuedOn: "2019-06-04",
      validUntil: "2024-06-03",
      registryStatus: "expired",
    }),
    identity: MATCHED,
    confirmation: "failed",
  },
  "PRM-DEMO-0004": {
    reference: "PRM-DEMO-0004",
    label: "Revoked credential",
    credentialOutcome: "revoked",
    credential: credential({
      credentialId: "PRM-DEMO-0004",
      fullName: "Nikhil Barman",
      designation: "Assistant Sub-Inspector",
      posting: "Transferred · posting withdrawn",
      registryStatus: "revoked",
    }),
    identity: MATCHED,
    confirmation: "failed",
  },
  "PRM-DEMO-0005": {
    reference: "PRM-DEMO-0005",
    label: "Verification service unavailable",
    credentialOutcome: "unavailable",
    credential: null,
    identity: { status: "offline", matchResult: "not_performed", confidence: null },
    confirmation: "failed",
    serviceFailure: true,
  },
  "PRM-DEMO-0006": {
    reference: "PRM-DEMO-0006",
    label: "Valid credential · identity mismatch",
    credentialOutcome: "valid",
    credential: credential({
      credentialId: "PRM-DEMO-0006",
      fullName: "Suresh Pillai",
      designation: "Sub-Inspector",
      posting: "District Unit I, New Delhi",
    }),
    identity: { status: "mismatch", matchResult: "mismatch", confidence: 0.21 },
    confirmation: "rejected",
  },
  "PRM-DEMO-0007": {
    reference: "PRM-DEMO-0007",
    label: "Valid credential · identity inconclusive, manual review",
    credentialOutcome: "valid",
    credential: credential({
      credentialId: "PRM-DEMO-0007",
      fullName: "Imran Qureshi",
      designation: "Inspector",
      posting: "District Unit V, New Delhi",
    }),
    identity: { status: "requires_review", matchResult: "inconclusive", confidence: 0.58 },
    confirmation: "pending" as never,
  },
  "PRM-DEMO-0008": {
    reference: "PRM-DEMO-0008",
    label: "Valid credential · official rejects the request",
    credentialOutcome: "valid",
    credential: credential({
      credentialId: "PRM-DEMO-0008",
      fullName: "Deepak Rana",
      designation: "Constable",
      posting: "District Unit II, New Delhi",
    }),
    identity: MATCHED,
    confirmation: "rejected",
  },
  "PRM-DEMO-0009": {
    reference: "PRM-DEMO-0009",
    label: "Valid credential · official confirmation times out",
    credentialOutcome: "valid",
    credential: credential({
      credentialId: "PRM-DEMO-0009",
      fullName: "Aarti Nair",
      designation: "Sub-Inspector",
      posting: "District Unit IV, New Delhi",
    }),
    identity: MATCHED,
    confirmation: "timeout",
  },
};

/** References that a demo operator can pick from deliberately. */
export const DEMO_SCENARIO_LIST = Object.values(DEMO_SCENARIOS);

export const PRIMARY_DEMO_REFERENCE = "PRM-DEMO-0001";

/** Registry lookup. `null` means the reference is not in the registry. */
export function findScenario(reference: string): DemoScenario | null {
  return DEMO_SCENARIOS[reference.toUpperCase()] ?? null;
}
