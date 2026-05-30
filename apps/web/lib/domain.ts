import { getSessionActor } from "@lab/demo-data";
import type { TenantConfig, TenantSnapshot } from "@lab/contracts";
import { workflowStore } from "./server/workflow-store";

export function withTenant(path: string, tenantSlug: string) {
  return `${path}?tenant=${tenantSlug}`;
}

export function getTenantDomainData(tenant: TenantConfig) {
  const snapshot = workflowStore.getSnapshot(tenant.slug);

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
