import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import * as crypto from "crypto";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { DatabaseService } from "../../database/database.service";
import * as schema from "../../database/schema";
import {
  GeneratedPresentationResult,
  GeneratePresentationOptions,
  QrPresentationStatus,
  QrPresentationSummary,
  ResolvedPresentationResult,
} from "./qr-presentation.types";

const SCHEME_V1_PREFIX = "pramaan://verify/v1/";
const SCHEME_CREDENTIAL_PREFIX = "pramaan://credential/";
const DEFAULT_TTL_MINUTES = 15; // 15 minutes default for high-security ephemeral QR presentations

@Injectable()
export class QrPresentationService {
  private readonly logger = new Logger(QrPresentationService.name);

  // In-memory fallback map for test/offline execution
  private readonly memoryPresentations = new Map<
    string,
    {
      id: string;
      credentialId: string;
      credentialReference: string;
      officialId: string;
      tokenHash: string;
      status: QrPresentationStatus;
      expiresAt: string;
      invalidatedAt: string | null;
      invalidatedReason: string | null;
      createdById?: string | null;
      createdAt: string;
      updatedAt: string;
    }
  >();

  constructor(private readonly dbService: DatabaseService) {}

  /**
   * Generates a high-entropy opaque presentation token and saves its SHA-256 hash.
   * Renders the QR image dynamically in the response.
   */
  async generatePresentation(
    credentialIdOrRef: string,
    officialIdInput?: string,
    options: GeneratePresentationOptions = {},
  ): Promise<GeneratedPresentationResult> {
    const ttlMinutes = options.ttlMinutes ?? DEFAULT_TTL_MINUTES;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    let credentialId = credentialIdOrRef;
    let credentialRef = options.credentialReference || credentialIdOrRef;
    let officialId = officialIdInput || "";

    // Resolve credential & official from DB if available
    if (this.dbService.db && this.dbService.isConnected) {
      try {
        const rows = await this.dbService.db
          .select({
            cred: schema.credentials,
            off: schema.officials,
          })
          .from(schema.credentials)
          .leftJoin(schema.officials, eq(schema.officials.userId, schema.credentials.subjectUserId))
          .where(
            eq(schema.credentials.id, credentialIdOrRef),
          )
          .limit(1);

        if (rows.length === 0) {
          // Check by credentialReference
          const rowsByRef = await this.dbService.db
            .select({
              cred: schema.credentials,
              off: schema.officials,
            })
            .from(schema.credentials)
            .leftJoin(schema.officials, eq(schema.officials.userId, schema.credentials.subjectUserId))
            .where(eq(schema.credentials.credentialReference, credentialIdOrRef.toUpperCase()))
            .limit(1);

          if (rowsByRef.length > 0) {
            credentialId = rowsByRef[0].cred.id;
            credentialRef = rowsByRef[0].cred.credentialReference;
            officialId = rowsByRef[0].off?.id || officialId;
          }
        } else {
          credentialId = rows[0].cred.id;
          credentialRef = rows[0].cred.credentialReference;
          officialId = rows[0].off?.id || officialId;
        }
      } catch (err: any) {
        this.logger.warn(`Failed to lookup credential for presentation in DB: ${err.message}`);
      }
    }

    // 1. Generate 256-bit cryptographically random opaque token
    const randomBytes = crypto.randomBytes(32);
    const rawToken = `prm_pres_${randomBytes.toString("base64url")}`;

    // 2. Compute SHA-256 hash for database storage (no plaintext token stored)
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 3. Presentation ID
    const presentationId = `pres_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    const qrUri = `${SCHEME_V1_PREFIX}${rawToken}`;

    // 4. Render QR data URL dynamically
    const qrDataUrl = await this.renderQrDataUrl(qrUri);

    // 5. Invalidate existing active presentations for this credential
    await this.invalidateByCredentialId(credentialId, "Superseded by new presentation generation");

    // 6. Insert presentation record
    if (this.dbService.db && this.dbService.isConnected) {
      try {
        await this.dbService.db.insert(schema.qrPresentations).values({
          id: presentationId,
          credentialId,
          officialId: officialId || "off_synthetic",
          tokenHash,
          status: "active",
          expiresAt,
          invalidatedAt: null,
          invalidatedReason: null,
          createdById: options.actorUserId || null,
          createdAt: now,
          updatedAt: now,
        });
      } catch (err: any) {
        this.logger.warn(`Failed to insert qr_presentation in DB: ${err.message}`);
      }
    }

    // Update in-memory fallback
    this.memoryPresentations.set(tokenHash, {
      id: presentationId,
      credentialId,
      credentialReference: credentialRef,
      officialId: officialId || "off_synthetic",
      tokenHash,
      status: "active",
      expiresAt: expiresAt.toISOString(),
      invalidatedAt: null,
      invalidatedReason: null,
      createdById: options.actorUserId || null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return {
      presentationId,
      credentialId,
      credentialReference: credentialRef,
      officialId: officialId || "off_synthetic",
      rawToken,
      qrUri,
      qrDataUrl,
      status: "active",
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };
  }

  /**
   * Regenerates a new QR presentation, explicitly invalidating any prior active presentation.
   */
  async regeneratePresentation(
    credentialIdOrRef: string,
    officialId?: string,
    options: GeneratePresentationOptions = {},
  ): Promise<GeneratedPresentationResult> {
    return this.generatePresentation(credentialIdOrRef, officialId, {
      ...options,
      reason: "Regenerated by operator",
    });
  }

  /**
   * Immediately invalidates an active QR presentation ("Expire Now").
   */
  async expirePresentation(
    presentationId: string,
    actorUserId?: string,
    reason: string = "Manually expired by operator",
  ): Promise<boolean> {
    const now = new Date();

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        await this.dbService.db
          .update(schema.qrPresentations)
          .set({
            status: "invalidated",
            invalidatedAt: now,
            invalidatedReason: reason,
            updatedAt: now,
          })
          .where(eq(schema.qrPresentations.id, presentationId));
      } catch (err: any) {
        this.logger.warn(`Failed to expire presentation in DB: ${err.message}`);
      }
    }

    for (const [hash, pres] of this.memoryPresentations.entries()) {
      if (pres.id === presentationId) {
        pres.status = "invalidated";
        pres.invalidatedAt = now.toISOString();
        pres.invalidatedReason = reason;
        pres.updatedAt = now.toISOString();
        this.memoryPresentations.set(hash, pres);
      }
    }

    return true;
  }

  /**
   * Invalidates all active presentations associated with a given credential.
   */
  async invalidateByCredentialId(credentialId: string, reason: string): Promise<number> {
    const now = new Date();

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        await this.dbService.db
          .update(schema.qrPresentations)
          .set({
            status: "invalidated",
            invalidatedAt: now,
            invalidatedReason: reason,
            updatedAt: now,
          })
          .where(
            and(
              eq(schema.qrPresentations.credentialId, credentialId),
              eq(schema.qrPresentations.status, "active"),
            ),
          );
      } catch (err: any) {
        this.logger.warn(`Failed to invalidate presentations by credential ID in DB: ${err.message}`);
      }
    }

    for (const [hash, pres] of this.memoryPresentations.entries()) {
      if (pres.credentialId === credentialId && pres.status === "active") {
        pres.status = "invalidated";
        pres.invalidatedAt = now.toISOString();
        pres.invalidatedReason = reason;
        pres.updatedAt = now.toISOString();
        this.memoryPresentations.set(hash, pres);
      }
    }

    return 1;
  }

  /**
   * Resolves a raw opaque token scanned by a citizen against the database.
   */
  async resolvePresentationByToken(rawToken: string): Promise<ResolvedPresentationResult> {
    const cleanToken = rawToken.trim();
    if (!cleanToken) {
      return {
        isValid: false,
        outcome: "unknown",
        presentation: null,
        credentialReference: null,
        message: "Empty token supplied.",
      };
    }

    // 1. Compute SHA-256 of the presented token
    const tokenHash = crypto.createHash("sha256").update(cleanToken).digest("hex");
    const now = Date.now();

    // 2. Query DB
    if (this.dbService.db && this.dbService.isConnected) {
      try {
        const rows = await this.dbService.db
          .select({
            pres: schema.qrPresentations,
            cred: schema.credentials,
            off: schema.officials,
          })
          .from(schema.qrPresentations)
          .innerJoin(schema.credentials, eq(schema.qrPresentations.credentialId, schema.credentials.id))
          .leftJoin(schema.officials, eq(schema.qrPresentations.officialId, schema.officials.id))
          .where(eq(schema.qrPresentations.tokenHash, tokenHash))
          .limit(1);

        if (rows.length > 0) {
          const row = rows[0];
          const pres = row.pres;
          const cred = row.cred;

          const isTimeExpired = new Date(pres.expiresAt).getTime() < now;
          if (pres.status === "invalidated" || pres.invalidatedAt) {
            return {
              isValid: false,
              outcome: "invalidated",
              presentation: {
                id: pres.id,
                credentialId: pres.credentialId,
                credentialReference: cred.credentialReference,
                officialId: pres.officialId,
                status: "invalidated",
                expiresAt: new Date(pres.expiresAt).toISOString(),
              },
              credentialReference: cred.credentialReference,
              message: "This QR presentation has been invalidated.",
            };
          }

          if (pres.status === "revoked" || cred.status === "revoked") {
            return {
              isValid: false,
              outcome: "revoked",
              presentation: {
                id: pres.id,
                credentialId: pres.credentialId,
                credentialReference: cred.credentialReference,
                officialId: pres.officialId,
                status: "revoked",
                expiresAt: new Date(pres.expiresAt).toISOString(),
              },
              credentialReference: cred.credentialReference,
              message: "This credential has been revoked by the issuing authority.",
            };
          }

          if (pres.status === "expired" || isTimeExpired) {
            return {
              isValid: false,
              outcome: "expired",
              presentation: {
                id: pres.id,
                credentialId: pres.credentialId,
                credentialReference: cred.credentialReference,
                officialId: pres.officialId,
                status: "expired",
                expiresAt: new Date(pres.expiresAt).toISOString(),
              },
              credentialReference: cred.credentialReference,
              message: "This QR presentation has expired. Please ask the official to present a fresh QR code.",
            };
          }

          return {
            isValid: true,
            outcome: "valid",
            presentation: {
              id: pres.id,
              credentialId: pres.credentialId,
              credentialReference: cred.credentialReference,
              officialId: pres.officialId,
              status: "active",
              expiresAt: new Date(pres.expiresAt).toISOString(),
            },
            credentialReference: cred.credentialReference,
            message: "QR presentation verified and active.",
          };
        }
      } catch (err: any) {
        this.logger.warn(`Failed to resolve presentation by token from DB: ${err.message}`);
      }
    }

    // In-memory fallback
    const mem = this.memoryPresentations.get(tokenHash);
    if (mem) {
      const isTimeExpired = new Date(mem.expiresAt).getTime() < now;
      if (mem.status === "invalidated" || mem.invalidatedAt) {
        return {
          isValid: false,
          outcome: "invalidated",
          presentation: {
            id: mem.id,
            credentialId: mem.credentialId,
            credentialReference: mem.credentialReference,
            officialId: mem.officialId,
            status: "invalidated",
            expiresAt: mem.expiresAt,
          },
          credentialReference: mem.credentialReference,
          message: "This QR presentation has been invalidated.",
        };
      }
      if (mem.status === "expired" || isTimeExpired) {
        return {
          isValid: false,
          outcome: "expired",
          presentation: {
            id: mem.id,
            credentialId: mem.credentialId,
            credentialReference: mem.credentialReference,
            officialId: mem.officialId,
            status: "expired",
            expiresAt: mem.expiresAt,
          },
          credentialReference: mem.credentialReference,
          message: "This QR presentation has expired. Please ask the official to present a fresh QR code.",
        };
      }
      return {
        isValid: true,
        outcome: "valid",
        presentation: {
          id: mem.id,
          credentialId: mem.credentialId,
          credentialReference: mem.credentialReference,
          officialId: mem.officialId,
          status: "active",
          expiresAt: mem.expiresAt,
        },
        credentialReference: mem.credentialReference,
        message: "QR presentation verified and active.",
      };
    }

    return {
      isValid: false,
      outcome: "unknown",
      presentation: null,
      credentialReference: null,
      message: "That QR presentation was not recognized in the registry.",
    };
  }

  /**
   * Retrieves the current active presentation summary for an official.
   */
  async getActivePresentation(officialId: string): Promise<QrPresentationSummary | null> {
    const now = new Date();

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        const rows = await this.dbService.db
          .select({
            pres: schema.qrPresentations,
            cred: schema.credentials,
          })
          .from(schema.qrPresentations)
          .innerJoin(schema.credentials, eq(schema.qrPresentations.credentialId, schema.credentials.id))
          .where(
            and(
              eq(schema.qrPresentations.officialId, officialId),
              eq(schema.qrPresentations.status, "active"),
            ),
          )
          .orderBy(desc(schema.qrPresentations.createdAt))
          .limit(1);

        if (rows.length > 0) {
          const pres = rows[0].pres;
          const cred = rows[0].cred;
          const isExpired = new Date(pres.expiresAt).getTime() < now.getTime();

          return {
            id: pres.id,
            credentialId: pres.credentialId,
            credentialReference: cred.credentialReference,
            officialId: pres.officialId,
            status: isExpired ? "expired" : (pres.status as QrPresentationStatus),
            expiresAt: new Date(pres.expiresAt).toISOString(),
            invalidatedAt: pres.invalidatedAt ? new Date(pres.invalidatedAt).toISOString() : null,
            invalidatedReason: pres.invalidatedReason,
            createdAt: new Date(pres.createdAt).toISOString(),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Failed to get active presentation from DB: ${err.message}`);
      }
    }

    for (const pres of this.memoryPresentations.values()) {
      if (pres.officialId === officialId && pres.status === "active") {
        const isExpired = new Date(pres.expiresAt).getTime() < now.getTime();
        return {
          id: pres.id,
          credentialId: pres.credentialId,
          credentialReference: pres.credentialReference,
          officialId: pres.officialId,
          status: isExpired ? "expired" : pres.status,
          expiresAt: pres.expiresAt,
          invalidatedAt: pres.invalidatedAt,
          invalidatedReason: pres.invalidatedReason,
          createdAt: pres.createdAt,
        };
      }
    }

    return null;
  }

  /**
   * Generates a permanent credential QR data URL for pramaan://credential/<ref>.
   *
   * This QR is STABLE — it contains only the credential reference and does NOT expire.
   * It is suitable for printing on a physical ID card.
   * No database record is created — the QR is derived on-the-fly from the reference.
   *
   * The QR does NOT assert verification; it merely identifies the credential.
   * Backend credential validation occurs when the QR is scanned.
   */
  async renderCredentialQrDataUrl(credentialRef: string): Promise<string> {
    const qrUri = `${SCHEME_CREDENTIAL_PREFIX}${credentialRef.toUpperCase()}`;
    return this.renderQrDataUrl(qrUri);
  }

  /**
   * Returns the canonical permanent credential QR URI and rendered data URL.
   */
  async getPermanentCredentialQr(credentialRef: string): Promise<{
    credentialReference: string;
    qrUri: string;
    qrDataUrl: string;
  }> {
    const qrUri = `${SCHEME_CREDENTIAL_PREFIX}${credentialRef.toUpperCase()}`;
    const qrDataUrl = await this.renderQrDataUrl(qrUri);
    return {
      credentialReference: credentialRef.toUpperCase(),
      qrUri,
      qrDataUrl,
    };
  }

  /**
   * Renders a high-resolution QR code data URL using `qrcode`.
   */
  async renderQrDataUrl(qrUri: string): Promise<string> {
    try {
      return await QRCode.toDataURL(qrUri, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 360,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      });
    } catch (err: any) {
      this.logger.error(`QRCode generation failed: ${err.message}`);
      throw new BadRequestException("Failed to generate QR code image.");
    }
  }

  /**
   * Renders SVG string for high-fidelity vector rendering.
   */
  async renderQrSvg(qrUri: string): Promise<string> {
    try {
      return await QRCode.toString(qrUri, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 2,
        width: 360,
      });
    } catch (err: any) {
      this.logger.error(`QRCode SVG generation failed: ${err.message}`);
      throw new BadRequestException("Failed to generate QR code SVG.");
    }
  }
}
