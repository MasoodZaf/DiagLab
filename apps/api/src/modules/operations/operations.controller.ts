import { Controller, Get, Query } from "@nestjs/common";
import { PlatformDataService } from "../platform-data/platform-data.service";
import { TenantsService } from "../tenants/tenants.service";

@Controller("operations")
export class OperationsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly platformStore: PlatformDataService
  ) {}

  @Get("snapshot")
  async getSnapshot(@Query("tenant") tenantSlug = "lumen") {
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return {
      tenant,
      snapshot: await this.platformStore.getSnapshot(tenant.id)
    };
  }

  @Get("dashboard")
  async getDashboard(@Query("tenant") tenantSlug = "lumen") {
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    const snapshot = await this.platformStore.getSnapshot(tenant.id);

    return {
      tenantId: tenant.id,
      patientCount: snapshot.patients.length,
      orderCount: snapshot.orders.length,
      awaitingRelease: snapshot.orders.filter((order) => order.status === "awaiting_release").length,
      criticalAlerts: snapshot.criticalAlerts.filter((alert) => alert.status === "open").length,
      unpaidInvoices: snapshot.invoices.filter((invoice) => invoice.status !== "paid").length
    };
  }
}
