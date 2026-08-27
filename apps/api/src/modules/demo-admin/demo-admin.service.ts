import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { and, desc, eq, not } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { AuditService } from "../audit/audit.service";
import { StorageService } from "../storage/storage.service";
import { DatabaseService } from "../../database/database.service";
import * as schema from "../../database/schema";
import { GovernmentCredentialAdapter } from "../credentials/government-credential.adapter";
import { QrPresentationService } from "../qr-presentation/qr-presentation.service";
import {
  CreateDemoOfficialDto,
  ExpirePresentationDto,
  GeneratePresentationDto,
  UpdateCredentialStatusDto,
  UpdateDemoOfficialDto,
} from "./demo-admin.dto";

const CREDENTIAL_REFERENCE_PATTERN = /^PRM-[A-Z0-9]{2,8}-\d{4}$/;

@Injectable()
export class DemoAdminService {
  private readonly logger = new Logger(DemoAdminService.name);

  // In-memory fallback catalog for local/test environments
  private readonly memoryOfficials = new Map<string, any>();
  private readonly memoryAssets = new Map<string, any[]>();

  constructor(
    private readonly dbService: DatabaseService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly qrPresentationService: QrPresentationService,
    @Optional() private readonly govAdapter?: GovernmentCredentialAdapter,
  ) {}

  async listOfficials(): Promise<any[]> {
    if (this.dbService.db && this.dbService.isConnected) {
      try {
        const rows = await this.dbService.db
          .select({
            official: schema.officials,
            user: schema.users,
            credential: schema.credentials,
          })
          .from(schema.officials)
          .innerJoin(schema.users, eq(schema.officials.userId, schema.users.id))
          .leftJoin(schema.credentials, eq(schema.credentials.subjectUserId, schema.users.id))
          .where(not(eq(schema.officials.officialStatus, "deprovisioned")));

        const officialsList = await Promise.all(
          rows.map(async (r) => {
            let activePres: any = null;
            try {
              activePres = await this.qrPresentationService.getActivePresentation(r.official.id);
            } catch {
              // ignore
            }

            return {
              id: r.official.id,
              userId: r.user.id,
              displayName: r.user.displayName,
              registeredEmail: r.official.registeredEmail,
              designation: r.official.designation,
              department: r.official.department,
              postingLocation: r.official.postingLocation,
              employeeReference: r.official.employeeReference,
              officialStatus: r.official.officialStatus,
              credential: r.credential
                ? {
                    id: r.credential.id,
                    reference: r.credential.credentialReference,
                    status: r.credential.status,
                    photoUrl: r.credential.photoUrl,
                    issuedAt: r.credential.issuedAt,
                    expiresAt: r.credential.expiresAt,
                  }
                : null,
              activePresentation: activePres,
            };
          }),
        );

        return officialsList;
      } catch (err: any) {
        this.logger.warn(`Failed to list officials from DB: ${err.message}`);
      }
    }

    return Array.from(this.memoryOfficials.values()).filter(
      (off) => off.officialStatus !== "deprovisioned",
    );
  }

  async getOfficial(id: string): Promise<any> {
    if (this.dbService.db && this.dbService.isConnected) {
      try {
        const rows = await this.dbService.db
          .select({
            official: schema.officials,
            user: schema.users,
            credential: schema.credentials,
          })
          .from(schema.officials)
          .innerJoin(schema.users, eq(schema.officials.userId, schema.users.id))
          .leftJoin(schema.credentials, eq(schema.credentials.subjectUserId, schema.users.id))
          .where(eq(schema.officials.id, id))
          .limit(1);

        if (rows.length > 0) {
          const r = rows[0];
          const assets = await this.dbService.db
            .select()
            .from(schema.demoAssets)
            .where(eq(schema.demoAssets.officialId, id));

          const activePres = await this.qrPresentationService.getActivePresentation(id);

          // Permanent credential QR: stable, derived from credential reference.
          // Does not change when presentations are regenerated.
          let permanentQr: { uri: string; qrDataUrl: string } | null = null;
          if (r.credential) {
            try {
              const permResult = await this.qrPresentationService.getPermanentCredentialQr(
                r.credential.credentialReference,
              );
              permanentQr = { uri: permResult.qrUri, qrDataUrl: permResult.qrDataUrl };
            } catch {
              // ignore render errors
            }
          }

          return {
            id: r.official.id,
            userId: r.user.id,
            displayName: r.user.displayName,
            registeredEmail: r.official.registeredEmail,
            designation: r.official.designation,
            department: r.official.department,
            postingLocation: r.official.postingLocation,
            employeeReference: r.official.employeeReference,
            officialStatus: r.official.officialStatus,
            credential: r.credential
              ? {
                  id: r.credential.id,
                  reference: r.credential.credentialReference,
                  status: r.credential.status,
                  photoUrl: r.credential.photoUrl,
                  issuedAt: r.credential.issuedAt,
                  expiresAt: r.credential.expiresAt,
                }
              : null,
            // Stable permanent QR for physical ID card
            permanentQr,
            // Ephemeral presentation for verification session monitoring
            activePresentation: activePres || null,
            assets: assets.map((a) => ({
              id: a.id,
              assetType: a.assetType,
              storagePath: a.storagePath,
              mimeType: a.mimeType,
              fileSize: a.fileSize,
              isVerified: a.isVerified,
              encodedReference: a.encodedReference,
              createdAt: a.createdAt,
            })),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Failed to get official from DB: ${err.message}`);
      }
    }

    const official = this.memoryOfficials.get(id);
    if (!official) {
      throw new NotFoundException(`Official with ID '${id}' not found`);
    }

    const assets = this.memoryAssets.get(id) || [];
    const activePres = await this.qrPresentationService.getActivePresentation(id);

    let permanentQr: { uri: string; qrDataUrl: string } | null = null;
    if (official.credential) {
      try {
        const permResult = await this.qrPresentationService.getPermanentCredentialQr(
          official.credential.reference,
        );
        permanentQr = { uri: permResult.qrUri, qrDataUrl: permResult.qrDataUrl };
      } catch {
        // ignore render errors
      }
    }

    return { ...official, permanentQr, activePresentation: activePres, assets };
  }

  async createOfficial(dto: CreateDemoOfficialDto, adminUserId?: string): Promise<any> {
    const cleanRef = dto.credentialReference.trim().toUpperCase();
    if (!CREDENTIAL_REFERENCE_PATTERN.test(cleanRef)) {
      throw new BadRequestException(
        `Invalid credential reference format '${cleanRef}'. Must match pattern PRM-XXXX-####`,
      );
    }

    const userId = `usr_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
    const officialId = `off_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
    const credentialId = `cred_${cleanRef.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const employeeRef = dto.employeeReference || `EMP-DP-${Math.floor(10000 + Math.random() * 90000)}`;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000); // 5 years

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        // 1. Create User
        await this.dbService.db.insert(schema.users).values({
          id: userId,
          role: "official",
          displayName: dto.displayName,
          email: dto.registeredEmail,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });

        // 2. Create Official profile
        await this.dbService.db.insert(schema.officials).values({
          id: officialId,
          userId,
          employeeReference: employeeRef,
          department: dto.department,
          designation: dto.designation,
          postingLocation: dto.postingLocation,
          registeredEmail: dto.registeredEmail,
          officialStatus: "active",
          createdAt: now,
          updatedAt: now,
        });

        // 3. Create Credential record
        await this.dbService.db.insert(schema.credentials).values({
          id: credentialId,
          credentialReference: cleanRef,
          subjectUserId: userId,
          issuerId: "iss_delhi_police",
          credentialType: "law_enforcement_id",
          issuedAt: now,
          expiresAt,
          status: "valid",
          version: "1.0.0",
          photoUrl: "/assets/persona-arjun-mehta.jpg",
          photoAlt: `${dto.displayName} photograph`,
          verificationPolicyId: "standard_government_v1",
          synthetic: true,
          createdAt: now,
          updatedAt: now,
        });
      } catch (err: any) {
        throw new BadRequestException(`Failed to create official in database: ${err.message}`);
      }
    }

    // 4. Automatically generate initial active QR Presentation (ephemeral verification presentation)
    const initialTtl = dto.initialQrTtlMinutes || 15;
    const presentation = await this.qrPresentationService.generatePresentation(
      credentialId,
      officialId,
      {
        ttlMinutes: initialTtl,
        actorUserId: adminUserId,
        reason: "Initial QR presentation upon credential creation",
        credentialReference: cleanRef,
      },
    );

    // 5. Generate permanent credential QR (stable, suitable for printing on physical ID card)
    let permanentQr: { uri: string; qrDataUrl: string } | null = null;
    try {
      const permResult = await this.qrPresentationService.getPermanentCredentialQr(cleanRef);
      permanentQr = { uri: permResult.qrUri, qrDataUrl: permResult.qrDataUrl };
    } catch {
      // ignore render errors
    }

    const officialRecord = {
      id: officialId,
      userId,
      displayName: dto.displayName,
      registeredEmail: dto.registeredEmail,
      designation: dto.designation,
      department: dto.department,
      postingLocation: dto.postingLocation,
      employeeReference: employeeRef,
      officialStatus: "active",
      credential: {
        id: credentialId,
        reference: cleanRef,
        status: "valid",
        photoUrl: "/assets/persona-arjun-mehta.jpg",
        issuedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      // Stable permanent QR suitable for printing on a physical ID card
      permanentQr,
      // Ephemeral presentation for the first verification session
      activePresentation: presentation,
    };

    this.memoryOfficials.set(officialId, officialRecord);
    this.memoryAssets.set(officialId, []);

    if (this.govAdapter) {
      this.govAdapter.addSyntheticCredential(cleanRef, "valid", {
        credentialId: cleanRef,
        fullName: dto.displayName,
        designation: dto.designation,
        department: dto.department,
        posting: dto.postingLocation,
        photoUrl: "/assets/persona-arjun-mehta.jpg",
        photoAlt: `${dto.displayName} photograph`,
        issuedOn: now.toISOString().split("T")[0],
        validUntil: expiresAt.toISOString().split("T")[0],
        issuer: {
          name: "Delhi Police Directorate of Personnel",
          authority: "Government of NCT of Delhi · Ministry of Home Affairs",
          registry: "demo",
        },
        registryStatus: "active",
        synthetic: true,
      });
    }

    await this.auditService.log({
      actorUserId: adminUserId,
      actorRole: "demo_admin",
      action: "DEMO_OFFICIAL_CREATED",
      resourceType: "official",
      resourceId: officialId,
      outcome: "success",
      metadata: {
        credentialReference: cleanRef,
        displayName: dto.displayName,
        presentationId: presentation.presentationId,
      },
    });

    return officialRecord;
  }

  async updateOfficial(
    id: string,
    dto: UpdateDemoOfficialDto,
    adminUserId?: string,
  ): Promise<any> {
    const official = await this.getOfficial(id);

    if (this.dbService.db && this.dbService.isConnected) {
      if (dto.displayName) {
        await this.dbService.db
          .update(schema.users)
          .set({ displayName: dto.displayName, updatedAt: new Date() })
          .where(eq(schema.users.id, official.userId));
      }

      await this.dbService.db
        .update(schema.officials)
        .set({
          designation: dto.designation || official.designation,
          department: dto.department || official.department,
          postingLocation: dto.postingLocation || official.postingLocation,
          updatedAt: new Date(),
        })
        .where(eq(schema.officials.id, id));

      if (dto.credentialStatus && official.credential) {
        await this.dbService.db
          .update(schema.credentials)
          .set({ status: dto.credentialStatus, updatedAt: new Date() })
          .where(eq(schema.credentials.id, official.credential.id));

        if (
          dto.credentialStatus === "suspended" ||
          dto.credentialStatus === "revoked" ||
          dto.credentialStatus === "archived"
        ) {
          await this.qrPresentationService.invalidateByCredentialId(
            official.credential.id,
            `Credential marked ${dto.credentialStatus}`,
          );
        }
      }
    }

    const updated = {
      ...official,
      displayName: dto.displayName || official.displayName,
      designation: dto.designation || official.designation,
      department: dto.department || official.department,
      postingLocation: dto.postingLocation || official.postingLocation,
      credential: official.credential
        ? {
            ...official.credential,
            status: dto.credentialStatus || official.credential.status,
          }
        : null,
    };

    this.memoryOfficials.set(id, updated);

    await this.auditService.log({
      actorUserId: adminUserId,
      actorRole: "demo_admin",
      action: "DEMO_OFFICIAL_UPDATED",
      resourceType: "official",
      resourceId: id,
      outcome: "success",
      metadata: { changes: dto },
    });

    return updated;
  }

  async updateCredentialStatus(
    id: string,
    dto: UpdateCredentialStatusDto,
    adminUserId?: string,
  ): Promise<any> {
    const official = await this.getOfficial(id);
    if (!official.credential) {
      throw new NotFoundException("Official has no linked credential");
    }

    if (this.dbService.db && this.dbService.isConnected) {
      await this.dbService.db
        .update(schema.credentials)
        .set({ status: dto.status, updatedAt: new Date() })
        .where(eq(schema.credentials.id, official.credential.id));

      await this.dbService.db.insert(schema.credentialStatusHistory).values({
        id: `csh_${uuidv4().replace(/-/g, "").slice(0, 16)}`,
        credentialId: official.credential.id,
        previousStatus: official.credential.status,
        newStatus: dto.status,
        reason: dto.reason || `Status updated to ${dto.status} by demo admin`,
        changedAt: new Date(),
        changedBy: adminUserId || "demo_admin",
      });

      if (dto.status === "suspended" || dto.status === "revoked" || dto.status === "archived") {
        await this.qrPresentationService.invalidateByCredentialId(
          official.credential.id,
          dto.reason || `Credential marked ${dto.status}`,
        );
      }
    } else {
      if (dto.status === "suspended" || dto.status === "revoked" || dto.status === "archived") {
        await this.qrPresentationService.invalidateByCredentialId(
          official.credential.id,
          dto.reason || `Credential marked ${dto.status}`,
        );
      }
    }

    if (this.govAdapter && official.credential) {
      this.govAdapter.addSyntheticCredential(
        official.credential.reference,
        dto.status === "valid" ? "valid" : "revoked",
        null,
      );
    }

    official.credential.status = dto.status;
    this.memoryOfficials.set(id, official);

    await this.auditService.log({
      actorUserId: adminUserId,
      actorRole: "demo_admin",
      action: "CREDENTIAL_STATUS_CHANGED",
      resourceType: "credential",
      resourceId: official.credential.id,
      outcome: "success",
      metadata: { newStatus: dto.status, reason: dto.reason },
    });

    return official;
  }

  /**
   * Generates a new temporary QR presentation for an official.
   */
  async generatePresentation(
    officialId: string,
    dto: GeneratePresentationDto = {},
    adminUserId?: string,
  ): Promise<any> {
    const official = await this.getOfficial(officialId);
    if (!official.credential) {
      throw new NotFoundException("Official has no linked credential");
    }

    const ttlMinutes = dto.ttlMinutes || 15;
    const result = await this.qrPresentationService.generatePresentation(
      official.credential.id,
      officialId,
      {
        ttlMinutes,
        actorUserId: adminUserId,
        reason: "Generated by demo admin operator",
        credentialReference: official.credential.reference,
      },
    );

    await this.auditService.log({
      actorUserId: adminUserId,
      actorRole: "demo_admin",
      action: "QR_PRESENTATION_GENERATED",
      resourceType: "qr_presentation",
      resourceId: result.presentationId,
      outcome: "success",
      metadata: { officialId, credentialId: official.credential.id, ttlMinutes },
    });

    return result;
  }

  /**
   * Regenerates a temporary QR presentation, invalidating previous active ones.
   */
  async regeneratePresentation(
    officialId: string,
    dto: GeneratePresentationDto = {},
    adminUserId?: string,
  ): Promise<any> {
    const official = await this.getOfficial(officialId);
    if (!official.credential) {
      throw new NotFoundException("Official has no linked credential");
    }

    const ttlMinutes = dto.ttlMinutes || 15;
    const result = await this.qrPresentationService.regeneratePresentation(
      official.credential.id,
      officialId,
      {
        ttlMinutes,
        actorUserId: adminUserId,
        reason: "Regenerated by demo admin operator",
        credentialReference: official.credential.reference,
      },
    );

    await this.auditService.log({
      actorUserId: adminUserId,
      actorRole: "demo_admin",
      action: "QR_PRESENTATION_REGENERATED",
      resourceType: "qr_presentation",
      resourceId: result.presentationId,
      outcome: "success",
      metadata: { officialId, credentialId: official.credential.id, ttlMinutes },
    });

    return result;
  }

  /**
   * Explicitly expires ("Expire Now") the current active presentation for an official.
   */
  async expirePresentation(
    officialId: string,
    dto: ExpirePresentationDto = {},
    adminUserId?: string,
  ): Promise<any> {
    const active = await this.qrPresentationService.getActivePresentation(officialId);
    if (!active) {
      throw new NotFoundException("No active QR presentation found for this official");
    }

    const reason = dto.reason || "Manually expired by operator";
    await this.qrPresentationService.expirePresentation(active.id, adminUserId, reason);

    await this.auditService.log({
      actorUserId: adminUserId,
      actorRole: "demo_admin",
      action: "QR_PRESENTATION_EXPIRED_NOW",
      resourceType: "qr_presentation",
      resourceId: active.id,
      outcome: "success",
      metadata: { officialId, reason },
    });

    return { success: true, presentationId: active.id, status: "invalidated" };
  }

  /**
   * Non-destructively archives/deprovisions an official, preserving historical receipts and audit trails.
   */
  async archiveOfficial(officialId: string, adminUserId?: string): Promise<any> {
    const official = await this.getOfficial(officialId);

    if (this.dbService.db && this.dbService.isConnected) {
      // 1. Mark official as deprovisioned
      await this.dbService.db
        .update(schema.officials)
        .set({ officialStatus: "deprovisioned", updatedAt: new Date() })
        .where(eq(schema.officials.id, officialId));

      // 2. Mark credential as archived
      if (official.credential) {
        await this.dbService.db
          .update(schema.credentials)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(schema.credentials.id, official.credential.id));

        // 3. Invalidate active presentations
        await this.qrPresentationService.invalidateByCredentialId(
          official.credential.id,
          "Official archived from active demo registry",
        );
      }
    } else {
      if (official.credential) {
        await this.qrPresentationService.invalidateByCredentialId(
          official.credential.id,
          "Official archived from active demo registry",
        );
      }
    }

    if (this.govAdapter && official.credential) {
      this.govAdapter.addSyntheticCredential(
        official.credential.reference,
        "revoked",
        null,
      );
    }

    official.officialStatus = "deprovisioned";
    if (official.credential) {
      official.credential.status = "archived";
    }
    this.memoryOfficials.set(officialId, official);

    await this.auditService.log({
      actorUserId: adminUserId,
      actorRole: "demo_admin",
      action: "DEMO_OFFICIAL_ARCHIVED",
      resourceType: "official",
      resourceId: officialId,
      outcome: "success",
      metadata: { officialId, archivedAt: new Date().toISOString() },
    });

    return { success: true, officialId, status: "archived" };
  }

  /**
   * Permanently deletes an official and all associated records from the database and storage:
   * - demo assets (and their storage files)
   * - ephemeral QR presentations
   * - credential status history
   * - credentials
   * - confirmation requests
   * - officials
   * - synthetic user record
   * This completely clears the uniqueness constraints (email, credentialReference, employeeReference)
   * so the same profile can be added again in the future with no conflicts.
   */
  async purgeOfficial(officialId: string, adminUserId?: string): Promise<any> {
    let official: any = null;
    try {
      official = await this.getOfficial(officialId);
    } catch {
      // ignore if already partially deleted
    }

    const credRef = official?.credential?.credentialReference || official?.credential?.reference;
    const credId = official?.credential?.id;
    const userId = official?.user?.id || official?.userId;

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        // 1. Delete asset files from storage & demo_assets
        const assets = await this.dbService.db
          .select()
          .from(schema.demoAssets)
          .where(eq(schema.demoAssets.officialId, officialId));

        for (const asset of assets) {
          if (asset.storagePath) {
            try {
              await this.storageService.deleteFile(asset.storagePath);
            } catch (err: any) {
              this.logger.warn(`Could not delete storage file ${asset.storagePath}: ${err.message}`);
            }
          }
        }

        await this.dbService.db
          .delete(schema.demoAssets)
          .where(eq(schema.demoAssets.officialId, officialId));

        // 2. Delete QR presentations
        await this.dbService.db
          .delete(schema.qrPresentations)
          .where(eq(schema.qrPresentations.officialId, officialId));

        if (credId) {
          await this.dbService.db
            .delete(schema.qrPresentations)
            .where(eq(schema.qrPresentations.credentialId, credId));

          // 3. Delete credential status history
          await this.dbService.db
            .delete(schema.credentialStatusHistory)
            .where(eq(schema.credentialStatusHistory.credentialId, credId));

          // 4. Update verification sessions to unlink credentialId
          await this.dbService.db
            .update(schema.verificationSessions)
            .set({ credentialId: null })
            .where(eq(schema.verificationSessions.credentialId, credId));

          // 5. Delete credential
          await this.dbService.db
            .delete(schema.credentials)
            .where(eq(schema.credentials.id, credId));
        }

        // 6. Delete confirmation requests for this official
        await this.dbService.db
          .delete(schema.officialConfirmationRequests)
          .where(eq(schema.officialConfirmationRequests.officialId, officialId));

        // 7. Delete official
        await this.dbService.db
          .delete(schema.officials)
          .where(eq(schema.officials.id, officialId));

        // 8. Delete user record if it exists
        if (userId) {
          await this.dbService.db
            .delete(schema.users)
            .where(eq(schema.users.id, userId));
        }
      } catch (err: any) {
        this.logger.error(`Database purge failed for official ${officialId}: ${err.message}`);
        throw new BadRequestException(`Failed to purge official from database: ${err.message}`);
      }
    }

    // Clear in-memory caches
    this.memoryOfficials.delete(officialId);
    this.memoryAssets.delete(officialId);
    if (credRef && this.govAdapter) {
      this.govAdapter.removeSyntheticCredential(credRef);
    }

    await this.auditService.log({
      actorUserId: adminUserId,
      actorRole: "demo_admin",
      action: "DEMO_OFFICIAL_PURGED",
      resourceType: "official",
      resourceId: officialId,
      outcome: "success",
      metadata: { officialId, credentialReference: credRef, purgedAt: new Date().toISOString() },
    });

    return { success: true, officialId, status: "purged" };
  }

  /* ----------------------------------------------------- Asset Management */

  async uploadAsset(
    officialId: string,
    assetType: "portrait" | "reference_face",
    file: { buffer: Buffer; originalname: string; mimetype: string },
    adminUserId?: string,
  ): Promise<any> {
    const official = await this.getOfficial(officialId);

    const folder = `officials/${officialId}`;
    const filename = `${assetType}_${file.originalname}`;
    const upload = await this.storageService.uploadFile(
      folder,
      filename,
      file.buffer,
      file.mimetype,
    );

    const assetId = `ast_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    const now = new Date();

    if (this.dbService.db && this.dbService.isConnected) {
      await this.dbService.db.insert(schema.demoAssets).values({
        id: assetId,
        officialId,
        assetType,
        storagePath: upload.storagePath,
        mimeType: upload.mimeType,
        fileSize: upload.fileSize,
        checksum: upload.checksum,
        encodedReference: null,
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      });

      // Update portrait URL on credential if portrait
      if (assetType === "portrait" && official.credential) {
        await this.dbService.db
          .update(schema.credentials)
          .set({ photoUrl: upload.publicUrl || upload.storagePath })
          .where(eq(schema.credentials.id, official.credential.id));
      }
    }

    const assetRecord = {
      id: assetId,
      assetType,
      storagePath: upload.storagePath,
      publicUrl: assetType === "reference_face" ? undefined : upload.publicUrl,
      mimeType: upload.mimeType,
      fileSize: upload.fileSize,
      isVerified: true,
      createdAt: now.toISOString(),
    };

    const assets = this.memoryAssets.get(officialId) || [];
    assets.push(assetRecord);
    this.memoryAssets.set(officialId, assets);

    await this.auditService.log({
      actorUserId: adminUserId,
      actorRole: "demo_admin",
      action: "DEMO_ASSET_UPLOADED",
      resourceType: "demo_asset",
      resourceId: assetId,
      outcome: "success",
      metadata: { officialId, assetType, storagePath: upload.storagePath },
    });

    return assetRecord;
  }

  /**
   * Returns the permanent credential QR for an official.
   *
   * This QR is STABLE — derived from the credential reference.
   * It does not expire, does not change across verification sessions,
   * and is suitable for printing on a physical ID card.
   *
   * Scanning this QR identifies the credential; it does NOT itself verify the holder.
   */
  async getCredentialQr(officialId: string): Promise<{
    credentialReference: string;
    qrUri: string;
    qrDataUrl: string;
  }> {
    const official = await this.getOfficial(officialId);
    if (!official.credential) {
      throw new NotFoundException("Official has no linked credential");
    }

    return this.qrPresentationService.getPermanentCredentialQr(official.credential.reference);
  }
}
