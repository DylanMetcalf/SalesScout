"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/components/ui/cn";

/** "What are we looking for?" — one sentence starts a discovery. */
export function AskBox({ examples, aiConnected }: { examples: string[]; aiConnected: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [going, setGoing] = useState(false);
  const go = (text: string) => {
    if (!text.trim()) return;
    setGoing(true);
    router.push(`/discover?q=${encodeURIComponent(text.trim())}${aiConnected ? "&auto=1" : ""}`);
  };
  return (
    <section aria-labelledby="h-ask">
      <h2 id="h-ask" className="mb-3 text-xl">What are we looking for?</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface py-2 pr-2 pl-3 shadow-md transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[var(--ring),var(--shadow-md)]"
      >
        <LogoMark size={30} working={going} label={null} />
        <label htmlFor="ask" className="sr-only">Describe the companies or people you're looking for</label>
        <input
          id="ask"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe who you'd like to sell to…"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-subtle focus-visible:shadow-none"
        />
        <button
          type="submit"
          disabled={!q.trim() || going}
          aria-label="Start discovering"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            q.trim() ? "bg-accent text-accent-fg hover:bg-accent-hover" : "bg-surface-2 text-subtle",
          )}
        >
          <ArrowUp className="size-5" aria-hidden />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {examples.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setQ(e)}
            className="rounded-full border border-border bg-surface px-3 py-1 text-left text-sm text-muted transition-colors hover:border-border-strong hover:text-text"
          >
            {e}
          </button>
        ))}
      </div>
    </section>
  );
}
