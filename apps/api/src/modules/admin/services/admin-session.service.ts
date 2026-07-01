import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { compare } from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminAuditService } from "./admin-audit.service";

const SESSION_TTL_MS = 20 * 60 * 1000;

@Injectable()
export class AdminSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AdminAuditService,
  ) {}

  async create(userId: number, password: string, meta: { ip?: string; userAgent?: string } = {}) {
    if (!password) throw new BadRequestException("La contraseña es obligatoria.");

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, passwordHash: true },
    });

    if (!user) throw new UnauthorizedException("Usuario no encontrado.");
    if (user.role !== "ADMIN") throw new ForbiddenException("Solo administradores pueden iniciar sesión administrativa.");

    const valid = await compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Contraseña incorrecta.");

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

    await this.prisma.adminSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ipHash: meta.ip ? createHash("sha256").update(meta.ip).digest("hex") : null,
        userAgentHash: meta.userAgent ? createHash("sha256").update(meta.userAgent).digest("hex") : null,
      },
    });

    await this.audit.record(userId, "ADMIN_SESSION_CREATE", "admin-session", {
      targetType: "AdminSession",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return { token, expiresAt };
  }

  async listActive(userId: number) {
    const now = new Date();
    const sessions = await this.prisma.adminSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
        ipHash: true,
        userAgentHash: true,
      },
    });
    return { sessions };
  }

  async revoke(userId: number, sessionId: number, meta: { ip?: string; userAgent?: string } = {}) {
    const session = await this.prisma.adminSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new BadRequestException("Sesión no encontrada.");
    if (session.userId !== userId) throw new ForbiddenException("No puedes revocar sesiones de otros administradores.");

    await this.prisma.adminSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.audit.record(userId, "ADMIN_SESSION_REVOKE", "admin-session", {
      targetType: "AdminSession",
      targetId: sessionId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return { revoked: true };
  }

  async revokeAll(userId: number, meta: { ip?: string; userAgent?: string } = {}) {
    const result = await this.prisma.adminSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit.record(userId, "ADMIN_SESSION_REVOKE_ALL", "admin-session", {
      targetType: "AdminSession",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return { revoked: result.count };
  }
}
