import { Module } from "@nestjs/common";
import { ObservabilityService } from "./observability.service";
import { ObservabilityController } from "./observability.controller";

@Module({
  providers: [ObservabilityService],
  controllers: [ObservabilityController],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
