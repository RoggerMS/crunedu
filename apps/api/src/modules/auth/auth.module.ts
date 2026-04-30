import { Module } from "@nestjs/common";
import { JwtSharedModule } from "./jwt-shared.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ObservabilityModule } from "../observability/observability.module";

@Module({
  imports: [
    ObservabilityModule,
    JwtSharedModule
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
