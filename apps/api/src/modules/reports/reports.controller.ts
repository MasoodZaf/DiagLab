import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { userRoles, type UserRole } from "@lab/contracts";
import { PlatformDataService } from "../platform-data/platform-data.service";
import { TenantsService } from "../tenants/tenants.service";

type ReportActionRequest = {
  actorRole: UserRole;
  actorName: string;
  branchName?: string;
};

type ReportAmendmentRequest = ReportActionRequest & {
  note: string;
};

@Controller("reports")
export class ReportsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly platformStore: PlatformDataService
  ) {}

  @Get()
  async listReports(@Query("tenant") tenantSlug = "lumen") {
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return this.platformStore.listReports(tenant.id);
  }

  @Post(":reportId/release")
  releaseReport(@Query("tenant") tenantSlug = "lumen", @Param("reportId") reportId: string, @Body() body: ReportActionRequest) {
    this.assertRole(body.actorRole);
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return this.platformStore.releaseReport(tenant.id, reportId, {
      role: body.actorRole,
      displayName: body.actorName,
      branchName: body.branchName
    });
  }

  @Post(":reportId/amend")
  amendReport(@Query("tenant") tenantSlug = "lumen", @Param("reportId") reportId: string, @Body() body: ReportAmendmentRequest) {
    this.assertRole(body.actorRole);
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return this.platformStore.amendReport(tenant.id, reportId, body.note, {
      role: body.actorRole,
      displayName: body.actorName,
      branchName: body.branchName
    });
  }

  private assertRole(role: UserRole) {
    if (!userRoles.includes(role)) {
      throw new Error(`Unknown role ${role}`);
    }
  }
}
