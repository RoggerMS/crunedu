import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { createHash } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { ADMIN_STEP_UP_KEY } from "../decorators/require-admin-step-up.decorator";

export interface AdminSessionPayload {
  id: number;
  userId: number;
  expiresAt: Date;
}

export type AdminAuthenticatedRequest = Request & {
  user?: { sub: number; role?: string };
  adminSession?: AdminSessionPayload;
};

@Injectable()
export class AdminStepUpGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(ADMIN_STEP_UP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) return true;

    const request = context.switchToHttp().getRequest<AdminAuthenticatedRequest>();
    const token = request.headers["x-admin-session"] as string | undefined;

    if (!token) {
      throw new ForbiddenException("Esta acción requiere reautenticación administrativa.");
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    });

    if (!session || session.revokedAt) {
      throw new ForbiddenException("La sesión administrativa fue revocada. Vuelve a reautenticarte.");
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException("La sesión administrativa expiró. Vuelve a reautenticarte.");
    }

    if (request.user?.sub && session.userId !== request.user.sub) {
      throw new ForbiddenException("La sesión administrativa no pertenece al usuario actual.");
    }

    await this.prisma.adminSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    request.adminSession = {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
    };

    return true;
  }
}
