import Link from "next/link";
import { peekResetToken } from "@/lib/services/password-reset";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  if (!token || !peekResetToken(token)) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">This link has expired</h1>
        <p className="mt-2 text-muted">Reset links work once, for 24 hours. Ask your administrator for a new one.</p>
        <Link href="/login" className="mt-6 inline-block font-medium text-accent-text hover:underline">Back to sign in</Link>
      </div>
    );
  }
  return <ResetForm token={token} />;
}
