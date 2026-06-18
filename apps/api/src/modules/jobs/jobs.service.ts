import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "redis";

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private redis: ReturnType<typeof createClient> | null = null;

  constructor(@Optional() private readonly config?: ConfigService) {}

  async onModuleInit() {
    const url = this.config?.get<string>("REDIS_URL") ?? process.env.REDIS_URL ?? "redis://localhost:6379";
    const client = createClient({ url });
    client.on("error", (error) => this.logger.warn(`Redis unavailable: ${String(error)}`));
    try {
      await client.connect();
      this.redis = client;
    } catch {
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    const client = this.redis;
    this.redis = null;
    if (!client?.isOpen) return;

    try {
      await client.quit();
    } catch {
      await client.disconnect().catch(() => undefined);
    }
  }

  async enqueueNotification(payload: Record<string, unknown>) {
    await this.enqueue("jobs:notifications", payload);
  }

  async enqueueRankingRecalculation(payload: Record<string, unknown>) {
    await this.enqueue("jobs:ranking", payload);
  }

  private async enqueue(queueName: string, payload: Record<string, unknown>) {
    if (!this.redis) return;
    await this.redis.rPush(queueName, JSON.stringify({ payload, createdAt: new Date().toISOString() }));
  }
}
