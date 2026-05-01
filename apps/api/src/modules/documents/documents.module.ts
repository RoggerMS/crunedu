import { Module } from "@nestjs/common";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { JwtSharedModule } from "../auth/jwt-shared.module";

@Module({
  imports: [PrismaModule, JwtSharedModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class DocumentsModule {}
