import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { DevSecurityService } from "../../core/dev-security.service";
import { ADMIN_ONLY_KEY } from "../decorators/admin-only.decorator";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly devSecurity: DevSecurityService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY_KEY, [
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

    throw new ForbiddenException("Se requiere rol ADMIN para acceder a esta recurso.");
  }
}
