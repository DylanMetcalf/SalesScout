"use server";

import * as z from "zod/v4";
import { requireTenant } from "@/lib/tenant";
import { cancelSubscription, manageLink, startCheckout } from "@/lib/billing/paystack";
import { PAID_PLANS } from "@/lib/billing/plans";
import { rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";
import { attempt } from "./result";

async function billingTenant() {
  const tenant = await requireTenant();
  if (tenant.role === "member") throw new Error("Only the account owner can manage billing.");
  if (!rateLimit(`billing:${tenant.account.id}`, 20, 3_600_000)) throw new Error("Too many attempts. Try again shortly.");
  return tenant;
}

export async function checkoutAction(plan: string) {
  return attempt(async () => {
    const tenant = await billingTenant();
    const id = z.enum(PAID_PLANS as [string, ...string[]]).parse(plan) as (typeof PAID_PLANS)[number];
    return startCheckout(tenant.account, tenant.user.email, id);
  });
}

export async function manageBillingAction() {
  return attempt(async () => manageLink((await billingTenant()).account));
}

export async function cancelSubscriptionAction() {
  return attempt(async () => {
    const tenant = await billingTenant();
    await cancelSubscription(tenant.account);
    audit({ ...tenant, company: null }, { entityType: "account", entityId: tenant.account.id, action: "subscription_canceled", source: "user", summary: "Cancelled the subscription (access continues to the end of the period)" });
  });
}
