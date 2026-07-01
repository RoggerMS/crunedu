import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminPermissionGuard } from "./guards/admin-permission.guard";
import { AdminOnly } from "./decorators/admin-only.decorator";
import { AdminPermission } from "./decorators/admin-permission.decorator";
import { AdminDashboardService } from "./services/admin-dashboard.service";
import { AdminSystemService } from "./services/admin-system.service";
import { AdminRequest } from "./types/admin-request";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionGuard)
@AdminOnly()
export class AdminDashboardController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly system: AdminSystemService,
  ) {}

  @Get("dashboard")
  @AdminPermission("dashboard.read")
  async dashboard(@Req() _req: AdminRequest) {
    const [overview, reports, activity] = await Promise.all([
      this.dashboardService.getOverview(),
      this.dashboardService.getReportsSummary(),
      this.dashboardService.getRecentActivity(),
    ]);
    return { overview, reports, activity };
  }

  @Get("system/health")
  @AdminPermission("system.read")
  async health() {
    return this.system.getHealth();
  }

  @Get("system/config")
  @AdminPermission("system.read")
  async config() {
    return this.system.getConfig();
  }
}
