import type { UserRole } from "@lab/contracts";
import type { Locale } from "../../lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { RoleSwitcher } from "./role-switcher";
import { ThemeToggle } from "./theme-toggle";

type AppControlsProps = {
  locale: Locale;
  themeLabel?: string;
  languageLabel?: string;
  role?: {
    current: UserRole;
    label: string;
    options: Array<{ value: UserRole; label: string }>;
  };
};

export function AppControls({ locale, themeLabel, languageLabel, role }: AppControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {role ? <RoleSwitcher current={role.current} options={role.options} label={role.label} /> : null}
      <LanguageSwitcher current={locale} label={languageLabel} />
      <ThemeToggle label={themeLabel} />
    </div>
  );
}
