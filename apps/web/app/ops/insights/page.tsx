import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  FlaskConical,
  Receipt,
  Timer
} from "lucide-react";
import type { BadgeTone } from "@lab/ui";
import { Badge, Card, SectionHeading } from "@lab/ui";
import type { SampleStatus } from "@lab/contracts";
import { OpsShell } from "../../../components/ops-shell";
import {
  AreaLineChart,
  BarChart,
  ChartLegend,
  DonutChart,
  LeveyJenningsChart,
  LegendSwatch,
  type AreaSeries,
  type BarDatum,
  type DonutSlice,
  type QcPoint
} from "../../../components/charts";
import { getTenantDomainData } from "../../../lib/domain";
import { getAppContext } from "../../../lib/session";
import { formatMoney, formatNumber } from "../../../lib/format";
import { sampleStatusLabel, sampleStatusTone } from "../../../lib/status";

type InsightsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// --- Deterministic demo time-series (no randomness, no current-time APIs) -----
// Revenue indices (relative units) for the trailing eight weeks. The page scales
// these by the tenant's collected/billed ratio so charts read with real money.
const WEEK_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
const COLLECTED_SHAPE = [0.62, 0.7, 0.66, 0.78, 0.83, 0.79, 0.9, 1.0];
const BILLED_SHAPE = [0.74, 0.81, 0.79, 0.9, 0.95, 0.93, 1.02, 1.12];

// Daily QC control values for a single analyte (e.g. Glucose L2), 16 days.
// Mostly inside ±2SD with two excursions to make limit lines meaningful.
const QC_MEAN = 5.4;
const QC_SD = 0.18;
const QC_VALUES = [
  5.41, 5.36, 5.48, 5.39, 5.55, 5.44, 5.31, 5.62, 5.46, 5.38, 5.52, 5.43, 5.49, 5.86, 5.4, 5.45
];

// Relative department workload weights — multiplied by real sample count so the
// bar chart totals stay consistent with the live snapshot.
const DEPT_WEIGHTS: Array<{ key: string; weight: number; color?: string }> = [
  { key: "hematology", weight: 1.0 },
  { key: "biochemistry", weight: 0.92 },
  { key: "immunology", weight: 0.58 },
  { key: "microbiology", weight: 0.41 },
  { key: "molecular", weight: 0.26 },
  { key: "endocrinology", weight: 0.37 }
];

const toneColor: Record<BadgeTone, string> = {
  success: "var(--color-success)",
  danger: "var(--color-danger)",
  warning: "var(--color-warning)",
  primary: "var(--color-primary)",
  info: "color-mix(in srgb, var(--color-primary) 62%, var(--color-success))",
  neutral: "var(--color-text-muted)"
};

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, actor, locale, intlLocale, t } = getAppContext(sp, {
    defaultRole: "branch_manager"
  });
  const { snapshot } = getTenantDomainData(tenant);

  // --- Real figures from the snapshot ---------------------------------------
  const currency = snapshot.invoices[0]?.currency ?? (tenant.slug === "cedar" ? "GBP" : "PKR");
  const billed = snapshot.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const collected = snapshot.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const outstanding = Math.max(0, billed - collected);
  const collectionRate = billed > 0 ? collected / billed : 0;

  const orderCount = snapshot.orders.length || 1;
  const avgOrderValue = billed / orderCount;

  const totalSamples = snapshot.samples.length;
  const rejectedSamples = snapshot.samples.filter((s) => s.status === "rejected").length;
  const activeSamples = snapshot.samples.filter((s) =>
    (["received", "processing", "in_transit", "collected", "scheduled"] as SampleStatus[]).includes(
      s.status
    )
  ).length;
  const rejectionRate = totalSamples > 0 ? rejectedSamples / totalSamples : 0;
  const openCriticals = snapshot.criticalAlerts.filter((a) => a.status === "open").length;

  const fmtMoney = (v: number) => formatMoney(v, currency, intlLocale);
  const fmtNum = (v: number) => formatNumber(Math.round(v), intlLocale);
  const pct = (v: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: "percent",
      maximumFractionDigits: 1,
      numberingSystem: "latn"
    }).format(v);

  // --- Revenue trend: scale demo shapes by real billed/collected peaks -------
  const collectedPeak = Math.max(collected, billed * 0.82, 1);
  const billedPeak = Math.max(billed, 1);
  const revenueSeries: AreaSeries[] = [
    {
      id: "billed",
      values: BILLED_SHAPE.map((s) => Math.round((s / 1.12) * billedPeak)),
      color: "var(--color-text-muted)",
      dashed: true
    },
    {
      id: "collected",
      values: COLLECTED_SHAPE.map((s) => Math.round(s * collectedPeak)),
      color: "var(--color-primary)",
      area: true
    }
  ];

  // --- Volume by department: weights × real sample volume --------------------
  const weightSum = DEPT_WEIGHTS.reduce((s, d) => s + d.weight, 0);
  const volumeBase = Math.max(totalSamples, 24);
  const deptData: BarDatum[] = DEPT_WEIGHTS.map((d) => ({
    label: t(`catalog.departments.${d.key}`),
    value: Math.round((d.weight / weightSum) * volumeBase * 6),
    color: d.color
  }));

  // --- Sample status mix donut ----------------------------------------------
  const statusCounts = new Map<SampleStatus, number>();
  for (const sample of snapshot.samples) {
    statusCounts.set(sample.status, (statusCounts.get(sample.status) ?? 0) + 1);
  }
  let statusSlices: DonutSlice[] = Array.from(statusCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({
      id: status,
      label: sampleStatusLabel(status, t),
      value: count,
      color: toneColor[sampleStatusTone(status)]
    }));
  // Deterministic fallback so the donut never reads empty in a thin demo tenant.
  if (statusSlices.length === 0) {
    const demo: Array<[SampleStatus, number]> = [
      ["completed", 9],
      ["processing", 5],
      ["received", 4],
      ["rejected", 1]
    ];
    statusSlices = demo.map(([status, value]) => ({
      id: status,
      label: sampleStatusLabel(status, t),
      value,
      color: toneColor[sampleStatusTone(status)]
    }));
  }
  const statusTotal = statusSlices.reduce((s, slice) => s + slice.value, 0);

  // --- QC Levey-Jennings points ---------------------------------------------
  const qcPoints: QcPoint[] = QC_VALUES.map((value, i) => ({
    label: `D${i + 1}`,
    value
  }));

  const kpis = [
    {
      key: "revenue",
      label: t("ops.dashboard.revenueToday"),
      value: fmtMoney(collected),
      icon: Banknote,
      delta: { dir: "up" as const, text: pct(collectionRate), note: t("insights.collectionRate") }
    },
    {
      key: "aov",
      label: t("insights.avgOrderValue"),
      value: fmtMoney(avgOrderValue),
      icon: Receipt,
      delta: {
        dir: "up" as const,
        text: "+4.8%",
        note: `${formatNumber(orderCount, intlLocale)} ${t("nav.orders").toLowerCase()}`
      }
    },
    {
      key: "tat",
      label: t("insights.tat"),
      value: `6.2 ${t("insights.hours")}`,
      icon: Timer,
      delta: {
        dir: "down" as const,
        text: "-0.7 h",
        note: `${t("insights.tatTarget")} 8.0 ${t("insights.hours")}`
      }
    },
    {
      key: "rejection",
      label: t("insights.rejectionRate"),
      value: pct(rejectionRate),
      icon: FlaskConical,
      delta: {
        dir: rejectionRate > 0.03 ? ("up" as const) : ("down" as const),
        text: `${formatNumber(rejectedSamples, intlLocale)}/${formatNumber(Math.max(totalSamples, 1), intlLocale)}`,
        note: `${formatNumber(activeSamples, intlLocale)} ${t("ops.dashboard.activeSamples").toLowerCase()}`
      }
    }
  ];

  return (
    <OpsShell active="insights" tenant={tenant} actor={actor} snapshot={snapshot} locale={locale}>
      <div className="grid gap-4">
        <header className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {tenant.brandName}
          </p>
          <h2 className="font-[var(--font-display)] text-3xl leading-tight text-[var(--color-text)]">
            {t("insights.title")}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            {t("insights.subtitle")}
          </p>
        </header>

        {/* KPI row */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            const up = kpi.delta.dir === "up";
            const DeltaIcon = up ? ArrowUpRight : ArrowDownRight;
            return (
              <Card className="p-5" key={kpi.key}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {kpi.label}
                  </p>
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-surface)] text-[var(--color-primary)]"
                  >
                    <Icon className="size-[18px]" />
                  </span>
                </div>
                <p className="mt-4 font-[var(--font-display)] text-3xl leading-none tabular-nums text-[var(--color-text)]">
                  {kpi.value}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span
                    className="inline-flex items-center gap-1 font-medium tabular-nums"
                    style={{ color: up ? "var(--color-success)" : "var(--color-primary)" }}
                  >
                    <DeltaIcon className="size-3.5" aria-hidden="true" />
                    {kpi.delta.text}
                  </span>
                  <span className="truncate text-[var(--color-text-muted)]">{kpi.delta.note}</span>
                </div>
              </Card>
            );
          })}
        </section>

        {/* Revenue trend */}
        <section>
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeading eyebrow={t("insights.collectionRate")}>
                {t("insights.revenue")}
              </SectionHeading>
              <div className="flex flex-col gap-2 sm:items-end">
                <ChartLegend>
                  <LegendSwatch color="var(--color-primary)" label={t("insights.revenueCollected")} />
                  <LegendSwatch
                    color="var(--color-text-muted)"
                    label={t("insights.revenueBilled")}
                    dashed
                  />
                </ChartLegend>
                <p className="text-sm text-[var(--color-text-muted)]">
                  <span className="font-medium text-[var(--color-text)] tabular-nums">
                    {fmtMoney(outstanding)}
                  </span>{" "}
                  {t("ops.dashboard.outstanding").toLowerCase()}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <AreaLineChart
                series={revenueSeries}
                labels={WEEK_LABELS}
                formatValue={fmtNum}
                ariaLabel={`${t("insights.revenue")} — ${t("insights.revenueCollected")} ${fmtMoney(
                  collected
                )}`}
              />
            </div>
          </Card>
        </section>

        {/* Volume by department + Status mix */}
        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="p-6">
            <SectionHeading eyebrow={t("ops.dashboard.activeSamples")}>
              {t("insights.volumeByDept")}
            </SectionHeading>
            <div className="mt-6">
              <BarChart
                data={deptData}
                formatValue={(v) => formatNumber(Math.round(v), intlLocale)}
                ariaLabel={t("insights.volumeByDept")}
              />
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeading eyebrow={t("ops.dashboard.bench")}>
              {t("insights.statusMix")}
            </SectionHeading>
            <div className="mt-6 flex flex-col items-center gap-6">
              <DonutChart
                slices={statusSlices}
                centerValue={formatNumber(statusTotal, intlLocale)}
                centerLabel={t("ops.dashboard.activeSamples")}
                ariaLabel={t("insights.statusMix")}
              />
              <ul className="grid w-full gap-2">
                {statusSlices.map((slice) => {
                  const share = statusTotal > 0 ? slice.value / statusTotal : 0;
                  return (
                    <li
                      className="flex items-center justify-between gap-3 text-sm"
                      key={slice.id}
                    >
                      <span className="inline-flex min-w-0 items-center gap-2 text-[var(--color-text)]">
                        <span
                          aria-hidden="true"
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="truncate">{slice.label}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-[var(--color-text-muted)]">
                        {formatNumber(slice.value, intlLocale)} · {pct(share)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>
        </section>

        {/* QC Levey-Jennings */}
        <section>
          <Card className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionHeading eyebrow={t("ops.dashboard.clinical")}>
                  {t("insights.qcTitle")}
                </SectionHeading>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {t("insights.qcSubtitle")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="success" dot>
                  {t("insights.tatTarget")} ±2SD
                </Badge>
                <Badge tone="warning" dot>
                  ±2SD
                </Badge>
                <Badge tone="danger" dot>
                  ±3SD
                </Badge>
              </div>
            </div>
            <div className="mt-6">
              <LeveyJenningsChart
                points={qcPoints}
                mean={QC_MEAN}
                sd={QC_SD}
                formatValue={(v) => v.toFixed(2)}
                ariaLabel={`${t("insights.qcTitle")} — ${t("insights.qcSubtitle")}`}
              />
            </div>
            <p className="mt-4 border-t border-[var(--color-line)] pt-4 text-xs text-[var(--color-text-muted)]">
              {openCriticals > 0
                ? `${formatNumber(openCriticals, intlLocale)} ${t("ops.dashboard.openAlerts").toLowerCase()}`
                : t("ops.guardrailNote")}
            </p>
          </Card>
        </section>
      </div>
    </OpsShell>
  );
}
