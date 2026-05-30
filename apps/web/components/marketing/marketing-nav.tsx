import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@lab/ui";
import { LanguageSwitcher } from "../controls/language-switcher";
import { ThemeToggle } from "../controls/theme-toggle";
import { withParams } from "../../lib/url";
import type { Locale, Translator } from "../../lib/i18n";

type MarketingNavProps = {
  t: Translator;
  locale: Locale;
};

/**
 * Sticky, glass top bar. Server component that renders the (client) language /
 * theme controls. Logical utilities keep the layout correct under RTL.
 */
export function MarketingNav({ t, locale }: MarketingNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-canvas)_82%,transparent)] backdrop-blur-xl">
      <nav
        aria-label={t("brand.platform")}
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"
      >
        <Link
          href={withParams("/", { lang: locale })}
          className="group inline-flex items-center gap-2.5"
        >
          <span
            aria-hidden="true"
            className="inline-flex size-9 items-center justify-center rounded-[14px] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-card transition-transform duration-200 group-hover:-translate-y-0.5"
          >
            <Activity className="size-[18px]" />
          </span>
          <span className="font-[var(--font-display)] text-lg font-semibold tracking-tight text-[var(--color-text)]">
            {t("brand.platform")}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher current={locale} label={t("controls.selectLanguage")} />
          </div>
          <ThemeToggle label={t("controls.toggleTheme")} />
          <Link
            href={withParams("/login", { lang: locale })}
            className="hidden min-h-11 items-center rounded-full px-4 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:inline-flex"
          >
            {t("nav.login")}
          </Link>
          <Link href={withParams("/login", { lang: locale })}>
            <Button size="sm">{t("common.bookDemo")}</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
