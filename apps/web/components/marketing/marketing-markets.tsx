import { MapPin, Languages, Wallet, DatabaseZap, BadgeCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, SectionHeading, Badge } from "@lab/ui";
import type { Translator } from "../../lib/i18n";

type MarketingMarketsProps = {
  t: Translator;
};

// Short, specific positioning bullets. These regional specifics are not in the
// shared dictionary, so English copy is intentional here.
const regions = [
  {
    name: "Pakistan",
    tags: ["PKR", "English"],
    points: [
      { icon: Languages, label: "English-first staff and patient surfaces" },
      { icon: Wallet, label: "JazzCash & Easypaisa local payment rails" },
      { icon: BadgeCheck, label: "PMC-aligned reporting and pathologist sign-off" }
    ]
  },
  {
    name: "GCC — KSA · UAE · Qatar",
    tags: ["Arabic / RTL", "SAR · AED · QAR"],
    points: [
      { icon: Languages, label: "Right-to-left Arabic UI across every workflow" },
      { icon: DatabaseZap, label: "In-region data residency for KSA / UAE / Qatar" },
      { icon: Wallet, label: "GCC payment gateways with VAT-ready invoicing" }
    ]
  }
] satisfies {
  name: string;
  tags: string[];
  points: { icon: LucideIcon; label: string }[];
}[];

export function MarketingMarkets({ t }: MarketingMarketsProps) {
  return (
    <section className="border-y border-[var(--color-line)] bg-[var(--color-panel-muted)]">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionHeading eyebrow={t("landing.marketsEyebrow")}>
          {t("landing.marketsTitle")}
        </SectionHeading>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {regions.map((region) => (
            <Card key={region.name} className="flex flex-col gap-6 p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-[14px] bg-[var(--color-accent-surface)] text-[var(--color-primary)]">
                    <MapPin className="size-5" />
                  </span>
                  <h3 className="font-[var(--font-display)] text-xl font-semibold tracking-tight text-[var(--color-text)]">
                    {region.name}
                  </h3>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {region.tags.map((tag) => (
                    <Badge key={tag} tone="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <ul className="flex flex-col gap-4">
                {region.points.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-[18px] shrink-0 text-[var(--color-primary)]" />
                    <span className="text-sm leading-relaxed text-[var(--color-text-muted)]">{label}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-auto inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                <BadgeCheck className="size-4 text-[var(--color-success)]" />
                ISO 15189-ready
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
