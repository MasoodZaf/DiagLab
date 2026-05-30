import { Body, Controller, Param, Post, Query } from "@nestjs/common";
import { userRoles, type UserRole } from "@lab/contracts";
import { PlatformDataService } from "../platform-data/platform-data.service";
import { TenantsService } from "../tenants/tenants.service";

type InvoicePaymentRequest = {
  actorRole: UserRole;
  actorName: string;
  branchName?: string;
  amount: number;
};

@Controller("invoices")
export class InvoicesController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly platformData: PlatformDataService
  ) {}

  @Post(":invoiceId/payments")
  recordPayment(@Query("tenant") tenantSlug = "lumen", @Param("invoiceId") invoiceId: string, @Body() body: InvoicePaymentRequest) {
    this.assertRole(body.actorRole);
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return this.platformData.recordInvoicePayment(tenant.id, invoiceId, Number(body.amount), {
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
