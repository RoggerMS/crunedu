import { Module } from "@nestjs/common";
import { JwtSharedModule } from "../auth/jwt-shared.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CacheModule } from "../cache/cache.module";
import { MomentsController } from "./moments.controller";
import { MomentsService } from "./moments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";

@Module({
  imports: [PrismaModule, JwtSharedModule, CacheModule],
  controllers: [MomentsController],
  providers: [MomentsService, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [MomentsService],
})
export class MomentsModule {}
