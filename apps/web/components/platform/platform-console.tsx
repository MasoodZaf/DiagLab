"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  ArrowLeft,
  Ban,
  Building2,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  MapPin,
  PlusCircle,
  RotateCcw,
  ShieldCheck,
  Trash2
} from "lucide-react";
import {
  catalogCurrencies,
  subscriptionPlans,
  type AccountState,
  type CatalogCurrency,
  type SubscriptionPlan,
  type SupportTicket,
  type TenantAccount,
  type TicketCategory,
  type TicketSeverity,
  type TicketStatus
} from "@lab/contracts";
import { AppShell, Badge, Button, Card, SectionHeading, cn, type BadgeTone } from "@lab/ui";
import { getTranslator, localeMeta, type Locale } from "../../lib/i18n";
import { formatDate, formatMoney, formatNumber } from "../../lib/format";
import { withParams } from "../../lib/url";
import { AppControls } from "../controls/app-controls";

type Section = "overview" | "tenants" | "billing" | "complaints" | "provision";

type PlatformConsoleProps = {
  accounts: TenantAccount[];
  tickets: SupportTicket[];
  intlLocale: string;
  locale: Locale;
  operatorName: string;
};

const stateTone: Record<AccountState, BadgeTone> = {
  active: "success",
  trial: "info",
  past_due: "warning",
  suspended: "danger"
};

const planTone: Record<SubscriptionPlan, BadgeTone> = {
  starter: "neutral",
  growth: "primary",
  enterprise: "success"
};

const severityTone: Record<TicketSeverity, BadgeTone> = {
  low: "neutral",
  normal: "neutral",
  high: "warning",
  urgent: "danger"
};

const ticketStatusTone: Record<TicketStatus, BadgeTone> = {
  open: "warning",
  in_progress: "info",
  resolved: "success"
};

const field =
  "min-h-10 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]";
const micro = "mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]";

export function PlatformConsole({ accounts: initialAccounts, tickets, intlLocale, locale, operatorName }: PlatformConsoleProps) {
  const t = getTranslator(locale);
  const dir = localeMeta[locale].dir;
  const [section, setSection] = useState<Section>("overview");
  const [accounts, setAccounts] = useState<TenantAccount[]>(initialAccounts);

  const planLabel = (p: SubscriptionPlan) => t(`platform.plan${cap(p)}`);
  const stateLabel = (s: AccountState) => t(`platform.state${pascal(s)}`);
  const categoryLabel = (c: TicketCategory) => t(`platform.cat${pascal(c)}`);
  const severityLabel = (s: TicketSeverity) => t(`platform.sev${cap(s)}`);
  const ticketStatusLabel = (s: TicketStatus) => t(`platform.ticket${pascal(s)}`);

  const openTickets = tickets.filter((ticket) => ticket.status !== "resolved").length;

  const kpis = useMemo(() => {
    const byState = (s: AccountState) => accounts.filter((a) => a.state === s).length;
    return {
      total: accounts.length,
      active: byState("active"),
      trial: byState("trial"),
      pastDue: byState("past_due"),
      openTickets
    };
  }, [accounts, openTickets]);

  // Mixed-currency revenue is summed per currency — never across currencies.
  const revenueByCurrency = useMemo(() => {
    const map = new Map<string, { arr: number; setupBilled: number; outstanding: number }>();
    for (const a of accounts) {
      const entry = map.get(a.currency) ?? { arr: 0, setupBilled: 0, outstanding: 0 };
      entry.arr += a.annualFee;
      entry.setupBilled += a.setupFee;
      if (!a.setupPaid) entry.outstanding += a.setupFee;
      map.set(a.currency, entry);
    }
    return [...map.entries()];
  }, [accounts]);

  const nav: Array<{ id: Section; label: string; icon: ComponentType<{ className?: string }> }> = [
    { id: "overview", label: t("platform.navOverview"), icon: LayoutDashboard },
    { id: "tenants", label: t("platform.navTenants"), icon: Building2 },
    { id: "billing", label: t("platform.navBilling"), icon: CreditCard },
    { id: "complaints", label: t("platform.navComplaints"), icon: LifeBuoy },
    { id: "provision", label: t("platform.navProvision"), icon: PlusCircle }
  ];

  const manageBrandHref = (slug: string) => withParams("/admin", { tenant: slug, role: "super_admin", lang: locale });
  const tenantConsoleHref = withParams("/ops", { role: "super_admin", lang: locale });

  const suspendTenant = (id: string) =>
    setAccounts((list) => list.map((a) => (a.tenantId === id ? { ...a, state: a.state === "suspended" ? "active" : "suspended" } : a)));
  const removeTenant = (id: string) => setAccounts((list) => list.filter((a) => a.tenantId !== id));

  return (
    <div lang={locale} dir={dir}>
      <AppShell
        sidebar={
          <div className="flex h-full flex-col gap-4">
            <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-muted)] p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-card">
                  <ShieldCheck className="size-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {t("platform.brandEyebrow")}
                  </p>
                  <h1 className="mt-1 text-balance font-[var(--font-display)] text-2xl leading-none text-[var(--color-text)]">
                    {t("platform.console")}
                  </h1>
                </div>
              </div>
              <div className="mt-4 border-t border-[var(--color-line)] pt-4">
                <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">{t("platform.signedInAs")}</p>
                <p className="mt-1 truncate text-sm font-medium text-[var(--color-text)]">{operatorName}</p>
                <p className="mt-0.5 truncate text-sm text-[var(--color-text-muted)]">{t("roles.super_admin")}</p>
              </div>
            </div>

            <nav aria-label={t("platform.console")} className="grid gap-1.5 text-sm">
              {nav.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === section;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition-colors",
                      isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-card"
                        : "border-transparent text-[var(--color-text)] hover:border-[var(--color-line)] hover:bg-[var(--color-panel-muted)]"
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.id === "complaints" && openTickets > 0 ? (
                      <span className="ms-auto rounded-full bg-[var(--color-danger)] px-1.5 text-xs font-semibold text-white tabular-nums">
                        {openTickets}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto grid gap-2">
              <ResetDemoButton t={t} />
              <Link
                href={tenantConsoleHref}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-line)] px-3 py-2.5 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-panel-muted)] hover:text-[var(--color-text)]"
              >
                <ArrowLeft className="size-[18px] rtl:-scale-x-100" />
                {t("platform.backToTenant")}
              </Link>
            </div>
          </div>
        }
        topbar={
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {t("platform.workspace")}
              </p>
              <h2 className="mt-1 truncate text-balance font-[var(--font-display)] text-3xl leading-tight">
                {t("brand.platform")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <Badge tone="primary">{t("platform.kpiTenants")}: {kpis.total}</Badge>
                <Badge tone={openTickets ? "warning" : "neutral"} dot={openTickets > 0}>
                  {t("platform.kpiOpenTickets")}: {openTickets}
                </Badge>
              </div>
              <AppControls
                locale={locale}
                themeLabel={t("controls.toggleTheme")}
                languageLabel={t("controls.selectLanguage")}
              />
            </div>
          </div>
        }
      >
        {section === "overview" ? (
          <Overview
            t={t}
            kpis={kpis}
            revenueByCurrency={revenueByCurrency}
            intlLocale={intlLocale}
          />
        ) : null}

        {section === "tenants" ? (
          <Tenants
            t={t}
            accounts={accounts}
            intlLocale={intlLocale}
            planLabel={planLabel}
            stateLabel={stateLabel}
            manageBrandHref={manageBrandHref}
            onSuspend={suspendTenant}
            onRemove={removeTenant}
          />
        ) : null}

        {section === "billing" ? (
          <Billing t={t} accounts={accounts} intlLocale={intlLocale} revenueByCurrency={revenueByCurrency} />
        ) : null}

        {section === "complaints" ? (
          <Complaints
            t={t}
            tickets={tickets}
            intlLocale={intlLocale}
            categoryLabel={categoryLabel}
            severityLabel={severityLabel}
            ticketStatusLabel={ticketStatusLabel}
          />
        ) : null}

        {section === "provision" ? (
          <Provision
            t={t}
            planLabel={planLabel}
            onProvision={(account) => {
              setAccounts((list) => [...list, account]);
              setSection("tenants");
            }}
          />
        ) : null}
      </AppShell>
    </div>
  );
}

type Translator = ReturnType<typeof getTranslator>;
type Kpis = { total: number; active: number; trial: number; pastDue: number; openTickets: number };
type RevenueRows = Array<[string, { arr: number; setupBilled: number; outstanding: number }]>;

function Overview({ t, kpis, revenueByCurrency, intlLocale }: { t: Translator; kpis: Kpis; revenueByCurrency: RevenueRows; intlLocale: string }) {
  return (
    <div className="grid gap-4">
      <div>
        <p className={micro}>{t("platform.console")}</p>
        <h2 className="mt-1 text-balance font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">
          {t("platform.overviewTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">{t("platform.overviewSubtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label={t("platform.kpiTenants")} value={kpis.total} tone="primary" />
        <Kpi label={t("platform.kpiActive")} value={kpis.active} tone="success" />
        <Kpi label={t("platform.kpiTrial")} value={kpis.trial} tone="info" />
        <Kpi label={t("platform.kpiPastDue")} value={kpis.pastDue} tone="warning" />
        <Kpi label={t("platform.kpiOpenTickets")} value={kpis.openTickets} tone={kpis.openTickets ? "danger" : "neutral"} />
      </div>

      <Card className="p-6">
        <SectionHeading eyebrow={t("platform.kpiAnnualValue")}>{t("platform.totalArr")}</SectionHeading>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {revenueByCurrency.map(([currency, totals]) => (
            <div key={currency} className="rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{currency}</p>
              <p className="mt-1 font-[var(--font-display)] text-2xl tabular-nums text-[var(--color-text)]">
                {formatMoney(totals.arr, currency, intlLocale)}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {t("platform.outstandingSetup")}: {formatMoney(totals.outstanding, currency, intlLocale)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Tenants({
  t,
  accounts,
  intlLocale,
  planLabel,
  stateLabel,
  manageBrandHref,
  onSuspend,
  onRemove
}: {
  t: Translator;
  accounts: TenantAccount[];
  intlLocale: string;
  planLabel: (p: SubscriptionPlan) => string;
  stateLabel: (s: AccountState) => string;
  manageBrandHref: (slug: string) => string;
  onSuspend: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <SectionScaffold t={t} title={t("platform.tenantsTitle")} subtitle={t("platform.tenantsSubtitle")} count={`${accounts.length}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-start text-sm">
          <thead className="text-[var(--color-text-muted)]">
            <tr>
              <Th>{t("platform.colBrand")}</Th>
              <Th>{t("platform.colLocation")}</Th>
              <Th>{t("platform.colPlan")}</Th>
              <Th>{t("platform.colState")}</Th>
              <Th>{t("platform.colOutlets")}</Th>
              <Th>{t("platform.colAnnualFee")}</Th>
              <Th>{t("platform.colRenewal")}</Th>
              <Th>{t("platform.colActions")}</Th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.tenantId} className="bg-[var(--color-panel-muted)]">
                <td className="rounded-s-[12px] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--color-accent-surface)] font-bold text-[var(--color-primary)]">
                      {a.brandName.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--color-text)]">{a.brandName}</p>
                      <p className="font-mono text-xs text-[var(--color-text-muted)]">{a.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-muted)]">
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {a.city}, {a.country}</span>
                </td>
                <td className="px-4 py-3"><Badge tone={planTone[a.plan]}>{planLabel(a.plan)}</Badge></td>
                <td className="px-4 py-3"><Badge tone={stateTone[a.state]} dot>{stateLabel(a.state)}</Badge></td>
                <td className="px-4 py-3 tabular-nums text-[var(--color-text)]">{a.outletCount}</td>
                <td className="px-4 py-3 tabular-nums text-[var(--color-text)]">
                  {formatMoney(a.annualFee, a.currency, intlLocale)}<span className="text-xs text-[var(--color-text-muted)]">{t("platform.perYear")}</span>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-muted)]">
                  {a.state === "trial" && a.trialEndsAt
                    ? t("platform.trialEnds", { date: formatDate(a.trialEndsAt, intlLocale) ?? "" })
                    : formatDate(a.renewalAt, intlLocale)}
                </td>
                <td className="rounded-e-[12px] px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {a.configured ? (
                      <Link
                        href={manageBrandHref(a.slug)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-panel)]"
                      >
                        {t("platform.manageBrand")}
                        <ExternalLink className="size-3.5" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                        {t("platform.configurePending")}
                      </span>
                    )}
                    <button
                      type="button"
                      title={a.state === "suspended" ? t("platform.reactivate") : t("platform.suspend")}
                      aria-label={a.state === "suspended" ? t("platform.reactivate") : t("platform.suspend")}
                      onClick={() => onSuspend(a.tenantId)}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-warning)] hover:text-[var(--color-warning)]"
                    >
                      {a.state === "suspended" ? <RotateCcw className="size-4" /> : <Ban className="size-4" />}
                    </button>
                    <button
                      type="button"
                      title={t("platform.remove")}
                      aria-label={t("platform.remove")}
                      onClick={() => onRemove(a.tenantId)}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] hover:text-[var(--color-danger)]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionScaffold>
  );
}

function Billing({ t, accounts, intlLocale, revenueByCurrency }: { t: Translator; accounts: TenantAccount[]; intlLocale: string; revenueByCurrency: RevenueRows }) {
  return (
    <div className="grid gap-4">
      <div>
        <p className={micro}>{t("platform.console")}</p>
        <h2 className="mt-1 text-balance font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">
          {t("platform.billingTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">{t("platform.billingSubtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {revenueByCurrency.map(([currency, totals]) => (
          <Card key={currency} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{currency}</p>
            <p className="mt-2 font-[var(--font-display)] text-2xl tabular-nums text-[var(--color-text)]">
              {formatMoney(totals.arr, currency, intlLocale)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">{t("platform.totalArr")}</p>
            <div className="mt-3 grid gap-1 border-t border-[var(--color-line)] pt-3 text-sm">
              <Row label={t("platform.totalSetup")} value={formatMoney(totals.setupBilled, currency, intlLocale)} />
              <Row label={t("platform.outstandingSetup")} value={formatMoney(totals.outstanding, currency, intlLocale)} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <SectionHeading eyebrow={`${accounts.length}`}>{t("platform.billingTitle")}</SectionHeading>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-start text-sm">
            <thead className="text-[var(--color-text-muted)]">
              <tr>
                <Th>{t("platform.colBrand")}</Th>
                <Th>{t("platform.colSetupFee")}</Th>
                <Th>{t("platform.colSetupStatus")}</Th>
                <Th>{t("platform.recurringAnnual")}</Th>
                <Th>{t("platform.colRenewal")}</Th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.tenantId} className="bg-[var(--color-panel-muted)]">
                  <td className="rounded-s-[12px] px-4 py-3 font-medium text-[var(--color-text)]">{a.brandName}</td>
                  <td className="px-4 py-3 tabular-nums text-[var(--color-text)]">{formatMoney(a.setupFee, a.currency, intlLocale)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={a.setupPaid ? "success" : "danger"} dot>
                      {a.setupPaid ? t("platform.setupPaid") : t("platform.setupUnpaid")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[var(--color-text)]">
                    {formatMoney(a.annualFee, a.currency, intlLocale)}<span className="text-xs text-[var(--color-text-muted)]">{t("platform.perYear")}</span>
                  </td>
                  <td className="rounded-e-[12px] px-4 py-3 text-[var(--color-text-muted)]">{formatDate(a.renewalAt, intlLocale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Complaints({
  t,
  tickets,
  intlLocale,
  categoryLabel,
  severityLabel,
  ticketStatusLabel
}: {
  t: Translator;
  tickets: SupportTicket[];
  intlLocale: string;
  categoryLabel: (c: TicketCategory) => string;
  severityLabel: (s: TicketSeverity) => string;
  ticketStatusLabel: (s: TicketStatus) => string;
}) {
  return (
    <SectionScaffold t={t} title={t("platform.complaintsTitle")} subtitle={t("platform.complaintsSubtitle")} count={`${tickets.length}`}>
      {tickets.length === 0 ? (
        <p className="rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          {t("platform.noTickets")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-start text-sm">
            <thead className="text-[var(--color-text-muted)]">
              <tr>
                <Th>{t("platform.colSubject")}</Th>
                <Th>{t("platform.colTenant")}</Th>
                <Th>{t("platform.colCategory")}</Th>
                <Th>{t("platform.colSeverity")}</Th>
                <Th>{t("platform.colStatus")}</Th>
                <Th>{t("platform.colOpened")}</Th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="bg-[var(--color-panel-muted)]">
                  <td className="rounded-s-[12px] px-4 py-3 font-medium text-[var(--color-text)]">{ticket.subject}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{ticket.brandName}</td>
                  <td className="px-4 py-3"><Badge tone="neutral">{categoryLabel(ticket.category)}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={severityTone[ticket.severity]} dot>{severityLabel(ticket.severity)}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={ticketStatusTone[ticket.status]} dot>{ticketStatusLabel(ticket.status)}</Badge></td>
                  <td className="rounded-e-[12px] px-4 py-3 text-[var(--color-text-muted)]">{formatDate(ticket.openedAt, intlLocale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionScaffold>
  );
}

function Provision({
  t,
  planLabel,
  onProvision
}: {
  t: Translator;
  planLabel: (p: SubscriptionPlan) => string;
  onProvision: (account: TenantAccount) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({ plan: "starter", currency: "PKR" });
  const [done, setDone] = useState(false);
  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  function submit() {
    const brandName = draft.brandName?.trim();
    if (!brandName) return;
    const slug = (draft.slug?.trim() || brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/(^-|-$)/g, "");
    const now = new Date();
    const inThirty = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    onProvision({
      tenantId: `tenant_${slug}`,
      slug,
      brandName,
      city: draft.city?.trim() || "—",
      country: draft.country?.trim() || "—",
      primaryContact: draft.primaryContact?.trim() || "—",
      plan: (draft.plan as SubscriptionPlan) ?? "starter",
      state: "trial",
      currency: (draft.currency as CatalogCurrency) ?? "PKR",
      setupFee: Number(draft.setupFee) || 0,
      setupPaid: false,
      annualFee: Number(draft.annualFee) || 0,
      signedUpAt: now.toISOString(),
      renewalAt: inThirty,
      trialEndsAt: inThirty,
      outletCount: 0,
      configured: false
    });
    setDone(true);
    setDraft({ plan: "starter", currency: "PKR" });
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className={micro}>{t("platform.console")}</p>
        <h2 className="mt-1 text-balance font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">
          {t("platform.provisionTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">{t("platform.provisionSubtitle")}</p>
      </div>

      <Card className="p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Labeled label={t("platform.fieldBrand")}>
            <input className={field} value={draft.brandName ?? ""} onChange={(e) => set("brandName", e.target.value)} />
          </Labeled>
          <Labeled label={t("platform.fieldSlug")}>
            <input className={field} value={draft.slug ?? ""} onChange={(e) => set("slug", e.target.value)} placeholder="auto" />
          </Labeled>
          <Labeled label={t("platform.fieldContact")}>
            <input className={field} value={draft.primaryContact ?? ""} onChange={(e) => set("primaryContact", e.target.value)} />
          </Labeled>
          <Labeled label={t("platform.fieldCity")}>
            <input className={field} value={draft.city ?? ""} onChange={(e) => set("city", e.target.value)} />
          </Labeled>
          <Labeled label={t("platform.fieldCountry")}>
            <input className={field} value={draft.country ?? ""} onChange={(e) => set("country", e.target.value)} />
          </Labeled>
          <Labeled label={t("platform.fieldPlan")}>
            <select className={field} value={draft.plan ?? "starter"} onChange={(e) => set("plan", e.target.value)}>
              {subscriptionPlans.map((p) => (
                <option key={p} value={p}>{planLabel(p)}</option>
              ))}
            </select>
          </Labeled>
          <Labeled label={t("platform.fieldCurrency")}>
            <select className={field} value={draft.currency ?? "PKR"} onChange={(e) => set("currency", e.target.value)}>
              {catalogCurrencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Labeled>
          <Labeled label={t("platform.fieldSetupFee")}>
            <input className={field} inputMode="numeric" value={draft.setupFee ?? ""} onChange={(e) => set("setupFee", e.target.value)} />
          </Labeled>
          <Labeled label={t("platform.fieldAnnualFee")}>
            <input className={field} inputMode="numeric" value={draft.annualFee ?? ""} onChange={(e) => set("annualFee", e.target.value)} />
          </Labeled>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={submit} disabled={!draft.brandName?.trim()} className="gap-2">
            <PlusCircle className="size-4" />
            {t("platform.createTenant")}
          </Button>
          {done ? <p className="text-xs text-[var(--color-text-muted)]">{t("platform.provisionedNote")}</p> : null}
        </div>
      </Card>
    </div>
  );
}

function SectionScaffold({ t, title, subtitle, count, children }: { t: Translator; title: string; subtitle: string; count: string; children: ReactNode }) {
  return (
    <div className="grid gap-4">
      <div>
        <p className={micro}>{t("platform.console")}</p>
        <h2 className="mt-1 text-balance font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">{subtitle}</p>
      </div>
      <Card className="p-6">
        <SectionHeading eyebrow={count}>{title}</SectionHeading>
        <div className="mt-5">{children}</div>
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: BadgeTone }) {
  const accent: Record<BadgeTone, string> = {
    neutral: "text-[var(--color-text)]",
    primary: "text-[var(--color-primary)]",
    success: "text-[var(--color-success)]",
    warning: "text-[var(--color-warning)]",
    danger: "text-[var(--color-danger)]",
    info: "text-[var(--color-primary)]"
  };
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className={cn("mt-2 font-[var(--font-display)] text-3xl tabular-nums", accent[tone])}>{formatNumber(value)}</p>
    </Card>
  );
}

function ResetDemoButton({ t }: { t: Translator }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function doReset() {
    setPending(true);
    try {
      await fetch("/api/demo/reset", { method: "POST" });
      // Reload so every surface (and this console's own client state) reseeds clean.
      window.location.reload();
    } catch {
      setPending(false);
      setConfirming(false);
    }
  }

  return (
    <button
      type="button"
      title={t("platform.resetNote")}
      disabled={pending}
      onClick={() => (confirming ? doReset() : setConfirming(true))}
      onBlur={() => setConfirming(false)}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-60",
        confirming
          ? "border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-[var(--color-danger)]"
          : "border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-warning)] hover:text-[var(--color-warning)]"
      )}
    >
      {pending ? <Loader2 className="size-[18px] animate-spin" /> : <RotateCcw className="size-[18px]" />}
      {pending ? t("platform.resetting") : confirming ? t("platform.resetConfirm") : t("platform.resetDemo")}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="tabular-nums text-[var(--color-text)]">{value}</span>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-2 text-start font-medium">{children}</th>;
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={micro}>{label}</span>
      {children}
    </label>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pascal(s: string) {
  return s.split("_").map(cap).join("");
}
