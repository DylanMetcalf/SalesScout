import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { Logo } from "@/components/ui/logo";
import { logout } from "@/app/actions/auth";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  if (!(await getSessionUser())) redirect("/login");
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Logo />
        <form action={logout}>
          <button className="text-sm text-muted hover:text-text">Sign out</button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-2xl px-5 pt-6 pb-20 sm:pt-12">{children}</main>
    </div>
  );
}
