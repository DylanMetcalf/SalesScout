"use client";

import { useState } from "react";
import { Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAction } from "@/components/prospects/shared";
import { createInviteAction, createResetLinkAction, revokeInviteAction, setAccountAccessAction, setEnquiryStatusAction } from "@/app/actions/admin";

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
  const [code, setCode] = useState<string | null>(null);
  const [aiAccess, setAccess] = useState("server");

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied" });
    } catch {
      toast({ kind: "error", title: "Couldn't copy. Select the text instead." });
    }
  };

  if (code) {
    const link = `${window.location.origin}/signup?invite=${code}`;
    return (
      <div className="rounded-lg border border-insight-border bg-insight p-4">
        <p className="text-sm font-semibold text-heading">Invite created</p>
        <p className="mt-2 select-all font-mono text-lg tracking-wider text-accent-text">{code}</p>
        <p className="mt-1 break-all text-xs text-muted select-all">{link}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" icon={<Copy className="size-4" />} onClick={() => copy(link)}>Copy sign-up link</Button>
          <Button size="sm" variant="ghost" onClick={() => { setCode(null); setOpen(false); }}>Done</Button>
        </div>
      </div>
    );
  }
  if (!open) return <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>New invite code</Button>;
  return (
    <form
      className="grid gap-3 rounded-lg border border-border bg-surface-2 p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const input = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        create.run(() => createInviteAction(input), { then: (c) => setCode(c) });
      }}
    >
      <Field label="Who is it for?" className="sm:col-span-2">{(p) => <Input {...p} name="label" placeholder="e.g. Acme Engineering pilot" required maxLength={80} />}</Field>
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
      <Field label="Expires after (days)" optional>{(p) => <Input {...p} name="expiresInDays" type="number" min={1} max={365} defaultValue={14} />}</Field>
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
