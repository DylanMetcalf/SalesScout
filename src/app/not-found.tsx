import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <EmptyState
        icon={<Compass />}
        title="We couldn't find that page"
        body="It may have been removed, or it belongs to a different company or workspace."
        action={<ButtonLink href="/home" variant="primary">Go home</ButtonLink>}
      />
    </main>
  );
}
