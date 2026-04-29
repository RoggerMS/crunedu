import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { CommunitiesModule } from "./modules/communities/communities.module";
import { CacheModule } from "./modules/cache/cache.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { HealthModule } from "./modules/health/health.module";
import { MarketplaceModule } from "./modules/marketplace/marketplace.module";
import { PostsModule } from "./modules/posts/posts.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { QuestionsModule } from "./modules/questions/questions.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SearchModule } from "./modules/search/search.module";
import { UsersModule } from "./modules/users/users.module";
import { ObservabilityModule } from "./modules/observability/observability.module";
import { RateLimitGuard } from "./modules/core/rate-limit.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    MarketplaceModule,
    ReportsModule,
    SearchModule,
    ObservabilityModule,
  ],
  providers: [RateLimitGuard],
})
export class AppModule {}
