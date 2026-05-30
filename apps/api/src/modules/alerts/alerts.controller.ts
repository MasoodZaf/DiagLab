import { Body, Controller, Param, Post, Query } from "@nestjs/common";
import { userRoles, type UserRole } from "@lab/contracts";
import { PlatformDataService } from "../platform-data/platform-data.service";
import { TenantsService } from "../tenants/tenants.service";

type AlertActionRequest = {
  actorRole: UserRole;
  actorName: string;
  branchName?: string;
};

@Controller("alerts")
export class AlertsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly platformStore: PlatformDataService
  ) {}

  @Post(":alertId/acknowledge")
  acknowledge(
    @Query("tenant") tenantSlug = "lumen",
    @Param("alertId") alertId: string,
    @Body() body: AlertActionRequest
  ) {
    this.assertRole(body.actorRole);
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return this.platformStore.acknowledgeCriticalAlert(tenant.id, alertId, {
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
