import { Module } from "@nestjs/common";
import { JwtSharedModule } from "../auth/jwt-shared.module";
import { CoreModule } from "../core/core.module";
import { UniversityController } from "./university.controller";
import { UniversityService } from "./university.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule, JwtSharedModule, CoreModule],
  controllers: [UniversityController],
  providers: [UniversityService],
})
export class UniversityModule {}
