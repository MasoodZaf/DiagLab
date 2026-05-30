import Link from "next/link";
import { ArrowUpRight, Layers } from "lucide-react";
import { Card, SectionHeading, Badge } from "@lab/ui";
import { withParams } from "../../lib/url";
import type { Locale, Translator } from "../../lib/i18n";

type MarketingWhiteLabelProps = {
  t: Translator;
  locale: Locale;
};

/**
 * Swatch hexes are intentionally hardcoded here ONLY to illustrate that each
 * tenant carries its own brand colour — they are demo brand previews, not the
 * app's themed surfaces.
 */
const brandPreviews = [
  { name: "Lumen", swatch: "#0e7c66", region: "Karachi" },
  { name: "Cedar", swatch: "#1f3f73", region: "London" },
  { name: "Solara", swatch: "#b4530a", region: "Riyadh" }
];

export function MarketingWhiteLabel({ t, locale }: MarketingWhiteLabelProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow={t("landing.whiteLabelEyebrow")}>
            {t("landing.whiteLabelTitle")}
          </SectionHeading>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-[var(--color-text-muted)]">
            {t("landing.whiteLabelBody")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={withParams("/ops", { tenant: "lumen", lang: locale })}
              className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 text-sm font-medium text-[var(--color-text)] shadow-card transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-panel-muted)]"
            >
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ backgroundColor: "#0e7c66" }}
              />
              {t("landing.seeBrand", { brand: "Lumen" })}
              <ArrowUpRight className="size-4 text-[var(--color-text-muted)] transition-transform duration-200 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
            </Link>
            <Link
              href={withParams("/ops", { tenant: "cedar", lang: locale })}
              className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 text-sm font-medium text-[var(--color-text)] shadow-card transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-panel-muted)]"
            >
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ backgroundColor: "#1f3f73" }}
              />
              {t("landing.seeBrand", { brand: "Cedar" })}
              <ArrowUpRight className="size-4 text-[var(--color-text-muted)] transition-transform duration-200 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
            </Link>
          </div>
        </div>

        {/* Multi-brand preview cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {brandPreviews.map((brand) => (
            <Card key={brand.name} interactive className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <span
                  aria-hidden="true"
                  className="inline-flex size-10 items-center justify-center rounded-[14px] text-white shadow-card"
                  style={{ backgroundColor: brand.swatch }}
                >
                  <Layers className="size-5" />
                </span>
                <span
                  aria-hidden="true"
                  className="size-3 rounded-full ring-2 ring-[var(--color-panel)]"
                  style={{ backgroundColor: brand.swatch }}
                />
              </div>
              <div>
                <p className="font-[var(--font-display)] text-base font-semibold text-[var(--color-text)]">
                  {brand.name}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  {brand.region}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-1.5 flex-1 rounded-full"
                  style={{ backgroundColor: brand.swatch }}
                />
                <span
                  aria-hidden="true"
                  className="h-1.5 w-4 rounded-full"
                  style={{ backgroundColor: `color-mix(in srgb, ${brand.swatch} 45%, transparent)` }}
                />
              </div>
              <Badge tone="primary">{t("brand.platform")}</Badge>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
