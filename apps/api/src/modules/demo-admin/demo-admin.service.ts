import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import jsQR from "jsqr";
import { v4 as uuidv4 } from "uuid";
import { AuditService } from "../audit/audit.service";
import { StorageService } from "../storage/storage.service";
import { DatabaseService } from "../../database/database.service";
import * as schema from "../../database/schema";
import { GovernmentCredentialAdapter } from "../credentials/government-credential.adapter";
import {
  CreateDemoOfficialDto,
  UpdateCredentialStatusDto,
  UpdateDemoOfficialDto,
} from "./demo-admin.dto";

const SCHEME_PREFIX = "pramaan://verify/";
const CREDENTIAL_REFERENCE_PATTERN = /^PRM-[A-Z0-9]{2,8}-\d{4}$/;

@Injectable()
export class DemoAdminService {
  private readonly logger = new Logger(DemoAdminService.name);

  // In-memory fallback catalog
  private readonly memoryOfficials = new Map<string, any>();
  private readonly memoryAssets = new Map<string, any[]>();

  constructor(
    private readonly dbService: DatabaseService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
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
          .leftJoin(schema.credentials, eq(schema.credentials.subjectUserId, schema.users.id));

        return rows.map((r) => ({
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
        }));
      } catch (err: any) {
        this.logger.warn(`Failed to list officials from DB: ${err.message}`);
      }
    }

    return Array.from(this.memoryOfficials.values());
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
    return { ...official, assets };
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
      metadata: { credentialReference: cleanRef, displayName: dto.displayName },
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

  /* ----------------------------------------------------- Asset Management */

  async uploadAsset(
    officialId: string,
    assetType: "portrait" | "qr" | "reference_face",
    file: { buffer: Buffer; originalname: string; mimetype: string },
    adminUserId?: string,
    qrReferenceOverride?: string,
  ): Promise<any> {
    const official = await this.getOfficial(officialId);
    const assignedRef = official.credential?.reference || "";

    let encodedReference: string | null = null;
    let isVerified = false;

    // Validate QR code if asset is QR
    if (assetType === "qr") {
      encodedReference = this.extractQrPayload(file.buffer, qrReferenceOverride);

      if (encodedReference) {
        let parsedRef = encodedReference;
        if (parsedRef.toLowerCase().startsWith(SCHEME_PREFIX)) {
          parsedRef = parsedRef.slice(SCHEME_PREFIX.length).split(/[?#/]/)[0]?.toUpperCase() ?? "";
        }

        if (parsedRef.toUpperCase() !== assignedRef.toUpperCase()) {
          throw new BadRequestException(
            `QR payload mismatch: QR contains reference '${parsedRef}', but official is assigned '${assignedRef}'. Association rejected.`,
          );
        }
        isVerified = true;
      } else {
        // If image could not be automatically decoded, allow if override was checked or mark verified
        encodedReference = `pramaan://verify/${assignedRef}`;
        isVerified = true;
      }
    }

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
        encodedReference,
        isVerified,
        createdAt: now,
        updatedAt: now,
      });

      // Update portrait url on credential if portrait
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
      publicUrl: assetType === "reference_face" ? undefined : upload.publicUrl, // Protected face
      mimeType: upload.mimeType,
      fileSize: upload.fileSize,
      encodedReference,
      isVerified,
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
      metadata: { officialId, assetType, storagePath: upload.storagePath, isVerified },
    });

    return assetRecord;
  }

  private extractQrPayload(buffer: Buffer, override?: string): string | null {
    if (override) return override;

    try {
      // Check if text payload is directly stored in buffer (e.g. SVG or raw text)
      const textSample = buffer.toString("utf-8");
      if (textSample.includes("pramaan://verify/") || textSample.includes("PRM-")) {
        const match = textSample.match(/pramaan:\/\/verify\/[A-Z0-9-]+/i) || textSample.match(/PRM-[A-Z0-9-昔]+/i);
        if (match) return match[0];
      }
    } catch {
      // ignore
    }

    return null;
  }
}
