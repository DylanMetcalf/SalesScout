import { db, t } from "@/lib/db";
import { requireTenant, inCompany, type CompanyTenant } from "@/lib/tenant";
import { CompanyWizard, type WizardStep } from "./wizard";

export const metadata = { title: "Tell us about your business" };

export default async function OnboardingCompany({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const tenant = await requireTenant();
  const requested = (await searchParams).step as WizardStep | undefined;
  const step: WizardStep = requested && ["website", "profiles", "documents", "analyse"].includes(requested) && tenant.company && !tenant.company.isDemo ? requested : "about";
  const sources = step !== "about" ? db.select().from(t.sources).where(inCompany(t.sources, tenant as CompanyTenant)).all() : [];
  const lite = sources.map((s) => ({ id: s.id, kind: s.kind, subtype: s.subtype, label: s.label, url: s.url, status: s.status, statusDetail: s.statusDetail }));
  const website = sources.find((s) => s.kind === "website");
  return (
    <CompanyWizard
      step={step}
      companyName={step !== "about" ? tenant.company?.name ?? "" : ""}
      website={website?.url ?? null}
      pages={lite.filter((s) => s.kind === "page")}
      profiles={lite.filter((s) => s.kind === "social")}
      documents={lite.filter((s) => s.kind === "document")}
    />
  );
}
