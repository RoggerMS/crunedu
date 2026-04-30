import { Module } from "@nestjs/common";
import { JwtSharedModule } from "../auth/jwt-shared.module";
import { PostsController } from "./posts.controller";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { PostsService } from "./posts.service";
import { ObservabilityModule } from "../observability/observability.module";

@Module({
  imports: [
    ObservabilityModule,
    JwtSharedModule
  ],
  controllers: [PostsController],
  providers: [PostsService, JwtAuthGuard],
})
export class PostsModule {}
