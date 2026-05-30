import Link from "next/link";
import { ArrowLeft, Building2, Layers, Lock, ShieldCheck } from "lucide-react";
import { tenantPresets } from "@lab/branding";
import { Badge, Card } from "@lab/ui";
import { getLocalization } from "../../../lib/i18n";
import { pickParam, withParams } from "../../../lib/url";
import { ThemeToggle } from "../../../components/controls/theme-toggle";
import { AdminLoginForm } from "../../../components/auth/admin-login-form";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminLoginPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const sp = searchParams ? await searchParams : undefined;
  const { t, locale, dir } = getLocalization(pickParam(sp, "lang"));

  const staffHref = withParams("/login", { lang: locale });

  return (
    <div lang={locale} dir={dir} className="relative min-h-dvh overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text)]">
      <div className="absolute end-4 top-4 z-20 flex items-center gap-2 sm:end-6 sm:top-6">
        <Link
          href={staffHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)]/80 px-4 text-sm font-medium text-[var(--color-text)] backdrop-blur transition-colors hover:bg-[var(--color-panel-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
          {t("adminLogin.backToStaff")}
        </Link>
        <ThemeToggle label={t("controls.toggleTheme")} />
      </div>

      <div className="mx-auto grid min-h-dvh w-full lg:grid-cols-[1.05fr_1fr]">
        {/* Platform operator panel — deliberately distinct from the tenant login */}
        <aside className="relative hidden flex-col justify-between overflow-hidden p-10 text-[var(--color-primary-foreground)] lg:flex xl:p-14"
          style={{ background: "linear-gradient(155deg, #0b1f1c 0%, #0a1412 55%, #06100e 100%)" }}
        >
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden />
          <div
            className="pointer-events-none absolute -top-24 end-[-6rem] size-80 rounded-full opacity-30 blur-3xl"
            aria-hidden
            style={{ background: "color-mix(in srgb, var(--color-primary) 60%, transparent)" }}
          />

          <div className="relative z-10 flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
              <ShieldCheck aria-hidden className="size-6 text-white" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t("adminLogin.brandEyebrow")}</p>
              <p className="font-[var(--font-display)] text-xl font-semibold tracking-tight text-white">{t("brand.platform")}</p>
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <Badge tone="primary" className="bg-white/10 text-white">
              <Lock aria-hidden className="size-3.5" /> {t("adminLogin.badge")}
            </Badge>
            <h2 className="mt-5 text-balance font-[var(--font-display)] text-4xl font-semibold leading-tight text-white xl:text-5xl">
              {t("adminLogin.panelTitle")}
            </h2>
            <p className="mt-4 text-pretty text-base/7 text-white/70">{t("adminLogin.panelBody")}</p>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{t("adminLogin.managedBrands")}</p>
              <div className="mt-3 flex flex-col gap-2">
                {Object.values(tenantPresets).map((tenant) => (
                  <div key={tenant.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                    <span
                      className="inline-flex size-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{ background: tenant.tokens.colorPrimary }}
                    >
                      {tenant.logos.square}
                    </span>
                    <span className="text-sm font-medium text-white/90">{tenant.brandName}</span>
                    <Building2 aria-hidden className="ms-auto size-4 text-white/40" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="relative z-10 flex items-center gap-2 text-sm text-white/55">
            <Layers aria-hidden className="size-4" />
            {t("landing.statLabs")} · {t("landing.statCompliance")}
          </p>
        </aside>

        {/* Form panel */}
        <main className="flex items-center justify-center px-5 py-16 sm:px-8">
          <div className="w-full max-w-md animate-rise">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                <ShieldCheck aria-hidden className="size-5" />
              </span>
              <span className="font-[var(--font-display)] text-xl font-semibold tracking-tight text-[var(--color-text)]">
                {t("brand.platform")}
              </span>
            </div>

            <Card className="p-7 sm:p-9">
              <header className="mb-7">
                <Badge tone="info" dot>
                  {t("adminLogin.badge")}
                </Badge>
                <h1 className="mt-3 text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight text-[var(--color-text)]">
                  {t("adminLogin.title")}
                </h1>
                <p className="mt-2 text-pretty text-sm leading-6 text-[var(--color-text-muted)]">{t("adminLogin.subtitle")}</p>
              </header>

              <AdminLoginForm
                locale={locale}
                labels={{
                  email: t("adminLogin.email"),
                  passcode: t("adminLogin.passcode"),
                  enter: t("adminLogin.enter"),
                  selectLanguage: t("adminLogin.selectLanguage"),
                  demoNote: t("adminLogin.demoNote")
                }}
              />
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
