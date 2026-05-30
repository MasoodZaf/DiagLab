import { Body, Controller, Param, Patch, Query } from "@nestjs/common";
import { sampleStatuses, userRoles, type SampleRecord, type UserRole } from "@lab/contracts";
import { PlatformDataService } from "../platform-data/platform-data.service";
import { TenantsService } from "../tenants/tenants.service";

type SampleTransitionRequest = {
  actorRole: UserRole;
  actorName: string;
  branchName?: string;
  nextStatus: SampleRecord["status"];
  checkpoint: string;
  reason?: string;
};

@Controller("samples")
export class SamplesController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly platformStore: PlatformDataService
  ) {}

  @Patch(":sampleId/status")
  transitionStatus(
    @Query("tenant") tenantSlug = "lumen",
    @Param("sampleId") sampleId: string,
    @Body() body: SampleTransitionRequest
  ) {
    this.assertRole(body.actorRole);
    this.assertSampleStatus(body.nextStatus);
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return this.platformStore.transitionSample(tenant.id, {
      role: body.actorRole,
      displayName: body.actorName,
      branchName: body.branchName
    }, {
      sampleId,
      nextStatus: body.nextStatus,
      checkpoint: body.checkpoint,
      reason: body.reason
    });
  }

  private assertRole(role: UserRole) {
    if (!userRoles.includes(role)) {
      throw new Error(`Unknown role ${role}`);
    }
  }

  private assertSampleStatus(status: SampleRecord["status"]) {
    if (!sampleStatuses.includes(status)) {
      throw new Error(`Unknown sample status ${status}`);
    }
  }
}
