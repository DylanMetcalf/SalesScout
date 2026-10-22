/**
 * Contact verification is recorded per field, with the method and time of each
 * check. These are distinct, and never collapsed into one "verified" badge:
 *  - source:   the value appears on a cited public page (we don't guess values)
 *  - domain:   the email's domain is set up to receive mail (MX record) — this does
 *              NOT prove the mailbox exists or that the person owns it
 *  - mailbox:  a mailbox-verification provider said the address accepts mail
 *  - role:     the person's title/company is stated on a cited source
 */
export type CheckStatus = "pass" | "fail" | "inconclusive";
export type Check = { status: CheckStatus; method: "source" | "domain" | "mailbox" | "role"; at: number; detail?: string };
export type ContactChecks = { email?: Check[]; phone?: Check[]; role?: Check[] };

export type FieldState = { label: string; tone: "strong" | "accent" | "moderate" | "neutral"; detail: string };

/** One honest label per field, from the strongest evidence available. */
export function emailState(checks: ContactChecks | null | undefined, hasEmail: boolean): FieldState | null {
  if (!hasEmail) return null;
  const c = checks?.email ?? [];
  const mailbox = c.find((x) => x.method === "mailbox");
  const source = c.some((x) => x.method === "source" && x.status === "pass");
  const domain = c.find((x) => x.method === "domain");
  if (mailbox?.status === "pass") return { label: "Mailbox verified", tone: "strong", detail: "A verification service confirmed this address accepts mail." };
  if (domain?.status === "fail") return { label: "Domain doesn't accept mail", tone: "moderate", detail: "The email's domain has no mail server. Check before using." };
  if (source && domain?.status === "pass") return { label: "Published · domain accepts mail", tone: "accent", detail: "Found on a cited public page, and the domain is set up for email. The mailbox itself hasn't been verified." };
  if (source) return { label: "Published on source", tone: "accent", detail: "Found on a cited public page. Not otherwise verified." };
  return { label: "Not verified", tone: "neutral", detail: "No evidence recorded for this address." };
}

export function phoneState(checks: ContactChecks | null | undefined, hasPhone: boolean): FieldState | null {
  if (!hasPhone) return null;
  return checks?.phone?.some((x) => x.method === "source" && x.status === "pass")
    ? { label: "Published on source", tone: "accent", detail: "Found on a cited public page. Not otherwise verified." }
    : { label: "Not verified", tone: "neutral", detail: "No evidence recorded for this number." };
}

export function roleState(checks: ContactChecks | null | undefined, sourced: boolean): FieldState {
  return sourced || checks?.role?.some((x) => x.status === "pass")
    ? { label: "Source confirmed", tone: "strong", detail: "Name and role are stated on a cited source." }
    : { label: "Role to find", tone: "neutral", detail: "A role worth finding; no named person confirmed yet." };
}
