import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

export interface LiveKitGrantOptions {
  canPublish: boolean;
  canSubscribe: boolean;
  canPublishData: boolean;
  canUpdateOwnMetadata: boolean;
  hidden: boolean;
}

@Injectable()
export class ConversationsLivekitService {
  private readonly logger = new Logger(ConversationsLivekitService.name);
  private readonly url: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly enabled: boolean;
  private roomService: RoomServiceClient | null = null;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get<string>("LIVEKIT_URL") ?? "ws://localhost:7880";
    this.apiKey = this.config.get<string>("LIVEKIT_API_KEY") ?? "devkey";
    this.apiSecret = this.config.get<string>("LIVEKIT_API_SECRET") ?? "secret";
    this.enabled = Boolean(this.config.get<string>("LIVEKIT_ENABLED") ?? "true");
    if (this.enabled) {
      try {
        this.roomService = new RoomServiceClient(this.url, this.apiKey, this.apiSecret);
      } catch (error) {
        this.logger.warn(`LiveKit RoomServiceClient no inicializado: ${(error as Error).message}`);
      }
    }
  }

  isAvailable(): boolean {
    return this.enabled;
  }

  getUrl(): string {
    return this.url;
  }

  buildGrants(role: string): LiveKitGrantOptions {
    switch (role) {
      case "HOST":
      case "MODERATOR":
        return {
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          canUpdateOwnMetadata: true,
          hidden: false,
        };
      case "SPEAKER":
        return {
          canPublish: true,
          canSubscribe: true,
          canPublishData: false,
          canUpdateOwnMetadata: false,
          hidden: false,
        };
      case "LISTENER":
      default:
        return {
          canPublish: false,
          canSubscribe: true,
          canPublishData: false,
          canUpdateOwnMetadata: false,
          hidden: false,
        };
    }
  }

  async createToken(params: {
    roomName: string;
    identity: string;
    name: string;
    role: string;
    metadata?: string;
  }): Promise<string> {
    const grants = this.buildGrants(params.role);
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: params.identity,
      name: params.name,
      ttl: 60 * 60 * 4,
      metadata: params.metadata,
    });
    token.addGrant({
      room: params.roomName,
      roomJoin: true,
      ...grants,
    });
    return token.toJwt();
  }

  async removeParticipant(roomName: string, identity: string): Promise<void> {
    if (!this.roomService) return;
    try {
      await this.roomService.removeParticipant(roomName, identity);
    } catch (error) {
      this.logger.debug(`removeParticipant ${identity}: ${(error as Error).message}`);
    }
  }

  async muteParticipant(roomName: string, identity: string, muted: boolean): Promise<void> {
    if (!this.roomService) return;
    try {
      await this.roomService.mutePublishedTrack(roomName, identity, "", muted);
    } catch (error) {
      this.logger.debug(`muteParticipant ${identity}: ${(error as Error).message}`);
    }
  }

  async listParticipants(roomName: string): Promise<Array<{ identity: string; tracks: unknown[] }>> {
    if (!this.roomService) return [];
    try {
      const participants = await this.roomService.listParticipants(roomName);
      return participants.map((p) => ({ identity: p.identity, tracks: p.tracks }));
    } catch (error) {
      this.logger.debug(`listParticipants: ${(error as Error).message}`);
      return [];
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    if (!this.roomService) return;
    try {
      await this.roomService.deleteRoom(roomName);
    } catch (error) {
      this.logger.debug(`deleteRoom: ${(error as Error).message}`);
    }
  }
}
