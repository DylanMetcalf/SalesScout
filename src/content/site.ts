import {
  Ban,
  BookOpenCheck,
  Building2,
  ClipboardCheck,
  Compass,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  Gauge,
  HelpCircle,
  Inbox,
  Layers,
  Link2,
  Lock,
  type LucideIcon,
  MailX,
  MessageSquareText,
  PhoneCall,
  Repeat2,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  UserCheck,
  UserRound,
  Users,
  Waypoints,
} from "lucide-react";

/**
 * Marketing-site copy. Short on purpose: icons and diagrams carry the idea,
 * words confirm it. Nothing here claims results we can't show (no invented
 * stats or quotes). Edit freely; layouts never need touching.
 */

type Item = { icon: LucideIcon; title: string; text: string };

export const SITE = {
  name: "Sales Scout",
  tagline: "AI sales intelligence, done for you",
  // Shown in the footer, contact page and legal pages.
  contactEmail: "salesscout@meacreo.co.za",

  nav: [
    { href: "/platform", label: "Platform" },
    { href: "/why-us", label: "Why Sales Scout" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/services", label: "Pricing" },
    { href: "/contact", label: "Contact" },
  ],

  hero: {
    eyebrow: "AI sales-intelligence platform",
    title: "Find the companies that need what you sell.",
    body: "Researched, vetted and explained. Delivered as a shortlist you can act on today.",
    proof: [
      { icon: Link2, label: "Every fact sourced" },
      { icon: Ban, label: "Nothing invented" },
      { icon: Send, label: "You stay in control" },
    ],
  },

  // What sellers are struggling with. Deliberately no invented statistics.
  problems: [
    { icon: Layers, title: "Lists without reasons", text: "Thousands of names. No idea who needs you.", answer: "Every company comes with a specific reason to talk." },
    { icon: Timer, title: "Research eats the day", text: "Hours of digging before one good call.", answer: "We do the digging. You get a one-minute brief." },
    { icon: MailX, title: "Generic outreach ignored", text: "Buyers delete messages that don't get them.", answer: "Drafts grounded in something real about them." },
    { icon: Fingerprint, title: "Guessed data backfires", text: "Bounced emails, wrong people, burnt domains.", answer: "Contacts only when published. Gaps marked unknown." },
    { icon: Sparkles, title: "AI that makes things up", text: "Confident, polished and often wrong.", answer: "Every claim links to its source. People review it." },
    { icon: Users, title: "No team to do it", text: "Researchers and SDRs are slow and costly to hire.", answer: "A research team's output, without the hiring." },
  ],

  // The four questions every lead answers.
  questions: [
    { icon: Building2, q: "Who?", a: "A real company that fits" },
    { icon: Target, q: "Why?", a: "The reason, with evidence" },
    { icon: UserRound, q: "Who inside?", a: "The buyer, named where public" },
    { icon: MessageSquareText, q: "What next?", a: "A brief and a first message" },
  ] as { icon: LucideIcon; q: string; a: string }[],

  // The process as a five-node flow.
  flow: [
    { icon: PhoneCall, title: "Discovery", text: "We learn your business" },
    { icon: Compass, title: "Market map", text: "We agree where to look" },
    { icon: Search, title: "Research", text: "The platform searches" },
    { icon: ClipboardCheck, title: "Vetting", text: "Every company checked" },
    { icon: Inbox, title: "Shortlist", text: "Briefed, ready to act" },
  ] as Item[],

  detailedSteps: [
    { icon: PhoneCall, title: "Discovery call", you: "Tell us what you sell and who buys it", we: "Define your ideal customer with you", get: "A shared target profile" },
    { icon: Compass, title: "Market map", you: "Share your website and case studies", we: "Build your Company Brain, suggest markets", get: "Markets to approve or reject" },
    { icon: Search, title: "Research & vetting", you: "Nothing. This part is on us", we: "Search, de-duplicate, check fit and evidence", get: "Only companies that passed" },
    { icon: UserCheck, title: "People & approach", you: "Nothing yet", we: "Find buyer roles and draft the approach", get: "Who to speak to, and what to say" },
    { icon: Inbox, title: "Briefed shortlist", you: "Keep, reject, tell us what missed", we: "Deliver, then learn from your feedback", get: "Conversations worth having" },
  ],

  // Every lead includes.
  anatomy: [
    { icon: Building2, title: "Company profile", text: "What they do, where, how big" },
    { icon: Target, title: "Why they matter", text: "The overlap with what you solve" },
    { icon: Gauge, title: "Fit on 6 dimensions", text: "Each rated, each explained" },
    { icon: UserRound, title: "Who to speak to", text: "Roles, and names where public" },
    { icon: HelpCircle, title: "What's unknown", text: "Gaps stated, never filled" },
    { icon: Link2, title: "Sources", text: "A link behind every fact" },
    { icon: FileText, title: "One-minute brief", text: "Everything before the call" },
    { icon: Send, title: "Outreach draft", text: "In your voice, sent by you" },
  ] as Item[],

  deliverables: [
    { icon: ClipboardCheck, title: "Briefed shortlist", text: "Ranked by fit" },
    { icon: Gauge, title: "Fit evidence", text: "Six dimensions, sourced" },
    { icon: UserRound, title: "Buyer contacts", text: "Only when published" },
    { icon: FileText, title: "Sales briefs", text: "One page per company" },
    { icon: MessageSquareText, title: "Outreach drafts", text: "Email and LinkedIn" },
    { icon: FileSpreadsheet, title: "CRM export", text: "Excel, CSV, report" },
  ] as Item[],

  principles: [
    { icon: Ban, title: "Nothing invented", text: "No guessed companies, people or emails." },
    { icon: Link2, title: "Evidence shown", text: "Check every lead's sources yourself." },
    { icon: Send, title: "You send", text: "We draft. You decide what goes out." },
    { icon: Lock, title: "Your data, separate", text: "Never shared with another client." },
  ] as Item[],

  // How the common options compare. "Typically" — a fair generalisation, not a claim about any one provider.
  comparison: {
    columns: ["Lead lists", "SDR agencies", "DIY AI tools", "Sales Scout"],
    rows: [
      { label: "Starts from what you sell", values: ["no", "partly", "partly", "yes"] },
      { label: "Explains why each company fits", values: ["no", "rarely", "sometimes", "yes"] },
      { label: "Sources behind every lead", values: ["no", "rarely", "rarely", "yes"] },
      { label: "Never guesses contact details", values: ["no", "varies", "no", "yes"] },
      { label: "You control what's sent", values: ["yes", "no", "varies", "yes"] },
      { label: "Learns from your feedback", values: ["no", "partly", "rarely", "yes"] },
      { label: "Brief, people and draft included", values: ["no", "partly", "partly", "yes"] },
    ],
    note: "What each approach typically offers. Individual providers vary.",
  },

  differences: [
    { icon: Waypoints, title: "Company first", text: "Find companies that need you, then the people inside." },
    { icon: Scale, title: "Explained, not scored", text: "Six reasons you can read, not a number to trust." },
    { icon: ShieldCheck, title: "Evidence or it doesn't ship", text: "No source, no lead." },
    { icon: Repeat2, title: "Sharper every round", text: "Your feedback steers the next search." },
  ] as Item[],

  whyUs: [
    { icon: Layers, title: "Our own platform", text: "Built in-house for this job. Not a resold database." },
    { icon: BookOpenCheck, title: "Human-reviewed", text: "A person checks every shortlist before you see it." },
    { icon: Building2, title: "Made for B2B", text: "Service firms, suppliers, manufacturers, consultants." },
    { icon: ShieldCheck, title: "Reputation-safe", text: "Nothing sent in your name. Nothing guessed." },
  ] as Item[],

  // Leads per month. A "qualified lead" is defined on the pricing page.
  packages: [
    {
      name: "Scout",
      leads: "10–20",
      summary: "Test a market, prove the fit.",
      items: ["1 target market", "Fit evidence and sources", "Buyer roles and public contacts", "One-minute briefs", "Excel / CSV export"],
      featured: false,
    },
    {
      name: "Growth",
      leads: "20–30",
      summary: "A steady pipeline, every month.",
      items: ["Up to 2 target markets", "Everything in Scout", "Outreach drafts for every lead", "Monthly review call", "Client workspace access"],
      featured: true,
    },
    {
      name: "Scale",
      leads: "40–50",
      summary: "Research that keeps pace with a sales team.",
      items: ["Up to 4 target markets", "Everything in Growth", "Priority deep research", "CRM handover in your format", "Fortnightly delivery"],
      featured: false,
    },
  ],
  qualifiedLead: [
    { icon: Building2, text: "A real, verified company" },
    { icon: Target, text: "A clear reason it fits" },
    { icon: UserRound, text: "Who to speak to" },
    { icon: FileText, text: "A brief and a draft" },
  ] as { icon: LucideIcon; text: string }[],
  packagesNote: "Fixed monthly quote after a short discovery call. If your market is too small for a tier, we'll say so rather than pad the list.",

  goodFit: ["You sell to other businesses", "You can describe who you help", "You want fewer, better conversations", "Someone will follow up"],
  notFit: ["Selling to consumers", "Mass email or bought lists", "Automated sending in your name"],

  faqs: [
    { q: "Do I need to learn new software?", a: "No. We run the platform and deliver the results. A client workspace is included from Growth up." },
    { q: "Where do the leads come from?", a: "Public sources: company websites, directories, news and published team pages. Every lead lists its sources." },
    { q: "Do you guarantee meetings?", a: "No one honestly can. We guarantee every company is real, relevant and backed by evidence." },
    { q: "Will you contact prospects for us?", a: "No. We draft; you review and send from your own inbox." },
    { q: "What counts as a lead?", a: "A verified company with a clear reason it fits, who to speak to, and a brief. Not a row in a spreadsheet." },
    { q: "How quickly do we start?", a: "We agree a start date on the discovery call, based on your market and volume." },
  ],

  contactNext: [
    { icon: Inbox, title: "We read your message", text: "And look at your business first." },
    { icon: PhoneCall, title: "30-minute discovery call", text: "What you sell, who buys it." },
    { icon: FileText, title: "A fixed quote", text: "Scope, volume, timing. No obligation." },
  ] as Item[],
};
