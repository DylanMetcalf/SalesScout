import type { CrmStatus } from "@/lib/db/schema";
import type { Tone } from "@/components/ui/badge";

export const STATUS_META: Record<CrmStatus, { label: string; tone: Tone; description: string }> = {
  new: { label: "New", tone: "info", description: "Found by Sales Scout, not reviewed yet" },
  reviewed: { label: "Reviewed", tone: "neutral", description: "You've looked at it" },
  qualified: { label: "Qualified", tone: "accent", description: "Worth pursuing" },
  contacted: { label: "Contacted", tone: "violet", description: "You've reached out" },
  replied: { label: "Replied", tone: "moderate", description: "They got back to you" },
  meeting: { label: "Meeting", tone: "moderate", description: "A meeting is booked or done" },
  opportunity: { label: "Opportunity", tone: "strong", description: "A real deal is in play" },
  won: { label: "Won", tone: "strong", description: "They became a customer" },
  lost: { label: "Lost", tone: "weak", description: "It didn't work out" },
  rejected: { label: "Rejected", tone: "neutral", description: "Set aside" },
};

/** Pipeline columns, in order. Reviewed/rejected live outside the board. */
export const PIPELINE_STAGES: CrmStatus[] = ["new", "qualified", "contacted", "replied", "meeting", "opportunity", "won", "lost"];
