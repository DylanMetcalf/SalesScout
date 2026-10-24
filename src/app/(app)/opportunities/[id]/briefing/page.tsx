import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { getOpportunity } from "@/lib/opportunities/service";
import { bookingLink, briefingFor } from "@/lib/opportunities/briefings";
import { Page } from "@/components/layout/page";
import { Notice } from "@/components/ui/error-state";
import { BriefingDocument } from "@/components/briefing/document";

export const metadata = { title: "Briefing preview", robots: { index: false } };
export const dynamic = "force-dynamic";

/** What the customer sees, for the operator. No private link needed, and views here aren't counted. */
export default async function BriefingPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  let o;
  try {
    o = getOpportunity(id);
  } catch {
    notFound();
  }
  const b = briefingFor(id);
  if (!b?.content) notFound();
  return (
    <Page width="wide">
      <Link href={`/opportunities/${id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><ArrowLeft className="size-4" aria-hidden /> Back to the opportunity</Link>
      <Notice tone="info" className="mb-8">Operator preview of briefing {b.reference}. This is what {o.name} sees at their private link. Opening it here doesn’t count as a view.</Notice>
      <h1 className="mb-10 max-w-4xl text-[36px] leading-[1.05] tracking-[-0.03em] sm:text-[52px]">{b.content.title}</h1>
      <BriefingDocument b={b.content} bookingHref={bookingLink(o, b.reference)} token="" requested />
    </Page>
  );
}
