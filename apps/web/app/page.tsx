import { getLocalization } from "../lib/i18n";
import { pickParam } from "../lib/url";
import { MarketingNav } from "../components/marketing/marketing-nav";
import { MarketingHero } from "../components/marketing/marketing-hero";
import { MarketingStats } from "../components/marketing/marketing-stats";
import { MarketingFeatures } from "../components/marketing/marketing-features";
import { MarketingModules } from "../components/marketing/marketing-modules";
import { MarketingWhiteLabel } from "../components/marketing/marketing-white-label";
import { MarketingMarkets } from "../components/marketing/marketing-markets";
import { MarketingCta } from "../components/marketing/marketing-cta";
import { MarketingFooter } from "../components/marketing/marketing-footer";

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const { t, locale, dir } = getLocalization(pickParam(sp, "lang"));

  return (
    <div
      lang={locale}
      dir={dir}
      className="min-h-dvh bg-[var(--color-canvas)] text-[var(--color-text)] antialiased"
    >
      <MarketingNav t={t} locale={locale} />

      <main>
        <MarketingHero t={t} locale={locale} />
        <MarketingStats t={t} />
        <MarketingFeatures t={t} />
        <MarketingModules t={t} />
        <MarketingWhiteLabel t={t} locale={locale} />
        <MarketingMarkets t={t} />
        <MarketingCta t={t} locale={locale} />
      </main>

      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
