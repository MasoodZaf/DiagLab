import { notFound } from "next/navigation";
import { Card, SectionHeading } from "@lab/ui";
import { OpsShell } from "../../../../components/ops-shell";
import { getOrderReport, getTenantDomainData } from "../../../../lib/domain";
import { formatDateTime, formatMoney } from "../../../../lib/format";
import { getAppContext } from "../../../../lib/session";

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OpsOrderDetailPage({ params, searchParams }: PageProps) {
  const [{ orderId }, resolvedParams] = await Promise.all([params, searchParams ?? Promise.resolve(undefined)]);
  const { tenant, locale, t } = getAppContext(resolvedParams, { defaultRole: "receptionist" });
  const { snapshot, receptionistActor } = await getTenantDomainData(tenant);
  const order = snapshot.orders.find((entry) => entry.id === orderId);

  if (!order) {
    notFound();
  }

  const patient = snapshot.patients.find((entry) => entry.id === order.patientId);
  const sample = snapshot.samples.find((entry) => entry.orderId === order.id);
  const results = snapshot.results.filter((entry) => entry.orderId === order.id);
  const invoice = snapshot.invoices.find((entry) => entry.orderId === order.id);
  const report = getOrderReport(snapshot, order.id);

  return (
    <OpsShell active="orders" actor={receptionistActor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6">
          <SectionHeading eyebrow={t("ops.orders.detailEyebrow")}>{order.orderNumber}</SectionHeading>
          <div className="mt-6 grid gap-4 text-sm">
            <div className="rounded-[22px] bg-[var(--color-panel-muted)] p-4">
              <p className="text-[var(--color-text-muted)]">{t("ops.orders.patient")}</p>
              <p className="mt-1 font-medium text-[var(--color-text)]">{patient?.fullName ?? t("ops.orders.unknownPatient")}</p>
            </div>
            <div className="rounded-[22px] bg-[var(--color-panel-muted)] p-4">
              <p className="text-[var(--color-text-muted)]">{t("ops.orders.sampleState")}</p>
              <p className="mt-1 font-medium text-[var(--color-text)]">{sample?.status ?? t("common.pending")}</p>
            </div>
            <div className="rounded-[22px] bg-[var(--color-panel-muted)] p-4">
              <p className="text-[var(--color-text-muted)]">{t("ops.orders.billing")}</p>
              <p className="mt-1 font-medium text-[var(--color-text)]">
                {invoice ? formatMoney(invoice.totalAmount - invoice.paidAmount, invoice.currency) : t("ops.orders.noInvoice")} {t("ops.orders.outstandingSuffix")}
              </p>
            </div>
            <div className="rounded-[22px] bg-[var(--color-panel-muted)] p-4">
              <p className="text-[var(--color-text-muted)]">{t("ops.orders.reportLabel")}</p>
              <p className="mt-1 font-medium text-[var(--color-text)]">{report ? report.status : t("ops.orders.notCreated")}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <SectionHeading eyebrow={t("ops.orders.resultsEyebrow")}>{t("ops.orders.resultsTitle")}</SectionHeading>
          <div className="mt-6 grid gap-4">
            {results.map((result) => (
              <div className="rounded-[24px] bg-[var(--color-panel-muted)] p-5" key={result.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">{result.testName}</p>
                    <p className="mt-2 font-medium text-[var(--color-text)]">{result.value}</p>
                  </div>
                  <span className="rounded-full bg-[var(--color-panel)] px-3 py-2 text-xs font-medium text-[var(--color-text)]">
                    {result.status}
                  </span>
                </div>
                <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                  {result.critical ? t("ops.orders.criticalAckRequired") : t("ops.orders.resultUpdated", { time: formatDateTime(result.updatedAt) ?? "—" })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </OpsShell>
  );
}
