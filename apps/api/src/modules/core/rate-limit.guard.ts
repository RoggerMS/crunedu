import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RATE_LIMIT_KEY, RateLimitOptions } from "./rate-limit.decorator";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  private readonly bucket = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const route = `${req.method}:${req.route?.path ?? req.url}`;
    const defaultOptions: RateLimitOptions = {
      windowMs: 60_000,
      maxPerIp: req.method === "GET" ? 120 : 40,
      message: "Demasiadas solicitudes. Intenta nuevamente en un minuto.",
    };

    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [context.getHandler(), context.getClass()]) ?? defaultOptions;
    const now = Date.now();
    const userId = req.user?.sub as number | undefined;
    const ip = req.ip ?? "unknown";

    this.enforceLimit(`ip:${route}:${ip}`, options.maxPerIp, options.windowMs, now, options.message, { route, scope: "ip", ip, userId });

    if (userId && options.maxPerUser) {
      this.enforceLimit(`user:${route}:${userId}`, options.maxPerUser, options.windowMs, now, options.message, { route, scope: "user", ip, userId });
    }

    return true;
  }

  private enforceLimit(key: string, maxEvents: number, windowMs: number, now: number, message: string, context: Record<string, string | number | undefined>) {
    const hits = (this.bucket.get(key) ?? []).filter((ts) => ts > now - windowMs);
    if (hits.length >= maxEvents) {
      console.warn(JSON.stringify({ level: "warn", message: "rate_limit_blocked", ...context, windowMs, maxEvents, timestamp: new Date(now).toISOString() }));
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }

    hits.push(now);
    this.bucket.set(key, hits);
  }
}
