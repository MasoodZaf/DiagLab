import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "./cn";

type AppShellProps = PropsWithChildren<{
  sidebar: ReactNode;
  topbar: ReactNode;
  className?: string;
}>;

export function AppShell({ children, sidebar, topbar, className }: AppShellProps) {
  return (
    <div className={cn("min-h-dvh bg-[var(--color-canvas)] text-[var(--color-text)]", className)}>
      <div className="mx-auto grid min-h-dvh max-w-[1760px] grid-cols-1 gap-4 p-3 sm:p-5 lg:grid-cols-[304px_minmax(0,1fr)]">
        <aside className="border border-[var(--color-line)] bg-[var(--color-panel)] p-3 shadow-sm lg:sticky lg:top-5 lg:h-[calc(100dvh-40px)] lg:overflow-y-auto">
          {sidebar}
        </aside>
        <div className="grid min-h-0 grid-rows-[auto_1fr] gap-4">
          <header className="border border-[var(--color-line)] bg-[var(--color-panel)] p-4 shadow-sm sm:p-5">
            {topbar}
          </header>
          <main className="min-h-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
