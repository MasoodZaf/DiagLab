import { WorkflowActionCenter } from "../../../components/workflow-action-center";
import { OpsShell } from "../../../components/ops-shell";
import { getTenantDomainData } from "../../../lib/domain";
import { getAppContext } from "../../../lib/session";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OpsActionsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  // The Action Center runs as the actively-selected role — switch role in the
  // top bar to drive a different stage of the workflow.
  const { tenant, actor, locale } = getAppContext(sp, { defaultRole: "pathologist" });
  const { snapshot } = await getTenantDomainData(tenant);

  return (
    <OpsShell active="actions" actor={actor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <WorkflowActionCenter actor={actor} initialSnapshot={snapshot} tenant={tenant} locale={locale} />
    </OpsShell>
  );
}
