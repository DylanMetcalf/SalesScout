import { Badge } from "@/components/ui/badge";
import type * as s from "@/lib/db/schema";

export function RunStatus({ run }: { run: typeof s.searchRuns.$inferSelect }) {
  if (run.status === "running") return <Badge tone="accent" dot className="animate-pulse-soft">Researching</Badge>;
  if (run.status === "interpreted" || run.status === "interpreting") return <Badge>Not run yet</Badge>;
  if (run.status === "failed") return <Badge tone="weak">Didn&apos;t finish</Badge>;
  return (
    <span className="flex shrink-0 items-center gap-3 text-sm text-muted tabular-nums">
      <span><span className="font-medium text-text">{run.relevant}</span> relevant</span>
      <span>{run.discovered} found</span>
      {run.status === "partial" && <Badge tone="moderate">Partial</Badge>}
    </span>
  );
}
