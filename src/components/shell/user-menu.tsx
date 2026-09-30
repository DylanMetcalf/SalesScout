"use client";

import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Menu } from "@/components/ui/menu";
import { logout } from "@/app/actions/auth";

export function UserMenu({ user, compact }: { user: { name: string; email: string }; compact?: boolean }) {
  const router = useRouter();
  return (
    <Menu
      align={compact ? "end" : "start"}
      width={220}
      className={compact ? "" : "w-full"}
      items={[
        { type: "label", label: user.email },
        { label: "Settings", icon: <Settings />, onSelect: () => router.push("/settings") },
        { type: "separator" },
        { label: "Sign out", icon: <LogOut />, onSelect: () => logout() },
      ]}
      trigger={({ ref, ...p }) => (
        <button ref={ref} {...p} className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left hover:bg-surface" aria-label="Account menu">
          <Avatar name={user.name} size={compact ? 30 : 28} />
          {!compact && <span className="min-w-0 flex-1 truncate text-sm font-medium">{user.name}</span>}
        </button>
      )}
    />
  );
}
