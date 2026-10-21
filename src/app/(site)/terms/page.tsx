import { TERMS } from "@/content/legal";
import { LegalPage } from "@/components/site/legal-page";

export const metadata = { title: "Terms of Service", description: "The terms for using Sales Scout." };

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="The rules for using Sales Scout, in plain language."
      summary={["You own your data and research.", "We never contact anyone for you.", "Check research before relying on it.", "No guaranteed results, but always real evidence."]}
      sections={TERMS}
    />
  );
}
