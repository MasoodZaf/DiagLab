"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { localeMeta, locales, type Locale } from "../../lib/i18n";
import { cn } from "@lab/ui";

export function LanguageSwitcher({ current, label }: { current: Locale; label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function selectLocale(locale: Locale) {
    if (locale === current) return;
    const params = new URLSearchParams(searchParams?.toString());
    params.set("lang", locale);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div
      role="group"
      aria-label={label ?? "Select language"}
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] p-0.5",
        isPending && "opacity-60"
      )}
    >
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => selectLocale(locale)}
            aria-pressed={active}
            lang={locale}
            className={cn(
              "min-h-9 rounded-full px-3 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            {localeMeta[locale].nativeName}
          </button>
        );
      })}
    </div>
  );
}
