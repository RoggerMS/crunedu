import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { CommunitiesController } from "./communities.controller";
import { CommunitiesService } from "./communities.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "change_this_local_secret",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
    }),
  ],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
})
export class CommunitiesModule {}
