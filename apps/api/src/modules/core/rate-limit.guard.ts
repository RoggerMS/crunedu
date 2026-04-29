import { CanActivate, ExecutionContext, Injectable, HttpException } from "@nestjs/common";

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly bucket = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = `${req.ip}:${req.route?.path ?? req.url}`;
    const now = Date.now();
    const windowMs = 60_000;
    const max = req.method === "GET" ? 120 : 40;

    const hits = (this.bucket.get(key) ?? []).filter((ts) => ts > now - windowMs);
    if (hits.length >= max) throw new HttpException("Demasiadas solicitudes. Intenta nuevamente en un minuto.", 429);
    hits.push(now);
    this.bucket.set(key, hits);
    return true;
  }
}
