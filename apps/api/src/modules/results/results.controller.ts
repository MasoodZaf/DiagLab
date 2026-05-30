import { Body, Controller, Param, Patch, Query } from "@nestjs/common";
import { userRoles, type UserRole } from "@lab/contracts";
import { PlatformDataService } from "../platform-data/platform-data.service";
import { TenantsService } from "../tenants/tenants.service";

type ResultValidationRequest = {
  actorRole: UserRole;
  actorName: string;
  branchName?: string;
};

@Controller("results")
export class ResultsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly platformStore: PlatformDataService
  ) {}

  @Patch(":resultId/validate")
  validateResult(@Query("tenant") tenantSlug = "lumen", @Param("resultId") resultId: string, @Body() body: ResultValidationRequest) {
    this.assertRole(body.actorRole);
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return this.platformStore.validateResult(tenant.id, resultId, {
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
