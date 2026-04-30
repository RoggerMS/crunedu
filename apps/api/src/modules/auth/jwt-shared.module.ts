import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "./guards/optional-jwt-auth.guard";
import { DevSecurityService } from "../core/dev-security.service";

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "change_this_local_secret",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
    }),
  ],
  providers: [JwtAuthGuard, OptionalJwtAuthGuard, DevSecurityService],
  exports: [JwtModule, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class JwtSharedModule {}
