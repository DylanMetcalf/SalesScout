import { CalendarCheck, Compass, House, Inbox, Kanban, Building2, Users } from "lucide-react";

export const NAV = [
  { href: "/home", label: "Home", icon: House },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/prospects", label: "Prospects", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarCheck },
  { href: "/company", label: "Company", icon: Building2 },
] as const;

/** Operators (administrators) also manage inbound business problems. */
export const OPPORTUNITIES = { href: "/opportunities", label: "Opportunities", icon: Inbox } as const;

export function navFor(admin: boolean) {
  return admin ? [NAV[0], OPPORTUNITIES, ...NAV.slice(1)] : [...NAV];
}
