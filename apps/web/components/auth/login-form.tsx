"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, ChevronDown, Loader2, Stethoscope, UserRound } from "lucide-react";
import { Button, cn } from "@lab/ui";
import { localeMeta, locales, type Locale } from "../../lib/i18n";
import { withParams } from "../../lib/url";

type Option = { value: string; label: string };

type LoginFormLabels = {
  selectBrand: string;
  selectRole: string;
  selectLanguage: string;
  continue: string;
  demoNote: string;
  asPatient: string;
  asStaff: string;
};

type LoginFormProps = {
  locale: Locale;
  brands: Option[];
  roles: Option[];
  labels: LoginFormLabels;
  /** Optional pre-filled email shown for realism — not required to submit. */
  emailLabel?: string;
};

const DEMO_EMAIL = "demo@aura.health";

export function LoginForm({ locale, brands, roles, labels, emailLabel }: LoginFormProps) {
  const router = useRouter();
  const brandId = useId();
  const roleId = useId();
  const emailId = useId();

  const [brand, setBrand] = useState(brands[0]?.value ?? "lumen");
  const [role, setRole] = useState(roles[0]?.value ?? "receptionist");
  const [lang, setLang] = useState<Locale>(locale);
  const [pending, setPending] = useState<"staff" | "patient" | null>(null);

  function enterStaff() {
    setPending("staff");
    router.push(withParams("/ops", { tenant: brand, role, lang }));
  }

  function enterPatient() {
    setPending("patient");
    router.push(withParams("/patient", { tenant: brand, lang }));
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
        enterStaff();
      }}
    >
      {/* Brand / workspace */}
      <div>
        <label htmlFor={brandId} className={labelClass}>
          {labels.selectBrand}
        </label>
        <div className="relative">
          <Building2
            aria-hidden
            className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--color-text-muted)] peer-focus-visible:text-[var(--color-primary)]"
          />
          <select
            id={brandId}
            name="brand"
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            className={fieldClass}
          >
            {brands.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
        </div>
      </div>

      {/* Role */}
      <div>
        <label htmlFor={roleId} className={labelClass}>
          {labels.selectRole}
        </label>
        <div className="relative">
          <Stethoscope
            aria-hidden
            className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--color-text-muted)] peer-focus-visible:text-[var(--color-primary)]"
          />
          <select
            id={roleId}
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className={fieldClass}
          >
            {roles.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
        </div>
      </div>

      {/* Optional email — prefilled for realism, not submitted */}
      <div>
        <label htmlFor={emailId} className={labelClass}>
          {emailLabel ?? "Email"}
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          defaultValue={DEMO_EMAIL}
          autoComplete="email"
          disabled
          aria-disabled="true"
          className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-muted)] px-4 py-3 text-sm text-[var(--color-text-muted)]"
        />
      </div>

      {/* Language segmented control */}
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

      {/* Primary actions */}
      <div className="mt-1 flex flex-col gap-3">
        <Button type="submit" size="lg" className="w-full" disabled={pending !== null}>
          {pending === "staff" ? (
            <Loader2 aria-hidden className="size-[18px] animate-spin" />
          ) : (
            <Stethoscope aria-hidden className="size-[18px]" />
          )}
          {labels.asStaff}
          <ArrowRight aria-hidden className="size-[18px] rtl:-scale-x-100" />
        </Button>
        <Button
          type="button"
          tone="secondary"
          size="lg"
          className="w-full"
          onClick={enterPatient}
          disabled={pending !== null}
        >
          {pending === "patient" ? (
            <Loader2 aria-hidden className="size-[18px] animate-spin" />
          ) : (
            <UserRound aria-hidden className="size-[18px]" />
          )}
          {labels.asPatient}
        </Button>
      </div>

      <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">{labels.demoNote}</p>
    </form>
  );
}
