/**
 * Marketing-site copy. Edit freely: wording, packages and contact details
 * all live here, so the page layout never needs touching.
 * Nothing here should claim results we can't show (no invented stats or quotes).
 */
export const SITE = {
  name: "Sales Scout",
  tagline: "Done-for-you sales intelligence",
  // Shown in the footer and on the contact section. Replace with your own.
  contactEmail: "hello@salesscout.co",
  hero: {
    title: "We find the companies that need what you sell.",
    eyebrow: "Done-for-you sales intelligence",
    body: "Sales Scout researches your market, vets every company, finds the right people to speak to and hands you a briefed shortlist, with the reasoning behind every lead.",
  },
  questions: [
    { q: "Who?", a: "Companies that could genuinely need what you offer, found from public sources and checked one by one." },
    { q: "Why?", a: "A plain explanation for every lead: how it fits, the evidence, and what we couldn't verify." },
    { q: "Who inside?", a: "The roles that buy what you sell, and the named people where a public source shows them." },
    { q: "What next?", a: "A suggested approach, a one-minute brief and an outreach draft you can send as your own." },
  ],
  steps: [
    { title: "Discovery call", body: "We learn what you sell, who already buys it, and who you never want to hear about again." },
    { title: "Your market map", body: "We build your Company Brain and agree where to look: industries, regions, company types and buyer roles." },
    { title: "Research and vetting", body: "Our platform searches, then every company is checked for fit, need and evidence. Duplicates and existing customers are removed." },
    { title: "Your briefed shortlist", body: "You receive the companies worth calling, who to speak to, why they matter and a draft of what to say." },
  ],
  deliverables: [
    { title: "A briefed shortlist", body: "Companies ranked by fit, each with what they do and why they're worth your time." },
    { title: "Why-this-lead evidence", body: "Fit across six dimensions, the sources we used and the things we couldn't confirm." },
    { title: "The right people", body: "Buyer roles for every company, plus named contacts where a public source shows them." },
    { title: "One-minute sales briefs", body: "Everything you need before a first call, on a single page." },
    { title: "Outreach drafts", body: "Emails and LinkedIn messages written for each prospect, for you to edit and send." },
    { title: "CRM-ready export", body: "Excel, CSV or a polished client report. Missing details stay blank, never guessed." },
  ],
  principles: [
    { title: "We never make anything up", body: "No invented companies, people, emails or phone numbers. If we can't verify it, we say so." },
    { title: "Every lead shows its evidence", body: "Each company comes with the sources behind it, so you can check our work." },
    { title: "You send, not us", body: "We draft outreach. You decide what goes out and it goes from your own inbox." },
    { title: "Your data stays yours", body: "Each client's research is kept separate and is never shared with anyone else." },
  ],
  packages: [
    {
      name: "Market Snapshot",
      cadence: "One-off",
      summary: "See who's out there before you commit.",
      items: ["Discovery call and market map", "Around 20 vetted companies", "Why-this-lead evidence for each", "Buyer roles and contacts where public", "Excel export and client report"],
      featured: false,
    },
    {
      name: "Pipeline Builder",
      cadence: "Monthly",
      summary: "A steady flow of qualified companies, every month.",
      items: ["Everything in Market Snapshot", "Around 40–60 new companies a month", "One-minute sales briefs", "Outreach drafts for each prospect", "Monthly review of what's working"],
      featured: true,
    },
    {
      name: "Embedded Scout",
      cadence: "Ongoing partnership",
      summary: "Research that runs alongside your sales team.",
      items: ["Everything in Pipeline Builder", "Multiple markets and strategies", "Priority deep research on request", "CRM handover in your format", "A client view of the workspace on request"],
      featured: false,
    },
  ],
  nav: [
    { href: "/why-us", label: "Why Sales Scout" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/services", label: "Services" },
    { href: "/contact", label: "Contact" },
  ],
  // What sellers are struggling with. Deliberately no invented statistics.
  problems: [
    {
      title: "Lists are long. Reasons to call are missing.",
      body: "Bought databases hand you thousands of names that match a filter. None of them tell you why a company might need you this year, so every call starts cold.",
      answer: "We start from what you sell and the problems you solve, and every company arrives with a specific reason it may need you now.",
    },
    {
      title: "Research eats the selling day.",
      body: "Before one good call, someone has to read the website, check the news, find the right person and work out an angle. Done properly, that's hours per company. Usually it doesn't get done.",
      answer: "We do the research for you. Each company comes with a one-minute brief, so you walk into the first call already informed.",
    },
    {
      title: "Buyers ignore generic outreach.",
      body: "Decision makers receive more cold messages than ever. The ones that show no real understanding of their business are deleted in seconds, and they take your reputation with them.",
      answer: "Every draft is grounded in something real about that company, written in your voice, and sent by you, only when you choose.",
    },
    {
      title: "Guessed data does real damage.",
      body: "Pattern-guessed emails bounce, wrong contacts get annoyed, and spam filters start to notice. Bad data doesn't just waste time; it quietly burns your domain and your name.",
      answer: "We never guess. Contact details appear only when they're published on a real page, and anything unconfirmed is clearly marked as unknown.",
    },
    {
      title: "AI tools sound sure. They often aren't.",
      body: "Many tools now promise automated prospecting. Too often they invent facts, guess contacts and write 'personalised' messages a buyer can spot as fake in one line.",
      answer: "Our platform uses AI for the heavy lifting, but every fact links to a source and a person checks every shortlist before it reaches you.",
    },
    {
      title: "Small teams can't build a research department.",
      body: "Hiring, training and managing researchers or SDRs is slow and expensive. Most growing businesses need the output without building the machine.",
      answer: "You get the output of a research team with none of the hiring. Start with a single snapshot and scale only when it works.",
    },
  ],
  // How the common options compare. Phrased as "typically" — it's a fair generalisation, not a claim about any one provider.
  comparison: {
    columns: ["Bought lead lists", "Outsourced SDR agencies", "DIY AI tools", "Sales Scout"],
    rows: [
      { label: "Starts from what you actually sell", values: ["no", "partly", "partly", "yes"] },
      { label: "Explains why each company fits", values: ["no", "rarely", "sometimes", "yes"] },
      { label: "Shows the sources behind every lead", values: ["no", "rarely", "rarely", "yes"] },
      { label: "Never guesses contact details", values: ["no", "varies", "no", "yes"] },
      { label: "You decide what's sent, from your own inbox", values: ["yes", "no", "varies", "yes"] },
      { label: "Learns from your feedback", values: ["no", "partly", "rarely", "yes"] },
      { label: "Ready to act: brief, people and a draft", values: ["no", "partly", "partly", "yes"] },
    ],
    note: "Comparison reflects what each approach typically offers. Individual providers vary.",
  },
  differences: [
    { title: "Company first, then people", body: "We start by finding companies whose work overlaps with the problems you solve. Only then do we look for the people inside who'd care. Most tools do it the other way round, which is why their lists feel random." },
    { title: "Every lead explains itself", body: "No black-box score. Each company shows how it fits across six dimensions, the evidence we found and what we couldn't confirm, so you can judge it in under a minute." },
    { title: "Evidence or it doesn't ship", body: "If we can't trace a company, a person or a contact detail back to a real public source, it doesn't go in your shortlist. Missing information stays missing." },
    { title: "Your judgement makes it sharper", body: "Every 'not relevant' and every edit you make is recorded. We use those signals to refine where we look, and we ask before changing your strategy." },
  ],
  whyUs: [
    { title: "We built the platform ourselves", body: "Sales Scout isn't a reseller of someone else's database. We built our own research and qualification platform for exactly this job, so we control the quality end to end." },
    { title: "A person reviews every shortlist", body: "Our platform does the heavy research. A person checks every shortlist before it reaches you, so what you receive has been read, not just generated." },
    { title: "Built for growing B2B sellers", body: "We work with service firms, suppliers, manufacturers and consultants who sell to other businesses and need more of the right conversations, not more noise." },
    { title: "We protect your reputation", body: "We never send messages on your behalf and never guess contact details. Your outreach goes from you, to the right person, for a real reason." },
  ],
  detailedSteps: [
    {
      title: "Discovery call",
      you: "Tell us what you sell, who already buys it, your best results and who you never want to hear about.",
      we: "Listen, ask the awkward questions and agree what a great prospect looks like for you.",
      get: "A shared definition of your ideal customer.",
    },
    {
      title: "Your market map",
      you: "Share your website, brochures, case studies and anything that explains your work.",
      we: "Build your Company Brain: what you do, who you help, the problems you solve. Then we suggest markets worth exploring, with our reasoning.",
      get: "A short list of target markets to approve, edit or reject. Nothing proceeds without your say-so.",
    },
    {
      title: "Research and vetting",
      you: "Nothing. This is where we earn our fee.",
      we: "Search for real companies, remove duplicates, existing customers and competitors, then research each one for fit, need and evidence.",
      get: "Only companies that passed: real, relevant and traceable to sources.",
    },
    {
      title: "People and approach",
      you: "Nothing yet.",
      we: "Identify the buyer roles inside each company, find named people where a public source shows them, and draft how to approach them.",
      get: "Who to speak to, why they'd care, and a first message in your voice.",
    },
    {
      title: "Your briefed shortlist",
      you: "Review, keep what's worth pursuing and tell us what missed the mark.",
      we: "Deliver the shortlist, one-minute sales briefs, outreach drafts and a CRM-ready export. Then we use your feedback to sharpen the next round.",
      get: "Conversations worth having, ready to start the same day.",
    },
  ],
  anatomy: [
    { label: "Who they are", body: "What the company does, where, and how big an operation it is." },
    { label: "Why they matter", body: "The specific overlap between their work and the problems you solve." },
    { label: "The opportunity", body: "What you might help them with, phrased as a possibility, not a promise." },
    { label: "How they fit", body: "Six dimensions rated strong, moderate, weak or unknown, each with a reason." },
    { label: "Who to speak to", body: "Buyer roles, plus named people where a public source shows them." },
    { label: "What we couldn't verify", body: "The gaps, stated plainly, so you know what to ask on the first call." },
    { label: "Sources", body: "Links to where every fact came from." },
    { label: "Next step and draft", body: "A suggested approach and a first message for you to edit." },
  ],
  goodFit: [
    "You sell to other businesses",
    "You can describe what you do and who it's for",
    "You want fewer, better conversations rather than mass emails",
    "Someone on your side can follow up with prospects",
  ],
  notFit: [
    "Consumer marketing or selling to the public",
    "Mass email campaigns or buying contact lists",
    "Anyone who wants messages sent automatically in their name",
  ],
  contactNext: [
    { title: "We read your message", body: "We look at your business before we speak, so the call is useful from the first minute." },
    { title: "A short discovery call", body: "We talk through what you sell, who buys it and where you'd like to grow." },
    { title: "A clear, fixed quote", body: "We send a scoped proposal with what you'll receive and when. No obligation." },
  ],
  packagesNote: "Every engagement is scoped to your market. After a short call we'll send a clear, fixed quote.",
  faqs: [
    { q: "Do I need to learn new software?", a: "No. We run Sales Scout for you and deliver the results as a shortlist, briefs and an export. A client view of the workspace is available if you'd like one." },
    { q: "Where do the leads come from?", a: "From public sources: company websites, directories, news and published team pages. Every company we hand over includes the sources we used." },
    { q: "Do you guarantee meetings?", a: "No one honestly can. What we guarantee is that every company is real, relevant to what you sell and comes with the evidence behind it." },
    { q: "Will you contact prospects for us?", a: "No. We prepare the outreach; you review it and send it yourself, so your reputation stays in your hands." },
    { q: "What kinds of businesses is this for?", a: "Business-to-business sellers: service firms, manufacturers, suppliers, agencies and consultants who sell to other companies." },
    { q: "How quickly do we start?", a: "We agree the timeline on the discovery call, based on your market and how many companies you need." },
  ],
};
