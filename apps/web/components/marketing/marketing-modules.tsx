import {
  UserPlus,
  CalendarCheck,
  ScanLine,
  FlaskConical,
  Cable,
  FileText,
  CreditCard,
  Boxes,
  ShieldCheck,
  Sparkles,
  Network,
  MessageCircle
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeading } from "@lab/ui";
import type { Translator } from "../../lib/i18n";

type MarketingModulesProps = {
  t: Translator;
};

const modules: { key: string; icon: LucideIcon }[] = [
  { key: "landing.modulesList.registration", icon: UserPlus },
  { key: "landing.modulesList.booking", icon: CalendarCheck },
  { key: "landing.modulesList.samples", icon: ScanLine },
  { key: "landing.modulesList.lis", icon: FlaskConical },
  { key: "landing.modulesList.analyzers", icon: Cable },
  { key: "landing.modulesList.reporting", icon: FileText },
  { key: "landing.modulesList.billing", icon: CreditCard },
  { key: "landing.modulesList.inventory", icon: Boxes },
  { key: "landing.modulesList.qc", icon: ShieldCheck },
  { key: "landing.modulesList.ai", icon: Sparkles },
  { key: "landing.modulesList.franchise", icon: Network },
  { key: "landing.modulesList.notifications", icon: MessageCircle }
];

/** A tidy 12-tile grid covering the full diagnostic value chain. */
export function MarketingModules({ t }: MarketingModulesProps) {
  return (
    <section className="border-y border-[var(--color-line)] bg-[var(--color-panel-muted)]">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionHeading eyebrow={t("landing.modulesEyebrow")}>
          {t("landing.modulesTitle")}
        </SectionHeading>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ key, icon: Icon }, index) => (
            <div
              key={key}
              className="group flex items-center gap-4 rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel)] p-4 shadow-card transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-line))]"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--color-accent-surface)] text-[var(--color-primary)]">
                <Icon className="size-5" />
              </span>
              <div className="flex flex-1 items-center justify-between gap-3">
                <span className="text-sm font-medium text-[var(--color-text)]">{t(key)}</span>
                <span className="font-[var(--font-display)] text-xs font-semibold tabular-nums text-[var(--color-text-muted)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
