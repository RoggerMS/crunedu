import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client as MinioClient } from "minio";

export interface UploadResult {
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export type StorageFolder = "avatars" | "covers";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client!: MinioClient;
  private bucket!: string;
  private readonly serveBase: string;

  constructor(private readonly config: ConfigService) {
    this.serveBase = this.config.get<string>("SERVE_BASE_URL") ?? "http://localhost:4000/api";
  }

  async onModuleInit() {
    const endpoint = this.config.get<string>("MINIO_ENDPOINT") ?? "minio";
    const port = parseInt(this.config.get<string>("MINIO_PORT") ?? "9000", 10);
    const useSSL = this.config.get<string>("MINIO_USE_SSL") === "true";
    const accessKey = this.config.get<string>("MINIO_ROOT_USER") ?? "crunedu_minio";
    const secretKey = this.config.get<string>("MINIO_ROOT_PASSWORD") ?? "crunedu_minio_password";
    this.bucket = this.config.get<string>("MINIO_BUCKET") ?? "crunedu-local";

    this.client = new MinioClient({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, "us-east-1");
        this.logger.log(`Created MinIO bucket: ${this.bucket}`);
      }
    } catch (error) {
      this.logger.error(`MinIO init failed: ${(error as Error).message}. Falling back gracefully.`);
    }
  }

  private generateKey(folder: StorageFolder, ext: string): string {
    const random = Math.random().toString(36).slice(2, 10);
    const ts = Date.now();
    return `${folder}/${ts}-${random}.${ext}`;
  }

  async upload(folder: StorageFolder, buffer: Buffer, mimeType: string, ext: string): Promise<UploadResult> {
    const storageKey = this.generateKey(folder, ext);
    try {
      await this.client.putObject(this.bucket, storageKey, buffer, buffer.length, {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=86400",
      });
    } catch (error) {
      this.logger.error(`MinIO upload failed: ${(error as Error).message}`);
      throw error;
    }
    const filename = storageKey.split("/").pop() ?? storageKey;
    return {
      storageKey,
      publicUrl: `/api/users/${folder}/${filename}`,
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, storageKey);
    } catch (error) {
      this.logger.warn(`MinIO delete failed for ${storageKey}: ${(error as Error).message}`);
    }
  }

  async getObject(storageKey: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, storageKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async statObject(storageKey: string) {
    return this.client.statObject(this.bucket, storageKey);
  }
}
