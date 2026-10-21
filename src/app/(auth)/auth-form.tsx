"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import { login, signup, type AuthState } from "@/app/actions/auth";

export function AuthForm({ mode, invite }: { mode: "login" | "signup"; invite?: { required: boolean; code: string } }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, undefined);
  const f = state?.fields ?? {};
  return (
    <div className="animate-rise">
      <h1 className="text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1.5 text-muted">
        {mode === "login" ? "Sign in to pick up where you left off." : invite?.required ? "Sales Scout is invite-only for now. Enter the code you were given." : "It takes a minute. No credit card, no configuration."}
      </p>
      <form action={action} className="mt-8 flex flex-col gap-4" noValidate>
        {state?.error && <ErrorState title={state.error} />}
        {mode === "signup" && (
          <Field label="Your name">{(p) => <Input {...p} name="name" autoComplete="name" defaultValue={f.name} required />}</Field>
        )}
        <Field label="Work email">{(p) => <Input {...p} name="email" type="email" autoComplete="email" defaultValue={f.email} required />}</Field>
        <Field label="Password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
          {(p) => <Input {...p} name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} />}
        </Field>
        {mode === "signup" && (invite?.required || invite?.code || f.invite) && (
          <Field label="Invite code">{(p) => <Input {...p} name="invite" autoComplete="off" spellCheck={false} defaultValue={f.invite ?? invite?.code} placeholder="ABCDE-FGHJK" className="font-mono uppercase" required={invite?.required} />}</Field>
        )}
        <Button type="submit" variant="primary" size="lg" loading={pending} className="mt-2 w-full">
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
        {mode === "signup" && (
          <p className="text-xs text-subtle">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="underline hover:text-accent-text">Terms</Link> and{" "}
            <Link href="/privacy" className="underline hover:text-accent-text">Privacy Policy</Link>.
          </p>
        )}
      </form>
      <p className="mt-6 text-sm text-muted">
        {mode === "login" ? (
          <>
            New to Sales Scout?{" "}
            <Link href="/signup" className="font-medium text-accent-text hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent-text hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
