import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/tenant";
import { db, t } from "@/lib/db";
import { inCompany } from "@/lib/tenant";
import { aiConfigured } from "@/lib/ai/core";
import { MarketDiscovery } from "@/components/company/market-discovery";
import { ButtonLink } from "@/components/ui/button";
import { Prompt, StepDots } from "../steps";

export const metadata = { title: "Who you could sell to" };

export default async function Markets() {
  const tenant = await requireCompany();
  if (tenant.company.isDemo) redirect("/home");
  const opps = db.select().from(t.marketOpportunities).where(inCompany(t.marketOpportunities, tenant)).all();
  const accepted = opps.filter((o) => o.status === "accepted");
  return (
    <div className="sm:-mx-24">
      <StepDots current={7} />
      <Prompt title="Here's who I think you could sell to.">
        Pick the directions that make sense. Each one becomes a lead strategy you can refine — I won&apos;t set your strategy for you.
      </Prompt>
      <MarketDiscovery opportunities={opps} aiConnected={aiConfigured()} onboarding />
      <div className="mt-10 flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-semibold">Let&apos;s find some companies.</p>
          <p className="text-sm text-muted">
            {accepted.length
              ? `You've chosen ${accepted.length} direction${accepted.length === 1 ? "" : "s"}. I'll start there.`
              : "Choose a direction above, or just tell me what you're looking for."}
          </p>
        </div>
        <ButtonLink href={accepted[0] ? `/discover?strategy=${accepted[0].strategyId}` : "/discover"} variant="primary" size="lg">
          Start discovering
        </ButtonLink>
        <ButtonLink href="/home" variant="ghost" size="lg">
          Skip to home
        </ButtonLink>
      </div>
    </div>
  );
}
