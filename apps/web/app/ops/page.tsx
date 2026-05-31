import Link from "next/link";
import { getTenantOrg } from "@lab/demo-data";
import type { TenantSnapshot, UserRole } from "@lab/contracts";
import { Badge, Card, SectionHeading } from "@lab/ui";
import { AlertTriangle, Building2, ClipboardCheck, FileText, FlaskConical, Receipt, Stethoscope, TestTube, Users, Wallet, type LucideIcon } from "lucide-react";
import { OpsShell } from "../../components/ops-shell";
import { WorkflowActionCenter } from "../../components/workflow-action-center";
import { getTenantDomainData } from "../../lib/domain";
import { store } from "../../lib/server/store";
import { getAppContext } from "../../lib/session";
import { withParams } from "../../lib/url";
import { formatMoney } from "../../lib/format";
import { invoiceStatusLabel, invoiceStatusTone } from "../../lib/status";

type OpsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type Kpi = { icon: LucideIcon; label: string; value: string; tone: "success" | "warning" | "info" | "danger" | "neutral" };

export default async function OpsPage({ searchParams }: OpsPageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, actor, locale, intlLocale, t } = getAppContext(sp, { defaultRole: "receptionist" });
  const { snapshot } = await getTenantDomainData(tenant);
  const role = actor.role;

  const currency = snapshot.invoices[0]?.currency ?? (tenant.locale === "en-GB" ? "GBP" : "PKR");
  const money = (value: number) => formatMoney(value, currency, intlLocale);
  const c = counts(snapshot);
  const org = getTenantOrg(tenant.id);
  const doctors = role === "lab_admin" || role === "super_admin" ? await store.listDoctors(tenant.slug) : [];

  const kpis = kpisForRole(role, { c, money, t, doctors: doctors.length, staff: org.staff.length, outlets: org.outlets.length });
  const href = (path: string) => withParams(path, { tenant: tenant.slug, lang: locale, role });

  return (
    <OpsShell active="dashboard" actor={actor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <div className="grid gap-4">
        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.roleConsoleEyebrow", { role: t(`roles.${role}`) })}>
            {t("ops.dashboard.roleHeadline", { role: t(`roles.${role}`) })}
          </SectionHeading>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t("ops.dashboard.roleSubtitle")}</p>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card className="p-5" key={kpi.label}>
                <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-accent-surface)] text-[var(--color-primary)]">
                  <Icon className="size-5" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{kpi.label}</p>
                <p
                  className={`mt-1 font-[var(--font-display)] text-2xl tabular-nums ${kpi.tone === "danger" ? "text-[var(--color-danger)]" : "text-[var(--color-text)]"}`}
                >
                  {kpi.value}
                </p>
              </Card>
            );
          })}
        </section>

        <section>
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <SectionHeading eyebrow={t("ops.dashboard.reception")}>{t("ops.dashboard.primaryQueue")}</SectionHeading>
              <Link className="text-sm font-medium text-[var(--color-primary)] hover:underline" href={href("/ops/patients")}>
                {t("common.viewAll")} →
              </Link>
            </div>
            <PrimaryQueue role={role} snapshot={snapshot} t={t} />
          </Card>
        </section>

        {/* Role-scoped action console — switching role changes exactly what can be done here. */}
        <WorkflowActionCenter actor={actor} initialSnapshot={snapshot} tenant={tenant} locale={locale} />
      </div>
    </OpsShell>
  );
}

function counts(s: TenantSnapshot) {
  const byStatus = (status: string) => s.samples.filter((sample) => sample.status === status).length;
  return {
    collected: s.invoices.reduce((sum, i) => sum + i.paidAmount, 0),
    outstanding: s.invoices.reduce((sum, i) => sum + Math.max(i.totalAmount - i.paidAmount, 0), 0),
    patients: s.patients.length,
    activeSamples: s.samples.filter((sample) => !["released", "rejected", "cancelled"].includes(sample.status)).length,
    openAlerts: s.criticalAlerts.filter((a) => a.status === "open").length,
    scheduled: byStatus("scheduled") + byStatus("registered"),
    collectedSamples: byStatus("collected"),
    inTransit: byStatus("in_transit"),
    received: byStatus("received"),
    processing: byStatus("processing"),
    pendingValidation: s.results.filter((r) => r.status === "entered" || r.status === "flagged").length,
    draftReports: s.reports.filter((r) => r.status === "draft").length,
    awaitingRelease: s.orders.filter((o) => o.status === "awaiting_release").length
  };
}

type KpiCtx = {
  c: ReturnType<typeof counts>;
  money: (v: number) => string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  doctors: number;
  staff: number;
  outlets: number;
};

function kpisForRole(role: UserRole, { c, money, t, doctors, staff, outlets }: KpiCtx): Kpi[] {
  const d = (k: string) => t(`ops.dashboard.${k}`);
  const num = (n: number, icon: LucideIcon, tone: Kpi["tone"] = "info"): Kpi => ({ icon, label: "", value: String(n), tone });

  switch (role) {
    case "receptionist":
    case "patient":
      return [
        { icon: Wallet, label: d("collections"), value: money(c.collected), tone: "success" },
        { icon: Receipt, label: d("outstanding"), value: money(c.outstanding), tone: "warning" },
        { ...num(c.patients, FlaskConical), label: d("registeredToday") },
        { ...num(c.scheduled, TestTube), label: d("scheduledCollections") }
      ];
    case "phlebotomist":
    case "rider":
      return [
        { ...num(c.scheduled, TestTube), label: d("scheduledCollections") },
        { ...num(c.collectedSamples, FlaskConical), label: t("sampleStatus.collected") },
        { ...num(c.inTransit, FlaskConical), label: d("inTransit") },
        { ...num(c.activeSamples, FlaskConical), label: d("activeSamples") }
      ];
    case "technician":
      return [
        { ...num(c.received, FlaskConical), label: d("received") },
        { ...num(c.processing, TestTube), label: d("processing") },
        { ...num(c.pendingValidation, ClipboardCheck), label: d("pendingValidation") },
        { ...num(c.activeSamples, FlaskConical), label: d("activeSamples") }
      ];
    case "pathologist":
      return [
        { ...num(c.pendingValidation, ClipboardCheck), label: d("pendingValidation") },
        { ...num(c.draftReports, FileText), label: d("draftReports") },
        { ...num(c.awaitingRelease, FileText), label: d("awaitingRelease") },
        { ...num(c.openAlerts, AlertTriangle, c.openAlerts ? "danger" : "neutral"), label: d("openAlerts") }
      ];
    case "lab_admin":
      return [
        { ...num(doctors, Stethoscope), label: d("doctorsOnPanel") },
        { ...num(staff, Users), label: d("teamMembers") },
        { ...num(outlets, Building2), label: d("outletsCount") },
        { ...num(c.activeSamples, FlaskConical), label: d("activeSamples") }
      ];
    case "branch_manager":
    case "super_admin":
    default:
      return [
        { icon: Wallet, label: d("collections"), value: money(c.collected), tone: "success" },
        { icon: Receipt, label: d("outstanding"), value: money(c.outstanding), tone: "warning" },
        { ...num(c.activeSamples, FlaskConical), label: d("activeSamples") },
        { ...num(c.openAlerts, AlertTriangle, c.openAlerts ? "danger" : "neutral"), label: d("openAlerts") }
      ];
  }
}

/** The primary list panel adapts to the role: reception sees patients, bench
 * roles see the sample queue, clinical roles see the result/release queue. */
function PrimaryQueue({ role, snapshot, t }: { role: UserRole; snapshot: TenantSnapshot; t: (k: string, v?: Record<string, string | number>) => string }) {
  if (role === "phlebotomist" || role === "rider" || role === "technician") {
    return (
      <div className="mt-6 grid gap-3">
        {snapshot.samples.map((sample) => (
          <div className="flex items-center justify-between gap-3 rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-4" key={sample.id}>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{sample.barcode}</p>
              <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">{sample.lastCheckpoint}</p>
            </div>
            <Badge tone="info">{t(`sampleStatus.${sample.status}`)}</Badge>
          </div>
        ))}
      </div>
    );
  }

  if (role === "pathologist") {
    return (
      <div className="mt-6 grid gap-3">
        {snapshot.results.map((result) => (
          <div className="flex items-center justify-between gap-3 rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-4" key={result.id}>
            <div className="min-w-0">
              <p className="truncate font-medium text-[var(--color-text)]">{result.testName}</p>
              <p className="mt-0.5 text-sm tabular-nums text-[var(--color-text-muted)]">{result.value}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {result.critical ? (
                <Badge tone="danger" dot>
                  {t("report.criticalFlag")}
                </Badge>
              ) : null}
              <Badge tone="info">{t(`resultStatus.${result.status}`)}</Badge>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // reception / management default: patient registry
  return (
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
  );
}
