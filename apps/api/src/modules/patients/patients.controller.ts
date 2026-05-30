import { Controller, Get, Query } from "@nestjs/common";
import { PlatformDataService } from "../platform-data/platform-data.service";
import { TenantsService } from "../tenants/tenants.service";

@Controller("patients")
export class PatientsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly platformStore: PlatformDataService
  ) {}

  @Get()
  async listPatients(@Query("tenant") tenantSlug = "lumen") {
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    const snapshot = await this.platformStore.getSnapshot(tenant.id);

    return snapshot.patients.map((patient) => {
      const patientOrders = snapshot.orders.filter((order) => order.patientId === patient.id);
      const latestInvoice = snapshot.invoices.find((invoice) => invoice.orderId === patientOrders[0]?.id);

      return {
        ...patient,
        orders: patientOrders,
        latestInvoice
      };
    });
  }
}
