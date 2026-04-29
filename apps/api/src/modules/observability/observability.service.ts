import { Injectable } from "@nestjs/common";

interface EndpointMetric {
  total: number;
  errors: number;
  durationsMs: number[];
}

type ProductEventName = "login_success" | "post_created" | "comment_created" | "follow" | "unfollow";

@Injectable()
export class ObservabilityService {
  private readonly endpointMetrics = new Map<string, EndpointMetric>();
  private readonly activeSessions = new Map<number, number>();
  private readonly productCounters = {
    postsCreated: 0,
    commentsCreated: 0,
    loginsSuccessful: 0,
    follows: 0,
    unfollows: 0,
  };
  private readonly signupCohorts = new Map<string, Set<number>>();
  private readonly retainedUsersByCohort = new Map<string, Set<number>>();

  recordRequest(params: { endpoint: string; latencyMs: number; isError: boolean }): void {
    const current = this.endpointMetrics.get(params.endpoint) ?? { total: 0, errors: 0, durationsMs: [] };
    current.total += 1;
    if (params.isError) current.errors += 1;
    current.durationsMs.push(params.latencyMs);
    if (current.durationsMs.length > 5_000) current.durationsMs.shift();
    this.endpointMetrics.set(params.endpoint, current);
  }

  registerActiveSession(userId?: number): void {
    if (!userId) return;
    this.activeSessions.set(userId, Date.now());
  }

  recordLoginSuccessful(userId: number): void {
    this.productCounters.loginsSuccessful += 1;
    this.registerActiveSession(userId);
    this.logProductEvent("login_success", userId);
  }

  recordPostCreated(userId: number, postId?: number): void {
    this.productCounters.postsCreated += 1;
    this.markRetentionActivity(userId);
    this.logProductEvent("post_created", userId, { postId });
  }

  recordCommentCreated(userId: number, commentId?: number, postId?: number): void {
    this.productCounters.commentsCreated += 1;
    this.markRetentionActivity(userId);
    this.logProductEvent("comment_created", userId, { commentId, postId });
  }

  recordFollow(userId: number, targetUserId: number): void {
    this.productCounters.follows += 1;
    this.markRetentionActivity(userId);
    this.logProductEvent("follow", userId, { targetUserId });
  }

  recordUnfollow(userId: number, targetUserId: number): void {
    this.productCounters.unfollows += 1;
    this.markRetentionActivity(userId);
    this.logProductEvent("unfollow", userId, { targetUserId });
  }

  registerUserInCohort(userId: number, createdAt: Date): void {
    const cohort = createdAt.toISOString().slice(0, 7);
    const users = this.signupCohorts.get(cohort) ?? new Set<number>();
    users.add(userId);
    this.signupCohorts.set(cohort, users);
  }

  snapshot() {
    const endpointMetrics = this.getEndpointMetrics();

    return {
      technical: endpointMetrics,
      product: {
        postsCreated: this.productCounters.postsCreated,
        commentsCreated: this.productCounters.commentsCreated,
        loginsSuccessful: this.productCounters.loginsSuccessful,
        follows: this.productCounters.follows,
        unfollows: this.productCounters.unfollows,
        activeSessions: this.getActiveSessionsCount(),
        retentionByCohort: this.getRetentionByCohort(),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  dashboard() {
    const endpoints = this.getEndpointMetrics();
    const global = endpoints.reduce(
      (acc, endpoint) => ({
        throughput: acc.throughput + endpoint.throughput,
        errors: acc.errors + endpoint.errors,
      }),
      { throughput: 0, errors: 0 },
    );

    const globalErrorRate = global.throughput ? Number((global.errors / global.throughput).toFixed(4)) : 0;
    const alerts = this.evaluateAlerts(endpoints, globalErrorRate);

    return {
      title: "CrunEdu API - Dashboard operativo básico",
      generatedAt: new Date().toISOString(),
      summary: {
        throughputTotal: global.throughput,
        errorRateGlobal: globalErrorRate,
        activeAlerts: alerts.length,
      },
      endpoints,
      product: this.snapshot().product,
      alerts,
      thresholds: {
        endpointP95LatencyMs: 800,
        endpointErrorRate: 0.05,
        minimumThroughputPerEndpoint: 20,
      },
    };
  }

  private getEndpointMetrics() {
    return Array.from(this.endpointMetrics.entries()).map(([endpoint, value]) => {
      const p95LatencyMs = this.calculatePercentile(value.durationsMs, 95);
      return {
        endpoint,
        throughput: value.total,
        errors: value.errors,
        errorRate: value.total ? Number((value.errors / value.total).toFixed(4)) : 0,
        p95LatencyMs,
      };
    });
  }

  private evaluateAlerts(
    endpoints: Array<{ endpoint: string; throughput: number; errorRate: number; p95LatencyMs: number }>,
    globalErrorRate: number,
  ): Array<{ severity: "warning" | "critical"; metric: string; endpoint?: string; value: number; threshold: number; message: string }> {
    const alerts: Array<{ severity: "warning" | "critical"; metric: string; endpoint?: string; value: number; threshold: number; message: string }> = [];

    for (const endpoint of endpoints) {
      if (endpoint.throughput >= 20 && endpoint.p95LatencyMs > 800) {
        alerts.push({
          severity: "warning",
          metric: "p95_latency",
          endpoint: endpoint.endpoint,
          value: endpoint.p95LatencyMs,
          threshold: 800,
          message: `Latencia p95 elevada en ${endpoint.endpoint}`,
        });
      }
      if (endpoint.throughput >= 20 && endpoint.errorRate > 0.05) {
        alerts.push({
          severity: "critical",
          metric: "error_rate",
          endpoint: endpoint.endpoint,
          value: endpoint.errorRate,
          threshold: 0.05,
          message: `Tasa de error alta en ${endpoint.endpoint}`,
        });
      }
    }

    if (globalErrorRate > 0.08) {
      alerts.push({
        severity: "critical",
        metric: "global_error_rate",
        value: globalErrorRate,
        threshold: 0.08,
        message: "Tasa de error global crítica en la API.",
      });
    }

    return alerts;
  }

  private logProductEvent(event: ProductEventName, userId: number, payload?: Record<string, number | undefined>): void {
    console.log(JSON.stringify({ level: "info", message: "product_event", event, userId, payload: payload ?? {}, timestamp: new Date().toISOString() }));
  }

  private markRetentionActivity(userId: number): void {
    this.registerActiveSession(userId);
    for (const [cohort, users] of this.signupCohorts.entries()) {
      if (!users.has(userId)) continue;
      const retained = this.retainedUsersByCohort.get(cohort) ?? new Set<number>();
      retained.add(userId);
      this.retainedUsersByCohort.set(cohort, retained);
    }
  }

  private getActiveSessionsCount(): number {
    const activeWindowMs = 30 * 60 * 1000;
    const threshold = Date.now() - activeWindowMs;
    for (const [userId, ts] of this.activeSessions.entries()) {
      if (ts < threshold) this.activeSessions.delete(userId);
    }
    return this.activeSessions.size;
  }

  private getRetentionByCohort() {
    return Array.from(this.signupCohorts.entries()).map(([cohort, users]) => {
      const retained = this.retainedUsersByCohort.get(cohort)?.size ?? 0;
      return {
        cohort,
        users: users.size,
        retained,
        retentionRate: users.size ? Number((retained / users.size).toFixed(4)) : 0,
      };
    });
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return Number(sorted[Math.max(index, 0)].toFixed(2));
  }
}
