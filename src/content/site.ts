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
