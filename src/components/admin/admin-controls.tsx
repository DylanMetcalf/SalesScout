"use client";

import { useState } from "react";
import { Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAction } from "@/components/prospects/shared";
import { adjustCreditsAction, createInviteAction, createResetLinkAction, revokeInviteAction, setAccessUntilAction, setAccountAccessAction, setAccountPausedAction, setEnquiryStatusAction, setPlanAction, setSwitchAction } from "@/app/actions/admin";

const toMillions = (tokens: number | null) => (tokens == null ? "" : String(tokens / 1_000_000));

export function AccountAccess({ accountId, access, limit, isAdmin }: { accountId: string; access: "server" | "own_key"; limit: number | null; isAdmin: boolean }) {
  const [aiAccess, setAccess] = useState(access);
  const [allowance, setAllowance] = useState(toMillions(limit));
  const save = useAction();
  if (isAdmin) return <span className="text-sm text-muted">Administrator · unlimited</span>;
  const dirty = aiAccess !== access || allowance !== toMillions(limit);
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        save.run(() => setAccountAccessAction({ accountId, aiAccess, allowance }), { success: "Access updated" });
      }}
    >
      <Select aria-label="AI access" value={aiAccess} onChange={(e) => setAccess(e.target.value as typeof aiAccess)} className="h-9 w-auto">
        <option value="own_key">Own key</option>
        <option value="server">Your key</option>
      </Select>
      {aiAccess === "server" && (
        <Input aria-label="Monthly allowance in millions of tokens" inputMode="decimal" value={allowance} onChange={(e) => setAllowance(e.target.value)} placeholder="No cap" className="h-9 w-24" />
      )}
      {dirty && <Button type="submit" size="sm" variant="primary" loading={save.pending}>Save</Button>}
    </form>
  );
}

export function InviteCreator() {
  const toast = useToast();
  const create = useAction();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<{ code: string; email: string; days: string } | null>(null);
  const [aiAccess, setAccess] = useState("server");

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied" });
    } catch {
      toast({ kind: "error", title: "Couldn't copy. Select the text instead." });
    }
  };

  if (created) {
    const loginUrl = `${window.location.origin}/login`;
    const message = [
      "Your Sales Scout access is ready.",
      `Sign in at ${loginUrl}`,
      `Email: ${created.email || "your work email"}`,
      `Password: ${created.code}`,
      created.days ? `Access: ${created.days} days from your first sign-in.` : "",
      "You can change your password in Settings once you're in.",
    ].filter(Boolean).join("\n");
    return (
      <div className="rounded-lg border border-insight-border bg-insight p-4">
        <p className="text-sm font-semibold text-heading">Access code created</p>
        <p className="mt-2 select-all font-mono text-lg tracking-wider text-accent-text">{created.code}</p>
        <p className="mt-1 text-sm text-muted">They sign in with {created.email ? <span className="font-medium text-text">{created.email}</span> : "their email"} and this code as the password.</p>
        <pre className="mt-3 rounded-md border border-border bg-surface p-3 font-sans text-xs whitespace-pre-wrap text-muted select-all">{message}</pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="primary" icon={<Copy className="size-4" />} onClick={() => copy(message)}>Copy message to send</Button>
          <Button size="sm" variant="ghost" onClick={() => { setCreated(null); setOpen(false); }}>Done</Button>
        </div>
      </div>
    );
  }
  if (!open) return <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>New access code</Button>;
  return (
    <form
      className="grid gap-3 rounded-lg border border-border bg-surface-2 p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const input = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        create.run(() => createInviteAction(input), { then: (code) => setCreated({ code, email: input.email ?? "", days: input.accessDays ?? "" }) });
      }}
    >
      <Field label="Who is it for?">{(p) => <Input {...p} name="label" placeholder="e.g. Acme Engineering" required maxLength={80} />}</Field>
      <Field label="Their email" hint="Recommended: only this email can use the code." optional>{(p) => <Input {...p} name="email" type="email" placeholder="name@company.com" />}</Field>
      <Field label="Access length (days)" hint="From first sign-in, e.g. 30 for a month. Blank = until you pause it." optional>{(p) => <Input {...p} name="accessDays" type="number" min={1} max={3650} defaultValue={30} />}</Field>
      <Field label="Plan" hint="What they've paid you for. Sets their monthly unlocks and limits.">
        {(p) => (
          <Select {...p} name="plan" defaultValue="">
            <option value="">Free (5 unlocks, once)</option>
            <option value="scout">Scout</option>
            <option value="growth">Growth</option>
            <option value="scale">Scale</option>
          </Select>
        )}
      </Field>
      <Field label="AI usage">
        {(p) => (
          <Select {...p} name="aiAccess" value={aiAccess} onChange={(e) => setAccess(e.target.value)}>
            <option value="server">Included (uses your key)</option>
            <option value="own_key">They bring their own key</option>
          </Select>
        )}
      </Field>
      {aiAccess === "server" ? (
        <Field label="Monthly allowance" hint="Millions of tokens. Blank = no cap." optional>{(p) => <Input {...p} name="allowance" inputMode="decimal" placeholder="e.g. 5" />}</Field>
      ) : (
        <input type="hidden" name="allowance" value="" />
      )}
      <Field label="Can be used">{(p) => <Input {...p} name="maxUses" type="number" min={1} max={100} defaultValue={1} />}</Field>
      <Field label="Code must be used within (days)" optional>{(p) => <Input {...p} name="expiresInDays" type="number" min={1} max={365} defaultValue={14} />}</Field>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" variant="primary" loading={create.pending}>Create code</Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

export function RevokeInvite({ id }: { id: string }) {
  const revoke = useAction();
  return (
    <Button size="sm" variant="ghost" loading={revoke.pending} onClick={() => revoke.run(() => revokeInviteAction(id), { success: "Invite revoked" })}>
      Revoke
    </Button>
  );
}

export function EnquiryStatus({ id, status }: { id: string; status: string }) {
  const set = useAction();
  return (
    <Select aria-label="Enquiry status" value={status} disabled={set.pending} onChange={(e) => set.run(() => setEnquiryStatusAction(id, e.target.value))} className="h-8 w-auto text-sm">
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="closed">Closed</option>
    </Select>
  );
}

/** Issues a one-time password reset link for a locked-out user and copies it. */
export function ResetLink({ userId, email }: { userId: string; email: string }) {
  const toast = useToast();
  const make = useAction();
  const [link, setLink] = useState<string | null>(null);
  if (link) {
    return (
      <span className="flex items-center gap-2">
        <span className="max-w-56 truncate font-mono text-xs text-muted select-all" title={link}>{link}</span>
        <Button size="sm" variant="ghost" icon={<Copy className="size-3.5" />} onClick={async () => { try { await navigator.clipboard.writeText(link); toast({ title: "Reset link copied. It works once, for 24 hours." }); } catch { toast({ kind: "error", title: "Couldn't copy. Select the link instead." }); } }}>Copy</Button>
      </span>
    );
  }
  return (
    <Button size="sm" variant="ghost" loading={make.pending} aria-label={`Create a password reset link for ${email}`} onClick={() => make.run(() => createResetLinkAction(userId), { refresh: false, then: (path) => setLink(`${window.location.origin}${path}`) })}>
      Reset link
    </Button>
  );
}

/** Pause / resume, and the paid-up-to date. */
export function AccessControl({ accountId, paused, until, isAdmin }: { accountId: string; paused: boolean; until: string; isAdmin: boolean }) {
  const pause = useAction();
  const save = useAction();
  const [date, setDate] = useState(until);
  if (isAdmin) return <span className="text-sm text-muted">Always</span>;
  const ended = !paused && until !== "" && new Date(`${until}T23:59:59`).getTime() < Date.now();
  return (
    <div className="flex flex-col gap-2">
      <span className={paused || ended ? "text-xs font-semibold text-weak" : "text-xs font-semibold text-strong"}>{paused ? "Paused" : ended ? "Ended" : "Active"}</span>
      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" aria-label="Access until" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 w-[150px]" />
        {date !== until && <Button size="sm" variant="primary" loading={save.pending} onClick={() => save.run(() => setAccessUntilAction(accountId, date), { success: date ? "Access date saved" : "No end date" })}>Save</Button>}
        <Button size="sm" variant={paused ? "primary" : "ghost"} loading={pause.pending} onClick={() => pause.run(() => setAccountPausedAction(accountId, !paused), { success: paused ? "Access restored" : "Access paused. They've been signed out." })}>
          {paused ? "Resume" : "Pause"}
        </Button>
      </div>
    </div>
  );
}

/** Manual plan (billed outside Paystack) and bonus credits. */
export function PlanControl({ accountId, plan, source, credits, isAdmin }: { accountId: string; plan: string; source: string; credits: number; isAdmin: boolean }) {
  const set = useAction();
  const adjust = useAction();
  const [amount, setAmount] = useState("");
  if (isAdmin) return <span className="text-sm text-muted">Unlimited</span>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select aria-label="Plan" value={plan} disabled={set.pending || source === "paystack"} onChange={(e) => set.run(() => setPlanAction(accountId, e.target.value), { success: "Plan updated" })} className="h-9 w-auto">
          <option value="free">Free</option>
          <option value="scout">Scout</option>
          <option value="growth">Growth</option>
          <option value="scale">Scale</option>
        </Select>
        <span className="text-xs text-muted">{source === "paystack" ? "Paystack" : source === "manual" ? "Manual" : ""}</span>
      </div>
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          adjust.run(() => adjustCreditsAction(accountId, Number(amount), "Manual adjustment"), { success: "Credits adjusted", then: () => setAmount("") });
        }}
      >
        <span className="text-xs text-muted tabular-nums">{credits} left</span>
        <Input aria-label="Add or remove credits" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="+5" className="h-8 w-16 text-sm" />
        {amount && <Button type="submit" size="sm" loading={adjust.pending}>Apply</Button>}
      </form>
    </div>
  );
}

/** A kill switch with an optional reason shown to users. */
export function SwitchControl({ id, label, detail, on, reason }: { id: string; label: string; detail: string; on: boolean; reason: string | null }) {
  const set = useAction();
  const [why, setWhy] = useState(reason ?? "");
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="font-medium">{label} {on && <span className="ml-1 rounded bg-weak-soft px-1.5 py-0.5 text-xs font-semibold text-weak">ON</span>}</p>
        <p className="text-sm text-muted">{detail}</p>
      </div>
      {!on && <Input aria-label={`Reason for ${label}`} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Reason (shown to users)" className="h-9 sm:w-56" />}
      <Button size="sm" variant={on ? "primary" : "danger"} loading={set.pending} onClick={() => set.run(() => setSwitchAction(id, !on, why), { success: on ? "Resumed" : "Paused" })}>
        {on ? "Resume" : "Pause"}
      </Button>
    </div>
  );
}
