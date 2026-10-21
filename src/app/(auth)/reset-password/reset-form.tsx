"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import { resetPassword, type AuthState } from "@/app/actions/auth";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(resetPassword, undefined);
  return (
    <div>
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <p className="mt-2 text-muted">You&apos;ll be signed in straight away, and signed out everywhere else.</p>
      <form action={action} className="mt-8 flex flex-col gap-4">
        {state?.error && <ErrorState title={state.error} />}
        <input type="hidden" name="token" value={token} />
        <Field label="New password" hint="At least 8 characters.">
          {(p) => <Input {...p} name="password" type="password" autoComplete="new-password" required minLength={8} />}
        </Field>
        <Button type="submit" variant="primary" size="lg" loading={pending} className="mt-2 w-full">Save and sign in</Button>
      </form>
    </div>
  );
}
