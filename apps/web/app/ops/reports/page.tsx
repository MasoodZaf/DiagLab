import Link from "next/link";
import { Badge, Card, SectionHeading } from "@lab/ui";
import { OpsShell } from "../../../components/ops-shell";
import { getTenantDomainData } from "../../../lib/domain";
import { getAppContext } from "../../../lib/session";
import { withParams } from "../../../lib/url";
import { formatDateTime } from "../../../lib/format";
import { reportStatusLabel, reportStatusTone } from "../../../lib/status";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OpsReportsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, locale, intlLocale, t } = getAppContext(sp, { defaultRole: "pathologist" });
  const { snapshot, pathologistActor } = getTenantDomainData(tenant);
  const href = (path: string) => withParams(path, { tenant: tenant.slug, lang: locale });

  return (
    <OpsShell active="reports" actor={pathologistActor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <Card className="p-6">
        <SectionHeading eyebrow={t("nav.reports")}>{t("ops.reports.subtitle")}</SectionHeading>
        <div className="mt-6 grid gap-4">
          {snapshot.reports.length ? (
            snapshot.reports.map((report) => {
              const order = snapshot.orders.find((entry) => entry.id === report.orderId);
              const patient = snapshot.patients.find((entry) => entry.id === order?.patientId);

              return (
                <div className="rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-5" key={report.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        {report.reportNumber}
                      </p>
                      <p className="mt-2 font-medium text-[var(--color-text)]">{patient?.fullName ?? "—"}</p>
                    </div>
                    <Badge tone={reportStatusTone(report.status)} dot>
                      {reportStatusLabel(report.status, t)}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--color-line)] pt-4 text-sm text-[var(--color-text-muted)]">
                    <span>{order?.orderNumber ?? "—"}</span>
                    <span>
                      {report.releasedAt
                        ? formatDateTime(report.releasedAt, intlLocale, tenant.timezone)
                        : t("common.pending")}
                    </span>
                    <span className="ms-auto flex items-center gap-4">
                      <Link className="font-medium text-[var(--color-primary)] hover:underline" href={href(`/ops/reports/${report.id}`)}>
                        {t("common.open")} →
                      </Link>
                      {order ? (
                        <Link className="font-medium text-[var(--color-primary)] hover:underline" href={href(`/report/${order.id}`)}>
                          {t("ops.reports.print")}
                        </Link>
                      ) : null}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-5">
              <p className="text-sm text-[var(--color-text-muted)]">{t("ops.dashboard.noActivity")}</p>
            </div>
          )}
        </div>
      </Card>
    </OpsShell>
  );
}
