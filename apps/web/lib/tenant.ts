import { buildTenantCssVariables, getTenantConfig } from "@lab/branding";

export function resolveTenant(searchParams?: Record<string, string | string[] | undefined>) {
  const requestedSlug = typeof searchParams?.tenant === "string" ? searchParams.tenant : "lumen";
  const tenant = getTenantConfig(requestedSlug);
  return {
    tenant,
    themeStyle: buildTenantCssVariables(tenant)
  };
}
