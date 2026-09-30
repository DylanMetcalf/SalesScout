"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Building2, CalendarCheck, Compass, Download, Kanban, Plus, Search, Settings, Sparkles, UserRound, Users, Layers, Telescope } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

type Prospect = { id: string; name: string; industry: string | null };

/** ⌘K: fast for experienced users, invisible to new ones. */
export function CommandPalette({ prospects, companies }: { prospects: Prospect[]; companies: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command", onOpen);
    };
  }, []);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const item = "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-[14.5px] text-text data-[selected=true]:bg-surface-2 [&_svg]:size-4 [&_svg]:text-subtle";
  const group = "px-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-subtle";

  return (
    <dialog
      ref={dialog}
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === dialog.current && setOpen(false)}
      aria-label="Search and actions"
      className="m-0 mx-auto mt-[12vh] w-[calc(100vw-2rem)] max-w-xl bg-transparent p-0 backdrop:bg-[rgb(17_18_20/0.35)]"
    >
      {open && (
        <Command label="What would you like to do?" className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg animate-rise">
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 text-subtle" aria-hidden />
            <Command.Input autoFocus placeholder="What would you like to do?" className="h-13 flex-1 bg-transparent text-[15px] outline-none placeholder:text-subtle focus-visible:shadow-none" />
            <Kbd>Esc</Kbd>
          </div>
          <Command.List className="max-h-[min(420px,60vh)] overflow-y-auto py-1 scrollbar-thin">
            <Command.Empty className="px-4 py-8 text-center text-muted">Nothing matches. Try a company name or an action.</Command.Empty>
            <Command.Group heading="Actions" className={group}>
              <Command.Item className={item} onSelect={() => go("/discover")}><Compass /> Discover companies</Command.Item>
              <Command.Item className={item} onSelect={() => go("/discover?mode=specific")}><UserRound /> Find specific people</Command.Item>
              <Command.Item className={item} onSelect={() => go("/prospects?similar=1")}><Layers /> Find similar companies</Command.Item>
              <Command.Item className={item} onSelect={() => go("/prospects?add=1")}><Plus /> Add a prospect</Command.Item>
              <Command.Item className={item} onSelect={() => go("/prospects?add=1")} keywords={["research"]}><Telescope /> Research a company</Command.Item>
              <Command.Item className={item} onSelect={() => go("/follow-ups?new=1")}><CalendarCheck /> Create a follow-up</Command.Item>
              <Command.Item className={item} onSelect={() => go("/company?tab=markets")}><Sparkles /> Discover my market</Command.Item>
              <Command.Item className={item} onSelect={() => go("/prospects?export=1")}><Download /> Export prospects</Command.Item>
            </Command.Group>
            <Command.Group heading="Go to" className={group}>
              <Command.Item className={item} onSelect={() => go("/prospects")}><Users /> Prospects</Command.Item>
              <Command.Item className={item} onSelect={() => go("/pipeline")} keywords={["crm"]}><Kanban /> Pipeline</Command.Item>
              <Command.Item className={item} onSelect={() => go("/follow-ups")}><CalendarCheck /> Follow-ups</Command.Item>
              <Command.Item className={item} onSelect={() => go("/company")} keywords={["brain"]}><Building2 /> Company Brain</Command.Item>
              <Command.Item className={item} onSelect={() => go("/settings")}><Settings /> Settings</Command.Item>
            </Command.Group>
            {prospects.length > 0 && (
              <Command.Group heading="Prospects" className={group}>
                {prospects.map((p) => (
                  <Command.Item key={p.id} value={`${p.name} ${p.industry ?? ""} ${p.id}`} className={item} onSelect={() => go(`/prospects/${p.id}`)}>
                    <Building2 />
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.industry && <span className="text-xs text-subtle">{p.industry}</span>}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {companies.length > 1 && (
              <Command.Group heading="Open company" className={group}>
                {companies.map((c) => (
                  <Command.Item key={c.id} value={`company ${c.name}`} className={item} onSelect={() => go(`/switch/${c.id}`)}>
                    <Building2 /> {c.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      )}
    </dialog>
  );
}
