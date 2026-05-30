import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { userRoles, type InvoiceRecord, type UserRole } from "@lab/contracts";
import { PlatformDataService } from "../platform-data/platform-data.service";
import { TenantsService } from "../tenants/tenants.service";

type CreateOrderRequest = {
  actorRole: UserRole;
  actorName: string;
  branchName: string;
  fullName: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  sex: "female" | "male" | "other";
  scheduledAt: string;
  channel: "walk_in" | "portal" | "whatsapp" | "home_collection";
  tests: string[];
  homeCollection: boolean;
  totalAmount: number;
  currency: InvoiceRecord["currency"];
};

type CreateDraftReportRequest = {
  actorRole: UserRole;
  actorName: string;
  branchName?: string;
};

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly platformStore: PlatformDataService
  ) {}

  @Get()
  async listOrders(@Query("tenant") tenantSlug = "lumen") {
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return this.platformStore.listOrders(tenant.id);
  }

  @Post()
  async createOrder(@Query("tenant") tenantSlug = "lumen", @Body() body: CreateOrderRequest) {
    this.assertRole(body.actorRole);
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return this.platformStore.registerPatientAndOrder(tenant.id, {
      role: body.actorRole,
      displayName: body.actorName,
      branchName: body.branchName
    }, {
      fullName: body.fullName,
      phone: body.phone,
      nationalId: body.nationalId,
      dateOfBirth: body.dateOfBirth,
      sex: body.sex,
      branchName: body.branchName,
      scheduledAt: body.scheduledAt,
      channel: body.channel,
      tests: body.tests,
      homeCollection: body.homeCollection,
      totalAmount: body.totalAmount,
      currency: body.currency
    });
  }

  @Post(":orderId/report")
  createDraftReport(
    @Query("tenant") tenantSlug = "lumen",
    @Param("orderId") orderId: string,
    @Body() body: CreateDraftReportRequest
  ) {
    this.assertRole(body.actorRole);
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return this.platformStore.createDraftReportForOrder(tenant.id, orderId, {
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
