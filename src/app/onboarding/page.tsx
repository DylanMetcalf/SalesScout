import { redirect } from "next/navigation";
import { getTenant } from "@/lib/tenant";
import { StepDots, Prompt } from "./steps";
import { WorkspaceForm } from "./workspace-form";

export const metadata = { title: "Welcome" };

export default async function OnboardingWorkspace({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const tenant = await getTenant();
  const creatingAnother = (await searchParams).new === "1";
  if (tenant && !creatingAnother) redirect(tenant.company ? "/home" : "/onboarding/company");
  return (
    <>
      <StepDots current={0} />
      <Prompt title={creatingAnother ? "Let's set up another workspace." : "Welcome to Sales Scout."}>
        {creatingAnother
          ? "Workspaces keep separate groups of companies and their sales activity apart."
          : "First, a home for your work. A workspace holds your companies — your own business, or clients you prospect for."}
      </Prompt>
      <WorkspaceForm showDemo={!creatingAnother} />
    </>
  );
}
