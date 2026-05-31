import { getSessionActor } from "@lab/demo-data";
import type { TenantConfig, TenantSnapshot } from "@lab/contracts";
import { store } from "./server/store";

export function withTenant(path: string, tenantSlug: string) {
  return `${path}?tenant=${tenantSlug}`;
}

export async function getTenantDomainData(tenant: TenantConfig) {
  const snapshot = await store.getSnapshot(tenant.slug);

  return {
    snapshot,
    patientActor: getSessionActor(tenant.id, "patient"),
    receptionistActor: getSessionActor(tenant.id, "receptionist"),
    phlebotomistActor: getSessionActor(tenant.id, "phlebotomist"),
    technicianActor: getSessionActor(tenant.id, "technician"),
    pathologistActor: getSessionActor(tenant.id, "pathologist")
  };
}

export function getOrderReport(snapshot: TenantSnapshot, orderId: string) {
  return snapshot.reports.find((report) => report.orderId === orderId);
}
