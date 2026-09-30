"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Download, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddProspectDialog } from "./add-prospect-dialog";
import { ExportDialog } from "./export-dialog";

export function ProspectsToolbar({ openAdd, openExport }: { openAdd: boolean; openExport: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [add, setAdd] = useState(openAdd);
  const [exp, setExp] = useState(openExport);
  const [, start] = useTransition();

  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.get("q") ?? "") === q) return;
      const next = new URLSearchParams(params);
      if (q) next.set("q", q);
      else next.delete("q");
      start(() => router.replace(`${pathname}?${next}`));
    }, 250);
    return () => clearTimeout(id);
  }, [q, params, pathname, router]);

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
        <Input aria-label="Search prospects" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-9 w-44 pl-9 sm:w-56" />
      </div>
      <Button icon={<Download className="size-4" />} onClick={() => setExp(true)}>
        Export
      </Button>
      <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdd(true)}>
        Add prospect
      </Button>
      <AddProspectDialog open={add} onClose={() => setAdd(false)} />
      <ExportDialog open={exp} onClose={() => setExp(false)} />
    </>
  );
}
