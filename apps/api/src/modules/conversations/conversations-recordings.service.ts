import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface EgressClient {
  startRoomCompositeEgress: (req: unknown) => Promise<{ egressId: string }>;
  stopEgress: (egressId: string) => Promise<unknown>;
}

@Injectable()
export class ConversationsRecordingsService {
  private readonly logger = new Logger(ConversationsRecordingsService.name);
  private readonly egressEnabled: boolean;
  private egressClient: EgressClient | null = null;

  constructor(private readonly config: ConfigService) {
    this.egressEnabled = Boolean(this.config.get<string>("LIVEKIT_EGRESS_ENABLED") ?? "false");
    if (this.egressEnabled) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { EgressClient } = require("livekit-server-sdk");
        const host = this.config.get<string>("LIVEKIT_URL") ?? "ws://localhost:7880";
        const apiKey = this.config.get<string>("LIVEKIT_API_KEY") ?? "devkey";
        const apiSecret = this.config.get<string>("LIVEKIT_API_SECRET") ?? "secret";
        this.egressClient = new EgressClient(host, apiKey, apiSecret);
      } catch (error) {
        this.logger.warn(`LiveKit Egress no disponible: ${(error as Error).message}`);
      }
    }
  }

  isEgressAvailable(): boolean {
    return this.egressEnabled && this.egressClient !== null;
  }

  async startRecording(roomName: string, outputPath: string): Promise<string | null> {
    if (!this.egressClient) {
      this.logger.warn("Egress no disponible: grabación no iniciada.");
      return null;
    }
    try {
      const req = {
        roomName,
        file: {
          filePath: outputPath,
          fileFormat: "mp4",
        },
        audioOnly: true,
      };
      const result = await this.egressClient.startRoomCompositeEgress(req);
      return result.egressId;
    } catch (error) {
      this.logger.error(`Error al iniciar grabación: ${(error as Error).message}`);
      return null;
    }
  }

  async stopRecording(egressId: string): Promise<void> {
    if (!this.egressClient) return;
    try {
      await this.egressClient.stopEgress(egressId);
    } catch (error) {
      this.logger.error(`Error al detener grabación: ${(error as Error).message}`);
    }
  }
}
