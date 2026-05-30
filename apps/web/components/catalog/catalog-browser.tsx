"use client";

import { useMemo, useState } from "react";
import type { CatalogCurrency, CatalogDepartment, CatalogTest } from "@lab/contracts";
import { Badge, Card, cn } from "@lab/ui";
import { Beaker, Layers, Search, Sparkles, Timer, X } from "lucide-react";
import { formatMoney } from "../../lib/format";

/**
 * Static, server-resolved labels. The translator (`t`) is never sent to the
 * client — every string is resolved on the server and passed as plain data.
 */
export type CatalogLabels = {
  code: string;
  test: string;
  department: string;
  specimen: string;
  tat: string;
  price: string;
  referenceRange: string;
  method: string;
  searchPlaceholder: string;
  panel: string;
  panelIncludes: string;
  popular: string;
  all: string;
  results: string;
  noResults: string;
  noResultsHint: string;
  clear: string;
  currency: string;
  tatUnit: string;
};

type CatalogBrowserProps = {
  tests: CatalogTest[];
  currencies: CatalogCurrency[];
  /** The tenant's home currency — used as the initial selection. */
  defaultCurrency: CatalogCurrency;
  intlLocale: string;
  /** Map of department slug -> translated display name. */
  departmentNames: Record<CatalogDepartment, string>;
  labels: CatalogLabels;
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

export function CatalogBrowser({
  tests,
  currencies,
  defaultCurrency,
  intlLocale,
  departmentNames,
  labels
}: CatalogBrowserProps) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<CatalogDepartment | "all">("all");
  const [currency, setCurrency] = useState<CatalogCurrency>(defaultCurrency);

  // Departments that actually appear in the catalog, in catalog order.
  const departments = useMemo(() => {
    const seen = new Set<CatalogDepartment>();
    const ordered: CatalogDepartment[] = [];
    for (const test of tests) {
      if (!seen.has(test.department)) {
        seen.add(test.department);
        ordered.push(test.department);
      }
    }
    return ordered;
  }, [tests]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return tests.filter((test) => {
      if (department !== "all" && test.department !== department) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [
        test.code,
        test.name,
        test.department,
        departmentNames[test.department] ?? "",
        test.specimen,
        test.method ?? ""
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tests, query, department, departmentNames]);

  // Group the filtered tests by department, preserving catalog order.
  const groups = useMemo(() => {
    const map = new Map<CatalogDepartment, CatalogTest[]>();
    for (const test of filtered) {
      const bucket = map.get(test.department);
      if (bucket) {
        bucket.push(test);
      } else {
        map.set(test.department, [test]);
      }
    }
    return departments
      .filter((dept) => map.has(dept))
      .map((dept) => ({ department: dept, tests: map.get(dept) ?? [] }));
  }, [filtered, departments]);

  const hasFilters = query.length > 0 || department !== "all";

  return (
    <div className="grid gap-5">
      {/* Toolbar — sticky beneath the shell topbar */}
      <div className="sticky top-2 z-10">
        <Card className="p-4 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--color-panel)_88%,transparent)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <span className="sr-only">{labels.searchPlaceholder}</span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--color-text-muted)]"
                />
                <input
                  autoComplete="off"
                  className="h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-muted)] ps-11 pe-10 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] hover:border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-line))]"
                  inputMode="search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={labels.searchPlaceholder}
                  type="search"
                  value={query}
                />
                {query ? (
                  <button
                    aria-label={labels.clear}
                    className="absolute end-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-panel)] hover:text-[var(--color-text)]"
                    onClick={() => setQuery("")}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </label>

              {/* Currency selector */}
              <div
                aria-label={labels.currency}
                className="flex shrink-0 items-center gap-1 self-start rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-muted)] p-1"
                role="group"
              >
                {currencies.map((option) => {
                  const isActive = option === currency;
                  return (
                    <button
                      aria-pressed={isActive}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors",
                        isActive
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-card"
                          : "text-[var(--color-text-muted)] hover:bg-[var(--color-panel)] hover:text-[var(--color-text)]"
                      )}
                      key={option}
                      onClick={() => setCurrency(option)}
                      type="button"
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department filter chips */}
            <div className="flex flex-wrap items-center gap-2">
              <DepartmentChip
                active={department === "all"}
                label={labels.all}
                onClick={() => setDepartment("all")}
              />
              {departments.map((dept) => (
                <DepartmentChip
                  active={department === dept}
                  key={dept}
                  label={departmentNames[dept] ?? dept}
                  onClick={() => setDepartment(dept)}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {labels.results}
          <span className="ms-2 tabular-nums text-[var(--color-text)]">{filtered.length}</span>
        </p>
        {hasFilters ? (
          <button
            className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] transition-opacity hover:opacity-70"
            onClick={() => {
              setQuery("");
              setDepartment("all");
            }}
            type="button"
          >
            {labels.clear}
          </button>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center" flat>
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-accent-surface)] text-[var(--color-primary)]">
            <Search className="size-6" />
          </span>
          <p className="font-[var(--font-display)] text-lg text-[var(--color-text)]">{labels.noResults}</p>
          <p className="max-w-sm text-pretty text-sm text-[var(--color-text-muted)]">{labels.noResultsHint}</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {groups.map((group) => (
            <section className="grid gap-3" key={group.department}>
              <div className="flex items-center gap-3 px-1">
                <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--color-accent-surface)] text-[var(--color-primary)]">
                  <Layers className="size-[18px]" />
                </span>
                <h3 className="font-[var(--font-display)] text-xl text-[var(--color-text)]">
                  {departmentNames[group.department] ?? group.department}
                </h3>
                <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-panel-muted)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-text-muted)]">
                  {group.tests.length}
                </span>
              </div>

              <Card className="overflow-hidden p-0" flat>
                {/* Table header (md+) */}
                <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_auto_minmax(0,1fr)] gap-4 border-b border-[var(--color-line)] bg-[var(--color-panel-muted)] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] md:grid">
                  <span>{labels.test}</span>
                  <span>{labels.specimen}</span>
                  <span>{labels.referenceRange}</span>
                  <span className="text-end">{labels.tat}</span>
                  <span className="text-end">{labels.price}</span>
                </div>

                <ul className="divide-y divide-[var(--color-line)]">
                  {group.tests.map((test) => (
                    <li key={test.code}>
                      <TestRow
                        currency={currency}
                        intlLocale={intlLocale}
                        labels={labels}
                        test={test}
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentChip({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-card"
          : "border-[var(--color-line)] bg-[var(--color-panel-muted)] text-[var(--color-text-muted)] hover:border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-line))] hover:text-[var(--color-text)]"
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function TestRow({
  test,
  currency,
  intlLocale,
  labels
}: {
  test: CatalogTest;
  currency: CatalogCurrency;
  intlLocale: string;
  labels: CatalogLabels;
}) {
  const price = test.prices[currency];

  return (
    <div className="grid gap-3 px-5 py-4 transition-colors hover:bg-[var(--color-panel-muted)] md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_auto_minmax(0,1fr)] md:items-center md:gap-4">
      {/* Test identity */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-[var(--color-line)] bg-[var(--color-panel-muted)] px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-[var(--color-text)]">
            {test.code}
          </span>
          {test.isPanel ? (
            <Badge tone="primary">
              <Beaker aria-hidden="true" className="size-3" />
              {labels.panel}
            </Badge>
          ) : null}
          {test.popular ? (
            <Badge tone="info">
              <Sparkles aria-hidden="true" className="size-3" />
              {labels.popular}
            </Badge>
          ) : null}
        </div>
        <p className="mt-1.5 text-pretty font-medium text-[var(--color-text)]">{test.name}</p>
        {test.method ? (
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            <span className="font-semibold uppercase tracking-wide">{labels.method}:</span> {test.method}
          </p>
        ) : null}
        {test.isPanel && test.panelTests && test.panelTests.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {labels.panelIncludes}:
            </span>
            {test.panelTests.map((member) => (
              <span
                className="rounded-md bg-[var(--color-accent-surface)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--color-primary)]"
                key={member}
              >
                {member}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Specimen */}
      <div className="min-w-0 text-sm text-[var(--color-text-muted)]">
        <span className="me-1 inline text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] md:hidden">
          {labels.specimen}:
        </span>
        {test.specimen}
      </div>

      {/* Reference range */}
      <div className="min-w-0 text-sm text-[var(--color-text)]">
        <span className="me-1 inline text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] md:hidden">
          {labels.referenceRange}:
        </span>
        <span className="tabular-nums">{test.referenceRange}</span>
        {test.unit ? <span className="ms-1 text-[var(--color-text-muted)]">{test.unit}</span> : null}
      </div>

      {/* TAT */}
      <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] md:justify-end">
        <Timer aria-hidden="true" className="size-3.5" />
        <span className="tabular-nums text-[var(--color-text)]">
          {labels.tatUnit.replace("{n}", String(test.tatHours))}
        </span>
      </div>

      {/* Price */}
      <div className="text-start md:text-end">
        {typeof price === "number" ? (
          <span className="font-[var(--font-display)] text-base tabular-nums text-[var(--color-text)]">
            {formatMoney(price, currency, intlLocale)}
          </span>
        ) : (
          <span className="text-sm text-[var(--color-text-muted)]">—</span>
        )}
      </div>
    </div>
  );
}
