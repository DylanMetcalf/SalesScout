import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  if (await getSessionUser()) redirect("/home");
  const { invite } = await searchParams;
  const inviteOnly = process.env.ALLOW_SIGNUPS === "false";
  return <AuthForm mode="signup" invite={{ required: inviteOnly, code: invite ?? "" }} />;
}
