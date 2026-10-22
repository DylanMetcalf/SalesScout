import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/tenant";
import { verifyReturn } from "@/lib/billing/paystack";

/** Paystack sends customers here after checkout. We confirm with Paystack directly before changing anything. */
export default async function BillingReturn({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string }> }) {
  const tenant = await requireTenant();
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref;
  let result: "active" | "pending" | "failed" = "pending";
  if (reference) {
    try {
      result = await verifyReturn(tenant.account, reference);
    } catch (err) {
      console.error("[billing] verify failed", err);
    }
  }
  redirect(`/settings/billing?result=${result}`);
}
