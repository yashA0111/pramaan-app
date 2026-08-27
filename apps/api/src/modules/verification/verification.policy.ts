import {
  FinalTrustState,
  TrustReceiptViewModel,
  VerificationCheck,
  VerificationMethodResult,
  VerificationSession,
  VerificationStatus,
} from "./verification.types";
import { TrustReceiptCrypto } from "./verification.receipt";

export class VerificationPolicyEngine {
  static evaluateFinalReceipt(session: VerificationSession): TrustReceiptViewModel {
    const credentialValid = session.credentialOutcome === "valid";
    const identityMatched = session.identity?.matchResult === "match";
    const identityMismatch = session.identity?.matchResult === "mismatch";
    const officiallyConfirmed = session.confirmation.state === "accepted";

    // Final state determination
    let finalState: FinalTrustState = "not_verified";
    if (officiallyConfirmed && identityMatched && credentialValid) {
      finalState = "final_verified";
    } else if (credentialValid && identityMatched) {
      finalState = "identity_matched_only";
    } else if (credentialValid && !identityMismatch) {
      finalState = "credential_valid_only";
    } else {
      finalState = "not_verified";
    }

    // Status determination
    let status: VerificationStatus = "pending";
    if (finalState === "final_verified") {
      status = "verified";
    } else if (session.state === "identity_failed" || identityMismatch) {
      status = "mismatch";
    } else if (session.credentialOutcome === "expired") {
      status = "expired";
    } else if (session.credentialOutcome === "revoked") {
      status = "revoked";
    } else if (session.credentialOutcome === "invalid") {
      status = "invalid";
    } else if (session.state === "service_unavailable") {
      status = "error";
    } else if (session.identity?.matchResult === "inconclusive") {
      status = "requires_review";
    } else if (session.confirmation.state === "rejected") {
      status = "rejected";
    } else if (session.confirmation.state === "timeout") {
      status = "timeout";
    } else {
      status = "pending";
    }

    const methods: VerificationMethodResult[] = [
      this.createMethod(
        "credential_validation",
        "Credential validation",
        session.checks.find((c) => c.id === "validate"),
      ),
      this.createMethod(
        "issuer_validation",
        "Issuer validation",
        session.checks.find((c) => c.id === "issuer"),
      ),
      this.createMethod(
        "status_validation",
        "Registry status validation",
        session.checks.find((c) => c.id === "status"),
      ),
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
        detail:
          session.confirmation.reason ?? "No live confirmation was requested from an official.",
      },
    ];

    let headline = "Not verified";
    let summary =
      "This verification did not establish credential validity. Treat the credential as unproven.";

    if (finalState === "final_verified") {
      headline = "Final verified";
      summary =
        "The credential passed registry validation, the presented person matched the reference identity, and an authorized official confirmed this request.";
    } else if (finalState === "identity_matched_only") {
      headline = "Identity matched — not officially confirmed";
      summary =
        "The credential is valid and the presented person matched the reference identity. No official confirmed this request, so authority was not independently established.";
    } else if (finalState === "credential_valid_only") {
      headline = "Credential valid — identity not established";
      summary =
        "The credential itself passed validation. No identity comparison concluded, so this does not establish who is holding it.";
    }

    const limitations = [...session.limitations];
    if (finalState !== "final_verified") {
      limitations.push("Not all trust conditions were satisfied — see the methods above.");
    }
    if (session.demo) {
      limitations.push(
        "The credential reference came from the labelled demo fallback, not a camera scan.",
      );
    }

    const receiptId = `rcpt_${session.sessionId.replace(/^ses_/, "")}`;
    const unsignedReceipt = {
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
      demo: session.demo ?? true,
    };

    return TrustReceiptCrypto.signTrustReceipt(receiptId, unsignedReceipt);
  }

  private static createMethod(
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
      outcome:
        check.state === "success"
          ? "passed"
          : check.state === "failure"
            ? "failed"
            : "inconclusive",
      detail: check.detail ?? "",
    };
  }
}
