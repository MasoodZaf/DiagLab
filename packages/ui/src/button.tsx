import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "./cn";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
  }
>;

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-9 px-3.5 text-xs",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base"
};

export function Button({
  children,
  className,
  tone = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,border-color,transform,box-shadow] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]",
        "active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        sizeClasses[size],
        tone === "primary" &&
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-card hover:shadow-lift hover:brightness-[1.06]",
        tone === "secondary" &&
          "border border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-panel-muted)]",
        tone === "ghost" && "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-panel-muted)]",
        tone === "danger" && "bg-[var(--color-danger)] text-white hover:brightness-[1.06]",
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
