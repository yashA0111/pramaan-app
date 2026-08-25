import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { DatabaseService } from "../../database/database.service";
import * as schema from "../../database/schema";

export interface LogAuditEventDto {
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome: "success" | "failure" | "denied" | "error";
  requestId?: string | null;
  ipContext?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly dbService: DatabaseService) {}

  async log(event: LogAuditEventDto): Promise<void> {
    const id = `aud_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    const sanitizedMetadata = event.metadata ? { ...event.metadata } : {};

    // Remove any sensitive keys if present
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.secret;
    delete sanitizedMetadata.biometricImage;

    this.logger.log(
      `AUDIT [${event.action}] outcome=${event.outcome} actor=${event.actorUserId || "anonymous"} res=${event.resourceType}:${event.resourceId || "*"} req=${event.requestId || "-"}`,
    );

    if (!this.dbService.db || !this.dbService.isConnected) {
      return;
    }

    try {
      await this.dbService.db.insert(schema.auditEvents).values({
        id,
        occurredAt: new Date(),
        actorUserId: event.actorUserId || null,
        actorRole: event.actorRole || null,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId || null,
        outcome: event.outcome,
        requestId: event.requestId || null,
        ipContext: event.ipContext || null,
        metadataJson: sanitizedMetadata,
      });
    } catch (err: any) {
      this.logger.error(`Failed to write audit event to DB: ${err.message}`);
    }
  }
}
