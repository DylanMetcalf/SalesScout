import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { requireTenant } from "@/lib/tenant";
import { balance, ensureGrants, entitlement, usageNow } from "@/lib/billing/credits";
import { freeEligible, verificationPolicy } from "@/lib/billing/eligibility";
import { PAID_PLANS, PLANS, planPrice } from "@/lib/billing/plans";
import { onSale, paystackConfigured } from "@/lib/billing/paystack";
import { SITE } from "@/content/site";
import { Page, PageHeader } from "@/components/layout/page";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/error-state";
import { CheckoutButton, ManageButtons } from "@/components/settings/billing-actions";
import { formatDate } from "@/lib/format";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Plan and usage" };

const STATUS = {
  none: null,
  processing: { label: "Payment processing", tone: "info" },
  active: { label: "Active", tone: "strong" },
  past_due: { label: "Payment failed: retrying", tone: "moderate" },
  canceled: { label: "Cancelled", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
} as const;

export default async function Billing({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const tenant = await requireTenant();
  const acc = tenant.account;
  const { result } = await searchParams;
  const eligible = freeEligible(acc.id);
  ensureGrants(acc, { freeEligible: eligible });
  const ent = entitlement(acc);
  const bal = balance(acc);
  const use = usageNow(acc.id);
  const status = STATUS[acc.subscriptionStatus];
  const limits = ent.plan.limits;
  const policy = verificationPolicy();

  const meters = [
    { label: "Searches today", used: use.searchesToday, of: limits.searchesPerDay },
    { label: "Researched previews this month", used: use.previewsThisMonth, of: limits.previewsPerMonth },
    { label: "Deep research this month", used: use.deepThisMonth, of: limits.deepResearchPerMonth },
  ];

  return (
    <Page width="narrow">
      <Link href="/settings" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" aria-hidden /> Settings
      </Link>
      <PageHeader title="Plan and usage" description="What you have, what you've used, and what each action costs." />

      <div className="flex flex-col gap-6">
        {result === "active" && <Notice tone="accent" title="You're subscribed. Thank you!">Your plan is active and this period's unlocks are ready.</Notice>}
        {result === "pending" && <Notice tone="info" title="Payment is processing">We'll update your plan as soon as Paystack confirms it, usually within a minute.</Notice>}
        {result === "failed" && <Notice tone="moderate" title="The payment didn't go through">Nothing was charged. You can try again below.</Notice>}
        {acc.subscriptionStatus === "past_due" && (
          <Notice tone="moderate" title="Your last payment failed">Paystack will retry. Update your card below to keep your plan without interruption.</Notice>
        )}
        {!eligible && (policy.email || policy.phone) && (
          <Notice tone="info" title="Verify your account to receive your 5 free unlocks">
            <Link href="/verify" className="font-medium text-accent-text hover:underline">Verify now</Link>. It only takes a minute.
          </Notice>
        )}

        <Card>
          <CardHeader
            title={`${ent.unlimited ? "Administrator" : ent.plan.name} plan`}
            description={
              ent.unlimited
                ? "No limits: you run this installation."
                : ent.paid && ent.renewsAt
                  ? acc.cancelAtPeriodEnd || acc.subscriptionStatus === "canceled"
                    ? `Ends ${formatDate(ent.renewsAt)}. You keep access to all your data afterwards.`
                    : `${acc.planSource === "manual" ? "Paid until" : "Renews"} ${formatDate(ent.renewsAt)}`
                  : "Free plan: 5 prospect unlocks, once."
            }
            action={status && acc.planSource === "paystack" ? <Badge tone={status.tone} dot>{status.label}</Badge> : undefined}
          />
          <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <p className="font-display text-4xl font-[650] text-heading tabular-nums">{ent.unlimited ? "∞" : bal.total}</p>
              <p className="text-sm text-muted">prospect unlocks left</p>
              {!ent.unlimited && (
                <p className="mt-1 text-xs text-subtle">
                  {[bal.plan ? `${bal.plan} this period` : null, bal.free ? `${bal.free} free` : null, bal.bonus ? `${bal.bonus} bonus` : null].filter(Boolean).join(" · ") || "None left"}
                </p>
              )}
            </div>
            <ul className="flex flex-col gap-3 sm:col-span-2">
              {meters.map((m) => (
                <li key={m.label}>
                  <div className="flex justify-between text-sm">
                    <span>{m.label}</span>
                    <span className="tabular-nums text-muted">{ent.unlimited ? m.used : `${m.used} / ${m.of}`}</span>
                  </div>
                  {!ent.unlimited && (
                    <div className="mt-1 h-1.5 rounded-full bg-surface-3">
                      <div className={cn("h-1.5 rounded-full", m.used >= m.of ? "bg-moderate" : "bg-accent")} style={{ width: `${Math.min(100, (m.used / Math.max(1, m.of)) * 100)}%` }} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-border px-5 py-4 text-sm text-muted">
            <p className="font-medium text-text">What uses what</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li><strong className="text-text">Keeping a prospect</strong> uses 1 unlock and opens its full profile, contacts, brief and outreach. Keeping the same prospect again is free.</li>
              <li><strong className="text-text">Previews</strong> (up to 5 per batch), skipping and rejecting use no unlocks; previews count towards your monthly research limit.</li>
              <li>If research fails, nothing is charged.</li>
            </ul>
          </div>
          {acc.planSource === "paystack" && acc.billingSubscriptionCode && (
            <div className="border-t border-border px-5 py-4">
              <ManageButtons canCancel={acc.subscriptionStatus === "active" || acc.subscriptionStatus === "past_due"} />
            </div>
          )}
        </Card>

        {!ent.unlimited && (
          <section aria-labelledby="h-plans">
            <h2 id="h-plans" className="text-xl">Plans</h2>
            {!paystackConfigured() && <p className="mt-1 text-sm text-muted">Online checkout is coming soon. To subscribe now, email <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-accent-text hover:underline">{SITE.contactEmail}</a> and we&apos;ll set up your plan.</p>}
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {PAID_PLANS.map((id) => {
                const p = PLANS[id];
                const price = planPrice(id);
                const current = ent.paid && acc.plan === id;
                return (
                  <article key={id} className={cn("flex flex-col rounded-xl border bg-surface p-5", id === "growth" ? "border-accent ring-1 ring-accent" : "border-border")}>
                    <h3 className="font-semibold text-heading">{p.name}</h3>
                    <p className="text-sm text-muted">{p.summary}</p>
                    <p className="mt-3 font-display text-3xl font-[650] text-heading">{price ? `R${price.toLocaleString("en-ZA")}` : "—"}<span className="text-sm font-normal text-muted">{price ? " / month" : ""}</span></p>
                    <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-sm">
                      {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />{f}</li>)}
                    </ul>
                    <div className="mt-4">
                      {current ? (
                        <Badge tone="strong" dot>Your plan</Badge>
                      ) : onSale(id) ? (
                        <CheckoutButton plan={id} label={ent.paid ? `Switch to ${p.name}` : `Choose ${p.name}`} primary={id === "growth"} />
                      ) : (
                        <a href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Sales Scout ${p.name} plan`)}`} className="text-sm font-medium text-accent-text hover:underline">Ask us about {p.name}</a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-subtle">Prices in rand, billed monthly by Paystack. Cancel any time; you keep your plan until the end of the period you&apos;ve paid for, and your saved prospects and history always stay yours.</p>
          </section>
        )}
      </div>
    </Page>
  );
}
