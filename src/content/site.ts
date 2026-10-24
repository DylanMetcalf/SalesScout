import {
  CalendarCheck,
  ClipboardList,
  Compass,
  FileStack,
  Handshake,
  Inbox,
  Layers,
  LibraryBig,
  Lightbulb,
  type LucideIcon,
  MessageSquareText,
  MessagesSquare,
  Plug,
  ReceiptText,
  ScanSearch,
  ShieldCheck,
  Timer,
  Users,
  Wrench,
} from "lucide-react";

/**
 * Website copy. One job: help a business explain what isn't working and take
 * the next step. Nothing here claims results, clients or numbers we can't show.
 */

type Item = { icon: LucideIcon; title: string; text: string };
/** A problem category: the intake area it pre-selects, and a labelled example. */
export type Category = Item & { area: string; example: string };

export const SITE = {
  name: "Sales Scout",
  tagline: "Practical software, AI and automation for real business problems",
  operator: "Sales Scout is a Mea Creo service.",
  // Shown in the footer, booking page and legal pages.
  contactEmail: "salesscout@meacreo.co.za",
  cta: "Explore My Problem",

  nav: [
    { href: "/#how", label: "How it works" },
    { href: "/#solve", label: "What we solve" },
    { href: "/book", label: "Book a call" },
  ],

  hero: {
    eyebrow: "Sales Scout by Mea Creo",
    body: "Tell us what’s not working. We’ll explore the problem, identify a potential solution, and send you a private briefing showing what the next step could look like.",
    note: "No technical knowledge needed. Explain it in your own words.",
  },

  solve: [
    { icon: Timer, area: "Admin and finance", title: "Repetitive admin", text: "The same data typed again and again.", example: "Invoices retyped from email into the accounts system." },
    { icon: Inbox, area: "Sales and enquiries", title: "Missed enquiries", text: "Leads and follow-ups that slip through.", example: "WhatsApp, email and web enquiries with no single owner." },
    { icon: ReceiptText, area: "Quoting and documents", title: "Quotes and documents", text: "Slow, error-prone paperwork.", example: "Quotes built by hand from old copies in Word." },
    { icon: Plug, area: "Operations", title: "Disconnected systems", text: "Tools that don’t talk to each other.", example: "Orders in one system, stock in a spreadsheet." },
    { icon: ClipboardList, area: "Reporting", title: "Manual reporting", text: "Hours spent pulling numbers together.", example: "A weekly report rebuilt from five exports." },
    { icon: LibraryBig, area: "Team knowledge", title: "Hard-to-find knowledge", text: "Answers buried in files and inboxes.", example: "New staff asking the same questions every week." },
    { icon: Users, area: "Customer service", title: "Onboarding and service", text: "Customer journeys that depend on memory.", example: "Each new client set up from a checklist in someone’s head." },
    { icon: Lightbulb, area: "A new product idea", title: "A product idea", text: "Software you’d like to exist.", example: "A tool your industry keeps asking for." },
  ] as Category[],

  // Illustrative only (labelled "Example" on the page): how one problem becomes a route forward.
  routes: [
    {
      key: "enquiries",
      label: "Missed enquiries",
     
      said: "Enquiries come in on WhatsApp, email and the website, and some never get a reply.",
      steps: [
        { kind: "We’d ask", text: "Where does each enquiry land, and who is meant to answer it?" },
        { kind: "We’d explore", text: "One shared inbox that routes, reminds and records every reply." },
        { kind: "You’d get", text: "A short, practical plan, starting with the smallest useful fix." },
      ],
    },
    {
      key: "quotes",
      label: "Slow quotes",
     
      said: "Every quote is rebuilt by hand from an old one, so they’re slow and full of small mistakes.",
      steps: [
        { kind: "We’d ask", text: "What changes from one quote to the next, and what never does?" },
        { kind: "We’d explore", text: "A quote builder that fills in prices and terms from what you already have." },
        { kind: "You’d get", text: "A clear view of what to automate first, and what to leave alone." },
      ],
    },
    {
      key: "admin",
      label: "Retyping data",
     
      said: "We type the same order details into three systems, and things get missed when we’re busy.",
      steps: [
        { kind: "We’d ask", text: "Which system should be the source of truth, and who touches each one?" },
        { kind: "We’d explore", text: "Connecting the systems so an order is entered once and flows on." },
        { kind: "You’d get", text: "A practical way forward that fits the tools you already use." },
      ],
    },
    {
      key: "reporting",
      label: "Manual reports",
     
      said: "Every Monday someone spends the morning pulling numbers into a report nobody fully trusts.",
      steps: [
        { kind: "We’d ask", text: "Which decisions does the report actually inform?" },
        { kind: "We’d explore", text: "A live summary built straight from the source data." },
        { kind: "You’d get", text: "A clear picture of the effort, risks and what’s worth doing first." },
      ],
    },
  ] as { key: string; label: string; said: string; steps: { kind: string; text: string }[] }[],

  steps: [
    { icon: MessageSquareText, title: "Tell us what’s not working", text: "Describe the problem in your own words. About five minutes, no technical knowledge needed." },
    { icon: ScanSearch, title: "Get your briefing", text: "We analyse it and prepare a private Business Problem & Solution Briefing: our read of the problem and a direction worth exploring." },
    { icon: Handshake, title: "Let’s Discuss Your Solution", text: "A short conversation to check our understanding, clarify what you need and work out how to take it forward." },
  ] as Item[],

  approach: [
    { icon: Compass, title: "Check our understanding", text: "A briefing is built only from what you wrote. Talking it through corrects anything we’ve misread." },
    { icon: ShieldCheck, title: "Clarify what you really need", text: "The details that decide the right solution only come out in conversation: volumes, tools, people, exceptions." },
    { icon: Layers, title: "Size it sensibly", text: "Start with the smallest useful step, see it working, then extend. No big-bang projects." },
    { icon: Wrench, title: "Straight answers", text: "If software isn’t the answer, or it isn’t worth it yet, we’ll tell you." },
  ] as Item[],

  bookingSteps: [
    { icon: CalendarCheck, title: "Pick a time", text: "30 minutes, online." },
    { icon: MessagesSquare, title: "Talk it through", text: "What’s happening and what you’d like instead." },
    { icon: FileStack, title: "Next steps", text: "If we can help, we’ll suggest how." },
  ] as Item[],
};
