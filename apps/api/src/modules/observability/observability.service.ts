import { Injectable } from "@nestjs/common";

interface EndpointMetric {
  total: number;
  errors: number;
  durationsMs: number[];
}

@Injectable()
export class ObservabilityService {
  private readonly endpointMetrics = new Map<string, EndpointMetric>();
  private readonly activeSessions = new Map<number, number>();
  private readonly productCounters = {
    postsCreated: 0,
    commentsCreated: 0,
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

  recordPostCreated(userId: number): void {
    this.productCounters.postsCreated += 1;
    this.markRetentionActivity(userId);
  }

  recordCommentCreated(userId: number): void {
    this.productCounters.commentsCreated += 1;
    this.markRetentionActivity(userId);
  }

  registerUserInCohort(userId: number, createdAt: Date): void {
    const cohort = createdAt.toISOString().slice(0, 7);
    const users = this.signupCohorts.get(cohort) ?? new Set<number>();
    users.add(userId);
    this.signupCohorts.set(cohort, users);
  }

  snapshot() {
    const endpointMetrics = Array.from(this.endpointMetrics.entries()).map(([endpoint, value]) => {
      const p95LatencyMs = this.calculatePercentile(value.durationsMs, 95);
      return {
        endpoint,
        throughput: value.total,
        errorRate: value.total ? Number((value.errors / value.total).toFixed(4)) : 0,
        p95LatencyMs,
      };
    });

    return {
      technical: endpointMetrics,
      product: {
        postsCreated: this.productCounters.postsCreated,
        commentsCreated: this.productCounters.commentsCreated,
        activeSessions: this.getActiveSessionsCount(),
        retentionByCohort: this.getRetentionByCohort(),
      },
      generatedAt: new Date().toISOString(),
    };
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
