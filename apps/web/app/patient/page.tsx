import Link from "next/link";
import { renderTenantNotification } from "@lab/branding";
import { Badge, Button, Card, SectionHeading } from "@lab/ui";
import { CalendarClock, CreditCard, FileText, FlaskConical, Wallet } from "lucide-react";
import { PatientShell } from "../../components/patient-shell";
import { getTenantDomainData } from "../../lib/domain";
import { getAppContext } from "../../lib/session";
import { withParams } from "../../lib/url";
import { formatDateTime, formatMoney } from "../../lib/format";
import { invoiceStatusLabel, invoiceStatusTone } from "../../lib/status";

type PatientPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PatientPage({ searchParams }: PatientPageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, locale, intlLocale, t } = getAppContext(sp, { defaultRole: "patient" });
  const { snapshot, patientActor: actor } = await getTenantDomainData(tenant);

  const patient = snapshot.patients.find((entry) => entry.fullName === actor.displayName) ?? snapshot.patients[0];
  const patientOrders = snapshot.orders.filter((order) => order.patientId === patient.id);
  const patientReports = snapshot.reports.filter((report) =>
    patientOrders.some((order) => order.id === report.orderId)
  );
  const patientInvoices = snapshot.invoices.filter((invoice) =>
    patientOrders.some((order) => order.id === invoice.orderId)
  );
  const nextAppointment = snapshot.appointments.find((entry) => entry.patientId === patient.id);
  const currency = patientInvoices[0]?.currency ?? (tenant.locale === "en-GB" ? "GBP" : "PKR");
  const outstanding = patientInvoices.reduce(
    (sum, invoice) => sum + Math.max(invoice.totalAmount - invoice.paidAmount, 0),
    0
  );
  const latestReport = patientReports.find((report) => report.status !== "draft") ?? patientReports[0];

  const appointmentMessage = renderTenantNotification(tenant, "appointmentBooked", "whatsapp", {
    patientName: patient.fullName,
    appointmentTime: formatDateTime(nextAppointment?.scheduledAt, intlLocale, tenant.timezone) ?? t("common.pending"),
    branchName: nextAppointment?.branchName ?? t("ops.centralLab"),
    orderNumber: patientOrders[0]?.orderNumber ?? t("common.pending")
  });

  const reportHref = (orderId: string) => withParams(`/report/${orderId}`, { tenant: tenant.slug, lang: locale });

  const stats = [
    {
      icon: CalendarClock,
      label: t("patient.upcoming"),
      value: formatDateTime(nextAppointment?.scheduledAt, intlLocale, tenant.timezone) ?? t("common.none")
    },
    { icon: FlaskConical, label: t("patient.activeOrders"), value: String(patientOrders.length) },
    {
      icon: Wallet,
      label: t("patient.outstanding"),
      value: formatMoney(outstanding, currency, intlLocale)
    },
    {
      icon: FileText,
      label: t("patient.latestReport"),
      value: latestReport?.reportNumber ?? t("patient.noReports")
    }
  ];

  return (
    <PatientShell active="home" actor={actor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <div className="flex flex-wrap gap-3">
        <Button>{t("patient.book")}</Button>
        {latestReport ? (
          <Link href={reportHref(latestReport.orderId)}>
            <Button tone="secondary">{t("patient.viewReport")}</Button>
          </Link>
        ) : null}
        <Link href={withParams("/patient/orders", { tenant: tenant.slug, lang: locale })}>
          <Button tone="ghost">{t("nav.myOrders")}</Button>
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card className="p-5" key={stat.label}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-accent-surface)] text-[var(--color-primary)]">
                <Icon className="size-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {stat.label}
              </p>
              <p className="mt-1 font-[var(--font-display)] text-xl tabular-nums text-[var(--color-text)]">
                {stat.value}
              </p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6 sm:p-7">
          <SectionHeading eyebrow={t("nav.myOrders")}>{t("patient.activeOrders")}</SectionHeading>
          <div className="mt-6 grid gap-3">
            {patientOrders.map((order) => {
              const invoice = patientInvoices.find((entry) => entry.orderId === order.id);
              const report = patientReports.find((entry) => entry.orderId === order.id);
              return (
                <div className="rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-5" key={order.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        {order.orderNumber}
                      </p>
                      <p className="mt-2 font-medium text-[var(--color-text)]">{order.tests.join(" · ")}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {order.homeCollection ? t("ops.dashboard.reception") : order.branchName}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                      {invoice ? (
                        <Badge tone={invoiceStatusTone(invoice.status)} dot>
                          {invoiceStatusLabel(invoice.status, t)}
                        </Badge>
                      ) : null}
                      {report && report.status !== "draft" ? (
                        <Link
                          href={reportHref(order.id)}
                          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                        >
                          {t("patient.viewReport")} →
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  {invoice ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--color-line)] pt-4 text-sm">
                      <span className="text-[var(--color-text-muted)]">
                        {formatMoney(invoice.totalAmount, invoice.currency, intlLocale)}
                      </span>
                      {invoice.totalAmount - invoice.paidAmount > 0 ? (
                        <Button size="sm" tone="secondary" className="ms-auto gap-2">
                          <CreditCard className="size-4" />
                          {t("patient.payNow")}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 sm:p-7">
          <SectionHeading eyebrow={t("nav.reports")}>{t("patient.latestReport")}</SectionHeading>
          <div className="mt-6 grid gap-3">
            {patientReports.length ? (
              patientReports.map((report) => (
                <div className="rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-5" key={report.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        {report.reportNumber}
                      </p>
                      <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
                        {report.releasedAt
                          ? formatDateTime(report.releasedAt, intlLocale, tenant.timezone)
                          : t("common.pending")}
                      </p>
                    </div>
                    <Badge tone={report.status === "released" ? "success" : "neutral"} dot>
                      {t(`reportStatus.${report.status}`)}
                    </Badge>
                  </div>
                  {report.status !== "draft" ? (
                    <Link
                      href={reportHref(report.orderId)}
                      className="mt-3 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {t("ops.reports.view")} →
                    </Link>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-5 text-sm text-[var(--color-text-muted)]">
                {t("patient.noReports")}
              </p>
            )}
          </div>

          <div className="mt-5 rounded-[var(--radius-panel)] border border-[var(--color-line)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              WhatsApp · {tenant.notifications.whatsappSender}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">{appointmentMessage.body}</p>
          </div>
        </Card>
      </section>
    </PatientShell>
  );
}
