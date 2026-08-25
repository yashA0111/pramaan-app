import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { AuditService } from "../audit/audit.service";
import { DatabaseService } from "../../database/database.service";
import * as schema from "../../database/schema";
import {
  ConfirmationResolution,
  OfficialConfirmationModel,
} from "./confirmation.types";
import { MockNotificationAdapter } from "./mock-notification.adapter";

export interface CreateConfirmationRequestDto {
  sessionId: string;
  credentialReference: string;
  subjectName?: string;
  posting?: string;
  officialId?: string;
}

@Injectable()
export class ConfirmationService {
  private readonly logger = new Logger(ConfirmationService.name);

  // In-memory store for in-flight requests fallback
  private readonly memoryRequests = new Map<
    string,
    {
      id: string;
      sessionId: string;
      credentialReference: string;
      status: OfficialConfirmationModel["state"];
      routedTo: string;
      requestedAt: string;
      respondedAt: string | null;
      decision: string | null;
      decisionReason: string | null;
    }
  >();

  constructor(
    private readonly dbService: DatabaseService,
    private readonly notificationAdapter: MockNotificationAdapter,
    private readonly auditService: AuditService,
  ) {}

  async createRequest(
    dto: CreateConfirmationRequestDto,
    actorUserId?: string,
    requestId?: string,
  ): Promise<OfficialConfirmationModel> {
    const id = `req_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    const now = new Date();
    const requestedAt = now.toISOString();
    const routedTo = "District Control Room · Duty Officer desk";

    this.memoryRequests.set(dto.sessionId, {
      id,
      sessionId: dto.sessionId,
      credentialReference: dto.credentialReference,
      status: "pending",
      routedTo,
      requestedAt,
      respondedAt: null,
      decision: null,
      decisionReason: null,
    });

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        await this.dbService.db.insert(schema.officialConfirmationRequests).values({
          id,
          verificationSessionId: dto.sessionId,
          officialId: dto.officialId || null,
          status: "pending",
          routedTo,
          requestReference: `CONF-${dto.credentialReference}-${Date.now().toString(36).toUpperCase()}`,
          requestedAt: now,
          expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        });
      } catch (err: any) {
        this.logger.warn(`Failed to insert confirmation request in DB: ${err.message}`);
      }
    }

    await this.notificationAdapter.sendConfirmationAlert({
      requestId: id,
      credentialReference: dto.credentialReference,
      subjectName: dto.subjectName || "Official",
      posting: dto.posting || "District Unit",
      officialId: dto.officialId,
    });

    await this.auditService.log({
      actorUserId,
      actorRole: "citizen",
      action: "OFFICIAL_CONFIRMATION_REQUESTED",
      resourceType: "verification_session",
      resourceId: dto.sessionId,
      outcome: "success",
      requestId,
      metadata: { credentialReference: dto.credentialReference, requestId: id },
    });

    return {
      state: "pending",
      routedTo,
      requestedAt,
      respondedAt: null,
      reason: null,
    };
  }

  async pollRequest(
    sessionId: string,
    credentialReference: string,
  ): Promise<OfficialConfirmationModel> {
    const req = this.memoryRequests.get(sessionId);

    // If already settled in memory, return
    if (req && req.status !== "pending" && req.status !== "request_ready" && req.status !== "request_sent") {
      return {
        state: req.status,
        routedTo: req.routedTo,
        requestedAt: req.requestedAt,
        respondedAt: req.respondedAt,
        reason: req.decisionReason,
      };
    }

    const cleanRef = credentialReference.trim().toUpperCase();
    const requestedAtMs = req ? new Date(req.requestedAt).getTime() : Date.now();
    const elapsed = Date.now() - requestedAtMs;

    // Deterministic simulation based on scenario
    let targetOutcome: ConfirmationResolution = "accepted";
    if (cleanRef === "PRM-DEMO-0008") targetOutcome = "rejected";
    else if (cleanRef === "PRM-DEMO-0009") targetOutcome = "timeout";
    else if (cleanRef === "PRM-DEMO-0002" || cleanRef === "PRM-DEMO-0003" || cleanRef === "PRM-DEMO-0004" || cleanRef === "PRM-DEMO-0005") {
      targetOutcome = "failed";
    }

    // Wait thresholds
    const minWait =
      process.env.NODE_ENV === "test"
        ? 0
        : targetOutcome === "timeout"
          ? 8000
          : 2500;
    if (elapsed < minWait) {
      return {
        state: "pending",
        routedTo: req?.routedTo || "District Control Room · Duty Officer desk",
        requestedAt: req?.requestedAt || new Date().toISOString(),
        respondedAt: null,
        reason: null,
      };
    }

    // Settle
    const now = new Date().toISOString();
    let reason = "Duty officer confirmed the posting and the request.";
    if (targetOutcome === "rejected") reason = "Duty officer declined to confirm this request.";
    else if (targetOutcome === "timeout") reason = "No official responded within the request window.";
    else if (targetOutcome === "failed") reason = "The confirmation request could not be delivered.";

    const settledState = targetOutcome;

    if (req) {
      req.status = settledState;
      req.respondedAt = now;
      req.decision = settledState;
      req.decisionReason = reason;
    }

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        await this.dbService.db
          .update(schema.officialConfirmationRequests)
          .set({
            status: settledState,
            decision: settledState,
            decisionReason: reason,
            respondedAt: new Date(),
          })
          .where(eq(schema.officialConfirmationRequests.verificationSessionId, sessionId));
      } catch (err: any) {
        this.logger.warn(`Failed to update confirmation request in DB: ${err.message}`);
      }
    }

    return {
      state: settledState,
      routedTo: req?.routedTo || "District Control Room · Duty Officer desk",
      requestedAt: req?.requestedAt || now,
      respondedAt: now,
      reason,
    };
  }

  async recordOfficialDecision(
    requestId: string,
    decision: "accepted" | "rejected",
    reason: string,
    officialUserId: string,
  ): Promise<boolean> {
    const now = new Date().toISOString();

    let foundSessionId: string | null = null;
    for (const [sesId, item] of this.memoryRequests.entries()) {
      if (item.id === requestId) {
        item.status = decision;
        item.respondedAt = now;
        item.decision = decision;
        item.decisionReason = reason;
        foundSessionId = sesId;
        break;
      }
    }

    if (this.dbService.db && this.dbService.isConnected) {
      await this.dbService.db
        .update(schema.officialConfirmationRequests)
        .set({
          status: decision,
          decision,
          decisionReason: reason,
          respondedAt: new Date(),
        })
        .where(eq(schema.officialConfirmationRequests.id, requestId));
    }

    await this.auditService.log({
      actorUserId: officialUserId,
      actorRole: "official",
      action: decision === "accepted" ? "CONFIRMATION_ACCEPTED" : "CONFIRMATION_REJECTED",
      resourceType: "confirmation_request",
      resourceId: requestId,
      outcome: "success",
      metadata: { reason, verificationSessionId: foundSessionId },
    });

    return true;
  }

  async listPendingRequestsForOfficial(): Promise<any[]> {
    if (this.dbService.db && this.dbService.isConnected) {
      return this.dbService.db
        .select()
        .from(schema.officialConfirmationRequests)
        .where(eq(schema.officialConfirmationRequests.status, "pending"));
    }

    return Array.from(this.memoryRequests.values()).filter((r) => r.status === "pending");
  }
}
