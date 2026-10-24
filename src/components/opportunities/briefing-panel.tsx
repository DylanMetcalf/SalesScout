"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Link2Off, RefreshCw, Send } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAction } from "@/components/prospects/shared";
import { useToast } from "@/components/ui/toast";
import { newBriefingLinkAction, retryBriefingAction, revokeBriefingLinkAction } from "@/app/actions/opportunities";
import { formatDate, timeAgo } from "@/lib/format";

export type BriefingSummary = {
  reference: string;
  status: "queued" | "generating" | "ready" | "failed" | "manual";
  error: string | null;
  attempts: number;
  model: string | null;
  updatedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  viewCount: number;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  emailStatus: "pending" | "sent" | "failed" | "not_configured";
  emailError: string | null;
  emailSentAt: Date | null;
};

const STATUS = {
  queued: { label: "Queued", tone: "info" },
  generating: { label: "Writing…", tone: "info" },
  ready: { label: "Ready", tone: "strong" },
  failed: { label: "Failed", tone: "weak" },
  manual: { label: "Needs a person", tone: "moderate" },
} as const;
const EMAIL = { pending: "Not sent yet", sent: "Emailed", failed: "Email failed", not_configured: "Email not configured" } as const;

/** The customer's briefing, as the operator sees it: status, link, delivery and the actions that fix things. */
export function BriefingPanel({ id, b }: { id: string; b: BriefingSummary | null }) {
  const { pending, run } = useAction();
  const toast = useToast();
  const [link, setLink] = useState<string | null>(null);
  const live = b && !b.revokedAt && b.expiresAt && b.expiresAt.getTime() > Date.now();

  const newLink = (email: boolean) =>
    run(() => newBriefingLinkAction(id, email), {
      then: (d) => {
        setLink(d.url);
        toast({ title: email ? (d.email === "sent" ? "New link emailed to the customer" : "New link created. Email isn’t configured, so copy it below") : "New link created" });
      },
    });

  if (!b) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">No briefing yet. Earlier enquiries didn’t get one automatically.</p>
        <Button size="sm" variant="secondary" loading={pending} icon={<RefreshCw className="size-4" />} onClick={() => run(() => retryBriefingAction(id), { success: "Briefing generated" })}>Generate briefing</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS[b.status].tone} dot>{STATUS[b.status].label}</Badge>
        <span className="caption-mono text-subtle">{b.reference}</span>
        <Badge tone={b.emailStatus === "sent" ? "strong" : b.emailStatus === "failed" ? "weak" : "neutral"}>{EMAIL[b.emailStatus]}</Badge>
        <Badge tone={live ? "accent" : "neutral"}>{b.revokedAt ? "Link revoked" : live ? `Link valid until ${formatDate(b.expiresAt!)}` : "Link expired"}</Badge>
      </div>
      <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        <div className="flex gap-2"><dt className="text-subtle">Opened</dt><dd>{b.viewCount ? `${b.viewCount} time${b.viewCount === 1 ? "" : "s"} (last ${timeAgo(b.lastViewedAt!)})` : "Not opened yet"}</dd></div>
        <div className="flex gap-2"><dt className="text-subtle">Updated</dt><dd>{timeAgo(b.updatedAt)}{b.attempts ? ` · ${b.attempts} attempt${b.attempts === 1 ? "" : "s"}` : ""}</dd></div>
        {b.emailError && <div className="flex gap-2 sm:col-span-2"><dt className="text-subtle">Email</dt><dd className="text-muted">{b.emailError}</dd></div>}
        {b.error && <div className="flex gap-2 sm:col-span-2"><dt className="text-subtle">Problem</dt><dd className="text-weak">{b.error}</dd></div>}
      </dl>
      <div className="flex flex-wrap gap-2">
        {b.status === "ready" && <Link href={`/opportunities/${id}/briefing`} target="_blank" className={buttonClass("secondary", "sm")}>Preview <ExternalLink className="size-3.5" aria-hidden /></Link>}
        <Button size="sm" variant="secondary" loading={pending} icon={<RefreshCw className="size-4" />} onClick={() => window.confirm(b.status === "ready" ? "Rewrite the briefing? The customer’s link will show the new version." : "Try generating the briefing again?") && run(() => retryBriefingAction(id), { success: "Briefing generated" })}>
          {b.status === "ready" ? "Regenerate" : "Retry"}
        </Button>
        {b.status === "ready" && <Button size="sm" variant="secondary" loading={pending} icon={<Send className="size-4" />} onClick={() => window.confirm("Email the customer a new private link? Their previous link will stop working.") && newLink(true)}>Email a new link</Button>}
        <Button size="sm" variant="ghost" loading={pending} onClick={() => window.confirm("Create a new private link? The previous one will stop working.") && newLink(false)}>New link to copy</Button>
        {live && <Button size="sm" variant="danger" loading={pending} icon={<Link2Off className="size-4" />} onClick={() => window.confirm("Revoke the customer’s link? It stops working straight away.") && run(() => revokeBriefingLinkAction(id), { success: "Link revoked" })}>Revoke link</Button>}
      </div>
      {link && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-2.5">
          <code className="min-w-0 flex-1 truncate text-xs">{link}</code>
          <Button size="sm" variant="secondary" icon={<Copy className="size-3.5" />} onClick={() => navigator.clipboard.writeText(link).then(() => toast({ title: "Link copied" }))}>Copy</Button>
        </div>
      )}
      {link && <p className="text-xs text-subtle">Shown once. Only its fingerprint is stored, so we can’t show it again.</p>}
    </div>
  );
}
