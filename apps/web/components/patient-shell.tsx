import Link from "next/link";
import type { SessionActor, TenantConfig, TenantSnapshot } from "@lab/contracts";
import type { ReactNode } from "react";
import { Badge, Card, cn } from "@lab/ui";
import { getTranslator, type Locale } from "../lib/i18n";
import { withParams } from "../lib/url";
import { AppControls } from "./controls/app-controls";
import { TenantTheme } from "./tenant-theme";

type PatientShellProps = {
  tenant: TenantConfig;
  actor: SessionActor;
  snapshot: TenantSnapshot;
  active: "home" | "orders";
  locale?: Locale;
  /** @deprecated theming now flows through TenantTheme; kept for compatibility. */
  themeStyle?: Record<string, string>;
  children: ReactNode;
};

export function PatientShell({ tenant, actor, snapshot, active, locale = "en", children }: PatientShellProps) {
  const t = getTranslator(locale);
  const reportsReady = snapshot.reports.filter((report) => report.status === "released").length;
  const href = (path: string) => withParams(path, { tenant: tenant.slug, lang: locale });

  const tabs: Array<{ id: PatientShellProps["active"]; key: string; href: string }> = [
    { id: "home", key: "nav.home", href: "/patient" },
    { id: "orders", key: "nav.myOrders", href: "/patient/orders" }
  ];

  return (
    <TenantTheme tenant={tenant} locale={locale}>
      <main className="min-h-dvh bg-[var(--color-canvas)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-7 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] font-[var(--font-display)] text-lg font-bold text-[var(--color-primary-foreground)] shadow-card">
                {tenant.logos.square}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {tenant.brandName}
                </p>
                <p className="font-[var(--font-display)] text-lg leading-none text-[var(--color-text)]">
                  {t("nav.portal")}
                </p>
              </div>
            </div>
            <AppControls
              locale={locale}
              themeLabel={t("controls.toggleTheme")}
              languageLabel={t("controls.selectLanguage")}
            />
          </div>

          <header className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel)] shadow-card">
            <div className="bg-aura p-6 sm:p-8">
              <h1 className="max-w-2xl text-balance font-[var(--font-display)] text-3xl leading-tight sm:text-4xl">
                {t("patient.welcome", { name: actor.displayName })}
              </h1>
              <p className="mt-3 max-w-xl text-pretty text-[var(--color-text-muted)]">{t("patient.subtitle")}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge tone="success" dot>
                  {reportsReady} {t("ops.reports.released")}
                </Badge>
                <nav className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <Link
                      key={tab.id}
                      href={href(tab.href)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        active === tab.id
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          : "bg-[var(--color-panel)] text-[var(--color-text)] hover:bg-[var(--color-panel-muted)]"
                      )}
                    >
                      {t(tab.key)}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </header>

          {children}

          <Card className="p-4 text-sm text-[var(--color-text-muted)]" flat>
            {t("report.confidential")} · {t("ops.guardrailNote")}
          </Card>
        </div>
      </main>
    </TenantTheme>
  );
}
