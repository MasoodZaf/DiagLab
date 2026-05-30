import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@lab/ui";
import { withParams } from "../../lib/url";
import type { Locale, Translator } from "../../lib/i18n";

type MarketingCtaProps = {
  t: Translator;
  locale: Locale;
};

/** Full-bleed conversion banner on the brand surface with layered glow. */
export function MarketingCta({ t, locale }: MarketingCtaProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
      <div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-[color-mix(in_srgb,var(--color-primary)_30%,var(--color-line))] bg-[var(--color-primary)] px-7 py-14 text-center shadow-lift sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 start-[-8%] size-[360px] rounded-full bg-[color-mix(in_srgb,white_22%,transparent)] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 end-[-6%] size-[360px] rounded-full bg-[color-mix(in_srgb,black_18%,transparent)] blur-3xl"
        />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center">
          <h2 className="text-balance font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-tight text-[var(--color-primary-foreground)] sm:text-4xl">
            {t("landing.ctaBannerTitle")}
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-[color-mix(in_srgb,var(--color-primary-foreground)_82%,transparent)]">
            {t("landing.ctaBannerBody")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link href={withParams("/login", { lang: locale })}>
              <Button
                size="lg"
                tone="secondary"
                className="group border-transparent bg-[var(--color-primary-foreground)] text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary-foreground)_88%,var(--color-primary))]"
              >
                {t("common.bookDemo")}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </Button>
            </Link>
            <Link
              href={withParams("/ops", { tenant: "lumen", lang: locale })}
              className="inline-flex min-h-12 items-center rounded-full px-5 text-sm font-medium text-[color-mix(in_srgb,var(--color-primary-foreground)_88%,transparent)] underline-offset-4 transition-colors hover:text-[var(--color-primary-foreground)] hover:underline"
            >
              {t("landing.ctaSecondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
