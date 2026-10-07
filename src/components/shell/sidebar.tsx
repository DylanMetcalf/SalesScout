"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Settings } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { Kbd } from "@/components/ui/kbd";
import { LogoMark } from "@/components/ui/logo";
import { NAV } from "./nav";
import { ContextSwitcher, type SwitcherProps } from "./context-switcher";
import { UserMenu } from "./user-menu";

export function Sidebar({ switcher, user, counts, aiConnected }: { switcher: SwitcherProps; user: { name: string; email: string }; counts: { followUpsDue: number; toReview: number }; aiConnected: boolean }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <LogoMark size={26} />
        <span className="font-display text-[17px] font-[650] tracking-[-0.02em]">Sales Scout</span>
      </div>
      <div className="px-3">
        <ContextSwitcher {...switcher} />
      </div>
      <nav aria-label="Main" className="mt-4 flex flex-col gap-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const badge = href === "/follow-ups" ? counts.followUpsDue : href === "/prospects" ? counts.toReview : 0;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-9 items-center gap-3 rounded-md px-2.5 text-[14px] font-medium transition-colors",
                active ? "bg-accent-soft text-accent-text font-semibold shadow-[inset_3px_0_0_var(--accent)]" : "text-muted hover:bg-surface/80 hover:text-text",
              )}
            >
              <Icon className={cn("size-[18px]", active ? "text-accent" : "text-subtle group-hover:text-muted")} aria-hidden />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="rounded-full bg-signal-soft px-1.5 text-xs font-medium tabular-nums text-signal-text">
                  {badge}
                  <span className="sr-only">{href === "/follow-ups" ? " follow-ups due" : " prospects to review"}</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5 px-3 pb-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-command"))}
          className="flex h-9 items-center gap-3 rounded-md px-2.5 text-[14px] font-medium text-muted hover:bg-surface/80 hover:text-text"
        >
          <Search className="size-[18px] text-subtle" aria-hidden />
          <span className="flex-1 text-left">Search & actions</span>
          <Kbd>⌘K</Kbd>
        </button>
        <Link
          href="/settings"
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2.5 text-[14px] font-medium",
            pathname.startsWith("/settings") ? "bg-accent-soft text-accent-text font-semibold shadow-[inset_3px_0_0_var(--accent)]" : "text-muted hover:bg-surface/80 hover:text-text",
          )}
        >
          <Settings className="size-[18px] text-subtle" aria-hidden />
          Settings
          {!aiConnected && <span className="ml-auto size-1.5 rounded-full bg-moderate" title="AI not connected" />}
        </Link>
        <div className="mt-2 border-t border-border pt-2">
          <UserMenu user={user} />
        </div>
      </div>
    </aside>
  );
}
