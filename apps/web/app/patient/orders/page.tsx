import Link from "next/link";
import { Badge, Card, SectionHeading } from "@lab/ui";
import { PatientShell } from "../../../components/patient-shell";
import { getOrderReport, getTenantDomainData } from "../../../lib/domain";
import { getAppContext } from "../../../lib/session";
import { withParams } from "../../../lib/url";
import { formatDateTime, formatMoney } from "../../../lib/format";
import { invoiceStatusLabel, invoiceStatusTone, sampleStatusLabel, sampleStatusTone } from "../../../lib/status";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PatientOrdersPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, locale, intlLocale, t } = getAppContext(sp, { defaultRole: "patient" });
  const { snapshot, patientActor } = await getTenantDomainData(tenant);
  const patient =
    snapshot.patients.find((entry) => entry.fullName === patientActor.displayName) ?? snapshot.patients[0];
  const orders = snapshot.orders.filter((entry) => entry.patientId === patient.id);

  return (
    <PatientShell active="orders" actor={patientActor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <Card className="p-6 sm:p-7">
        <SectionHeading eyebrow={t("nav.myOrders")}>{t("patient.myOrdersSubtitle")}</SectionHeading>
        <div className="mt-6 grid gap-4">
          {orders.map((order) => {
            const sample = snapshot.samples.find((entry) => entry.orderId === order.id);
            const invoice = snapshot.invoices.find((entry) => entry.orderId === order.id);
            const report = getOrderReport(snapshot, order.id);

            return (
              <div className="rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-5" key={order.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      {order.orderNumber}
                    </p>
                    <p className="mt-2 font-medium text-[var(--color-text)]">{order.tests.join(" · ")}</p>
                  </div>
                  {sample ? (
                    <Badge tone={sampleStatusTone(sample.status)} dot>
                      {sampleStatusLabel(sample.status, t)}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-2 border-t border-[var(--color-line)] pt-4 text-sm sm:grid-cols-2">
                  <p className="text-[var(--color-text-muted)]">
                    {t("ops.orders.sample")}: <span className="text-[var(--color-text)]">{sample?.lastCheckpoint ?? t("common.pending")}</span>
                  </p>
                  <p className="text-[var(--color-text-muted)]">
                    {t("ops.orders.collection")}:{" "}
                    <span className="text-[var(--color-text)]">
                      {formatDateTime(sample?.collectedAt, intlLocale, tenant.timezone) ?? t("common.pending")}
                    </span>
                  </p>
                  <p className="flex items-center gap-2 text-[var(--color-text-muted)]">
                    {t("ops.orders.invoice")}:
                    {invoice ? (
                      <Badge tone={invoiceStatusTone(invoice.status)}>
                        {formatMoney(invoice.totalAmount, invoice.currency, intlLocale)} · {invoiceStatusLabel(invoice.status, t)}
                      </Badge>
                    ) : (
                      <span className="text-[var(--color-text)]">{t("common.none")}</span>
                    )}
                  </p>
                  <p className="text-[var(--color-text-muted)]">
                    {t("ops.orders.report")}:{" "}
                    {report && report.status !== "draft" ? (
                      <Link
                        href={withParams(`/report/${order.id}`, { tenant: tenant.slug, lang: locale })}
                        className="font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {t("ops.reports.view")} →
                      </Link>
                    ) : (
                      <span className="text-[var(--color-text)]">{report ? t(`reportStatus.${report.status}`) : t("common.none")}</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </PatientShell>
  );
}
