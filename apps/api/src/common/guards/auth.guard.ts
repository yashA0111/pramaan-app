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

    // Check header or cookie for session / user identity
    const authHeader = request.headers["authorization"];
    const customUserId = request.headers["x-user-id"];
    const customRole = request.headers["x-demo-role"] || request.headers["x-user-role"];
    const customEmail = request.headers["x-user-email"];

    let user: AuthenticatedUser | null = null;

    if (customUserId) {
      const email = (customEmail as string) || `${customUserId}@pramaan.dev`;
      const isDemoAdmin =
        customRole === "demo_admin" ||
        customRole === "admin" ||
        config.demoAdminEmails.includes(email.toLowerCase());

      user = {
        id: customUserId as string,
        role: isDemoAdmin ? "demo_admin" : (customRole as any) || "citizen",
        email,
        displayName: (request.headers["x-user-name"] as string) || "Authenticated User",
      };
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      // Handle simple token or bearer formatting
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
    } else {
      // Default dev fallback citizen context
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
