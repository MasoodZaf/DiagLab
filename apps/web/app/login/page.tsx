import Link from "next/link";
import { ArrowLeft, Activity, CheckCircle2, Languages, MapPin, ShieldCheck } from "lucide-react";
import { Card } from "@lab/ui";
import { getLocalization } from "../../lib/i18n";
import { pickParam, withParams } from "../../lib/url";
import { ThemeToggle } from "../../components/controls/theme-toggle";
import { LoginForm } from "../../components/auth/login-form";

type SearchParams = Record<string, string | string[] | undefined>;

const STAFF_ROLES = [
  "receptionist",
  "phlebotomist",
  "technician",
  "pathologist",
  "branch_manager"
] as const;

const BRAND_OPTIONS = [
  { value: "lumen", label: "Lumen Diagnostics" },
  { value: "cedar", label: "Cedar PathLab" }
];

export default async function Page({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const sp = searchParams ? await searchParams : undefined;
  const { t, locale, dir, intlLocale } = getLocalization(pickParam(sp, "lang"));

  const brand = t("brand.platform");

  const roles = STAFF_ROLES.map((role) => ({ value: role, label: t(`roles.${role}`) }));

  const valueProps = [
    { icon: ShieldCheck, label: t("landing.feature.auditTitle") },
    { icon: Activity, label: t("landing.feature.workflowTitle") },
    { icon: Languages, label: t("landing.feature.multilingualTitle") }
  ];

  const homeHref = withParams("/", { lang: locale });
  const platformHref = withParams("/admin/login", { lang: locale });
  const outletHref = withParams("/outlet/login", { lang: locale });

  return (
    <div
      lang={locale}
      dir={dir}
      data-intl={intlLocale}
      className="relative min-h-dvh overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text)]"
    >
      {/* Floating controls */}
      <div className="absolute end-4 top-4 z-20 flex items-center gap-2 sm:end-6 sm:top-6">
        <Link
          href={homeHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)]/80 px-4 text-sm font-medium text-[var(--color-text)] backdrop-blur transition-colors hover:bg-[var(--color-panel-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
          {t("nav.home")}
        </Link>
        <ThemeToggle label={t("controls.toggleTheme")} />
      </div>

      <div className="mx-auto grid min-h-dvh w-full lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-aura p-10 text-[var(--color-primary-foreground)] lg:flex xl:p-14">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden />
          <div
            className="pointer-events-none absolute -top-24 end-[-6rem] size-80 rounded-full opacity-40 blur-3xl"
            aria-hidden
            style={{ background: "color-mix(in srgb, var(--color-primary-foreground) 30%, transparent)" }}
          />

          <div className="relative z-10 flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/25 bg-white/10 backdrop-blur">
              <Activity aria-hidden className="size-6" />
            </span>
            <span className="font-[var(--font-display)] text-2xl font-semibold tracking-tight">{brand}</span>
          </div>

          <div className="relative z-10 max-w-md">
            <h2 className="text-balance font-[var(--font-display)] text-4xl font-semibold leading-tight xl:text-5xl">
              {t("brand.tagline")}
            </h2>
            <ul className="mt-8 flex flex-col gap-4">
              {valueProps.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <CheckCircle2 aria-hidden className="size-[18px]" />
                  </span>
                  <span className="flex items-center gap-2 text-pretty text-base/6 text-[color-mix(in_srgb,var(--color-primary-foreground)_92%,transparent)]">
                    <Icon aria-hidden className="size-4 opacity-80" />
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 max-w-sm text-sm text-[color-mix(in_srgb,var(--color-primary-foreground)_75%,transparent)]">
            {t("landing.trustedBy")}
          </p>
        </aside>

        {/* Form panel */}
        <main className="flex items-center justify-center px-5 py-16 sm:px-8">
          <div className="w-full max-w-md animate-rise">
            {/* Compact brand lockup for small screens */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                <Activity aria-hidden className="size-5" />
              </span>
              <span className="font-[var(--font-display)] text-xl font-semibold tracking-tight text-[var(--color-text)]">
                {brand}
              </span>
            </div>

            <Card className="p-7 sm:p-9">
              <header className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {t("brand.platform")}
                </p>
                <h1 className="mt-2 text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight text-[var(--color-text)]">
                  {t("login.title", { brand })}
                </h1>
                <p className="mt-2 text-pretty text-sm leading-6 text-[var(--color-text-muted)]">
                  {t("login.subtitle")}
                </p>
              </header>

              <LoginForm
                locale={locale}
                brands={BRAND_OPTIONS}
                roles={roles}
                labels={{
                  selectBrand: t("login.selectBrand"),
                  selectRole: t("login.selectRole"),
                  selectLanguage: t("login.selectLanguage"),
                  continue: t("login.continue"),
                  demoNote: t("login.demoNote"),
                  asPatient: t("login.asPatient"),
                  asStaff: t("login.asStaff")
                }}
              />
            </Card>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                href={outletHref}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
              >
                <MapPin aria-hidden className="size-4" />
                {t("outlet.workspace")}
              </Link>
              <Link
                href={platformHref}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
              >
                <ShieldCheck aria-hidden className="size-4" />
                {t("login.platformLink")}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
