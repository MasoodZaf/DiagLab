import Link from "next/link";
import { Activity } from "lucide-react";
import { withParams } from "../../lib/url";
import type { Locale, Translator } from "../../lib/i18n";

type MarketingFooterProps = {
  t: Translator;
  locale: Locale;
};

export function MarketingFooter({ t, locale }: MarketingFooterProps) {
  const year = new Date().getFullYear();

  const links: { label: string; href: string }[] = [
    { label: t("nav.login"), href: withParams("/login", { lang: locale }) },
    { label: t("nav.dashboard"), href: withParams("/ops", { tenant: "lumen", lang: locale }) },
    { label: t("nav.portal"), href: withParams("/patient", { tenant: "lumen", lang: locale }) },
    { label: t("nav.admin"), href: withParams("/ops", { tenant: "lumen", lang: locale, role: "super_admin" }) }
  ];

  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-panel)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="inline-flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="inline-flex size-9 items-center justify-center rounded-[14px] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
            >
              <Activity className="size-[18px]" />
            </span>
            <span className="font-[var(--font-display)] text-lg font-semibold tracking-tight text-[var(--color-text)]">
              {t("brand.platform")}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t("brand.tagline")}
          </p>
        </div>

        <nav aria-label={t("brand.platform")} className="flex flex-wrap gap-x-8 gap-y-3">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-[var(--color-line)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="tabular-nums">
            © {year} {t("brand.platform")}. {t("common.poweredBy")} AURA.
          </p>
          <p>{t("landing.trustedBy")}</p>
        </div>
      </div>
    </footer>
  );
}
