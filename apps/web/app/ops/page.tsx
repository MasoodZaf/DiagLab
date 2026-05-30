import Link from "next/link";
import { Badge, Card, SectionHeading } from "@lab/ui";
import { AlertTriangle, FlaskConical, Receipt, Wallet } from "lucide-react";
import { OpsShell } from "../../components/ops-shell";
import { getTenantDomainData } from "../../lib/domain";
import { getAppContext } from "../../lib/session";
import { withParams } from "../../lib/url";
import { formatDateTime, formatMoney } from "../../lib/format";
import {
  invoiceStatusLabel,
  invoiceStatusTone,
  resultStatusLabel,
  resultStatusTone
} from "../../lib/status";

type OpsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OpsPage({ searchParams }: OpsPageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, role, actor, locale, intlLocale, t } = getAppContext(sp, { defaultRole: "receptionist" });
  const { snapshot } = getTenantDomainData(tenant);
  void role;

  const currency = snapshot.invoices[0]?.currency ?? (tenant.locale === "en-GB" ? "GBP" : "PKR");
  const collected = snapshot.invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const outstanding = snapshot.invoices.reduce(
    (sum, invoice) => sum + Math.max(invoice.totalAmount - invoice.paidAmount, 0),
    0
  );
  const activeSamples = snapshot.samples.filter(
    (sample) => !["released", "rejected", "cancelled"].includes(sample.status)
  ).length;
  const openAlerts = snapshot.criticalAlerts.filter((alert) => alert.status === "open").length;
  const releaseQueue = snapshot.orders.filter((order) => order.status === "awaiting_release");
  const outstandingInvoices = snapshot.invoices.filter((invoice) => invoice.status !== "paid");
  const href = (path: string) => withParams(path, { tenant: tenant.slug, lang: locale, role: actor.role });

  const kpis = [
    { icon: Wallet, label: t("ops.dashboard.revenueToday"), value: formatMoney(collected, currency, intlLocale), tone: "success" as const },
    { icon: Receipt, label: t("ops.dashboard.outstanding"), value: formatMoney(outstanding, currency, intlLocale), tone: "warning" as const },
    { icon: FlaskConical, label: t("ops.dashboard.activeSamples"), value: String(activeSamples), tone: "info" as const },
    { icon: AlertTriangle, label: t("ops.dashboard.openAlerts"), value: String(openAlerts), tone: openAlerts ? "danger" as const : "neutral" as const }
  ];

  return (
    <OpsShell active="dashboard" actor={actor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <div className="grid gap-4">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card className="p-5" key={kpi.label}>
                <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-accent-surface)] text-[var(--color-primary)]">
                  <Icon className="size-5" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {kpi.label}
                </p>
                <p className="mt-1 font-[var(--font-display)] text-2xl tabular-nums text-[var(--color-text)]">
                  {kpi.value}
                </p>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <SectionHeading eyebrow={t("ops.dashboard.reception")}>{t("ops.patients.title")}</SectionHeading>
              <Link className="text-sm font-medium text-[var(--color-primary)] hover:underline" href={href("/ops/patients")}>
                {t("common.viewAll")} →
              </Link>
            </div>
            <div className="mt-6 grid gap-3">
              {snapshot.patients.map((patient) => {
                const order = snapshot.orders.find((entry) => entry.patientId === patient.id);
                const invoice = snapshot.invoices.find((entry) => entry.orderId === order?.id);
                return (
                  <div className="flex items-center justify-between gap-3 rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-4" key={patient.id}>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{patient.mrn}</p>
                      <p className="mt-1 truncate font-medium text-[var(--color-text)]">{patient.fullName}</p>
                      <p className="mt-0.5 truncate text-sm text-[var(--color-text-muted)]">{order?.tests.join(", ") ?? "—"}</p>
                    </div>
                    {invoice ? (
                      <Badge tone={invoiceStatusTone(invoice.status)} dot>
                        {invoiceStatusLabel(invoice.status, t)}
                      </Badge>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeading eyebrow={t("ops.clinical")}>{t("ops.dashboard.releaseQueue")}</SectionHeading>
            <div className="mt-6 grid gap-3">
              <div className="grid grid-cols-3 gap-3">
                <Metric label={t("ops.pendingRelease")} value={releaseQueue.length} />
                <Metric label={t("ops.dashboard.openAlerts")} value={openAlerts} tone={openAlerts ? "danger" : undefined} />
                <Metric label={t("invoiceStatus.issued")} value={outstandingInvoices.length} />
              </div>
              <div className="mt-2 grid gap-3">
                {snapshot.results.map((result) => (
                  <div className="flex items-center justify-between gap-3 rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-4" key={result.id}>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-text)]">{result.testName}</p>
                      <p className="mt-0.5 text-sm tabular-nums text-[var(--color-text-muted)]">{result.value}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {result.critical ? <Badge tone="danger" dot>{t("report.criticalFlag")}</Badge> : null}
                      <Badge tone={resultStatusTone(result.status)}>{resultStatusLabel(result.status, t)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section>
          <Card className="p-6">
            <SectionHeading eyebrow={t("ops.badgeAudit")}>{t("ops.dashboard.recentActivity")}</SectionHeading>
            <div className="mt-6 grid gap-2">
              {snapshot.auditLogs.length ? (
                snapshot.auditLogs.slice(0, 6).map((entry) => (
                  <div className="flex items-center justify-between gap-3 rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] px-4 py-3 text-sm" key={entry.id}>
                    <span className="min-w-0">
                      <span className="font-medium text-[var(--color-text)]">{entry.action}</span>
                      <span className="text-[var(--color-text-muted)]"> · {entry.entityType}/{entry.entityId}</span>
                    </span>
                    <span className="shrink-0 text-[var(--color-text-muted)]">
                      {formatDateTime(entry.createdAt, intlLocale, tenant.timezone)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  {t("ops.dashboard.noActivity")}
                </p>
              )}
            </div>
          </Card>
        </section>
      </div>
    </OpsShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return (
    <div className="rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-2 font-[var(--font-display)] text-3xl tabular-nums ${tone === "danger" ? "text-[var(--color-danger)]" : "text-[var(--color-text)]"}`}>
        {value}
      </p>
    </div>
  );
}
