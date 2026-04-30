import { Module } from "@nestjs/common";
import { JwtSharedModule } from "../auth/jwt-shared.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { ObservabilityModule } from "../observability/observability.module";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    ObservabilityModule,
    JwtSharedModule
  ],
})
export class UsersModule {}
