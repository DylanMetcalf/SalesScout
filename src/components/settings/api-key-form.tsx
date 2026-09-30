"use client";

import { useState } from "react";
import { CircleCheck, ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "@/components/prospects/shared";
import { removeApiKeyAction, saveApiKeyAction, testApiKeyAction } from "@/app/actions/ai-key";
import { formatDate } from "@/lib/format";

type Status = { source: "account" | "server" | null; hint: string | null; updatedAt: number | null; serverKey: boolean; canEdit: boolean };

/** Paste-in API key. The key is encrypted on the server and never shown again in full. */
export function ApiKeyForm({ status }: { status: Status }) {
  const [key, setKey] = useState("");
  const [replacing, setReplacing] = useState(false);
  const save = useAction();
  const test = useAction();
  const remove = useAction();

  const showForm = status.canEdit && (status.source !== "account" || replacing);

  return (
    <div className="flex flex-col gap-4">
      {status.source === "account" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-strong/25 bg-strong-soft/50 px-4 py-3">
          <CircleCheck className="size-4 text-strong" aria-hidden />
          <p className="flex-1 text-sm">
            Using <span className="font-medium">your API key</span> ending <span className="font-mono">…{status.hint}</span>
            {status.updatedAt && <span className="text-muted"> · saved {formatDate(status.updatedAt)}</span>}
          </p>
          {status.canEdit && (
            <div className="flex gap-2">
              <Button size="sm" loading={test.pending} onClick={() => test.run(() => testApiKeyAction(), { success: "The key works", refresh: false })}>Test</Button>
              <Button size="sm" variant="ghost" onClick={() => setReplacing((r) => !r)}>{replacing ? "Cancel" : "Replace"}</Button>
              <Button size="sm" variant="danger" loading={remove.pending} onClick={() => remove.run(() => removeApiKeyAction(), { success: "Key removed" })}>Remove</Button>
            </div>
          )}
        </div>
      )}
      {status.source === "server" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-strong/25 bg-strong-soft/50 px-4 py-3">
          <ShieldCheck className="size-4 text-strong" aria-hidden />
          <p className="flex-1 text-sm">Using the <span className="font-medium">server&apos;s API key</span> (set by whoever runs this installation). You can paste your own to use it instead.</p>
          {status.canEdit && <Button size="sm" loading={test.pending} onClick={() => test.run(() => testApiKeyAction(), { success: "The key works", refresh: false })}>Test</Button>}
        </div>
      )}

      {showForm && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.run(() => saveApiKeyAction(key), { success: "Connected — AI features are on", then: () => { setKey(""); setReplacing(false); } });
          }}
        >
          <label htmlFor="api-key" className="text-sm font-medium">
            {status.source === "account" ? "New Anthropic API key" : "Paste your Anthropic API key"}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
              <Input
                id="api-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-…"
                className="pl-9 font-mono text-sm"
              />
            </div>
            <Button type="submit" variant="primary" loading={save.pending} disabled={key.trim().length < 20}>
              Save & test
            </Button>
          </div>
          <p className="text-xs text-subtle">
            We check the key with Anthropic before saving it, then store it encrypted. It&apos;s never shown again or sent to your browser.{" "}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-accent-text hover:underline">
              Get a key <ExternalLink className="size-3" aria-hidden />
            </a>
          </p>
        </form>
      )}
      {!status.canEdit && status.source === null && <p className="text-sm text-muted">Ask a workspace owner to connect AI.</p>}
    </div>
  );
}
