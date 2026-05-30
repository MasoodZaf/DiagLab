"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, ChevronDown, Loader2, MapPin, UserRound } from "lucide-react";
import { Button, cn } from "@lab/ui";
import { localeMeta, locales, type Locale } from "../../lib/i18n";
import { withParams } from "../../lib/url";

type Option = { value: string; label: string };

type OutletLoginLabels = {
  selectBrand: string;
  selectOutlet: string;
  selectRole: string;
  selectLanguage: string;
  enter: string;
};

type OutletLoginFormProps = {
  locale: Locale;
  tenants: Option[];
  outletsByTenant: Record<string, Option[]>;
  roles: Option[];
  labels: OutletLoginLabels;
};

export function OutletLoginForm({ locale, tenants, outletsByTenant, roles, labels }: OutletLoginFormProps) {
  const router = useRouter();
  const tenantId = useId();
  const outletId = useId();
  const roleId = useId();

  const [tenant, setTenant] = useState(tenants[0]?.value ?? "lumen");
  const outletOptions = outletsByTenant[tenant] ?? [];
  const [outlet, setOutlet] = useState(outletOptions[0]?.value ?? "");
  const [role, setRole] = useState(roles[0]?.value ?? "receptionist");
  const [lang, setLang] = useState<Locale>(locale);
  const [pending, setPending] = useState(false);

  function onTenantChange(next: string) {
    setTenant(next);
    setOutlet((outletsByTenant[next] ?? [])[0]?.value ?? "");
  }

  function enterConsole() {
    setPending(true);
    router.push(withParams("/outlet", { tenant, outlet, role, lang }));
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
        <label htmlFor={tenantId} className={labelClass}>{labels.selectBrand}</label>
        <div className="relative">
          <Building2 aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--color-text-muted)]" />
          <select id={tenantId} value={tenant} onChange={(e) => onTenantChange(e.target.value)} className={fieldClass}>
            {tenants.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        </div>
      </div>

      <div>
        <label htmlFor={outletId} className={labelClass}>{labels.selectOutlet}</label>
        <div className="relative">
          <MapPin aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--color-text-muted)]" />
          <select id={outletId} value={outlet} onChange={(e) => setOutlet(e.target.value)} className={fieldClass}>
            {outletOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        </div>
      </div>

      <div>
        <label htmlFor={roleId} className={labelClass}>{labels.selectRole}</label>
        <div className="relative">
          <UserRound aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--color-text-muted)]" />
          <select id={roleId} value={role} onChange={(e) => setRole(e.target.value)} className={fieldClass}>
            {roles.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        </div>
      </div>

      <div>
        <span className={labelClass}>{labels.selectLanguage}</span>
        <div role="group" aria-label={labels.selectLanguage} className="inline-flex w-full items-center gap-1 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-muted)] p-1">
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
                  active ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-card" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                {localeMeta[option].nativeName}
              </button>
            );
          })}
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending || !outlet}>
        {pending ? <Loader2 aria-hidden className="size-[18px] animate-spin" /> : null}
        {labels.enter}
        <ArrowRight aria-hidden className="size-[18px] rtl:-scale-x-100" />
      </Button>
    </form>
  );
}
