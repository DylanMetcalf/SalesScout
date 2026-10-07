"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { LogoMark } from "@/components/ui/logo";
import { IconButton } from "@/components/ui/button";
import { NAV } from "./nav";
import { ContextSwitcher, type SwitcherProps } from "./context-switcher";
import { UserMenu } from "./user-menu";

export function MobileTopBar({ switcher, user }: { switcher: SwitcherProps; user: { name: string; email: string } }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-bg/90 px-3 py-2 backdrop-blur md:hidden">
      <LogoMark size={26} />
      <div className="min-w-0 flex-1">
        <ContextSwitcher {...switcher} />
      </div>
      <IconButton label="Search and actions" onClick={() => window.dispatchEvent(new CustomEvent("open-command"))}>
        <Search className="size-5" />
      </IconButton>
      <UserMenu user={user} compact />
    </header>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-accent-text font-semibold" : "text-subtle")}>
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
