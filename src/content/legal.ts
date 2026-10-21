import { SITE } from "./site";

/**
 * DRAFT legal pages, written in plain language for review by a qualified lawyer
 * before being relied on. Fill in the business details below; any left empty
 * are simply left out of the pages (never shown as placeholders).
 */
export const LEGAL = {
  lastUpdated: "21 October 2026",
  /** Registered legal name of the business, e.g. "Sales Scout (Pty) Ltd". */
  entity: "",
  /** Company registration number, if any. */
  registration: "",
  /** Registered or postal address. */
  address: "",
  /** POPIA Information Officer (South Africa), if different from the general contact. */
  informationOfficer: "",
  email: SITE.contactEmail,
  /** Where the platform's data is hosted. Matches `region` in render.yaml. */
  hostingRegion: "the European Union (Frankfurt, Germany)",
  /** Confirm with your lawyer. */
  governingLaw: "the Republic of South Africa",
};

const who = LEGAL.entity ? `${LEGAL.entity} ("Sales Scout", "we", "us")` : `Sales Scout ("we", "us")`;

export type LegalSection = { id: string; title: string; body: (string | string[])[] };

export const PRIVACY: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: [
      `This policy explains how ${who} handles personal information when you visit our website, use the Sales Scout platform, or receive our done-for-you research service.`,
      "We aim to follow the Protection of Personal Information Act (POPIA) in South Africa and, where it applies, the EU and UK General Data Protection Regulation (GDPR).",
    ],
  },
  {
    id: "collect",
    title: "What we collect",
    body: [
      [
        "Enquiries: your name, email, company, website and message when you contact us.",
        "Accounts: your name, email and a password (stored only as a one-way scrypt hash).",
        "Workspace content: information you add about your business, uploaded documents, notes, pipeline activity, outreach drafts and feedback.",
        "Security and usage data: a session cookie, IP address (for rate limiting and abuse prevention), server logs, and records of AI requests (task type, size and timing, not their content).",
        "Business research data: publicly available information about companies and the professionals who work at them (see below).",
      ],
    ],
  },
  {
    id: "research",
    title: "Research about businesses and professionals",
    body: [
      "To find prospects, we research companies using publicly available sources such as company websites, published team pages, directories and news. This can include a professional's name, job title and business contact details where the business itself has published them.",
      [
        "We record the source of every fact so it can be checked.",
        "We never guess or generate contact details. If it isn't published, it stays blank.",
        "We don't scrape platforms whose terms forbid it.",
        "We use this information only to assess business relevance for our clients, never for consumer marketing.",
      ],
      "If you are a professional whose details appear in our research and you'd like them corrected or removed, or you object to this processing, email us and we'll act on it promptly.",
      "Our clients decide whether and how to contact the businesses we identify. They are responsible for complying with direct-marketing laws, such as section 69 of POPIA and applicable electronic-marketing rules. We never send messages on anyone's behalf.",
    ],
  },
  {
    id: "use",
    title: "How we use information",
    body: [
      [
        "To provide the platform and our research service, including AI-assisted analysis.",
        "To respond to enquiries and manage our client relationships.",
        "To keep accounts secure, prevent abuse and fix problems.",
        "To improve your results using your own feedback. Your data is never used to serve another client.",
        "To meet legal, tax and accounting obligations.",
      ],
      "We rely on: performing our contract with you; our legitimate interests in running and securing the service and in business-to-business research of publicly available information; your consent where the law requires it; and legal obligations.",
    ],
  },
  {
    id: "ai",
    title: "AI processing",
    body: [
      "Sales Scout uses Anthropic's Claude models, through Anthropic's commercial API, to analyse information and draft content. Relevant workspace content and public web pages are sent to Anthropic to process each request.",
      "Anthropic's commercial terms state that API inputs and outputs are not used to train its models by default. If you connect your own Anthropic API key, requests made with it are also governed by your own agreement with Anthropic.",
      "AI output is labelled as confirmed, inferred, suggested or unknown, and every fact links to its source, so a person can check it before relying on it.",
    ],
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: [
      "We don't sell personal information. We share it only with service providers who help us run Sales Scout, under contracts that require them to protect it:",
      [`Render: application hosting and storage, in ${LEGAL.hostingRegion}.`, "Anthropic: AI processing and web research."],
      "We may also disclose information where the law requires it, or to protect our rights, our clients or the public.",
    ],
  },
  {
    id: "transfers",
    title: "International transfers",
    body: [
      "Our providers may process information outside your country, including in the United States and the European Union. Where this happens we rely on appropriate safeguards, such as contractual protections, as required by POPIA and the GDPR.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    body: [
      "We use one essential cookie to keep you signed in. It is HTTP-only, sent over HTTPS, and expires after 30 days. We don't use advertising or third-party analytics cookies.",
    ],
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: [
      [
        "Account and workspace data: while your account is active, then deleted within 90 days of closure unless the law requires us to keep it longer.",
        "Enquiries: up to 24 months after our last contact.",
        "Security logs: as long as needed to protect the service, normally no more than 12 months.",
      ],
    ],
  },
  {
    id: "security",
    title: "Security",
    body: [
      "Data is encrypted in transit (HTTPS). Passwords are stored as one-way hashes. API keys are encrypted at rest and never sent to the browser. Each client's data is kept separate, enforced both in the application and in the database. No system is perfectly secure; if a breach affects you, we will notify you and the relevant regulator as the law requires.",
    ],
  },
  {
    id: "rights",
    title: "Your rights",
    body: [
      "You can ask to access, correct or delete your personal information, object to or restrict its processing, or receive a copy in a portable format. You can withdraw consent at any time where we rely on it.",
      "Email us to make a request. We'll respond within the time the law allows. You can also complain to the Information Regulator (South Africa) or, in the EU/UK, your local data-protection authority.",
    ],
  },
  {
    id: "children",
    title: "Children",
    body: ["Sales Scout is a business service and isn't intended for anyone under 18."],
  },
  {
    id: "changes",
    title: "Changes",
    body: ["We'll update this page when our practices change and show the date of the latest version at the top. Significant changes will be communicated to account holders."],
  },
];

export const TERMS: LegalSection[] = [
  {
    id: "agreement",
    title: "The agreement",
    body: [
      `These terms apply to your use of the Sales Scout website and platform and to our research services, provided by ${who}. By creating an account or using the service you agree to them. If you use Sales Scout for an organisation, you confirm you may accept these terms on its behalf.`,
      "A signed proposal or order for done-for-you research (covering scope, volume, fees and timing) forms part of this agreement. If it conflicts with these terms, the proposal wins for that engagement.",
    ],
  },
  {
    id: "service",
    title: "The service",
    body: [
      "Sales Scout researches and qualifies businesses that may need what you sell. It identifies relevant roles and published contacts, explains its reasoning with sources, and drafts outreach for you to review.",
      "We may improve or change features over time. We'll give reasonable notice of changes that materially reduce what you've paid for.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts",
    body: [
      [
        "Keep your login details secure, and tell us promptly about any unauthorised use.",
        "Provide accurate information and keep it up to date.",
        "Access may be by invitation. Administrators may set how much AI usage is included with an account.",
      ],
    ],
  },
  {
    id: "use",
    title: "Acceptable use",
    body: [
      "You agree not to:",
      [
        "Break any law, including data-protection, anti-spam and direct-marketing laws, when acting on research from Sales Scout.",
        "Use Sales Scout for consumer marketing, harassment or discrimination.",
        "Upload content you don't have the right to use.",
        "Try to access other clients' data, bypass security or usage limits, or overload the service.",
        "Scrape, resell or reverse-engineer the platform.",
      ],
    ],
  },
  {
    id: "outreach",
    title: "Outreach is yours",
    body: [
      "Sales Scout never contacts anyone on your behalf. You decide whether, how and when to contact a business, and you are responsible for the messages you send and for complying with the laws that apply to them.",
    ],
  },
  {
    id: "research",
    title: "Research and AI output",
    body: [
      "Research is drawn from public sources and AI analysis. It is labelled to show what is confirmed, inferred, suggested or unknown, and every fact links to its source. Public information can be incomplete or out of date, so please check anything important before relying on it.",
      "We don't guarantee meetings, sales or other commercial results. For done-for-you work, our commitment is that every lead we deliver is a real company, assessed for relevance, with the evidence shown.",
    ],
  },
  {
    id: "data",
    title: "Your data",
    body: [
      "You own the information you add and the research delivered to you. You give us permission to process it only to provide and improve the service for you, as described in our Privacy Policy. We don't use one client's data to serve another.",
      "You can export your data at any time in standard formats.",
    ],
  },
  {
    id: "third",
    title: "Third-party services",
    body: [
      "Sales Scout relies on providers such as Anthropic (AI) and Render (hosting). If you connect your own Anthropic API key, Anthropic bills you directly for that usage under your own agreement with it.",
    ],
  },
  {
    id: "fees",
    title: "Fees",
    body: [
      "Fees for research services and platform access are set out in your proposal or order. Unless it says otherwise, invoices are due within 14 days, and fees exclude applicable taxes. We may suspend the service for invoices that are significantly overdue, after giving notice.",
    ],
  },
  {
    id: "ip",
    title: "Our platform",
    body: ["We own the Sales Scout platform, software, design and brand. These terms give you a right to use it, not ownership of it."],
  },
  {
    id: "confidentiality",
    title: "Confidentiality",
    body: ["Each of us will keep the other's non-public business information confidential and use it only for this agreement, except where disclosure is required by law."],
  },
  {
    id: "liability",
    title: "Liability",
    body: [
      "The service is provided with reasonable skill and care. Beyond that, and to the extent the law allows, it is provided without other warranties.",
      "Neither of us is liable for indirect or consequential loss, or for lost profits or opportunities. Our total liability under this agreement is limited to the fees you paid us in the 12 months before the claim. Nothing in these terms limits liability that cannot legally be limited.",
    ],
  },
  {
    id: "ending",
    title: "Ending the agreement",
    body: [
      "You can close your account at any time by emailing us. Either of us may end the agreement for a serious breach that isn't fixed within 14 days of notice. We may suspend access immediately if needed to protect the service or other clients. Fixed-term engagements end as set out in your proposal.",
      "After closure, you can request an export of your data for 30 days, after which we delete it as described in our Privacy Policy.",
    ],
  },
  {
    id: "law",
    title: "Governing law",
    body: [`These terms are governed by the laws of ${LEGAL.governingLaw}. Disputes will be dealt with by the courts of that jurisdiction, unless the law where you are based gives you other rights.`],
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: ["We may update these terms. We'll show the date of the latest version and give account holders at least 30 days' notice of material changes."],
  },
];
