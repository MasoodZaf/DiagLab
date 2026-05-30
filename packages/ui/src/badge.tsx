import type { PropsWithChildren } from "react";
import { cn } from "./cn";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

type BadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
  className?: string;
  /** Shows a leading status dot. */
  dot?: boolean;
}>;

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    "bg-[var(--color-panel-muted)] text-[var(--color-text-muted)] border-[var(--color-line)]",
  primary:
    "bg-[var(--color-accent-surface)] text-[var(--color-primary)] border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]",
  success:
    "bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_32%,transparent)]",
  warning:
    "bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_34%,transparent)]",
  danger:
    "bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] text-[var(--color-danger)] border-[color-mix(in_srgb,var(--color-danger)_34%,transparent)]",
  info:
    "bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
};

export function Badge({ children, tone = "neutral", dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
        className
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
