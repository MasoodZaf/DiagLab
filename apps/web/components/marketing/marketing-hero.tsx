import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@lab/ui";
import { withParams } from "../../lib/url";
import type { Locale, Translator } from "../../lib/i18n";

type MarketingHeroProps = {
  t: Translator;
  locale: Locale;
};

/**
 * The hero splits the headline into two clauses so the second clause can carry
 * the `text-gradient` treatment. Layered `bg-aura` + `bg-grid` create depth.
 */
export function MarketingHero({ t, locale }: MarketingHeroProps) {
  const title = t("landing.heroTitle");
  // Split on the last space to gradient-highlight the closing phrase.
  const lastSpace = title.lastIndexOf(" ");
  const lead = lastSpace > 0 ? title.slice(0, lastSpace) : title;
  const tail = lastSpace > 0 ? title.slice(lastSpace + 1) : "";

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-line)]">
      {/* Layered decorative backgrounds */}
      <div aria-hidden="true" className="bg-aura pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(70%_60%_at_50%_0%,#000,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 end-[-10%] size-[420px] rounded-full bg-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-5 pb-20 pt-20 text-center sm:px-8 sm:pb-28 sm:pt-28">
        <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-3.5 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)] shadow-card">
          <Sparkles className="size-3.5 text-[var(--color-primary)]" />
          {t("landing.eyebrow")}
        </span>

        <h1 className="animate-rise mt-7 max-w-4xl text-balance font-[var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--color-text)] sm:text-6xl">
          {lead} {tail ? <span className="text-gradient">{tail}</span> : null}
        </h1>

        <p className="animate-rise mt-6 max-w-2xl text-pretty text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
          {t("landing.heroSubtitle")}
        </p>

        <div className="animate-rise mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link href={withParams("/login", { lang: locale })}>
            <Button size="lg" className="group">
              {t("landing.ctaPrimary")}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </Button>
          </Link>
          <Link href={withParams("/ops", { tenant: "lumen", lang: locale })}>
            <Button size="lg" tone="secondary" className="group">
              <PlayCircle className="size-4 text-[var(--color-primary)]" />
              {t("landing.ctaSecondary")}
            </Button>
          </Link>
        </div>

        <p className="animate-rise mt-10 inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <ShieldCheck className="size-4 text-[var(--color-success)]" />
          {t("landing.trustedBy")}
        </p>
      </div>
    </section>
  );
}
