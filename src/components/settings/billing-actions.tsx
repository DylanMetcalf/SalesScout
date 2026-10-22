"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAction } from "@/components/prospects/shared";
import { cancelSubscriptionAction, checkoutAction, manageBillingAction } from "@/app/actions/billing";

/** Sends the user to Paystack's hosted checkout. */
export function CheckoutButton({ plan, label, primary }: { plan: string; label: string; primary?: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <Button
      variant={primary ? "primary" : "secondary"}
      className="w-full"
      loading={pending}
      onClick={() =>
        start(async () => {
          const r = await checkoutAction(plan);
          if (!r.ok) toast({ kind: "error", title: r.error });
          else window.location.href = r.data;
        })
      }
    >
      {label}
    </Button>
  );
}

export function ManageButtons({ canCancel }: { canCancel: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const cancel = useAction();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        loading={pending}
        onClick={() =>
          start(async () => {
            const r = await manageBillingAction();
            if (!r.ok) toast({ kind: "error", title: r.error });
            else window.open(r.data, "_blank", "noopener");
          })
        }
      >
        Update card or billing details
      </Button>
      {canCancel && (
        <Button
          variant="ghost"
          loading={cancel.pending}
          onClick={() => {
            if (confirm("Cancel your subscription? You keep your plan until the end of the period you've paid for, and all your data stays.")) {
              cancel.run(() => cancelSubscriptionAction(), { success: "Subscription cancelled. Your plan stays active until the end of this period." });
            }
          }}
        >
          Cancel subscription
        </Button>
      )}
    </div>
  );
}
