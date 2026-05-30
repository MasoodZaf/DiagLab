"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { UserRole } from "@lab/contracts";

type RoleOption = { value: UserRole; label: string };

export function RoleSwitcher({
  current,
  options,
  label
}: {
  current: UserRole;
  options: RoleOption[];
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function selectRole(role: string) {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("role", role);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <select
        value={current}
        onChange={(event) => selectRole(event.target.value)}
        aria-label={label ?? "Select role"}
        className="min-h-9 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-sm font-medium text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60"
        disabled={isPending}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
