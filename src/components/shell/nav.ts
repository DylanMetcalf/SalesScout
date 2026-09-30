import { CalendarCheck, Compass, House, Kanban, Building2, Users } from "lucide-react";

export const NAV = [
  { href: "/home", label: "Home", icon: House },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/prospects", label: "Prospects", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarCheck },
  { href: "/company", label: "Company", icon: Building2 },
] as const;
