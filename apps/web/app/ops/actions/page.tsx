import { WorkflowActionCenter } from "../../../components/workflow-action-center";
import { OpsShell } from "../../../components/ops-shell";
import { getTenantDomainData } from "../../../lib/domain";
import { workflowStore } from "../../../lib/server/workflow-store";
import { getAppContext } from "../../../lib/session";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OpsActionsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, locale } = getAppContext(sp, { defaultRole: "pathologist" });
  const { receptionistActor, phlebotomistActor, technicianActor, pathologistActor } = getTenantDomainData(tenant);
  const snapshot = workflowStore.getSnapshot(tenant.slug);

  return (
    <OpsShell active="actions" actor={pathologistActor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <WorkflowActionCenter
        actors={{
          receptionist: receptionistActor,
          phlebotomist: phlebotomistActor,
          technician: technicianActor,
          pathologist: pathologistActor
        }}
        initialSnapshot={snapshot}
        tenant={tenant}
        locale={locale}
      />
    </OpsShell>
  );
}
