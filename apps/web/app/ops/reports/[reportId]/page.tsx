import { notFound } from "next/navigation";
import { Card, SectionHeading } from "@lab/ui";
import { OpsShell } from "../../../../components/ops-shell";
import { getTenantDomainData } from "../../../../lib/domain";
import { formatDateTime } from "../../../../lib/format";
import { getAppContext } from "../../../../lib/session";

type PageProps = {
  params: Promise<{ reportId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OpsReportDetailPage({ params, searchParams }: PageProps) {
  const [{ reportId }, resolvedParams] = await Promise.all([params, searchParams ?? Promise.resolve(undefined)]);
  const { tenant, locale } = getAppContext(resolvedParams, { defaultRole: "pathologist" });
  const { snapshot, pathologistActor } = getTenantDomainData(tenant);
  const report = snapshot.reports.find((entry) => entry.id === reportId);

  if (!report) {
    notFound();
  }

  const order = snapshot.orders.find((entry) => entry.id === report.orderId);
  const patient = snapshot.patients.find((entry) => entry.id === order?.patientId);
  const alerts = snapshot.criticalAlerts.filter((entry) =>
    snapshot.results.some((result) => result.id === entry.resultId && result.orderId === order?.id)
  );
  const amendments = snapshot.reportAmendments.filter((entry) => entry.reportId === report.id);

  return (
    <OpsShell active="reports" actor={pathologistActor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6">
          <SectionHeading eyebrow="Report detail">{report.reportNumber}</SectionHeading>
          <div className="mt-6 grid gap-4 text-sm">
            <div className="rounded-[22px] bg-[var(--color-panel-muted)] p-4">
              <p className="text-[var(--color-text-muted)]">Patient</p>
              <p className="mt-1 font-medium text-[var(--color-text)]">{patient?.fullName ?? "Unknown patient"}</p>
            </div>
            <div className="rounded-[22px] bg-[var(--color-panel-muted)] p-4">
              <p className="text-[var(--color-text-muted)]">Status</p>
              <p className="mt-1 font-medium text-[var(--color-text)]">{report.status}</p>
            </div>
            <div className="rounded-[22px] bg-[var(--color-panel-muted)] p-4">
              <p className="text-[var(--color-text-muted)]">Released</p>
              <p className="mt-1 font-medium text-[var(--color-text)]">{formatDateTime(report.releasedAt)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <SectionHeading eyebrow="Amendment history">Correction trace</SectionHeading>
          <div className="mt-6 grid gap-4">
            {amendments.length ? (
              amendments.map((amendment) => (
                <div className="rounded-[24px] bg-[var(--color-panel-muted)] p-5" key={amendment.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">Version {amendment.version}</p>
                      <p className="mt-2 font-medium text-[var(--color-text)]">{amendment.note}</p>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">{formatDateTime(amendment.amendedAt)}</span>
                  </div>
                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">Amended by {amendment.amendedBy}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] bg-[var(--color-panel-muted)] p-5">
                <p className="text-sm text-[var(--color-text-muted)]">No amendments have been recorded for this report.</p>
              </div>
            )}
          </div>
        </Card>
        <Card className="p-6">
          <SectionHeading eyebrow="Release blockers">Critical alerts and result readiness</SectionHeading>
          <div className="mt-6 grid gap-4">
            {alerts.length ? (
              alerts.map((alert) => (
                <div className="rounded-[24px] bg-[var(--color-panel-muted)] p-5" key={alert.id}>
                  <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">Critical alert</p>
                  <p className="mt-2 font-medium text-[var(--color-text)]">{alert.status}</p>
                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    {alert.acknowledgedAt ? `Acknowledged ${formatDateTime(alert.acknowledgedAt)}` : "Requires acknowledgment before release."}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] bg-[var(--color-panel-muted)] p-5">
                <p className="text-sm text-[var(--color-text-muted)]">No active critical blockers are linked to this report.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </OpsShell>
  );
}
