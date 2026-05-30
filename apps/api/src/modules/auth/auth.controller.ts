import { Controller, Get, Query } from "@nestjs/common";
import { userRoles, type UserRole } from "@lab/contracts";
import { getSessionActor } from "@lab/demo-data";
import { TenantsService } from "../tenants/tenants.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get("session")
  getSession(@Query("tenant") tenantSlug = "lumen", @Query("role") role = "receptionist") {
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    const sessionRole = userRoles.includes(role as UserRole) ? (role as UserRole) : "receptionist";

    return {
      tenant,
      actor: getSessionActor(tenant.id, sessionRole)
    };
  }
}
