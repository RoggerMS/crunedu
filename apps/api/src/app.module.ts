import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { CommunitiesModule } from "./modules/communities/communities.module";
import { CacheModule } from "./modules/cache/cache.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { DebatesModule } from "./modules/debates/debates.module";
import { HealthModule } from "./modules/health/health.module";
import { PostsModule } from "./modules/posts/posts.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { QuestionsModule } from "./modules/questions/questions.module";
import { UsersModule } from "./modules/users/users.module";
import { ObservabilityModule } from "./modules/observability/observability.module";
import { CoreModule } from "./modules/core/core.module";
import { RateLimitGuard } from "./modules/core/rate-limit.guard";
import { MarketplaceModule } from "./modules/marketplace/marketplace.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CoreModule,
    PrismaModule,
    CacheModule,
    JobsModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommunitiesModule,
    QuestionsModule,
    DocumentsModule,
    DebatesModule,
    MarketplaceModule,
    ObservabilityModule,
  ],
  providers: [RateLimitGuard],
})
export class AppModule {}
