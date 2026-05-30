import { Injectable, NotFoundException } from "@nestjs/common";
import { tenantPresets } from "@lab/branding";

@Injectable()
export class TenantsService {
  list() {
    return Object.values(tenantPresets);
  }

  getBySlug(slug: string) {
    const tenant = tenantPresets[slug];

    if (!tenant) {
      throw new NotFoundException(`Unknown tenant: ${slug}`);
    }

    return tenant;
  }
}
