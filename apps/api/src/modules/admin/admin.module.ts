import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CacheModule } from "../cache/cache.module";
import { StorageModule } from "../storage/storage.module";
import { CoreModule } from "../core/core.module";
import { AdminAuditController } from "./admin-audit.controller";
import { AdminCommunitiesController } from "./admin-communities.controller";
import { AdminContentController } from "./admin-content.controller";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminFeedController } from "./admin-feed.controller";
import { AdminOperationsController } from "./admin-operations.controller";
import { AdminPromotionsController } from "./admin-promotions.controller";
import { AdminReportsController } from "./admin-reports.controller";
import { AdminSessionController } from "./admin-session.controller";
import { AdminStoreController } from "./admin-store.controller";
import { AdminUsersController } from "./admin-users.controller";
import { PromotionsPublicController } from "./promotions-public.controller";
import { AdminGuard } from "./guards/admin.guard";
import { AdminPermissionGuard } from "./guards/admin-permission.guard";
import { AdminStepUpGuard } from "./guards/admin-step-up.guard";
import { AdminAuditService } from "./services/admin-audit.service";
import { AdminCommunitiesService } from "./services/admin-communities.service";
import { AdminContentService } from "./services/admin-content.service";
import { AdminDashboardService } from "./services/admin-dashboard.service";
import { AdminFeedService } from "./services/admin-feed.service";
import { AdminPlacementsService } from "./services/admin-placements.service";
import { AdminPromotionsService } from "./services/admin-promotions.service";
import { AdminReportsService } from "./services/admin-reports.service";
import { AdminSessionService } from "./services/admin-session.service";
import { AdminStoreService } from "./services/admin-store.service";
import { AdminSystemService } from "./services/admin-system.service";
import { MarketplaceModule } from "../marketplace/marketplace.module";
import { ConversationsModule } from "../conversations/conversations.module";

@Module({
  imports: [PrismaModule, CacheModule, StorageModule, CoreModule, MarketplaceModule, ConversationsModule],
  controllers: [
    AdminAuditController,
    AdminCommunitiesController,
    AdminContentController,
    AdminDashboardController,
    AdminFeedController,
    AdminOperationsController,
    AdminPromotionsController,
    AdminReportsController,
    AdminSessionController,
    AdminStoreController,
    AdminUsersController,
    PromotionsPublicController,
  ],
  providers: [
    AdminGuard,
    AdminPermissionGuard,
    AdminStepUpGuard,
    AdminAuditService,
    AdminCommunitiesService,
    AdminContentService,
    AdminDashboardService,
    AdminFeedService,
    AdminPlacementsService,
    AdminPromotionsService,
    AdminReportsService,
    AdminSessionService,
    AdminStoreService,
    AdminSystemService,
  ],
  exports: [AdminAuditService, AdminSessionService],
})
export class AdminModule {}
