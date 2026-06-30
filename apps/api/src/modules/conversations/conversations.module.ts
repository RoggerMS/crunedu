import { Module } from "@nestjs/common";
import { JwtSharedModule } from "../auth/jwt-shared.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";
import { ConversationsPermissionsService } from "./conversations-permissions.service";
import { ConversationsLivekitService } from "./conversations-livekit.service";
import { ConversationsRecordingsService } from "./conversations-recordings.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";

@Module({
  imports: [PrismaModule, JwtSharedModule],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    ConversationsPermissionsService,
    ConversationsLivekitService,
    ConversationsRecordingsService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
