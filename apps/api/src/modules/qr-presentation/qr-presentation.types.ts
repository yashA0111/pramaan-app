export type QrPresentationStatus = "active" | "expired" | "invalidated" | "revoked";

/**
 * Represents the stable, permanent credential QR printed on a physical ID card.
 *
 * - Contains only the credential reference (pramaan://credential/<ref>)
 * - Does NOT expire or change when verification sessions are created
 * - Does NOT contain authentication secrets
 * - Does NOT assert that the holder has been verified
 * - Backend credential status (valid/suspended/revoked) controls whether
 *   a scan of this QR can proceed to verification
 */
export interface PermanentCredentialQr {
  credentialReference: string;
  qrUri: string;
  qrDataUrl: string;
}

export interface GeneratePresentationOptions {
  ttlMinutes?: number;
  actorUserId?: string;
  reason?: string;
  credentialReference?: string;
}

export interface GeneratedPresentationResult {
  presentationId: string;
  credentialId: string;
  credentialReference: string;
  officialId: string;
  rawToken: string;
  qrUri: string;
  qrDataUrl: string;
  status: QrPresentationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface QrPresentationSummary {
  id: string;
  credentialId: string;
  credentialReference: string;
  officialId: string;
  status: QrPresentationStatus;
  expiresAt: string;
  invalidatedAt: string | null;
  invalidatedReason: string | null;
  createdAt: string;
  qrUri?: string;
  qrDataUrl?: string;
}

export interface ResolvedPresentationResult {
  isValid: boolean;
  outcome: "valid" | "expired" | "invalidated" | "revoked" | "unknown";
  presentation: {
    id: string;
    credentialId: string;
    credentialReference: string;
    officialId: string;
    status: QrPresentationStatus;
    expiresAt: string;
  } | null;
  credentialReference: string | null;
  message: string;
}
