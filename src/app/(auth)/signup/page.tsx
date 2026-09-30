import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Create account" };

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/home");
  if (process.env.ALLOW_SIGNUPS === "false") {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Sign-ups are closed</h1>
        <p className="mt-2 text-muted">This Sales Scout installation is private. If you should have access, ask its owner.</p>
        <a href="/login" className="mt-6 inline-block font-medium text-accent-text hover:underline">Sign in instead</a>
      </div>
    );
  }
  return <AuthForm mode="signup" />;
}
