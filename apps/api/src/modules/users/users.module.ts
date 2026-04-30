import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { ObservabilityModule } from "../observability/observability.module";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    ObservabilityModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "change_this_local_secret",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
    }),
  ],
})
export class UsersModule {}
