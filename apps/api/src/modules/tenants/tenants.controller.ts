import { Controller, Get, Param } from "@nestjs/common";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  listTenants() {
    return this.tenantsService.list();
  }

  @Get(":slug")
  getTenant(@Param("slug") slug: string) {
    return this.tenantsService.getBySlug(slug);
  }
}
