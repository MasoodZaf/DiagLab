import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Network } from "lucide-react";
import { tenantPresets } from "@lab/branding";
import { getTenantOrg } from "@lab/demo-data";
import { Badge, Card } from "@lab/ui";
import type { UserRole } from "@lab/contracts";
import { getLocalization } from "../../../lib/i18n";
import { pickParam, withParams } from "../../../lib/url";
import { ThemeToggle } from "../../../components/controls/theme-toggle";
import { OutletLoginForm } from "../../../components/auth/outlet-login-form";

type SearchParams = Record<string, string | string[] | undefined>;

const OUTLET_ROLES: UserRole[] = ["receptionist", "phlebotomist", "technician", "branch_manager"];

export default async function OutletLoginPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const sp = searchParams ? await searchParams : undefined;
  const { t, locale, dir } = getLocalization(pickParam(sp, "lang"));

  const tenants = Object.values(tenantPresets).map((tenant) => ({ value: tenant.slug, label: tenant.brandName }));
  const outletsByTenant: Record<string, Array<{ value: string; label: string }>> = {};
  for (const tenant of Object.values(tenantPresets)) {
    outletsByTenant[tenant.slug] = getTenantOrg(tenant.id).outlets.map((o) => ({ value: o.id, label: `${o.name} · ${o.city}` }));
  }
  const roles = OUTLET_ROLES.map((role) => ({ value: role, label: t(`roles.${role}`) }));
  const staffHref = withParams("/login", { lang: locale });

  return (
    <div lang={locale} dir={dir} className="relative min-h-dvh overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text)]">
      <div className="absolute end-4 top-4 z-20 flex items-center gap-2 sm:end-6 sm:top-6">
        <Link
          href={staffHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)]/80 px-4 text-sm font-medium text-[var(--color-text)] backdrop-blur transition-colors hover:bg-[var(--color-panel-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
          {t("outlet.backToStaff")}
        </Link>
        <ThemeToggle label={t("controls.toggleTheme")} />
      </div>

      <div className="mx-auto grid min-h-dvh w-full lg:grid-cols-[1.05fr_1fr]">
        <aside
          className="relative hidden flex-col justify-between overflow-hidden p-10 text-[var(--color-primary-foreground)] lg:flex xl:p-14"
          style={{ background: "linear-gradient(155deg, #0b1f1c 0%, #0a1412 55%, #06100e 100%)" }}
        >
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden />
          <div className="relative z-10 flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
              <Network aria-hidden className="size-6 text-white" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t("outlet.loginEyebrow")}</p>
              <p className="font-[var(--font-display)] text-xl font-semibold tracking-tight text-white">{t("brand.platform")}</p>
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <Badge tone="primary" className="bg-white/10 text-white">
              <MapPin aria-hidden className="size-3.5" /> {t("outlet.workspace")}
            </Badge>
            <h2 className="mt-5 text-balance font-[var(--font-display)] text-4xl font-semibold leading-tight text-white xl:text-5xl">
              {t("outlet.panelTitle")}
            </h2>
            <p className="mt-4 text-pretty text-base/7 text-white/70">{t("outlet.panelBody")}</p>
          </div>

          <p className="relative z-10 flex items-center gap-2 text-sm text-white/55">
            <Building2 aria-hidden className="size-4" />
            {t("landing.statLabs")} · {t("landing.statCompliance")}
          </p>
        </aside>

        <main className="flex items-center justify-center px-5 py-16 sm:px-8">
          <div className="w-full max-w-md animate-rise">
            <Card className="p-7 sm:p-9">
              <header className="mb-7">
                <Badge tone="info" dot>{t("outlet.workspace")}</Badge>
                <h1 className="mt-3 text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight text-[var(--color-text)]">
                  {t("outlet.loginTitle")}
                </h1>
                <p className="mt-2 text-pretty text-sm leading-6 text-[var(--color-text-muted)]">{t("outlet.loginSubtitle")}</p>
              </header>

              <OutletLoginForm
                locale={locale}
                tenants={tenants}
                outletsByTenant={outletsByTenant}
                roles={roles}
                labels={{
                  selectBrand: t("outlet.selectBrand"),
                  selectOutlet: t("outlet.selectOutlet"),
                  selectRole: t("outlet.selectRole"),
                  selectLanguage: t("login.selectLanguage"),
                  enter: t("outlet.enter")
                }}
              />

              <p className="mt-6 text-center text-xs leading-5 text-[var(--color-text-muted)]">{t("outlet.demoNote")}</p>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
