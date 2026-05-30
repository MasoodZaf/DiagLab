"use client";

import { Printer } from "lucide-react";
import { Button } from "@lab/ui";

type PrintButtonProps = {
  label: string;
};

/** Triggers the browser print dialog for PDF export of the report sheet. */
export function PrintButton({ label }: PrintButtonProps) {
  return (
    <Button tone="primary" size="sm" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
