import Link from "next/link";
import type { TenantConfig, TenantSnapshot, SessionActor, UserRole } from "@lab/contracts";
import type { ComponentType, ReactNode } from "react";
import {
  Activity,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LineChart,
  SlidersHorizontal,
  TestTubes,
  Users
} from "lucide-react";
import { AppShell, Badge, Card, cn } from "@lab/ui";
import { getTranslator, type Locale } from "../lib/i18n";
import { withParams } from "../lib/url";
import { AppControls } from "./controls/app-controls";
import { TenantTheme } from "./tenant-theme";

type OpsActive =
  | "dashboard"
  | "insights"
  | "patients"
  | "orders"
  | "catalog"
  | "reports"
  | "actions"
  | "labadmin"
  | "admin";

type OpsShellProps = {
  tenant: TenantConfig;
  actor: SessionActor;
  snapshot: TenantSnapshot;
  active: OpsActive;
  locale?: Locale;
  /** @deprecated theming now flows through TenantTheme; kept for compatibility. */
  themeStyle?: Record<string, string>;
  children: ReactNode;
};

const navItems: Array<{
  id: OpsActive;
  key: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  roles?: UserRole[];
}> = [
  { id: "dashboard", key: "nav.dashboard", href: "/ops", icon: LayoutDashboard },
  { id: "insights", key: "nav.insights", href: "/ops/insights", icon: LineChart },
  { id: "patients", key: "nav.patients", href: "/ops/patients", icon: Users },
  { id: "orders", key: "nav.orders", href: "/ops/orders", icon: ClipboardList },
  { id: "catalog", key: "nav.catalog", href: "/ops/catalog", icon: TestTubes },
  { id: "reports", key: "nav.reports", href: "/ops/reports", icon: FileText },
  { id: "actions", key: "nav.actions", href: "/ops/actions", icon: Activity },
  { id: "labadmin", key: "nav.labAdmin", href: "/ops/lab-admin", icon: Building2, roles: ["lab_admin", "super_admin"] },
  { id: "admin", key: "nav.admin", href: "/admin", icon: SlidersHorizontal, roles: ["super_admin"] }
];

const staffRoles: UserRole[] = [
  "receptionist",
  "phlebotomist",
  "technician",
  "pathologist",
  "branch_manager",
  "lab_admin",
  "super_admin"
];

export function OpsShell({ tenant, actor, snapshot, active, locale = "en", children }: OpsShellProps) {
  const t = getTranslator(locale);
  const openAlerts = snapshot.criticalAlerts.filter((alert) => alert.status === "open").length;
  const pendingRelease = snapshot.reports.filter((report) => report.status === "draft").length;
  const href = (path: string) => withParams(path, { tenant: tenant.slug, lang: locale, role: actor.role });

  return (
    <TenantTheme tenant={tenant} locale={locale}>
      <AppShell
        sidebar={
          <div className="flex h-full flex-col gap-4">
            <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-muted)] p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] font-[var(--font-display)] text-xl font-bold text-[var(--color-primary-foreground)] shadow-card">
                  {tenant.logos.square}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {tenant.brandName}
                  </p>
                  <h1 className="mt-1 text-balance font-[var(--font-display)] text-2xl leading-none text-[var(--color-text)]">
                    {t("ops.opsCommand")}
                  </h1>
                </div>
              </div>
              <div className="mt-4 border-t border-[var(--color-line)] pt-4">
                <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">{t("common.signedInAs")}</p>
                <p className="mt-1 truncate text-sm font-medium text-[var(--color-text)]">{actor.displayName}</p>
                <p className="mt-0.5 truncate text-sm text-[var(--color-text-muted)]">
                  {t(`roles.${actor.role}`)} · {actor.branchName ?? t("ops.centralLab")}
                </p>
              </div>
            </div>
            <nav aria-label="Operations navigation" className="grid gap-1.5 text-sm">
              {navItems
                .filter((item) => !item.roles || item.roles.includes(actor.role))
                .map((item) => {
                const Icon = item.icon;
                const isActive = item.id === active;
                return (
                  <Link
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                      isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-card"
                        : "border-transparent text-[var(--color-text)] hover:border-[var(--color-line)] hover:bg-[var(--color-panel-muted)]"
                    )}
                    href={href(item.href)}
                    key={item.id}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    <span className="truncate">{t(item.key)}</span>
                    {item.id === "actions" && openAlerts > 0 ? (
                      <span className="ms-auto rounded-full bg-[var(--color-danger)] px-1.5 text-xs font-semibold text-white tabular-nums">
                        {openAlerts}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <Card className="mt-auto border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-line))] p-4" flat>
              <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">{t("ops.guardrails")}</p>
              <div className="mt-3 grid gap-3 text-sm text-[var(--color-text)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--color-text-muted)]">{t("ops.critical")}</span>
                  <span className="font-[var(--font-display)] text-xl tabular-nums">{openAlerts}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--color-text-muted)]">{t("ops.pendingRelease")}</span>
                  <span className="font-[var(--font-display)] text-xl tabular-nums">{pendingRelease}</span>
                </div>
                <p className="border-t border-[var(--color-line)] pt-3 text-xs text-[var(--color-text-muted)]">
                  {t("ops.guardrailNote")}
                </p>
              </div>
            </Card>
          </div>
        }
        topbar={
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {t("ops.workspace")}
              </p>
              <h2 className="mt-1 truncate text-balance font-[var(--font-display)] text-3xl leading-tight">
                {actor.branchName ?? t("ops.centralLab")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <Badge tone="primary">{t("ops.badgeAudit")}</Badge>
                <Badge tone={openAlerts ? "danger" : "neutral"} dot={openAlerts > 0}>
                  {t("ops.critical")}: {openAlerts}
                </Badge>
              </div>
              <AppControls
                locale={locale}
                themeLabel={t("controls.toggleTheme")}
                languageLabel={t("controls.selectLanguage")}
                role={{
                  current: actor.role,
                  label: t("controls.role"),
                  options: staffRoles.map((role) => ({ value: role, label: t(`roles.${role}`) }))
                }}
              />
            </div>
          </div>
        }
      >
        {children}
      </AppShell>
    </TenantTheme>
  );
}
