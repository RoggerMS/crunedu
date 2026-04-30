import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { DevSecurityService } from "../../core/dev-security.service";
import { Request } from "express";

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly devSecurity: DevSecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      if (this.devSecurity.isRelaxedAuthEnabled()) {
        request.user = { sub: 1, email: "dev@crunedu.local", role: "ADMIN" };
        return true;
      }
      throw new UnauthorizedException("Token de autenticación inválido.");
    }

    const token = authHeader.slice(7).trim();

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = payload;
      return true;
    } catch {
      if (this.devSecurity.isRelaxedAuthEnabled()) {
        request.user = { sub: 1, email: "dev@crunedu.local", role: "ADMIN" };
        return true;
      }
      throw new UnauthorizedException("Token expirado o inválido.");
    }
  }
}
