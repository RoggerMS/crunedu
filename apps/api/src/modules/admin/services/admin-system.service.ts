import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { createClient } from "redis";

@Injectable()
export class AdminSystemService {
  private readonly logger = new Logger(AdminSystemService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getHealth() {
    const [api, postgres, redis, minio, livekit, jobs] = await Promise.all([
      Promise.resolve({ status: "ok" as const, name: "API", detail: "crunedu-api running" }),
      this.checkPostgres(),
      this.checkRedis(),
      this.checkMinio(),
      this.checkLiveKit(),
      this.checkJobs(),
    ]);

    return {
      services: [api, postgres, redis, minio, livekit, jobs],
      version: this.config.get<string>("npm_package_version") ?? "0.1.0",
      nodeEnv: this.config.get<string>("NODE_ENV") ?? "development",
      timestamp: new Date().toISOString(),
    };
  }

  async getConfig() {
    return {
      modules: {
        feed: true,
        communities: true,
        conversar: this.config.get<string>("LIVEKIT_ENABLED") === "true",
        moments: true,
        store: true,
        university: true,
      },
      limits: {
        maxFeaturedPerArea: 10,
        promotionMaxActivePerPlacement: 3,
        adminSessionMinutes: 20,
        bulkActionMaxItems: 50,
      },
    };
  }

  private async checkPostgres() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok" as const, name: "PostgreSQL", detail: "connection ok" };
    } catch (error) {
      return { status: "down" as const, name: "PostgreSQL", detail: (error as Error).message };
    }
  }

  private async checkRedis() {
    const url = this.config.get<string>("REDIS_URL") ?? "redis://localhost:6379";
    const client = createClient({ url, socket: { connectTimeout: 2000 } });
    try {
      client.on("error", () => undefined);
      await client.connect();
      await client.ping();
      return { status: "ok" as const, name: "Redis", detail: "pong" };
    } catch (error) {
      return { status: "down" as const, name: "Redis", detail: (error as Error).message };
    } finally {
      try { if (client.isOpen) await client.quit(); } catch { /* ignore */ }
    }
  }

  private async checkMinio() {
    const endpoint = this.config.get<string>("MINIO_ENDPOINT") ?? "minio";
    const bucket = this.config.get<string>("MINIO_BUCKET") ?? "crunedu-local";
    return {
      status: "configured" as const,
      name: "MinIO",
      detail: `endpoint=${endpoint} bucket=${bucket}`,
    };
  }

  private async checkLiveKit() {
    const enabled = this.config.get<string>("LIVEKIT_ENABLED") === "true";
    return {
      status: enabled ? ("configured" as const) : ("disabled" as const),
      name: "LiveKit",
      detail: enabled ? "enabled" : "disabled",
    };
  }

  private async checkJobs() {
    return { status: "configured" as const, name: "Jobs/Queues", detail: "redis-backed queues" };
  }
}
