import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetSessionStore,
  advanceCredentialStage,
  buildReceipt,
  createSession,
  decodeQr,
  listCompletedVerifications,
  pollOfficialConfirmation,
  requestOfficialConfirmation,
  skipOfficialConfirmation,
  verifyIdentity,
} from "@/features/verification/session-service";
import type { VerificationSession } from "@/types/verification-session";
import { formatPermanentCredentialUri } from "@/features/verification/qr";
async function advanceTime(ms: number): Promise<void> {
  if (typeof (vi as any).advanceTimersByTimeAsync === "function") {
    await (vi as any).advanceTimersByTimeAsync(ms);
  } else {
    vi.advanceTimersByTime(ms);
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  }
}

/** Resolves a mocked request by pushing the fake clock past its latency. */
async function settle<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => {});
  await advanceTime(2_000);
  return promise;
}

/** Walks the credential leg to completion, exactly as the UI does. */
async function resolveCredential(sessionId: string): Promise<VerificationSession> {
  let session = await settle(advanceCredentialStage(sessionId));
  let guard = 0;
  while (session.state === "validating" && guard++ < 12) {
    session = await settle(advanceCredentialStage(sessionId));
  }
  return session;
}

async function startSession(reference: string) {
  const created = await settle(createSession(reference, { demo: true }));
  return resolveCredential(created.sessionId);
}

beforeEach(() => {
  vi.useFakeTimers();
  __resetSessionStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("QR decoding", () => {
  it("decodes the stable permanent credential QR", async () => {
    const uri = formatPermanentCredentialUri("prm-demo-0001");
    const scan = await settle(decodeQr(uri));

    expect(uri).toBe("pramaan://credential/PRM-DEMO-0001");
    expect(scan.outcome).toBe("qr_decoded");
    expect(scan.credentialReference).toBe("PRM-DEMO-0001");
    expect(scan.message).toMatch(/nothing is verified/i);
  });

  it("decodes a v1 opaque presentation token cleanly", async () => {
    const scan = await settle(decodeQr("pramaan://verify/v1/prm_pres_AbCdEf1234567890"));

    expect(scan.outcome).toBe("qr_decoded");
    expect(scan.credentialReference).toBe("PRM-DEMO-0001");
    expect(scan.message).toMatch(/decoded/i);
  });

  it("decoding a legacy payload verifies nothing on its own", async () => {
    const scan = await settle(decodeQr("PRM-DEMO-0001"));

    expect(scan.outcome).toBe("qr_decoded");
    expect(scan.credentialReference).toBe("PRM-DEMO-0001");
    expect(scan.message).toMatch(/nothing is verified/i);
  });

  it("reports unrecognized payloads without inventing a reference", async () => {
    const scan = await settle(decodeQr("https://example.com/not-a-credential"));

    expect(scan.outcome).not.toBe("qr_decoded");
    expect(scan.credentialReference).toBeNull();
  });
});

describe("credential leg", () => {
  it("resolves a valid credential and stops short of claiming identity", async () => {
    const session = await startSession("PRM-DEMO-0001");

    expect(session.credentialOutcome).toBe("valid");
    expect(session.state).toBe("credential_resolved");
    expect(session.identity).toBeNull();
    expect(buildReceipt(session).finalState).toBe("credential_valid_only");
  });

  it.each([
    ["PRM-DEMO-0002", "invalid"],
    ["PRM-DEMO-0003", "expired"],
    ["PRM-DEMO-0004", "revoked"],
  ] as const)("fails closed for a %s credential", async (reference, outcome) => {
    const session = await startSession(reference);

    expect(session.credentialOutcome).toBe(outcome);
    expect(session.state).toBe("credential_failed");
    expect(buildReceipt(session).finalState).toBe("not_verified");
  });

  it("treats an unavailable registry as unproven, never as valid", async () => {
    const session = await startSession("PRM-DEMO-0005");

    expect(session.state).toBe("service_unavailable");
    expect(session.credentialOutcome).toBe("unavailable");
    expect(buildReceipt(session).finalState).toBe("not_verified");
  });
});

describe("identity leg", () => {
  it("refuses to compare identity without a valid credential", async () => {
    const session = await startSession("PRM-DEMO-0002");

    await expect(settle(verifyIdentity(session.sessionId, { observation: "single_face" }))).rejects.toThrow();
  });

  it("does not conclude anything when no face was captured", async () => {
    const session = await startSession("PRM-DEMO-0001");
    const next = await settle(verifyIdentity(session.sessionId, { observation: "no_face" }));

    expect(next.identity?.status).toBe("no_face");
    expect(next.identity?.matchResult).toBe("not_performed");
    expect(next.state).toBe("identity_pending");
  });

  it("records a mismatch as a terminal failure", async () => {
    const session = await startSession("PRM-DEMO-0006");
    const next = await settle(verifyIdentity(session.sessionId, { observation: "single_face" }));

    expect(next.identity?.matchResult).toBe("mismatch");
    expect(next.state).toBe("identity_failed");
    expect(buildReceipt(next).finalState).toBe("not_verified");
  });
});

describe("official confirmation", () => {
  it("reaches final verified only with credential, identity and official confirmation", async () => {
    const session = await startSession("PRM-DEMO-0001");
    await settle(verifyIdentity(session.sessionId, { observation: "single_face" }));
    const requested = await settle(requestOfficialConfirmation(session.sessionId));
    expect(requested.confirmation.state).toBe("pending");

    await advanceTime(5_000);
    const resolved = await settle(pollOfficialConfirmation(session.sessionId));

    expect(resolved.confirmation.state).toBe("accepted");
    expect(resolved.state).toBe("final_verified");
    expect(buildReceipt(resolved).finalState).toBe("final_verified");
  });

  it("never lets a confirmation backfill an inconclusive identity", async () => {
    const session = await startSession("PRM-DEMO-0007");
    const identity = await settle(verifyIdentity(session.sessionId, { observation: "single_face" }));
    expect(identity.identity?.matchResult).toBe("inconclusive");

    await settle(requestOfficialConfirmation(session.sessionId));
    await advanceTime(5_000);
    const resolved = await settle(pollOfficialConfirmation(session.sessionId));

    expect(resolved.confirmation.state).toBe("accepted");
    expect(resolved.state).toBe("confirmation_resolved");
    expect(buildReceipt(resolved).finalState).toBe("credential_valid_only");
  });

  it("treats a rejection as authority not established", async () => {
    const session = await startSession("PRM-DEMO-0008");
    await settle(verifyIdentity(session.sessionId, { observation: "single_face" }));
    await settle(requestOfficialConfirmation(session.sessionId));
    await advanceTime(5_000);
    const resolved = await settle(pollOfficialConfirmation(session.sessionId));

    expect(resolved.confirmation.state).toBe("rejected");
    expect(buildReceipt(resolved).finalState).toBe("identity_matched_only");
  });

  it("treats silence as a timeout, not an approval", async () => {
    const session = await startSession("PRM-DEMO-0009");
    await settle(verifyIdentity(session.sessionId, { observation: "single_face" }));
    await settle(requestOfficialConfirmation(session.sessionId));

    await advanceTime(5_000);
    const stillPending = await settle(pollOfficialConfirmation(session.sessionId));
    expect(stillPending.confirmation.state).toBe("pending");

    await advanceTime(10_000);
    const timedOut = await settle(pollOfficialConfirmation(session.sessionId));

    expect(timedOut.confirmation.state).toBe("timeout");
    expect(buildReceipt(timedOut).finalState).toBe("identity_matched_only");
  });

  it("lets the citizen finish without confirmation and keeps the receipt honest", async () => {
    const session = await startSession("PRM-DEMO-0001");
    await settle(verifyIdentity(session.sessionId, { observation: "single_face" }));
    const skipped = await settle(skipOfficialConfirmation(session.sessionId));

    const receipt = buildReceipt(skipped);
    expect(receipt.finalState).toBe("identity_matched_only");
    expect(receipt.methods.find((m) => m.id === "official_confirmation")?.outcome).toBe(
      "not_performed",
    );
  });
});

describe("history", () => {
  it("records completed verifications with the level they actually reached", async () => {
    const failed = await startSession("PRM-DEMO-0002");
    const matched = await startSession("PRM-DEMO-0001");
    await settle(verifyIdentity(matched.sessionId, { observation: "single_face" }));
    await settle(skipOfficialConfirmation(matched.sessionId));

    const history = await settle(listCompletedVerifications());

    expect(history).toHaveLength(2);
    expect(history.map((entry) => entry.sessionId)).toContain(failed.sessionId);
    expect(history[0]?.sessionId).toBe(matched.sessionId);
    expect(history[0]?.method).toBe("qr_face");
  });
});
