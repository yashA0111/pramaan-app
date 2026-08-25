import { Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "../../database/database.service";
import * as schema from "../../database/schema";
import { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { UserProfileDto } from "./auth.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory fallback map for offline dev
  private readonly memoryUsers = new Map<string, UserProfileDto>([
    [
      "usr_citizen_001",
      {
        id: "usr_citizen_001",
        role: "citizen",
        displayName: "Citizen Demo User",
        email: "citizen@pramaan.dev",
        status: "active",
      },
    ],
    [
      "usr_admin_001",
      {
        id: "usr_admin_001",
        role: "demo_admin",
        displayName: "Pramaan Demo Admin",
        email: "admin@pramaan.dev",
        status: "active",
      },
    ],
    [
      "usr_arjun_mehta",
      {
        id: "usr_arjun_mehta",
        role: "official",
        displayName: "Inspector Arjun Mehta",
        email: "arjun.mehta@delhipolice.gov.in",
        status: "active",
      },
    ],
  ]);

  constructor(private readonly dbService: DatabaseService) {}

  async getCurrentUser(user: AuthenticatedUser | null): Promise<UserProfileDto> {
    if (!user) {
      return this.memoryUsers.get("usr_citizen_001")!;
    }

    if (this.dbService.db && this.dbService.isConnected) {
      const rows = await this.dbService.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, user.id))
        .limit(1);

      if (rows.length > 0) {
        const u = rows[0];
        return {
          id: u.id,
          role: u.role,
          displayName: u.displayName,
          email: u.email,
          status: u.status,
        };
      }
    }

    const fallback = this.memoryUsers.get(user.id);
    if (fallback) return fallback;

    return {
      id: user.id,
      role: user.role,
      displayName: user.displayName,
      email: user.email,
      status: "active",
    };
  }

  async loginDemo(role: "citizen" | "official" | "demo_admin", userId?: string): Promise<UserProfileDto> {
    let targetId = userId;
    if (!targetId) {
      if (role === "demo_admin") targetId = "usr_admin_001";
      else if (role === "official") targetId = "usr_arjun_mehta";
      else targetId = "usr_citizen_001";
    }

    if (this.dbService.db && this.dbService.isConnected) {
      const rows = await this.dbService.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, targetId))
        .limit(1);

      if (rows.length > 0) {
        const u = rows[0];
        return {
          id: u.id,
          role: u.role,
          displayName: u.displayName,
          email: u.email,
          status: u.status,
        };
      }
    }

    return (
      this.memoryUsers.get(targetId) || {
        id: targetId,
        role,
        displayName: `${role.toUpperCase()} User`,
        email: `${role}@pramaan.dev`,
        status: "active",
      }
    );
  }
}
