"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { findSimilarAction } from "@/app/actions/discovery";

export function FindSimilarButton({ prospectId, variant = "secondary", size = "sm" }: { prospectId: string; variant?: "secondary" | "ghost" | "primary"; size?: "sm" | "md" }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <Button
      size={size}
      variant={variant}
      loading={pending}
      icon={<Layers className="size-4" />}
      onClick={() =>
        start(async () => {
          const r = await findSimilarAction(prospectId);
          if (!r.ok) toast({ kind: "error", title: r.error });
          else router.push(`/discover/runs/${r.data}`);
        })
      }
    >
      Find similar
    </Button>
  );
}
