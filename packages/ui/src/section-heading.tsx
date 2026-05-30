import type { PropsWithChildren } from "react";
import { cn } from "./cn";

type SectionHeadingProps = PropsWithChildren<{
  eyebrow?: string;
  align?: "left" | "center";
}>;

export function SectionHeading({ children, eyebrow, align = "left" }: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" && "text-center")}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]">{eyebrow}</p>
      ) : null}
      <h2 className="max-w-3xl text-balance font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">
        {children}
      </h2>
    </div>
  );
}
