"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Loader2, Mail } from "lucide-react";
import { Button, cn } from "@lab/ui";
import { localeMeta, locales, type Locale } from "../../lib/i18n";
import { withParams } from "../../lib/url";

type AdminLoginLabels = {
  email: string;
  passcode: string;
  enter: string;
  selectLanguage: string;
  demoNote: string;
};

type AdminLoginFormProps = {
  locale: Locale;
  labels: AdminLoginLabels;
};

const DEMO_ADMIN_EMAIL = "admin@aura.health";

export function AdminLoginForm({ locale, labels }: AdminLoginFormProps) {
  const router = useRouter();
  const emailId = useId();
  const passId = useId();

  const [lang, setLang] = useState<Locale>(locale);
  const [pending, setPending] = useState(false);

  function enterConsole() {
    setPending(true);
    // The Super Admin lands on the cross-tenant platform console; per-tenant
    // brand management is reached from there via "Manage brand" deep-links.
    router.push(withParams("/platform", { role: "super_admin", lang }));
  }

  const fieldClass = cn(
    "peer w-full appearance-none rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-muted)]",
    "ps-11 pe-10 py-3 text-sm text-[var(--color-text)] transition-colors",
    "hover:border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-line))]",
    "focus-visible:outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]"
  );
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]";

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        enterConsole();
      }}
    >
      <div>
        <label htmlFor={emailId} className={labelClass}>
          {labels.email}
        </label>
        <div className="relative">
          <Mail aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            id={emailId}
            name="email"
            type="email"
            defaultValue={DEMO_ADMIN_EMAIL}
            autoComplete="email"
            className={cn(fieldClass, "pe-4")}
          />
        </div>
      </div>

      <div>
        <label htmlFor={passId} className={labelClass}>
          {labels.passcode}
        </label>
        <div className="relative">
          <KeyRound aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            id={passId}
            name="passcode"
            type="password"
            placeholder="••••••••"
            autoComplete="off"
            className={cn(fieldClass, "pe-4")}
          />
        </div>
      </div>

      <div>
        <span className={labelClass}>{labels.selectLanguage}</span>
        <div
          role="group"
          aria-label={labels.selectLanguage}
          className="inline-flex w-full items-center gap-1 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-muted)] p-1"
        >
          {locales.map((option) => {
            const active = option === lang;
            return (
              <button
                key={option}
                type="button"
                lang={option}
                aria-pressed={active}
                onClick={() => setLang(option)}
                className={cn(
                  "min-h-9 flex-1 rounded-xl px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-card"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                {localeMeta[option].nativeName}
              </button>
            );
          })}
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
        {pending ? <Loader2 aria-hidden className="size-[18px] animate-spin" /> : null}
        {labels.enter}
        <ArrowRight aria-hidden className="size-[18px] rtl:-scale-x-100" />
      </Button>

      <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">{labels.demoNote}</p>
    </form>
  );
}
