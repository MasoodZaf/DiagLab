import { Building2, Activity, Languages, BadgeCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Translator } from "../../lib/i18n";

type MarketingStatsProps = {
  t: Translator;
};

const stats: { key: string; icon: LucideIcon }[] = [
  { key: "landing.statLabs", icon: Building2 },
  { key: "landing.statUptime", icon: Activity },
  { key: "landing.statLangs", icon: Languages },
  { key: "landing.statCompliance", icon: BadgeCheck }
];

/** Four headline proof-points in a divided strip, numbers in tabular-nums. */
export function MarketingStats({ t }: MarketingStatsProps) {
  return (
    <section className="border-b border-[var(--color-line)] bg-[var(--color-panel)]">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-px overflow-hidden px-5 sm:px-8 lg:grid-cols-4">
        {stats.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex flex-col items-center gap-2 px-4 py-8 text-center sm:py-10"
          >
            <Icon className="size-5 text-[var(--color-primary)]" />
            <p className="font-[var(--font-display)] text-lg font-semibold tabular-nums tracking-tight text-[var(--color-text)] sm:text-xl">
              {t(key)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
