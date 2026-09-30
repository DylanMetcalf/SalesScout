"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveBrainAndContinueAction } from "@/app/actions/brain";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" loading={pending} icon={<ArrowRight className="size-4" />}>
      This looks right
    </Button>
  );
}

export function ApproveBrain() {
  return (
    <form
      action={approveBrainAndContinueAction}
      className="sticky bottom-0 mt-8 -mx-5 flex items-center justify-between gap-4 border-t border-border bg-bg/95 px-5 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5"
    >
      <p className="text-sm text-muted">You can change any of this later from Company.</p>
      <Submit />
    </form>
  );
}
