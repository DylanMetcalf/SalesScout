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

export const SITE = {
  name: "Sales Scout",
  tagline: "Practical software, AI and automation for real business problems",
  operator: "Sales Scout is a Mea Creo service.",
  // Shown in the footer, booking page and legal pages.
  contactEmail: "salesscout@meacreo.co.za",
  cta: "Tell us your problem",

  nav: [
    { href: "/#how", label: "How it works" },
    { href: "/#solve", label: "What we solve" },
    { href: "/book", label: "Book a call" },
  ],

  hero: {
    eyebrow: "Sales Scout by Mea Creo",
    title: "Tell us what’s slowing your business down.",
    body: "We’ll help you understand the problem, explore what could work better, and find a practical way forward. Software, AI or automation, only where it genuinely helps.",
    note: "No technical knowledge needed. Explain it in your own words.",
  },

  // Example only, clearly labelled on the page: shows the shape of the conversation, not a result.
  example: {
    said: "Every quote gets retyped into three different systems, and follow-ups slip through the cracks when we’re busy.",
    explore: ["Where the retyping actually happens", "What a missed follow-up costs you", "Which parts could run on their own"],
  },

  solve: [
    { icon: Timer, title: "Repetitive admin", text: "The same data typed again and again." },
    { icon: Inbox, title: "Missed enquiries", text: "Leads and follow-ups that slip through." },
    { icon: ReceiptText, title: "Quotes and documents", text: "Slow, error-prone paperwork." },
    { icon: Plug, title: "Disconnected systems", text: "Tools that don’t talk to each other." },
    { icon: ClipboardList, title: "Manual reporting", text: "Hours spent pulling numbers together." },
    { icon: LibraryBig, title: "Hard-to-find knowledge", text: "Answers buried in files and inboxes." },
    { icon: Users, title: "Onboarding and service", text: "Customer journeys that depend on memory." },
    { icon: Lightbulb, title: "A product idea", text: "Software you’d like to exist." },
  ] as Item[],

  steps: [
    { icon: MessageSquareText, title: "Tell us what’s happening", text: "Explain the problem in your own words. A few minutes is enough." },
    { icon: ScanSearch, title: "We work out the right approach", text: "We review it, ask the right questions and look at what could improve it." },
    { icon: Handshake, title: "We agree a practical way forward", text: "We talk it through and, where it makes sense, scope a solution that fits your business." },
  ] as Item[],

  approach: [
    { icon: Compass, title: "Problem first", text: "We start with how your business works, not with a technology we want to sell." },
    { icon: ShieldCheck, title: "Straight answers", text: "If software isn’t the answer, or it isn’t worth it yet, we’ll say so." },
    { icon: Layers, title: "Sized to fit", text: "Small, useful steps you can see working, rather than big promises." },
    { icon: Wrench, title: "Built to be used", text: "Tools your team will actually use, handed over with the know-how to run them." },
  ] as Item[],

  // Kept on the page so expectations are clear before anyone submits.
  expectations: [
    "We read every submission ourselves.",
    "Sharing a problem doesn’t commit you to anything.",
    "We don’t promise savings or results before we understand the situation.",
  ],

  bookingSteps: [
    { icon: CalendarCheck, title: "Pick a time", text: "30 minutes, online." },
    { icon: MessagesSquare, title: "Talk it through", text: "What’s happening and what you’d like instead." },
    { icon: FileStack, title: "Next steps", text: "If we can help, we’ll suggest how." },
  ] as Item[],
};
