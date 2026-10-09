import { getSessionUser } from "@/lib/auth/session";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { PaletteDock } from "@/components/ui/palette-picker";

/** Public website: explains the done-for-you service. Clients don't need the portal to benefit. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const signedIn = Boolean(await getSessionUser());
  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader signedIn={signedIn} />
      <main>{children}</main>
      <SiteFooter signedIn={signedIn} />
      {signedIn && <PaletteDock />}
    </div>
  );
}
