import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { config } from "../../config/env.config";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Authentication required for role-protected resource");
    }

    // Check if user is demo admin by email allowlist
    const isDemoAdmin =
      user.role === "demo_admin" ||
      user.role === "admin" ||
      config.demoAdminEmails.includes(user.email.toLowerCase());

    if (requiredRoles.includes("demo_admin") && isDemoAdmin) {
      return true;
    }

    if (requiredRoles.includes(user.role)) {
      return true;
    }

    throw new ForbiddenException(
      `Access denied: requires one of roles [${requiredRoles.join(", ")}], but user has role '${user.role}'`,
    );
  }
}
