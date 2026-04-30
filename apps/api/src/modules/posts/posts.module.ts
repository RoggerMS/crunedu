import { Module } from "@nestjs/common";
import { JwtSharedModule } from "../auth/jwt-shared.module";
import { PostsController } from "./posts.controller";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { PostsService } from "./posts.service";
import { ObservabilityModule } from "../observability/observability.module";

@Module({
  imports: [
    ObservabilityModule,
    JwtSharedModule
  ],
  controllers: [PostsController],
  providers: [PostsService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class PostsModule {}
