"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/error-state";
import { useToast } from "@/components/ui/toast";
import { JobProgress } from "@/components/ai/job-progress";
import { DocumentUploader, PagesInput, SocialInput, WebsiteInput, type SourceLite } from "@/components/company/source-inputs";
import { createCompanyAction } from "@/app/actions/workspace";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { analyseCompanyAction } from "@/app/actions/brain";
import { Prompt, StepDots } from "../steps";

export type WizardStep = "about" | "website" | "profiles" | "documents" | "analyse";
const ORDER: WizardStep[] = ["about", "website", "profiles", "documents", "analyse"];

const ANALYSIS_STEPS = [
  { key: "website", label: "Reading your website" },
  { key: "pages", label: "Looking at your services and pages" },
  { key: "documents", label: "Reading your documents" },
  { key: "profiles", label: "Checking your public profiles" },
  { key: "understand", label: "Understanding your business" },
  { key: "save", label: "Preparing your Company Brain" },
];

export function CompanyWizard(props: {
  step: WizardStep;
  companyName: string;
  website: string | null;
  pages: SourceLite[];
  profiles: SourceLite[];
  documents: SourceLite[];
  aiConnected: boolean;
  canEditKey: boolean;
}) {
  const nextHref = `/onboarding/company?step=${ORDER[ORDER.indexOf(props.step) + 1]}`;
  const idx = ORDER.indexOf(props.step) + 1;

  const Nav = ({ canSkip = true, label = "Continue" }: { canSkip?: boolean; label?: string }) => (
    <div className="mt-8 flex items-center gap-3">
      <ButtonLink href={nextHref} variant="primary" size="lg" icon={<ArrowRight className="size-4" />}>
        {label}
      </ButtonLink>
      {canSkip && (
        <ButtonLink href={nextHref} variant="ghost" size="lg">
          Skip for now
        </ButtonLink>
      )}
    </div>
  );

  return (
    <>
      <StepDots current={idx} />
      {props.step === "about" && <AboutStep />}
      {props.step === "website" && (
        <div className="animate-rise">
          <Prompt title={`Where can I learn about ${props.companyName || "you"}?`}>
            Your website is the best place to start. Add any pages that explain what you do — I&apos;ll read them.
          </Prompt>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">Website</p>
              <WebsiteInput current={props.website} />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">Specific pages <span className="font-normal text-subtle">Optional</span></p>
              <p className="text-xs text-subtle">About, services, products, case studies, portfolio, pricing — anything that shows what you do and for whom.</p>
              <PagesInput pages={props.pages} />
            </div>
          </div>
          <Nav />
        </div>
      )}
      {props.step === "profiles" && (
        <div className="animate-rise">
          <Prompt title="Connect your public profiles.">
            LinkedIn, Facebook, Instagram, X, YouTube, TikTok — add as many as you like, including personal profiles you sell from.
          </Prompt>
          <SocialInput profiles={props.profiles} />
          <Notice tone="info" className="mt-4" title="How we use these">
            We save each profile as a source. Reading posts requires an authorised connection to that platform — we don&apos;t scrape. Until it&apos;s connected, we&apos;ll show it as “Requires permission”.
          </Notice>
          <Nav />
        </div>
      )}
      {props.step === "documents" && (
        <div className="animate-rise">
          <Prompt title="Anything else that helps me understand you?">
            Brochures, case studies, proposals, product catalogues, price lists or presentations. They stay private to this company.
          </Prompt>
          <DocumentUploader documents={props.documents} />
          {!props.aiConnected && props.canEditKey && (
            <div className="mt-8 rounded-xl border border-border bg-surface p-5">
              <p className="font-semibold">Connect AI before I analyse <span className="font-normal text-subtle">(recommended)</span></p>
              <p className="mt-1 mb-4 text-sm text-muted">
                With an Anthropic API key I can properly understand your business, suggest markets and research real companies. Without one I&apos;ll only record what your sources say directly — you can add a key later in Settings.
              </p>
              <ApiKeyForm status={{ source: null, hint: null, updatedAt: null, serverKey: false, canEdit: true }} />
            </div>
          )}
          <Nav label="Analyse everything" canSkip={false} />
        </div>
      )}
      {props.step === "analyse" && <AnalyseStep />}
    </>
  );
}

function AboutStep() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="animate-rise">
      <Prompt title="Tell Sales Scout about your business.">
        What do you do, who do you do it for, and what makes you good at it? A few sentences is plenty — plain words are best.
      </Prompt>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await createCompanyAction({ name, description });
            if (!r.ok) setError(r.error);
          });
        }}
      >
        <Field label="Company name" error={error}>
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mea Creo" className="h-12 text-base" autoFocus />}
        </Field>
        <Field label="What does your business do?" optional hint="For example: “We design and build websites for engineering firms in South Africa. Most clients come to us for a complete rebrand.”">
          {(p) => <Textarea {...p} value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-32 text-base" />}
        </Field>
        <div>
          <Button type="submit" variant="primary" size="lg" loading={pending} disabled={!name.trim()} icon={<ArrowRight className="size-4" />}>
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}

function AnalyseStep() {
  const router = useRouter();
  const toast = useToast();
  const [jobId, setJobId] = useState<string | null>(null);
  const started = useRef(false);
  const start = async () => {
    const r = await analyseCompanyAction();
    if (!r.ok) toast({ kind: "error", title: "Couldn't start the analysis", body: r.error });
    else setJobId(r.data);
  };
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="animate-rise">
      <Prompt title="Give me a moment to read everything.">
        I&apos;m going through what you&apos;ve shared so I can explain your business back to you. This usually takes under a minute.
      </Prompt>
      {jobId ? (
        <JobProgress
          jobId={jobId}
          title="Understanding your business…"
          doneTitle="I've got a clearer picture of your business."
          initialSteps={ANALYSIS_STEPS}
          onDone={(job) => {
            if (job.status !== "failed") setTimeout(() => router.push("/onboarding/understand"), 700);
          }}
          failureActions={() => (
            <>
              <Button size="sm" onClick={() => { setJobId(null); start(); }}>Retry</Button>
              <Button size="sm" variant="ghost" onClick={() => router.push("/onboarding/company?step=website")}>Check my sources</Button>
              <Button size="sm" variant="ghost" onClick={() => router.push("/onboarding/understand")}>Continue anyway</Button>
            </>
          )}
        />
      ) : (
        <div className="h-64 animate-pulse-soft rounded-xl border border-border bg-surface" />
      )}
    </div>
  );
}
