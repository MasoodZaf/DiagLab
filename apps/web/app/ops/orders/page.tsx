import Link from "next/link";
import { Badge, Card, SectionHeading } from "@lab/ui";
import { OpsShell } from "../../../components/ops-shell";
import { getOrderReport, getTenantDomainData } from "../../../lib/domain";
import { getAppContext } from "../../../lib/session";
import { withParams } from "../../../lib/url";
import { formatDateTime, formatMoney } from "../../../lib/format";
import { reportStatusLabel, reportStatusTone, sampleStatusLabel, sampleStatusTone } from "../../../lib/status";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OpsOrdersPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, locale, intlLocale, t } = getAppContext(sp, { defaultRole: "receptionist" });
  const { snapshot, receptionistActor } = getTenantDomainData(tenant);
  const href = (path: string) => withParams(path, { tenant: tenant.slug, lang: locale });

  return (
    <OpsShell active="orders" actor={receptionistActor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <Card className="p-6">
        <SectionHeading eyebrow={t("nav.orders")}>{t("ops.orders.subtitle")}</SectionHeading>
        <div className="mt-6 grid gap-4">
          {snapshot.orders.map((order) => {
            const patient = snapshot.patients.find((entry) => entry.id === order.patientId);
            const sample = snapshot.samples.find((entry) => entry.orderId === order.id);
            const invoice = snapshot.invoices.find((entry) => entry.orderId === order.id);
            const report = getOrderReport(snapshot, order.id);

            return (
              <div className="rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-5" key={order.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      {order.orderNumber}
                    </p>
                    <p className="mt-2 font-medium text-[var(--color-text)]">{patient?.fullName ?? "—"}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">{order.tests.join(" · ")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {sample ? (
                      <Badge tone={sampleStatusTone(sample.status)} dot>
                        {sampleStatusLabel(sample.status, t)}
                      </Badge>
                    ) : null}
                    {report ? (
                      <Badge tone={reportStatusTone(report.status)}>{reportStatusLabel(report.status, t)}</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--color-line)] pt-4 text-sm text-[var(--color-text-muted)]">
                  <span>{order.homeCollection ? t("ops.dashboard.reception") : order.branchName}</span>
                  {invoice ? <span className="tabular-nums">{formatMoney(invoice.totalAmount, invoice.currency, intlLocale)}</span> : null}
                  <span>{formatDateTime(sample?.collectedAt, intlLocale, tenant.timezone) ?? t("common.pending")}</span>
                  <span className="ms-auto flex items-center gap-4">
                    <Link className="font-medium text-[var(--color-primary)] hover:underline" href={href(`/ops/orders/${order.id}`)}>
                      {t("common.open")} →
                    </Link>
                    {report ? (
                      <Link className="font-medium text-[var(--color-primary)] hover:underline" href={href(`/report/${order.id}`)}>
                        {t("ops.reports.print")}
                      </Link>
                    ) : null}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </OpsShell>
  );
}
