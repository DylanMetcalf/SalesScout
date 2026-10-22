import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { verificationPolicy } from "@/lib/billing/eligibility";
import { phoneVerificationAvailable } from "@/lib/services/verify";
import { Logo } from "@/components/ui/logo";
import { VerifyForms } from "./verify-forms";

export const metadata = { title: "Verify your account" };

export default async function Verify() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const policy = verificationPolicy();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Logo />
      <div>
        <h1 className="text-2xl">Verify your account</h1>
        <p className="mt-2 text-muted">
          This keeps free allowances fair and your account secure. We use your number only to send this code, and never for marketing.
        </p>
      </div>
      <VerifyForms
        email={user.email}
        emailDone={Boolean(user.emailVerifiedAt)}
        phoneDone={Boolean(user.phoneVerifiedAt)}
        needEmail={policy.email}
        needPhone={policy.phone && phoneVerificationAvailable()}
      />
    </main>
  );
}
