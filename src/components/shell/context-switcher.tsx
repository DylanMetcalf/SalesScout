"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, ChevronsUpDown, Plus, FlaskConical } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";
import { switchCompanyAction, switchWorkspaceAction } from "@/app/actions/workspace";

export type SwitcherProps = {
  workspace: { id: string; name: string };
  workspaces: { id: string; name: string }[];
  company: { id: string; name: string; isDemo: boolean } | null;
  companies: { id: string; name: string; isDemo: boolean }[];
};

/** Workspace + company switcher. Switching company changes everything you see. */
export function ContextSwitcher({ workspace, workspaces, company, companies }: SwitcherProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const go = (fn: () => Promise<{ ok: boolean; error?: string }>, label: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast({ kind: "error", title: `Couldn't switch to ${label}`, body: (r as { error: string }).error });
    });

  const items: MenuItem[] = [
    { type: "label", label: `Companies in ${workspace.name}` },
    ...companies.map((c) => ({
      label: c.name,
      icon: c.id === company?.id ? <Check /> : c.isDemo ? <FlaskConical /> : <span className="block size-4" />,
      hint: c.isDemo ? "Demo" : undefined,
      onSelect: () => c.id !== company?.id && go(() => switchCompanyAction(c.id), c.name),
    })),
    { label: "Add a company", icon: <Plus />, onSelect: () => router.push("/onboarding/company") },
    { type: "separator" },
    { type: "label", label: "Workspaces" },
    ...workspaces.map((w) => ({
      label: w.name,
      icon: w.id === workspace.id ? <Check /> : <span className="block size-4" />,
      onSelect: () => w.id !== workspace.id && go(() => switchWorkspaceAction(w.id), w.name),
    })),
    { label: "New workspace", icon: <Plus />, onSelect: () => router.push("/onboarding?new=1") },
  ];

  return (
    <Menu
      width={260}
      items={items}
      className="w-full"
      trigger={({ ref, ...p }) => (
        <button
          ref={ref}
          {...p}
          aria-label={`Current company: ${company?.name ?? "none"}. Switch company or workspace`}
          className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-2.5 py-2 text-left shadow-sm transition-colors hover:border-border-strong aria-busy:opacity-60"
          aria-busy={pending}
        >
          <Avatar name={company?.name ?? workspace.name} size={30} square />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-5">{company?.name ?? "No company yet"}</span>
            <span className="block truncate text-xs text-subtle">{workspace.name}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-subtle" aria-hidden />
        </button>
      )}
    />
  );
}
