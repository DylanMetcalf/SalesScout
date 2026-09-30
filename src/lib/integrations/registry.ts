/**
 * Integration registry. Providers are described here, once, and the rest of
 * the app talks to them through this abstraction — no provider-specific
 * logic is embedded elsewhere. Only authorised APIs and supported connection
 * methods are used; nothing here scrapes or automates third-party platforms.
 */
export type IntegrationCategory = "email" | "social" | "research" | "crm";

export type Provider = {
  key: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  /** What works today without connecting anything. */
  available: string | null;
  /** What connecting would add, and what it needs. */
  requires: string;
  /** Whether a full connection can be made in this installation. */
  connectable: (env: NodeJS.ProcessEnv) => boolean;
};

export const PROVIDERS: Provider[] = [
  {
    key: "gmail",
    name: "Gmail",
    category: "email",
    description: "Open reviewed drafts in Gmail to send from your own account.",
    available: "Draft hand-off: “Open in Gmail” works now, no connection needed.",
    requires: "Reading replies and logging sent mail needs Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).",
    connectable: (env) => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  },
  {
    key: "outlook",
    name: "Outlook",
    category: "email",
    description: "Open reviewed drafts in Outlook to send from your own account.",
    available: "Draft hand-off: “Open in Outlook” works now, no connection needed.",
    requires: "Reading replies and logging sent mail needs Microsoft Graph credentials (MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET).",
    connectable: (env) => Boolean(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET),
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    category: "social",
    description: "Company pages and personal profiles as sources for your Company Brain.",
    available: "Profiles can be saved as sources now.",
    requires: "Reading posts requires LinkedIn's authorised API access (partner program). Sales Scout does not scrape LinkedIn.",
    connectable: (env) => Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET),
  },
  {
    key: "meta",
    name: "Facebook & Instagram",
    category: "social",
    description: "Business pages you manage, as sources for your Company Brain.",
    available: "Profiles can be saved as sources now.",
    requires: "Reading posts requires a Meta app with Pages / Instagram Graph API permissions.",
    connectable: (env) => Boolean(env.META_APP_ID && env.META_APP_SECRET),
  },
  {
    key: "web_research",
    name: "Web research",
    category: "research",
    description: "Live web search and page reading used to discover and research prospects.",
    available: null,
    requires: "Needs ANTHROPIC_API_KEY on the server (uses Claude's web search and fetch tools).",
    connectable: (env) => Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN),
  },
  {
    key: "crm_export",
    name: "Other CRMs",
    category: "crm",
    description: "Move prospects into Salesforce, HubSpot or others.",
    available: "CSV and Excel exports work now and import cleanly into most CRMs.",
    requires: "Direct sync is planned for a future version.",
    connectable: () => false,
  },
];
