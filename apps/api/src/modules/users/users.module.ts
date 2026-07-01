import { Module } from "@nestjs/common";
import { JwtSharedModule } from "../auth/jwt-shared.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { ObservabilityModule } from "../observability/observability.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    ObservabilityModule,
    StorageModule,
    JwtSharedModule
  ],
})
export class UsersModule {}
