import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAppContext } from "../../../lib/session";
import { getTenantDomainData, getOrderReport } from "../../../lib/domain";
import { withParams } from "../../../lib/url";
import { TenantTheme } from "../../../components/tenant-theme";
import { ReportDocument } from "../../../components/report/report-document";
import { PrintButton } from "../../../components/report/print-button";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orderId } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, locale, intlLocale, t } = getAppContext(sp);
  const { snapshot } = await getTenantDomainData(tenant);

  // Prefer the requested order; otherwise fall back to the first order that has
  // a report or any results so the demo always renders a meaningful sheet.
  const order =
    snapshot.orders.find((o) => o.id === orderId || o.orderNumber === orderId) ??
    snapshot.orders.find((o) => snapshot.reports.some((r) => r.orderId === o.id)) ??
    snapshot.orders.find((o) => snapshot.results.some((r) => r.orderId === o.id)) ??
    snapshot.orders[0];

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] p-8">
        <TenantTheme tenant={tenant} locale={locale}>
          <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel)] p-10 text-center shadow-card">
            <p className="text-sm text-[var(--color-text-muted)]">{t("common.pending")}</p>
          </div>
        </TenantTheme>
      </main>
    );
  }

  const patient = snapshot.patients.find((p) => p.id === order.patientId);
  const results = snapshot.results.filter((r) => r.orderId === order.id);
  const sample =
    snapshot.samples.find((s) => s.orderId === order.id && s.collectedAt) ??
    snapshot.samples.find((s) => s.orderId === order.id);
  const report = getOrderReport(snapshot, order.id);

  const backHref = withParams("/ops/reports", {
    tenant: tenant.slug,
    lang: locale
  });

  return (
    <TenantTheme tenant={tenant} locale={locale}>
      <main className="min-h-screen bg-[var(--color-canvas)] bg-grid px-4 py-6 sm:py-10">
        {/* Toolbar — never printed */}
        <div className="no-print mx-auto mb-6 flex max-w-[820px] items-center justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-2 text-sm font-medium text-[var(--color-text)] shadow-card transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-panel-muted)]"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            {t("common.back")}
          </Link>
          <PrintButton label={t("report.print")} />
        </div>

        {/* A4-like report sheet */}
        <div className="print-page mx-auto max-w-[820px] rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 shadow-lift sm:p-12">
          <ReportDocument
            tenant={tenant}
            patient={patient}
            order={order}
            results={results}
            sample={sample}
            report={report}
            intlLocale={intlLocale}
            t={t}
          />
        </div>
      </main>
    </TenantTheme>
  );
}
