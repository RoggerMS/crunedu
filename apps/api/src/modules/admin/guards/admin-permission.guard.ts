import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { DevSecurityService } from "../../core/dev-security.service";
import {
  ADMIN_PERMISSION_KEY,
  AdminPermissionName,
} from "../decorators/admin-permission.decorator";

const MODERATOR_PERMISSIONS: AdminPermissionName[] = [
  "reports.read",
  "reports.manage",
  "users.read",
  "feed.manage",
  "questions.manage",
  "documents.manage",
  "moments.manage",
  "conversations.manage",
];

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly devSecurity: DevSecurityService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminPermissionName>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: { role?: string } }>();
    const role = request.user?.role;

    if (role === "ADMIN") return true;

    if (this.devSecurity.isAdminBypassEnabled()) {
      return true;
    }

    if (role === "MODERATOR" && MODERATOR_PERMISSIONS.includes(required)) {
      return true;
    }

    throw new ForbiddenException(`No tienes el permiso requerido: ${required}.`);
  }
}
