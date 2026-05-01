import { Injectable, Logger, OnModuleInit, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, RedisClientType } from "redis";

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);
  private redis: RedisClientType | null = null;

  constructor(@Optional() private readonly config?: ConfigService) {}

  async onModuleInit() {
    const url = this.config?.get<string>("REDIS_URL") ?? process.env.REDIS_URL ?? "redis://localhost:6379";
    this.redis = createClient({ url });
    this.redis.on("error", (error) => this.logger.warn(`Redis unavailable: ${String(error)}`));
    try {
      await this.redis.connect();
    } catch {
      this.redis = null;
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
