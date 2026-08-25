import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DatabaseService } from "../../database/database.service";

@ApiTags("Health & Diagnostics")
@Controller("health")
export class HealthController {
  constructor(private readonly dbService: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: "Liveness probe" })
  @ApiResponse({ status: 200 })
  getLiveness() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "pramaan-api",
      version: "0.2.0",
    };
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness probe verifying database connectivity" })
  @ApiResponse({ status: 200 })
  async getReadiness() {
    let dbStatus = "disconnected";
    let dbLatencyMs: number | null = null;

    if (this.dbService.client && this.dbService.isConnected) {
      const start = Date.now();
      try {
        await this.dbService.client`SELECT 1`;
        dbLatencyMs = Date.now() - start;
        dbStatus = "connected";
      } catch {
        dbStatus = "error";
      }
    }

    return {
      status: dbStatus === "connected" ? "ready" : "degraded",
      timestamp: new Date().toISOString(),
      infrastructure: {
        database: {
          type: "PostgreSQL (Supabase)",
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
    };
  }
}
