import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { config } from "../../config/env.config";
import { AuthenticatedUser } from "../decorators/current-user.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers["authorization"];
    const customUserId = request.headers["x-user-id"];
    const claimedRole = request.headers["x-demo-role"] || request.headers["x-user-role"];
    const customEmail = request.headers["x-user-email"];
    const adminKey = request.headers["x-demo-admin-key"] || request.headers["x-admin-key"];

    let user: AuthenticatedUser | null = null;

    // 1. Bearer Token Authentication
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token.startsWith("admin_") || token.includes("admin")) {
        user = {
          id: "usr_admin_001",
          role: "demo_admin",
          email: "admin@pramaan.dev",
          displayName: "Pramaan Demo Admin",
        };
      } else if (token.startsWith("off_") || token.includes("official")) {
        user = {
          id: "usr_arjun_mehta",
          role: "official",
          email: "arjun.mehta@delhipolice.gov.in",
          displayName: "Inspector Arjun Mehta",
        };
      } else {
        user = {
          id: "usr_citizen_001",
          role: "citizen",
          email: "citizen@pramaan.dev",
          displayName: "Citizen Demo User",
        };
      }
    }
    // 2. Verified Admin Key (Development / Demo Operator Mode)
    else if (adminKey) {
      const configuredAdminKey = process.env.DEMO_ADMIN_API_KEY;
      const isValidKey = Boolean(configuredAdminKey) && adminKey === configuredAdminKey;
      if (isValidKey) {
        user = {
          id: (customUserId as string) || "usr_admin_001",
          role: "demo_admin",
          email: (customEmail as string) || "admin@pramaan.dev",
          displayName: (request.headers["x-user-name"] as string) || "Pramaan Demo Admin",
        };
      } else {
        user = {
          id: "usr_citizen_001",
          role: "citizen",
          email: "citizen@pramaan.dev",
          displayName: "Citizen Demo User",
        };
      }
    }
    // 3. User Header Identity (Protected against unverified demo_admin elevation)
    else if (customUserId) {
      const email = (customEmail as string) || `${customUserId}@pramaan.dev`;
      const isEmailAllowedAdmin = config.demoAdminEmails.includes(email.toLowerCase());

      // If claiming demo_admin without verified admin key or allowed admin email, downgrade to citizen
      let assignedRole: "citizen" | "official" | "demo_admin" = "citizen";
      if (claimedRole === "official") {
        assignedRole = "official";
      } else if ((claimedRole === "demo_admin" || claimedRole === "admin") && isEmailAllowedAdmin) {
        assignedRole = "demo_admin";
      }

      user = {
        id: customUserId as string,
        role: assignedRole,
        email,
        displayName: (request.headers["x-user-name"] as string) || "Authenticated User",
      };
    } else {
      // Default dev fallback context: non-privileged citizen
      user = {
        id: "usr_citizen_001",
        role: "citizen",
        email: "citizen@pramaan.dev",
        displayName: "Citizen Demo User",
      };
    }

    request.user = user;
    return true;
  }
}
