import type { ReactNode } from "react";
import { testCatalog } from "@lab/demo-data";
import type { CatalogCurrency, CatalogDepartment } from "@lab/contracts";
import { Badge } from "@lab/ui";
import { Beaker, Layers, Sparkles } from "lucide-react";
import { OpsShell } from "../../../components/ops-shell";
import { CatalogBrowser, type CatalogLabels } from "../../../components/catalog/catalog-browser";
import { getTenantDomainData } from "../../../lib/domain";
import { getAppContext } from "../../../lib/session";

type CatalogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Tenant home currency. Catalog also exposes a selector for the others. */
const tenantCurrency: Record<string, CatalogCurrency> = {
  lumen: "PKR",
  cedar: "GBP"
};

const departmentSlugs: CatalogDepartment[] = [
  "hematology",
  "biochemistry",
  "immunology",
  "microbiology",
  "molecular",
  "histopathology",
  "endocrinology"
];

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, actor, locale, intlLocale, t } = getAppContext(sp, {
    defaultRole: "receptionist"
  });
  const { snapshot } = await getTenantDomainData(tenant);

  const defaultCurrency = tenantCurrency[tenant.slug] ?? testCatalog.currencies[0];

  // Resolve every translated department name on the server -> plain object.
  const departmentNames = departmentSlugs.reduce<Record<CatalogDepartment, string>>(
    (acc, dept) => {
      acc[dept] = t(`catalog.departments.${dept}`);
      return acc;
    },
    {} as Record<CatalogDepartment, string>
  );

  // All UI strings resolved server-side; the translator is never sent to the client.
  const labels: CatalogLabels = {
    code: t("catalog.code"),
    test: t("catalog.test"),
    department: t("catalog.department"),
    specimen: t("catalog.specimen"),
    tat: t("catalog.tat"),
    price: t("catalog.price"),
    referenceRange: t("catalog.referenceRange"),
    method: t("catalog.method"),
    searchPlaceholder: t("catalog.searchPlaceholder"),
    panel: t("catalog.panel"),
    panelIncludes: t("catalog.panelIncludes"),
    popular: "Popular",
    all: "All",
    results: t("catalog.title"),
    noResults: "No matching tests",
    noResultsHint: t("catalog.subtitle"),
    clear: "Clear",
    currency: t("catalog.price"),
    tatUnit: "{n} h"
  };

  const panelCount = testCatalog.tests.filter((test) => test.isPanel).length;
  const popularCount = testCatalog.tests.filter((test) => test.popular).length;
  const departmentCount = new Set(testCatalog.tests.map((test) => test.department)).size;

  return (
    <OpsShell active="catalog" actor={actor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <div className="grid gap-6">
        <header className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {tenant.brandName}
            </p>
            <h2 className="mt-2 text-balance font-[var(--font-display)] text-4xl leading-tight text-[var(--color-text)]">
              {t("catalog.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-[var(--color-text-muted)]">
              {t("catalog.subtitle")}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            <CatalogStat
              icon={<Layers className="size-4" />}
              label={t("catalog.department")}
              value={departmentCount}
            />
            <CatalogStat
              icon={<Beaker className="size-4" />}
              label={t("catalog.panel")}
              value={panelCount}
            />
            <CatalogStat
              icon={<Sparkles className="size-4" />}
              label={labels.popular}
              value={popularCount}
            />
          </dl>
        </header>

        <CatalogBrowser
          currencies={testCatalog.currencies}
          defaultCurrency={defaultCurrency}
          departmentNames={departmentNames}
          intlLocale={intlLocale}
          labels={labels}
          tests={testCatalog.tests}
        />

        <p className="flex flex-wrap items-center gap-2 px-1 text-xs text-[var(--color-text-muted)]">
          <Badge tone="neutral">{tenant.brandName}</Badge>
          {t("catalog.subtitle")}
        </p>
      </div>
    </OpsShell>
  );
}

function CatalogStat({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel)] p-4 shadow-card">
      <div className="flex items-center gap-2 text-[var(--color-primary)]">{icon}</div>
      <p className="mt-2 font-[var(--font-display)] text-2xl tabular-nums text-[var(--color-text)]">{value}</p>
      <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
    </div>
  );
}
