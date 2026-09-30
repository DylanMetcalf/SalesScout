"use client";

import { Check, ChevronDown } from "lucide-react";
import { Menu } from "@/components/ui/menu";
import { StatusDot } from "@/components/ui/badge";
import { CRM_STATUSES, type CrmStatus } from "@/lib/db/schema";
import { STATUS_META } from "@/lib/status";
import { setStatusAction } from "@/app/actions/prospects";
import { useAction } from "./shared";

export function StatusSelect({ id, status }: { id: string; status: CrmStatus }) {
  const { pending, run } = useAction();
  return (
    <Menu
      width={250}
      items={[
        { type: "label", label: "Move to stage" },
        ...CRM_STATUSES.map((s) => ({
          label: STATUS_META[s].label,
          hint: STATUS_META[s].description.length < 26 ? STATUS_META[s].description : undefined,
          icon: s === status ? <Check /> : <StatusDot tone={STATUS_META[s].tone} className="mx-1" />,
          onSelect: () => s !== status && run(() => setStatusAction(id, s), { success: `Moved to ${STATUS_META[s].label}` }),
        })),
      ]}
      trigger={({ ref, ...p }) => (
        <button
          ref={ref}
          {...p}
          aria-label={`Status: ${STATUS_META[status].label}. Change status`}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium shadow-sm hover:border-border-strong aria-busy:opacity-60"
          aria-busy={pending}
        >
          <StatusDot tone={STATUS_META[status].tone} />
          {STATUS_META[status].label}
          <ChevronDown className="size-3.5 text-subtle" aria-hidden />
        </button>
      )}
    />
  );
}
