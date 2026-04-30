import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PostsController } from "./posts.controller";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { PostsService } from "./posts.service";
import { ObservabilityModule } from "../observability/observability.module";

@Module({
  imports: [
    ObservabilityModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "change_this_local_secret",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService, JwtAuthGuard],
})
export class PostsModule {}
