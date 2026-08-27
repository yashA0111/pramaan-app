import * as crypto from "crypto";
import { config } from "../../config/env.config";
import { TrustReceiptViewModel } from "./verification.types";

export const RECEIPT_SCHEMA_VERSION = "pramaan_receipt_v1";
export const DEFAULT_KEY_ID = "k_pramaan_authority_2026_01";
export const SIGNING_ALGORITHM = "HMAC-SHA256";

export interface CanonicalReceiptPayload {
  version: string;
  receiptId: string;
  sessionId: string;
  credentialReference: string;
  subjectName: string;
  subjectDesignation: string;
  issuerName: string;
  issuerAuthority: string;
  finalState: string;
  headline: string;
  summary: string;
  status: string;
  occurredAt: string;
  methods: Array<{ id: string; outcome: string; label: string; detail: string }>;
  limitations: string[];
}

export class TrustReceiptCrypto {
  /**
   * Deterministically orders object keys recursively for canonical JSON representation.
   */
  static canonicalize(obj: any): string {
    if (obj === null || typeof obj !== "object") {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return "[" + obj.map((item) => this.canonicalize(item)).join(",") + "]";
    }
    const sortedKeys = Object.keys(obj).sort();
    const keyValPairs = sortedKeys.map(
      (key) => `${JSON.stringify(key)}:${this.canonicalize(obj[key])}`,
    );
    return "{" + keyValPairs.join(",") + "}";
  }

  /**
   * Constructs the canonical payload representation for a trust receipt.
   */
  static buildCanonicalPayload(
    receiptId: string,
    receipt: Omit<TrustReceiptViewModel, "receiptId" | "receiptHash" | "signature" | "signingKeyId" | "signingAlgorithm">,
  ): CanonicalReceiptPayload {
    return {
      version: RECEIPT_SCHEMA_VERSION,
      receiptId,
      sessionId: receipt.sessionId,
      credentialReference: receipt.credentialReference,
      subjectName: receipt.subject?.fullName || "Unverified Subject",
      subjectDesignation: receipt.subject?.designation || "Unknown Designation",
      issuerName: receipt.subject?.issuer?.name || "Unknown Issuer",
      issuerAuthority: receipt.subject?.issuer?.authority || "Unknown Authority",
      finalState: receipt.finalState,
      headline: receipt.headline,
      summary: receipt.summary,
      status: receipt.status,
      occurredAt: receipt.occurredAt,
      methods: receipt.methods.map((m) => ({
        id: m.id,
        label: m.label,
        outcome: m.outcome,
        detail: m.detail,
      })),
      limitations: [...receipt.limitations].sort(),
    };
  }

  /**
   * Computes SHA-256 hash of canonical payload.
   */
  static computeReceiptHash(canonicalPayload: CanonicalReceiptPayload): string {
    const canonicalString = this.canonicalize(canonicalPayload);
    return crypto.createHash("sha256").update(canonicalString, "utf8").digest("hex");
  }

  /**
   * Digitally signs the receipt hash using the server-side signing secret.
   */
  static signReceiptHash(receiptHash: string, key?: string): string {
    const secretKey = key || config.sessionSecret || "pramaan_trust_receipt_signing_key_2026";
    return crypto.createHmac("sha256", secretKey).update(receiptHash, "utf8").digest("hex");
  }

  /**
   * Creates a signed Trust Receipt with cryptographic binding.
   */
  static signTrustReceipt(
    receiptId: string,
    unsignedReceipt: Omit<TrustReceiptViewModel, "receiptId" | "receiptHash" | "signature" | "signingKeyId" | "signingAlgorithm">,
    key?: string,
  ): TrustReceiptViewModel {
    const canonicalPayload = this.buildCanonicalPayload(receiptId, unsignedReceipt);
    const receiptHash = this.computeReceiptHash(canonicalPayload);
    const signature = this.signReceiptHash(receiptHash, key);

    return {
      ...unsignedReceipt,
      receiptId,
      receiptHash,
      signature,
      signingKeyId: DEFAULT_KEY_ID,
      signingAlgorithm: SIGNING_ALGORITHM,
    };
  }

  /**
   * Independently verifies the authenticity and cryptographic integrity of a Trust Receipt.
   */
  static verifyReceipt(
    receipt: TrustReceiptViewModel,
    key?: string,
  ): { isValid: boolean; reason: string } {
    if (!receipt.receiptId || !receipt.receiptHash || !receipt.signature) {
      return { isValid: false, reason: "Missing cryptographic signature or receipt hash." };
    }

    if (receipt.signingAlgorithm !== SIGNING_ALGORITHM) {
      return { isValid: false, reason: `Unsupported signing algorithm '${receipt.signingAlgorithm}'.` };
    }

    // Reconstruct canonical payload from receipt data
    const canonicalPayload = this.buildCanonicalPayload(receipt.receiptId, receipt);
    const expectedHash = this.computeReceiptHash(canonicalPayload);

    if (expectedHash !== receipt.receiptHash) {
      return {
        isValid: false,
        reason: "Receipt hash mismatch: the receipt payload has been modified or tampered with.",
      };
    }

    const secretKey = key || config.sessionSecret || "pramaan_trust_receipt_signing_key_2026";
    const expectedSignature = this.signReceiptHash(expectedHash, secretKey);

    const sigBuf = Buffer.from(receipt.signature, "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return {
        isValid: false,
        reason: "Invalid digital signature: receipt was not signed by an authorized Pramaan key.",
      };
    }

    return { isValid: true, reason: "Cryptographic signature and payload integrity verified." };
  }
}
