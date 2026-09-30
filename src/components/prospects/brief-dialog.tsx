"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { salesBriefAction } from "@/app/actions/prospects";

type Brief = { headline: string; whatTheyDo: string; whyRelevant: string; opportunity: string; people: string[]; evidence: string[]; unknowns: string[]; nextStep: string };

/** A one-minute read before making contact. */
export function BriefDialog({ open, onClose, prospectId, name }: { open: boolean; onClose: () => void; prospectId: string; name: string }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setBrief(null);
    salesBriefAction(prospectId).then((r) => (r.ok ? setBrief(r.data) : setError(r.error)));
  }, [open, prospectId]);

  const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="border-t border-border pt-4 first:border-0 first:pt-0">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-subtle">{title}</h3>
      <div className="text-[15px] leading-7">{children}</div>
    </section>
  );
  const Bullets = ({ items, empty }: { items: string[]; empty: string }) =>
    items.length ? (
      <ul className="list-disc space-y-1 pl-5">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    ) : (
      <p className="text-muted">{empty}</p>
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={`Sales brief — ${name}`}
      description="Assembled directly from the research. Read it in under a minute before you make contact."
      footer={<Button icon={<Printer className="size-4" />} onClick={() => window.print()}>Print</Button>}
    >
      {error && <p className="text-weak">{error}</p>}
      {!brief && !error && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}
      {brief && (
        <div className="flex flex-col gap-4 print:text-black">
          <p className="text-lg font-semibold">{brief.headline}</p>
          <Block title="What they do">{brief.whatTheyDo}</Block>
          <Block title="Why they're relevant">{brief.whyRelevant}</Block>
          <Block title="Potential opportunity">{brief.opportunity}</Block>
          <Block title="Relevant people"><Bullets items={brief.people} empty="No people identified yet." /></Block>
          <Block title="Known evidence"><Bullets items={brief.evidence} empty="No sources recorded." /></Block>
          <Block title="Unknowns"><Bullets items={brief.unknowns} empty="Nothing flagged." /></Block>
          <Block title="Suggested next step"><p className="font-medium">{brief.nextStep}</p></Block>
        </div>
      )}
    </Dialog>
  );
}
