"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/error-state";
import { useToast } from "@/components/ui/toast";
import { Needle } from "@/components/ui/needle";
import { cn } from "@/components/ui/cn";
import { draftOutreachAction, saveDraftAction } from "@/app/actions/prospects";
import { useAction, type ContactFull } from "./shared";

type Channel = "email" | "linkedin" | "call" | "follow_up";
const CHANNELS: { id: Channel; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "linkedin", label: "LinkedIn message" },
  { id: "call", label: "Call introduction" },
  { id: "follow_up", label: "Follow-up" },
];

export type Draft = { id: string; channel: Channel; subject: string | null; body: string; status: string; generatedBy: string; contactId: string | null; createdAt: number };

/**
 * "How should we approach them?" Sales Scout drafts; the user reviews,
 * edits and sends from their own email. Nothing is ever sent automatically.
 */
const MAIL_CLIENTS = [
  { id: "mailto", label: "Outlook Desktop", hint: "Opens your default email app (Outlook if it's your default)" },
  { id: "outlook", label: "Outlook on the web", hint: "Opens a new message in Outlook on the web" },
  { id: "gmail", label: "Gmail", hint: "Opens a new message in Gmail" },
] as const;

export function OutreachDrawer({
  open,
  onClose,
  prospectId,
  prospectName,
  contacts,
  existing,
  aiConnected,
  preferredContactId,
  initialChannel,
}: {
  open: boolean;
  onClose: () => void;
  prospectId: string;
  prospectName: string;
  contacts: ContactFull[];
  existing?: Draft | null;
  aiConnected: boolean;
  preferredContactId?: string;
  initialChannel?: Channel;
}) {
  const toast = useToast();
  const [preferred, setPreferred] = useState<"gmail" | "outlook" | "mailto">("mailto");
  useEffect(() => {
    try {
      const v = localStorage.getItem("ss-mail-client");
      if (v === "gmail" || v === "outlook" || v === "mailto") setPreferred(v);
    } catch {}
  }, []);
  const [channel, setChannel] = useState<Channel>(existing?.channel ?? "email");
  const [contactId, setContactId] = useState<string>(existing?.contactId ?? contacts.find((c) => c.name)?.id ?? contacts[0]?.id ?? "");
  const [draft, setDraft] = useState<{ id: string; generatedBy: string } | null>(existing ? { id: existing.id, generatedBy: existing.generatedBy } : null);
  const [subject, setSubject] = useState(existing?.subject ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [copied, setCopied] = useState(false);
  const gen = useAction();
  const save = useAction();

  useEffect(() => {
    if (!open) return;
    setDraft(existing ? { id: existing.id, generatedBy: existing.generatedBy } : null);
    setSubject(existing?.subject ?? "");
    setBody(existing?.body ?? "");
    if (existing) setChannel(existing.channel);
    else if (initialChannel) setChannel(initialChannel);
    setContactId(existing?.contactId ?? preferredContactId ?? contacts.find((c) => c.name)?.id ?? contacts[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing, preferredContactId]);

  const contact = contacts.find((c) => c.id === contactId);
  const generate = () =>
    gen.run(() => draftOutreachAction({ prospectId, contactId: contactId || null, channel }), {
      refresh: false,
      then: (d) => {
        setDraft({ id: d.id, generatedBy: d.generatedBy });
        setSubject(d.subject ?? "");
        setBody(d.body);
      },
    });

  const persist = (handOff: boolean, then?: () => void) =>
    draft && save.run(() => saveDraftAction(draft.id, { subject: subject || null, body, handOff }), { success: handOff ? "Saved to the prospect's activity" : "Draft saved", then });

  const [desktopHelp, setDesktopHelp] = useState(false);
  const handOff = (target: "gmail" | "outlook" | "mailto") => {
    try {
      localStorage.setItem("ss-mail-client", target);
    } catch {}
    if (target === "mailto") setDesktopHelp(true);
    const to = contact?.email ?? "";
    const enc = encodeURIComponent;
    const url =
      target === "gmail"
        ? `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`
        : target === "outlook"
          ? `https://outlook.office.com/mail/deeplink/compose?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`
          : `mailto:${to}?subject=${enc(subject)}&body=${enc(body)}`;
    persist(true);
    window.open(url, target === "mailto" ? "_self" : "_blank", "noopener");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(subject ? `Subject: ${subject}\n\n${body}` : body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: "Copied" });
  };

  const isEmail = channel === "email" || channel === "follow_up";

  return (
    <Dialog open={open} onClose={onClose} variant="sheet" title="How should we approach them?" description={prospectName}>
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="o-channel" className="text-sm font-medium">Channel</label>
            <Select id="o-channel" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="o-contact" className="text-sm font-medium">To</label>
            <Select id="o-contact" value={contactId} onChange={(e) => setContactId(e.target.value)}>
              {contacts.length === 0 && <option value="">A relevant decision maker</option>}
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name ? `${c.name} — ${c.role}` : `${c.role} (name unknown)`}</option>)}
            </Select>
          </div>
        </div>

        {!draft ? (
          <div className="rounded-lg border border-insight-border bg-insight px-5 py-8 text-center">
            <p className="font-medium">I&apos;ll write a first draft from the research and your Company Brain.</p>
            <p className="mt-1 text-sm text-muted">You review and edit everything. Sales Scout never sends anything on your behalf.</p>
            <Button className="mt-4" variant="primary" icon={<Needle className="size-4 text-accent-fg" />} loading={gen.pending} onClick={generate}>
              {aiConnected ? "Draft it" : "Create a template draft"}
            </Button>
            {!aiConnected && <p className="mt-2 text-xs text-subtle">AI isn&apos;t connected, so this will be a simple template built from the research.</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            {draft.generatedBy === "template" && <Notice tone="moderate">This is a template, not an AI draft. Personalise it before sending.</Notice>}
            {isEmail && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="o-subject" className="text-sm font-medium">Subject</label>
                <Input id="o-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="o-body" className="text-sm font-medium">{channel === "call" ? "Script" : "Message"}</label>
              <Textarea id="o-body" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-72 font-[inherit] leading-7" />
              <p className="text-xs text-subtle">Your edits teach Sales Scout how you like to write. Text in [brackets] needs your input.</p>
            </div>
            {isEmail && !contact?.email && <p className="text-sm text-muted">We don&apos;t have a verified email for this person, so the “To” field will be empty. We never guess email addresses.</p>}
            <div className="flex flex-wrap gap-2">
              {isEmail && (
                <>
                  {MAIL_CLIENTS.map((m) => (
                    <Button key={m.id} variant={m.id === preferred ? "primary" : "secondary"} icon={m.id === "mailto" ? <Mail className="size-4" /> : <ExternalLink className="size-4" />} onClick={() => handOff(m.id)} title={m.hint}>
                      {m.label}
                    </Button>
                  ))}
                </>
              )}
              <Button variant={isEmail ? "ghost" : "primary"} icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />} onClick={() => { copy(); if (!isEmail) persist(true); }}>
                Copy
              </Button>
              <Button variant="ghost" loading={save.pending} onClick={() => persist(false)}>Save draft</Button>
              <Button variant="ghost" className={cn("ml-auto")} loading={gen.pending} onClick={generate}>Start over</Button>
            </div>
            {isEmail && desktopHelp && (
              <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted">
                &ldquo;Outlook Desktop&rdquo; opens your computer&apos;s default email app. If a different app opened, make Outlook the default: on Windows, Settings → Apps → Default apps → Outlook; on a Mac, Mail → Settings → General → Default email reader. Or use Copy and paste into Outlook. Nothing is sent until you press Send there.
              </p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
