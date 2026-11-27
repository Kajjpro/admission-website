"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function PrintButton() {
  return (
    <Button variant="secondary" size="sm" onClick={() => window.print()} className="print:hidden">
      <Printer className="size-3.5" />
      Print or save as PDF
    </Button>
  );
}
