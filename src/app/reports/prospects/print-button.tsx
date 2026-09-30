"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button variant="primary" icon={<Printer className="size-4" />} onClick={() => window.print()}>
      Print or save as PDF
    </Button>
  );
}
