import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { AuditService } from "../audit/audit.service";
import { ConfirmationService } from "../confirmation/confirmation.service";
import { CredentialsService } from "../credentials/credentials.service";
import { IdentityService } from "../identity/identity.service";
import { IdentityVerificationInputDto } from "../identity/identity.types";
import { DatabaseService } from "../../database/database.service";
import * as schema from "../../database/schema";
import { VerificationPolicyEngine } from "./verification.policy";
import { TrustReceiptCrypto } from "./verification.receipt";
import {
  QrScanResult,
  RecentVerificationSummary,
  TrustReceiptViewModel,
  VerificationCheck,
  VerificationSession,
  VerificationStage,
  VerificationStepModel,
} from "./verification.types";

import { QrPresentationService } from "../qr-presentation/qr-presentation.service";
import { StorageService } from "../storage/storage.service";

const SESSION_TTL_MS = 10 * 60 * 1000;
const CREDENTIAL_STAGES = ["validate", "resolve", "issuer", "status"] as const;
type CredentialStage = (typeof CREDENTIAL_STAGES)[number];

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

export const CREDENTIAL_REFERENCE_PATTERN = /^PRM-[A-Z0-9]{2,8}-\d{4}$/;

// Canonical permanent credential QR: pramaan://credential/<ref>
// Printed on physical ID cards — stable, no expiry.
const SCHEME_CREDENTIAL_PREFIX = "pramaan://credential/";

// Ephemeral verification presentation: pramaan://verify/v1/<opaque-token>
// Short-lived, SHA-256 hashed, replay-resistant.
const SCHEME_V1_PREFIX = "pramaan://verify/v1/";

// Legacy/dev direct reference: pramaan://verify/<ref> or bare PRM-XXXX-####
const SCHEME_PREFIX = "pramaan://verify/";

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly sessions = new Map<string, VerificationSession>();
  private readonly completed = new Map<string, RecentVerificationSummary>();

  constructor(
    private readonly dbService: DatabaseService,
    private readonly credentialsService: CredentialsService,
    private readonly identityService: IdentityService,
    private readonly confirmationService: ConfirmationService,
    private readonly auditService: AuditService,
    private readonly qrPresentationService: QrPresentationService,
    private readonly storageService: StorageService,
  ) {}

  /* ------------------------------------------------------------ QR Intake */

  async decodeQr(
    raw: string,
    options: { demo?: boolean; offline?: boolean } = {},
  ): Promise<QrScanResult> {
    const scannedAt = new Date().toISOString();
    const base = { rawValue: raw, demo: options.demo ?? false, scannedAt };

    if (options.offline) {
      return {
        ...base,
        outcome: "offline",
        credentialReference: null,
        message: "You appear to be offline. Pramaan could not reach the registry.",
      };
    }

    const value = raw.trim();
    if (!value) {
      return {
        ...base,
        outcome: "unrecognized_qr",
        credentialReference: null,
        message: "That QR code was read, but it is not a Pramaan credential.",
      };
    }

    // 1. Canonical Permanent Credential QR: pramaan://credential/<ref>
    //    Printed on physical ID cards. Stable — does not expire.
    //    Resolves directly to the credential reference; no ephemeral presentation needed.
    if (value.toLowerCase().startsWith(SCHEME_CREDENTIAL_PREFIX)) {
      const reference = value.slice(SCHEME_CREDENTIAL_PREFIX.length).split(/[?#/]/)[0]?.toUpperCase() ?? "";
      if (!CREDENTIAL_REFERENCE_PATTERN.test(reference)) {
        return {
          ...base,
          outcome: "invalid_qr",
          credentialReference: null,
          message: "This looks like a Pramaan credential QR, but the reference is malformed.",
          qrFormat: "permanent_credential" as const,
        };
      }

      const res = await this.credentialsService.resolveCredential(reference);
      if (res.serviceFailure) {
        return {
          ...base,
          outcome: "service_unavailable",
          credentialReference: reference,
          message: "The verification service did not respond. Nothing has been verified.",
          qrFormat: "permanent_credential" as const,
        };
      }

      if (res.outcome === "unavailable" && !res.credential) {
        return {
          ...base,
          outcome: "expired_reference",
          credentialReference: reference,
          message: "This credential reference is not active in the registry.",
          qrFormat: "permanent_credential" as const,
        };
      }

      return {
        ...base,
        outcome: "qr_decoded",
        credentialReference: reference,
        message: "Permanent credential QR decoded. Nothing is verified yet.",
        qrFormat: "permanent_credential" as const,
      };
    }

    // 2. Ephemeral Verification Presentation Token: pramaan://verify/v1/<opaque-token>
    //    Short-lived, SHA-256 hashed, replay-resistant.
    //    Generated by the server for verification sessions — NOT printed on physical ID cards.
    if (value.toLowerCase().startsWith(SCHEME_V1_PREFIX)) {
      const token = value.slice(SCHEME_V1_PREFIX.length).split(/[?#/]/)[0]?.trim() ?? "";
      if (!token) {
        return {
          ...base,
          outcome: "invalid_qr",
          credentialReference: null,
          message: "This looks like a Pramaan v1 QR, but the presentation token is empty.",
          qrFormat: "ephemeral_presentation" as const,
        };
      }

      const pres = await this.qrPresentationService.resolvePresentationByToken(token);
      if (!pres.isValid || !pres.credentialReference) {
        if (pres.outcome === "unknown") {
          return {
            ...base,
            outcome: "unrecognized_qr",
            credentialReference: null,
            message: "That QR code was read, but it is not an active Pramaan presentation.",
            qrFormat: "ephemeral_presentation" as const,
          };
        }
        return {
          ...base,
          outcome: "expired_reference",
          credentialReference: pres.credentialReference,
          message: pres.message,
          qrFormat: "ephemeral_presentation" as const,
        };
      }

      const res = await this.credentialsService.resolveCredential(pres.credentialReference);
      if (res.serviceFailure) {
        return {
          ...base,
          outcome: "service_unavailable",
          credentialReference: pres.credentialReference,
          message: "The verification service did not respond. Nothing has been verified.",
          qrFormat: "ephemeral_presentation" as const,
        };
      }

      if (res.outcome === "unavailable" && !res.credential) {
        return {
          ...base,
          outcome: "expired_reference",
          credentialReference: pres.credentialReference,
          message: "This reference is no longer active in the demo registry.",
          qrFormat: "ephemeral_presentation" as const,
        };
      }

      return {
        ...base,
        outcome: "qr_decoded",
        credentialReference: pres.credentialReference,
        message: "Ephemeral QR presentation verified and active. Nothing is verified yet.",
        qrFormat: "ephemeral_presentation" as const,
      };
    }

    // 3. Legacy / Dev direct reference: pramaan://verify/<ref> or bare PRM-XXXX-####
    let reference = "";
    if (value.toLowerCase().startsWith(SCHEME_PREFIX)) {
      reference = value.slice(SCHEME_PREFIX.length).split(/[?#/]/)[0]?.toUpperCase() ?? "";
      if (!CREDENTIAL_REFERENCE_PATTERN.test(reference)) {
        return {
          ...base,
          outcome: "invalid_qr",
          credentialReference: null,
          message: "This looks like a Pramaan code, but the reference is malformed.",
          qrFormat: "legacy_reference" as const,
        };
      }
    } else if (CREDENTIAL_REFERENCE_PATTERN.test(value.toUpperCase())) {
      reference = value.toUpperCase();
    } else {
      return {
        ...base,
        outcome: "unrecognized_qr",
        credentialReference: null,
        message: "That QR code was read, but it is not a Pramaan credential.",
      };
    }

    const res = await this.credentialsService.resolveCredential(reference);
    if (res.serviceFailure) {
      return {
        ...base,
        outcome: "service_unavailable",
        credentialReference: reference,
        message: "The verification service did not respond. Nothing has been verified.",
        qrFormat: "legacy_reference" as const,
      };
    }

    if (res.outcome === "unavailable" && !res.credential) {
      return {
        ...base,
        outcome: "expired_reference",
        credentialReference: reference,
        message: "This reference is no longer active in the demo registry.",
        qrFormat: "legacy_reference" as const,
      };
    }

    return {
      ...base,
      outcome: "qr_decoded",
      credentialReference: reference,
      message: "Credential reference decoded. Nothing is verified yet.",
      qrFormat: "legacy_reference" as const,
    };
  }

  /* ----------------------------------------------------- Session Creation */

  async createSession(
    credentialReference: string,
    options: { demo?: boolean } = {},
    actorUserId?: string,
  ): Promise<VerificationSession> {
    const cleanRef = credentialReference.trim().toUpperCase();
    const sessionId = `ses_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const now = Date.now();
    const createdAt = new Date(now).toISOString();
    const expiresAt = new Date(now + SESSION_TTL_MS).toISOString();

    const session: VerificationSession = {
      sessionId,
      credentialReference: cleanRef,
      demo: options.demo ?? false,
      currentStage: "validate",
      state: "validating",
      createdAt,
      expiresAt,
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
        "Identity matching runs against an integrated biometric adapter.",
      ],
    };

    session.steps = this.projectSteps(session);
    this.sessions.set(sessionId, session);

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        await this.dbService.db.insert(schema.verificationSessions).values({
          id: sessionId,
          requestingUserId: actorUserId || null,
          credentialReference: cleanRef,
          demo: session.demo,
          currentStage: session.currentStage,
          sessionState: session.state,
          credentialOutcome: session.credentialOutcome,
          credentialStatus: session.credentialStatus,
          createdAt: new Date(now),
          expiresAt: new Date(now + SESSION_TTL_MS),
          limitationsJson: session.limitations,
        });
      } catch (err: any) {
        this.logger.warn(`Failed to insert session in DB: ${err.message}`);
      }
    }

    await this.auditService.log({
      actorUserId,
      actorRole: "citizen",
      action: "VERIFICATION_SESSION_CREATED",
      resourceType: "verification_session",
      resourceId: sessionId,
      outcome: "success",
      metadata: { credentialReference: cleanRef, demo: session.demo },
    });

    return structuredClone(session);
  }

  async getSession(sessionId: string): Promise<VerificationSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException("This verification session does not exist or has expired.");
    }

    if (Date.now() > new Date(session.expiresAt).getTime() && session.state !== "final_verified") {
      session.state = "session_expired";
      session.error = {
        kind: "session_expired",
        message: "This session expired. Start a new verification.",
      };
      session.steps = this.projectSteps(session);
    }

    return structuredClone(session);
  }

  /* -------------------------------------------------- Credential Pipeline */

  async advanceCredentialStage(sessionId: string): Promise<VerificationSession> {
    const session = await this.requireSession(sessionId);
    if (session.state === "session_expired") return structuredClone(session);

    const resolved = await this.credentialsService.resolveCredential(session.credentialReference);

    if (resolved.serviceFailure) {
      session.state = "service_unavailable";
      session.credentialOutcome = "unavailable";
      session.credentialStatus = "error";
      session.error = {
        kind: "service_unavailable",
        message: "The verification service is unavailable. No conclusion can be drawn.",
      };
      session.currentStage = "validate";
      session.steps = this.projectSteps(session);
      this.recordCompletion(session);
      return structuredClone(session);
    }

    const next = this.nextCredentialStage(session);
    if (!next) return structuredClone(session);

    switch (next) {
      case "validate":
        if (resolved.outcome === "invalid") {
          return this.failCredential(session, "invalid", "validate", "Credential signature failed validation.");
        }
        this.passStage(session, "validate", "Signature well-formed and verifiable.");
        break;

      case "resolve":
        if (!resolved.credential) {
          return this.failCredential(session, "unavailable", "resolve", "Credential could not be resolved in the registry.");
        }
        session.credential = resolved.credential;
        this.passStage(session, "resolve", "Credential located in the demo registry.");
        break;

      case "issuer":
        this.passStage(
          session,
          "issuer",
          `Issuer recognized — ${session.credential?.issuer.name ?? "unknown"}.`,
        );
        break;

      case "status":
        if (resolved.outcome === "expired") {
          return this.failCredential(session, "expired", "status", "Credential validity period has ended.");
        }
        if (session.credential?.registryStatus === "suspended") {
          return this.failCredential(session, "revoked", "status", "Credential is temporarily suspended by the issuing authority.");
        }
        if (resolved.outcome === "revoked") {
          return this.failCredential(session, "revoked", "status", "Credential was revoked by the issuing authority.");
        }
        this.passStage(session, "status", "Active in the registry · not revoked.");
        session.credentialOutcome = "valid";
        session.credentialStatus = "verified";
        session.state = "credential_resolved";
        session.currentStage = "match";
        break;
    }

    session.steps = this.projectSteps(session);
    return structuredClone(session);
  }

  private nextCredentialStage(session: VerificationSession): CredentialStage | null {
    for (const stage of CREDENTIAL_STAGES) {
      if (!session.checks.some((check) => check.id === stage)) return stage;
    }
    return null;
  }

  private passStage(session: VerificationSession, stage: CredentialStage, detail: string) {
    session.checks.push({ id: stage, label: STAGE_LABELS[stage], state: "success", detail });
    const upcoming = this.nextCredentialStage(session);
    session.currentStage = upcoming ?? "match";
    session.state = upcoming ? "validating" : session.state;
  }

  private failCredential(
    session: VerificationSession,
    outcome: "invalid" | "expired" | "revoked" | "unavailable",
    stage: CredentialStage,
    detail: string,
  ): VerificationSession {
    session.checks.push({ id: stage, label: STAGE_LABELS[stage], state: "failure", detail });
    session.credentialOutcome = outcome;
    session.credentialStatus =
      outcome === "invalid"
        ? "invalid"
        : outcome === "expired"
          ? "expired"
          : outcome === "revoked"
            ? "revoked"
            : "error";
    session.state = "credential_failed";
    session.currentStage = stage;
    session.steps = this.projectSteps(session);
    this.recordCompletion(session);
    return structuredClone(session);
  }

  /* ------------------------------------------------------------- Identity */

  async verifyIdentity(
    sessionId: string,
    input: IdentityVerificationInputDto,
  ): Promise<VerificationSession> {
    const session = await this.requireSession(sessionId);
    if (session.state === "session_expired") return structuredClone(session);

    if (session.credentialOutcome !== "valid") {
      throw new ForbiddenException("Identity matching requires a valid credential.");
    }

    // Resolve the reference face from storage so the biometric adapter has actual image data.
    // We look up the reference_face asset for the credential's official, download it, and
    // convert to base64. If unavailable we proceed without it — the service will report
    // "not_performed" gracefully rather than crashing.
    let referencePhotoBase64: string | undefined;
    try {
      if (this.dbService.db && this.dbService.isConnected) {
        // Find the official linked to this credential reference
        const rows = await this.dbService.db
          .select({
            officialId: schema.officials.id,
            photoUrl: schema.credentials.photoUrl,
          })
          .from(schema.credentials)
          .innerJoin(
            schema.officials,
            eq(schema.credentials.subjectUserId, schema.officials.userId),
          )
          .where(eq(schema.credentials.credentialReference, session.credentialReference))
          .limit(1);

        const officialId = rows[0]?.officialId;
        const photoUrl = rows[0]?.photoUrl;

        if (officialId) {
          // Fetch all assets for this official and find reference_face, falling back to portrait
          const assets = await this.dbService.db
            .select({
              storagePath: schema.demoAssets.storagePath,
              assetType: schema.demoAssets.assetType,
            })
            .from(schema.demoAssets)
            .where(eq(schema.demoAssets.officialId, officialId));

          const refFace =
            assets.find(
              (a) => a.assetType === "reference_face" || a.storagePath?.includes("reference_face"),
            ) ||
            assets.find(
              (a) => a.assetType === "portrait" || a.storagePath?.includes("portrait"),
            );

          if (refFace?.storagePath) {
            try {
              const { buffer, mimeType } = await this.storageService.getFile(refFace.storagePath);
              referencePhotoBase64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
              this.logger.log(
                `Reference face resolved for ${session.credentialReference} (${refFace.storagePath})`,
              );
            } catch (storageErr: any) {
              this.logger.warn(
                `Storage getFile failed for ${refFace.storagePath}: ${storageErr.message}`,
              );
            }
          }
        }

        // Fallback: if referencePhotoBase64 is not yet resolved, check credential photoUrl
        if (!referencePhotoBase64 && photoUrl) {
          if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
            try {
              const resp = await fetch(photoUrl);
              if (resp.ok) {
                const arrayBuf = await resp.arrayBuffer();
                const mime = resp.headers.get("content-type") || "image/jpeg";
                referencePhotoBase64 = `data:${mime};base64,${Buffer.from(arrayBuf).toString("base64")}`;
                this.logger.log(`Reference face resolved from public photoUrl for ${session.credentialReference}`);
              }
            } catch (fetchErr: any) {
              this.logger.warn(`Could not fetch photoUrl ${photoUrl}: ${fetchErr.message}`);
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `Could not fetch reference face for ${session.credentialReference}: ${err.message}`,
      );
    }

    const result = await this.identityService.verifyIdentity(session.credentialReference, {
      ...input,
      referencePhotoBase64,
    });
    session.identity = result;

    if (result.matchResult === "match" || result.matchResult === "inconclusive") {
      session.state = "identity_resolved";
      session.currentStage = "confirm";
    } else if (result.matchResult === "mismatch") {
      session.state = "identity_failed";
      session.currentStage = "match";
      this.recordCompletion(session);
    } else {
      // not_performed / transient (no face, multiple faces, offline)
      session.state = "identity_pending";
      session.currentStage = "match";
    }

    session.steps = this.projectSteps(session);
    return structuredClone(session);
  }

  /* ------------------------------------------------- Official Confirmation */

  async requestOfficialConfirmation(
    sessionId: string,
    actorUserId?: string,
  ): Promise<VerificationSession> {
    const session = await this.requireSession(sessionId);
    if (session.state === "session_expired") return structuredClone(session);

    if (!session.identity || session.identity.matchResult === "mismatch") {
      throw new ForbiddenException("Confirmation requires the identity stage to be resolved.");
    }

    const confirmation = await this.confirmationService.createRequest(
      {
        sessionId,
        credentialReference: session.credentialReference,
        subjectName: session.credential?.fullName,
        posting: session.credential?.posting,
      },
      actorUserId,
    );

    session.confirmation = confirmation;
    session.state = "confirmation_pending";
    session.currentStage = "confirm";
    session.steps = this.projectSteps(session);

    return structuredClone(session);
  }

  async pollOfficialConfirmation(sessionId: string): Promise<VerificationSession> {
    const session = await this.requireSession(sessionId);
    if (session.state === "session_expired") return structuredClone(session);
    if (session.confirmation.state !== "pending") return structuredClone(session);

    const confirmation = await this.confirmationService.pollRequest(
      sessionId,
      session.credentialReference,
    );
    session.confirmation = confirmation;

    if (confirmation.state === "accepted") {
      session.state =
        session.identity?.matchResult === "match" ? "final_verified" : "confirmation_resolved";
      session.currentStage = "receipt";
      this.recordCompletion(session);
    } else if (
      confirmation.state === "rejected" ||
      confirmation.state === "timeout" ||
      confirmation.state === "expired" ||
      confirmation.state === "failed"
    ) {
      session.state = "confirmation_failed";
      session.currentStage = "confirm";
      this.recordCompletion(session);
    }

    session.steps = this.projectSteps(session);
    return structuredClone(session);
  }

  async skipOfficialConfirmation(sessionId: string): Promise<VerificationSession> {
    const session = await this.requireSession(sessionId);
    if (session.state === "session_expired") return structuredClone(session);

    session.confirmation.state = "request_ready";
    session.state = "confirmation_resolved";
    session.currentStage = "receipt";
    session.steps = this.projectSteps(session);
    this.recordCompletion(session);

    return structuredClone(session);
  }

  /* -------------------------------------------------------- Trust Receipt */

  async getTrustReceipt(sessionId: string): Promise<TrustReceiptViewModel> {
    const session = await this.requireSession(sessionId);
    const receipt = VerificationPolicyEngine.evaluateFinalReceipt(session);

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        await this.dbService.db
          .insert(schema.trustReceipts)
          .values({
            id: `rcpt_${session.sessionId}`,
            verificationSessionId: session.sessionId,
            credentialReference: session.credentialReference,
            finalState: receipt.finalState,
            status: receipt.status,
            headline: receipt.headline,
            summary: receipt.summary,
            subjectSnapshotJson: receipt.subject as any,
            issuerSnapshotJson: receipt.subject?.issuer as any,
            methodsJson: receipt.methods,
            limitationsJson: receipt.limitations,
            occurredAt: new Date(receipt.occurredAt),
            demo: true,
          })
          .onConflictDoNothing();
      } catch (err: any) {
        this.logger.warn(`Failed to persist trust receipt in DB: ${err.message}`);
      }
    }

    return receipt;
  }

  /**
   * Cryptographically validates a Trust Receipt payload and digital signature.
   */
  verifyTrustReceipt(receipt: TrustReceiptViewModel): { isValid: boolean; reason: string } {
    return TrustReceiptCrypto.verifyReceipt(receipt);
  }

  /* -------------------------------------------------------------- History */

  async listCompletedVerifications(userId?: string): Promise<RecentVerificationSummary[]> {
    return Array.from(this.completed.values());
  }

  /* ------------------------------------------------------------- Helpers */

  private async requireSession(sessionId: string): Promise<VerificationSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException("This verification session does not exist or has expired.");
    }
    return session;
  }

  private recordCompletion(session: VerificationSession) {
    const receipt = VerificationPolicyEngine.evaluateFinalReceipt(session);
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
    this.completed.set(session.sessionId, entry);
  }

  private projectSteps(session: VerificationSession): VerificationStepModel[] {
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

    steps.push(this.identityStep(session));
    steps.push(this.confirmStep(session));
    steps.push({
      id: "receipt",
      label: "Receipt",
      state:
        session.state === "final_verified" || session.state === "confirmation_resolved"
          ? "success"
          : this.isTerminal(session)
            ? "warning"
            : "pending",
      ...(this.isTerminal(session) ? { detail: "Receipt available" } : {}),
    });

    return steps;
  }

  private identityStep(session: VerificationSession): VerificationStepModel {
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
      return {
        id: "match",
        label: "Match",
        state: "success",
        detail: "Presented identity matched the credential",
      };
    }
    if (identity.matchResult === "mismatch") {
      return { id: "match", label: "Match", state: "failure", detail: identity.reason };
    }
    if (identity.matchResult === "inconclusive") {
      return { id: "match", label: "Match", state: "warning", detail: identity.reason };
    }
    return { id: "match", label: "Match", state: "current", detail: identity.reason };
  }

  private confirmStep(session: VerificationSession): VerificationStepModel {
    const { state } = session.confirmation;
    if (session.credentialOutcome !== "valid" || session.state === "identity_failed") {
      return { id: "confirm", label: "Confirm", state: "skipped", detail: "Not attempted" };
    }
    switch (state) {
      case "accepted":
        return {
          id: "confirm",
          label: "Confirm",
          state: "success",
          detail: "An authorized official confirmed this",
        };
      case "pending":
      case "request_sent":
        return { id: "confirm", label: "Confirm", state: "current", detail: "Awaiting an official response" };
      case "rejected":
        return { id: "confirm", label: "Confirm", state: "failure", detail: "Official declined to confirm" };
      case "timeout":
      case "expired":
      case "failed":
        return {
          id: "confirm",
          label: "Confirm",
          state: "warning",
          detail: session.confirmation.reason ?? "No response",
        };
      default:
        return {
          id: "confirm",
          label: "Confirm",
          state: session.currentStage === "confirm" ? "current" : "pending",
          detail: "Optional — request live confirmation",
        };
    }
  }

  private isTerminal(session: VerificationSession): boolean {
    return (
      session.state === "final_verified" ||
      session.state === "credential_failed" ||
      session.state === "identity_failed" ||
      session.state === "confirmation_failed" ||
      session.state === "confirmation_resolved" ||
      session.state === "service_unavailable"
    );
  }
}
