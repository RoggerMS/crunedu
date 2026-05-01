import { Global, Module } from "@nestjs/common";
import { DevSecurityService } from "./dev-security.service";

@Global()
@Module({
  providers: [DevSecurityService],
  exports: [DevSecurityService],
})
export class CoreModule {}
