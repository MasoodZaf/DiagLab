import { getTenantConfig } from "@lab/branding";
import { getSessionActor } from "@lab/demo-data";
import { roleCapabilities, userRoles, type SessionActor, type TenantConfig, type UserRole } from "@lab/contracts";
import { getLocalization, type Localization } from "./i18n";
import { pickParam, type SearchParams } from "./url";

export type { SearchParams } from "./url";

const fallbackNames: Partial<Record<UserRole, string>> = {
  rider: "Field Rider",
  branch_manager: "Operations Lead",
  lab_admin: "Lab Administrator",
  super_admin: "Platform Admin"
};

export function resolveRole(value: unknown, fallback: UserRole): UserRole {
  return typeof value === "string" && (userRoles as readonly string[]).includes(value)
    ? (value as UserRole)
    : fallback;
}

/** Returns a demo actor for any role, synthesising one when no preset exists. */
export function actorForRole(tenant: TenantConfig, role: UserRole): SessionActor {
  const preset = getSessionActor(tenant.id, role);
  if (preset.role === role && preset.tenantId === tenant.id) {
    return preset;
  }
  const capabilities = roleCapabilities.find((entry) => entry.role === role)?.capabilities ?? [];
  return {
    id: `sess_${tenant.id}_${role}`,
    tenantId: tenant.id,
    role,
    displayName: fallbackNames[role] ?? role.replace(/_/g, " "),
    branchName: "Central Lab",
    capabilities
  };
}

export type AppContext = Localization & {
  tenant: TenantConfig;
  role: UserRole;
  actor: SessionActor;
};

/** Resolve tenant, locale and role/actor from a page's searchParams. */
export function getAppContext(
  searchParams?: SearchParams,
  options?: { defaultRole?: UserRole }
): AppContext {
  const tenant = getTenantConfig(pickParam(searchParams, "tenant") ?? "lumen");
  const localization = getLocalization(pickParam(searchParams, "lang"));
  const role = resolveRole(pickParam(searchParams, "role"), options?.defaultRole ?? "receptionist");
  const actor = actorForRole(tenant, role);
  return { tenant, role, actor, ...localization };
}
