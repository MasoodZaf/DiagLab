import { Palette, ShieldCheck, Languages, FileCheck2, LineChart, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, SectionHeading } from "@lab/ui";
import type { Translator } from "../../lib/i18n";

type MarketingFeaturesProps = {
  t: Translator;
};

const features: { icon: LucideIcon; titleKey: string; bodyKey: string }[] = [
  { icon: Palette, titleKey: "landing.feature.brandedTitle", bodyKey: "landing.feature.brandedBody" },
  { icon: ShieldCheck, titleKey: "landing.feature.workflowTitle", bodyKey: "landing.feature.workflowBody" },
  { icon: Languages, titleKey: "landing.feature.multilingualTitle", bodyKey: "landing.feature.multilingualBody" },
  { icon: FileCheck2, titleKey: "landing.feature.auditTitle", bodyKey: "landing.feature.auditBody" },
  { icon: LineChart, titleKey: "landing.feature.analyticsTitle", bodyKey: "landing.feature.analyticsBody" },
  { icon: Smartphone, titleKey: "landing.feature.mobileTitle", bodyKey: "landing.feature.mobileBody" }
];

/** Six capability cards with iconography on a calm canvas background. */
export function MarketingFeatures({ t }: MarketingFeaturesProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeading eyebrow={t("landing.featuresEyebrow")}>
        {t("landing.featuresTitle")}
      </SectionHeading>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, titleKey, bodyKey }) => (
          <Card key={titleKey} interactive className="group flex flex-col gap-4 p-6">
            <span className="inline-flex size-12 items-center justify-center rounded-[16px] bg-[var(--color-accent-surface)] text-[var(--color-primary)] transition-transform duration-200 group-hover:-translate-y-0.5">
              <Icon className="size-6" />
            </span>
            <div>
              <h3 className="font-[var(--font-display)] text-xl font-semibold tracking-tight text-[var(--color-text)]">
                {t(titleKey)}
              </h3>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t(bodyKey)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
