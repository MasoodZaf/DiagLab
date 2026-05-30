import { Body, Controller, Post, Query } from "@nestjs/common";
import type { MobileSyncRequest } from "@lab/contracts";
import { TenantsService } from "../tenants/tenants.service";
import { MobileSyncService } from "./mobile-sync.service";

@Controller("mobile-sync")
export class MobileSyncController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly mobileSync: MobileSyncService
  ) {}

  @Post("reconcile")
  reconcile(@Query("tenant") tenantSlug = "lumen", @Body() body: Omit<MobileSyncRequest, "tenantId"> & { tenantId?: string }) {
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return this.mobileSync.reconcile({
      ...body,
      tenantId: body.tenantId ?? tenant.id
    });
  }
}
