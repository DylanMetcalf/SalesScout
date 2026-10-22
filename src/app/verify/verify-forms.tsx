"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useAction } from "@/components/prospects/shared";
import { checkEmailCodeAction, checkPhoneCodeAction, sendEmailCodeAction, sendPhoneCodeAction } from "@/app/actions/verify";

function Done({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-strong/25 bg-strong-soft/50 px-4 py-3 text-sm">
      <CircleCheck className="size-4 text-strong" aria-hidden /> {label}
    </p>
  );
}

export function VerifyForms({ email, emailDone, phoneDone, needEmail, needPhone }: { email: string; emailDone: boolean; phoneDone: boolean; needEmail: boolean; needPhone: boolean }) {
  const router = useRouter();
  const send = useAction();
  const check = useAction();
  const [sent, setSent] = useState<"email" | "phone" | null>(null);
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");

  const allDone = (!needEmail || emailDone) && (!needPhone || phoneDone);
  if (allDone) {
    return (
      <div className="flex flex-col gap-4">
        <Done label="Your account is verified." />
        <ButtonLink href="/home" variant="primary">Continue</ButtonLink>
      </div>
    );
  }

  const codeForm = (channel: "email" | "phone") => (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        check.run(() => (channel === "email" ? checkEmailCodeAction(code) : checkPhoneCodeAction(code)), {
          success: "Verified",
          then: () => {
            setSent(null);
            setCode("");
            router.refresh();
          },
        });
      }}
    >
      <Field label="6-digit code">{(p) => <Input {...p} value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={8} className="font-mono text-lg tracking-widest" required />}</Field>
      <Button type="submit" variant="primary" loading={check.pending}>Verify</Button>
    </form>
  );

  return (
    <div className="flex flex-col gap-6">
      {needEmail &&
        (emailDone ? (
          <Done label={`Email verified: ${email}`} />
        ) : (
          <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
            <h2 className="text-base font-semibold">1. Your email</h2>
            {sent === "email" ? (
              <>
                <p className="text-sm text-muted">We sent a code to {email}. It expires in 15 minutes.</p>
                {codeForm("email")}
              </>
            ) : (
              <Button loading={send.pending} onClick={() => send.run(() => sendEmailCodeAction(), { refresh: false, then: () => setSent("email") })}>
                Email me a code
              </Button>
            )}
          </section>
        ))}
      {needPhone &&
        (phoneDone ? (
          <Done label="Phone verified" />
        ) : (
          <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
            <h2 className="text-base font-semibold">{needEmail ? "2. " : ""}Your mobile number</h2>
            {sent === "phone" ? (
              <>
                <p className="text-sm text-muted">We sent an SMS code. It expires in 10 minutes.</p>
                {codeForm("phone")}
              </>
            ) : (
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  send.run(() => sendPhoneCodeAction(phone), { refresh: false, then: () => setSent("phone") });
                }}
              >
                <Field label="Mobile number" hint="e.g. 082 123 4567 or +27 82 123 4567">{(p) => <Input {...p} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required />}</Field>
                <Button type="submit" loading={send.pending}>Text me a code</Button>
              </form>
            )}
          </section>
        ))}
    </div>
  );
}
