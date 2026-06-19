import { Module } from "@nestjs/common";
import { JwtSharedModule } from "../auth/jwt-shared.module";
import { UniversityController } from "./university.controller";
import { UniversityService } from "./university.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule, JwtSharedModule],
  controllers: [UniversityController],
  providers: [UniversityService],
})
export class UniversityModule {}
