import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "./cn";

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    /** Adds a hover lift — use for clickable / linked cards. */
    interactive?: boolean;
    /** Removes the default shadow for flat, nested panels. */
    flat?: boolean;
  }
>;

export function Card({ children, className, interactive, flat, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel)]",
        flat ? "shadow-none" : "shadow-card",
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-line))]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
