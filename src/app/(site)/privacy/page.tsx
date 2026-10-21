import { PRIVACY } from "@/content/legal";
import { LegalPage } from "@/components/site/legal-page";

export const metadata = { title: "Privacy Policy", description: "How Sales Scout handles personal information." };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Plain-language summary first, details below."
      summary={["We never sell personal information.", "Research uses public business sources only.", "Contact details are never guessed.", "One essential cookie. No ad tracking."]}
      sections={PRIVACY}
    />
  );
}
