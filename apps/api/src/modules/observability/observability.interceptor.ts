import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { ObservabilityService } from "./observability.service";

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(private readonly observability: ObservabilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: { sub?: number } }>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    const requestId = request.headers["x-request-id"]?.toString() ?? randomUUID();
    const userId = request.user?.sub;
    const endpoint = `${request.method} ${request.route?.path ?? request.url}`;

    response.setHeader("x-request-id", requestId);

    return next.handle().pipe(
      tap({
        next: () => this.logRequest({ requestId, userId, endpoint, statusCode: response.statusCode, latencyMs: Date.now() - startedAt }),
        error: () => this.logRequest({ requestId, userId, endpoint, statusCode: response.statusCode || 500, latencyMs: Date.now() - startedAt, isError: true }),
      }),
    );
  }

  private logRequest(params: { requestId: string; userId?: number; endpoint: string; statusCode: number; latencyMs: number; isError?: boolean }): void {
    this.observability.recordRequest({ endpoint: params.endpoint, latencyMs: params.latencyMs, isError: Boolean(params.isError) || params.statusCode >= 400 });
    this.observability.registerActiveSession(params.userId);
    console.log(JSON.stringify({ level: params.isError ? "error" : "info", message: "http_request", ...params, timestamp: new Date().toISOString() }));
  }
}
