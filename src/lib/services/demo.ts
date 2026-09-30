import { eq as sqlEq } from "drizzle-orm";
import type { DB } from "@/lib/db/connection";
import * as t from "@/lib/db/schema";
import type { FitAssessment, FitLevel } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

/*
 * "Example Industrial Solutions" — a fully populated demonstration company.
 * All prospects and people are fictional, use the reserved `.example`
 * domain, and are flagged `isExample` so the UI labels them clearly.
 */

const DAY = 86_400_000;
const at = (days: number, hour = 9) => {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const fit = (c: FitLevel, i: FitLevel, g: FitLevel, n: FitLevel, ct: FitLevel, e: FitLevel, notes: Partial<Record<keyof FitAssessment, string>>): FitAssessment => ({
  company: { level: c, explanation: notes.company ?? "" },
  industry: { level: i, explanation: notes.industry ?? "" },
  geography: { level: g, explanation: notes.geography ?? "" },
  need: { level: n, explanation: notes.need ?? "" },
  contact: { level: ct, explanation: notes.contact ?? "" },
  evidence: { level: e, explanation: notes.evidence ?? "" },
});

export function createDemoCompany(db: DB, scope: { accountId: string; workspaceId: string; userId: string; userName: string }) {
  const companyId = newId("co");
  const ws = scope.workspaceId;
  const tc = { companyId, workspaceId: ws };

  db.transaction((tx) => {
    tx.insert(t.companies)
      .values({
        id: companyId,
        accountId: scope.accountId,
        workspaceId: ws,
        name: "Example Industrial Solutions",
        website: "https://industrial-solutions.example",
        description: "We help mines and heavy manufacturers keep critical equipment running with condition monitoring, predictive maintenance and on-site reliability engineering.",
        summary:
          "Example Industrial Solutions provides condition monitoring, predictive maintenance and reliability engineering for mining and heavy manufacturing operations in Southern Africa, helping maintenance and operations teams reduce unplanned downtime on critical rotating equipment.",
        brainStatus: "ready",
        brainAnalysedAt: at(-21),
        isDemo: true,
      })
      .run();

    // Sources --------------------------------------------------------------
    const siteId = newId("src");
    const docId = newId("src");
    const deckId = newId("src");
    tx.insert(t.sources)
      .values([
        {
          id: siteId, ...tc, kind: "website", label: "industrial-solutions.example", url: "https://industrial-solutions.example",
          status: "analysed", statusDetail: "5 pages read (example)", lastAnalysedAt: at(-21),
          pagesRead: [
            { url: "https://industrial-solutions.example/", title: "Home" },
            { url: "https://industrial-solutions.example/services", title: "Services" },
            { url: "https://industrial-solutions.example/industries/mining", title: "Mining" },
            { url: "https://industrial-solutions.example/case-studies", title: "Case studies" },
            { url: "https://industrial-solutions.example/about", title: "About us" },
          ],
        },
        { id: newId("src"), ...tc, kind: "page", subtype: "services", label: "Services", url: "https://industrial-solutions.example/services", status: "analysed", statusDetail: "Read" },
        { id: newId("src"), ...tc, kind: "page", subtype: "case_studies", label: "Case studies", url: "https://industrial-solutions.example/case-studies", status: "analysed", statusDetail: "Read" },
        { id: newId("src"), ...tc, kind: "social", subtype: "linkedin", label: "LinkedIn company page", url: "https://linkedin.example/company/example-industrial", status: "requires_permission", statusDetail: "Saved. Reading posts needs an authorised connection." },
        { id: newId("src"), ...tc, kind: "social", subtype: "youtube", label: "YouTube channel", url: "https://youtube.example/@exampleindustrial", status: "requires_permission", statusDetail: "Saved. Reading videos needs an authorised connection." },
        { id: docId, ...tc, kind: "document", label: "Capabilities brochure.pdf", status: "analysed", statusDetail: "Example document · 6 pages", lastAnalysedAt: at(-21) },
        { id: deckId, ...tc, kind: "document", label: "Case study – Platinum concentrator.pdf", status: "analysed", statusDetail: "Example document · 3 pages", lastAnalysedAt: at(-21) },
        { id: newId("src"), ...tc, kind: "web_research", label: "Web research", status: "available", statusDetail: "Used during discovery when AI is connected" },
      ])
      .run();

    // Company Brain --------------------------------------------------------
    const f = (section: t.BrainSection, field: string, value: string, knowledge: t.Knowledge, rationale: string | null, sourceIds: string[] = [siteId]) => ({
      id: newId("bf"), ...tc, section, field, value, knowledge, rationale, sourceIds, origin: "ai" as const,
    });
    tx.insert(t.brainFacts)
      .values([
        f("business", "what_they_do", "Condition monitoring, predictive maintenance and reliability engineering for heavy industry.", "confirmed", "Stated on the home page and in the capabilities brochure", [siteId, docId]),
        f("business", "services", "Vibration analysis, thermography, oil analysis, motor current analysis, reliability audits, maintenance planning support", "confirmed", "Listed on the Services page"),
        f("business", "products", "Wireless vibration sensors (resold), monitoring dashboard subscription", "confirmed", "Brochure, page 4", [docId]),
        f("business", "industries_served", "Mining, minerals processing, heavy manufacturing", "confirmed", "Industries section of the website"),
        f("business", "locations", "Johannesburg head office; field teams in Mpumalanga and North West", "confirmed", "About page"),
        f("business", "business_model", "Monthly monitoring contracts plus project-based reliability work", "inferred", "Pricing isn't published; the brochure describes 'ongoing programmes' and 'once-off audits'", [docId]),
        f("customer", "customer_types", "Mines, concentrators and smelters; cement and steel plants", "confirmed", "Case studies name these customer types"),
        f("customer", "ideal_customer", "Operations with large fleets of rotating equipment (pumps, mills, conveyors, fans) where one failure stops production", "inferred", "Every case study involves critical rotating plant"),
        f("customer", "decision_makers", "Engineering Manager, Maintenance Manager, Operations Manager", "inferred", "Case study quotes come from engineering and maintenance leads"),
        f("customer", "influencers", "Reliability engineers, planners, procurement", "suggested", "Common in industrial service sales — worth confirming"),
        f("customer", "company_characteristics", "Mid-size to large sites, 24/7 operations, high cost of downtime", "inferred", "Drawn from the case studies"),
        f("problem", "problems_solved", "Unplanned equipment failures and the production losses they cause", "confirmed", "Headline on the home page"),
        f("problem", "pain_points", "Reactive maintenance, skills shortages in reliability, poor visibility of asset health", "inferred", "Themes across the services and case study pages"),
        f("problem", "use_cases", "Monitoring mill drives and pumps; shutdown planning; root-cause analysis after failures", "confirmed", "Case study – Platinum concentrator", [deckId]),
        f("problem", "outcomes", "Fewer breakdowns, longer component life, better-planned shutdowns", "confirmed", "Brochure, page 2", [docId]),
        f("market", "current_markets", "Mining and minerals processing", "confirmed", "Most case studies are mining"),
        f("market", "geographies", "South Africa — Gauteng, Mpumalanga, North West", "confirmed", "About page"),
        f("market", "potential_markets", "Cement, pulp & paper, water utilities", "suggested", "Similar rotating-equipment reliability needs"),
        f("market", "adjacent_markets", "Mining contractors running their own fleets", "suggested", "Contractors often own maintenance of their equipment"),
        f("positioning", "differentiators", "Certified vibration analysts on the ground, not just software", "confirmed", "About page: 'people, not just dashboards'"),
        f("positioning", "brand_positioning", "Practical, engineering-led, plain-spoken", "inferred", "Tone of the website copy"),
        f("positioning", "communication_style", "Direct and technical; short sentences; avoids hype", "inferred", "Tone of the website copy"),
        f("exclusions", "industries_to_avoid", "Residential and small commercial buildings", "confirmed", "Stated by you during setup", []),
        { id: newId("bf"), ...tc, section: "customer" as const, field: "buyer_personas", value: "What budget holders typically sign off on monitoring contracts", knowledge: "unknown" as const, rationale: null, sourceIds: [], origin: "ai" as const },
        { id: newId("bf"), ...tc, section: "positioning" as const, field: "competitive_advantages", value: "How pricing compares with larger OEM service providers", knowledge: "unknown" as const, rationale: null, sourceIds: [], origin: "ai" as const },
      ])
      .run();

    // Market discovery & strategies ------------------------------------------
    const miningStrategy = newId("ls");
    const mfgStrategy = newId("ls");
    tx.insert(t.leadStrategies)
      .values([
        {
          id: miningStrategy, ...tc, name: "Mining operations", description: "Mines and concentrators with critical rotating equipment.",
          industries: ["Mining", "Minerals processing"], companyTypes: ["Mining companies", "Concentrators", "Mining contractors"],
          geographies: ["Gauteng", "Mpumalanga", "North West"], companySizes: ["Mid-size", "Large"],
          buyerRoles: ["Engineering Manager", "Maintenance Manager", "Operations Manager"], keywords: ["condition monitoring", "reliability", "plant maintenance", "mill"],
          exclusions: [], origin: "market_discovery", notes: "Why Sales Scout suggested this: most of your case studies are in mining.",
        },
        {
          id: mfgStrategy, ...tc, name: "Heavy manufacturing", description: "Cement, steel and process plants running 24/7.",
          industries: ["Cement", "Steel", "Manufacturing"], companyTypes: ["Process plants", "Industrial manufacturers"],
          geographies: ["South Africa"], companySizes: ["Mid-size", "Large"],
          buyerRoles: ["Maintenance Manager", "Plant Manager", "Reliability Engineer"], keywords: ["kiln", "rotating equipment", "shutdown"],
          exclusions: ["Construction"], origin: "market_discovery",
        },
      ])
      .run();
    tx.insert(t.marketOpportunities)
      .values([
        {
          id: newId("mo"), ...tc, title: "Mining operations in Mpumalanga & North West", status: "accepted", strategyId: miningStrategy, knowledge: "inferred",
          summary: "Coal, platinum and chrome operations running mills, pumps and conveyors around the clock.",
          reasoning: "Most of your case studies are mining sites, and your field teams are already based in these provinces.",
          industries: ["Mining"], companyTypes: ["Mines", "Concentrators"], buyerRoles: ["Engineering Manager", "Maintenance Manager"], jobTitles: ["Senior Maintenance Engineer"],
          geographies: ["Mpumalanga", "North West"], useCases: ["Mill drive monitoring"], keywords: ["condition monitoring"],
        },
        {
          id: newId("mo"), ...tc, title: "Cement and steel plants", status: "accepted", strategyId: mfgStrategy, knowledge: "inferred",
          summary: "Continuous process plants where kiln fans, crushers and rolling mills can't stop unexpectedly.",
          reasoning: "Your brochure lists cement and steel customers, and the equipment is the same kind you already monitor.",
          industries: ["Cement", "Steel"], companyTypes: ["Process plants"], buyerRoles: ["Plant Manager", "Maintenance Manager"], jobTitles: ["Reliability Engineer"],
          geographies: ["South Africa"], useCases: ["Kiln fan monitoring"], keywords: ["kiln", "rolling mill"],
        },
        {
          id: newId("mo"), ...tc, title: "Water utilities and pump stations", status: "saved", knowledge: "suggested",
          summary: "Municipal and bulk water operators maintaining large pump fleets.",
          reasoning: "Pumps are a core part of your monitoring work. Utilities have the same failure risks but you haven't mentioned any as customers — worth testing.",
          industries: ["Water utilities"], companyTypes: ["Bulk water operators"], buyerRoles: ["Operations Manager", "Asset Manager"], jobTitles: ["Mechanical Engineer"],
          geographies: ["Gauteng"], useCases: ["Pump station monitoring"], keywords: ["pump station", "asset management"],
        },
        {
          id: newId("mo"), ...tc, title: "Mining contractors with their own fleets", status: "suggested", knowledge: "suggested",
          summary: "Contract miners and crushing contractors who maintain their own equipment on client sites.",
          reasoning: "Contractors carry the downtime risk on their own equipment and often lack in-house reliability engineers.",
          industries: ["Mining services"], companyTypes: ["Contract miners", "Crushing contractors"], buyerRoles: ["Contracts Manager", "Maintenance Manager"], jobTitles: ["Fleet Manager"],
          geographies: ["Gauteng", "Limpopo"], useCases: ["Crusher monitoring"], keywords: ["contract mining", "crushing"],
        },
      ])
      .run();

    // Search runs ----------------------------------------------------------
    const run1 = newId("run");
    const run2 = newId("run");
    const interp = (industries: string[], geos: string[], roles: string[], summary: string): t.SearchInterpretation => ({
      summary, industries, companyTypes: [], geographies: geos, companySizes: ["Mid-size", "Large"], buyerRoles: roles, keywords: [], exclusions: [], requested: 10,
    });
    tx.insert(t.searchRuns)
      .values([
        {
          id: run1, ...tc, strategyId: miningStrategy, mode: "discover", title: "Mining operations prospects", query: "Find mining operations that could need condition monitoring",
          interpretation: interp(["Mining"], ["Mpumalanga", "North West"], ["Engineering Manager", "Maintenance Manager"], "I'll look for mines and concentrators in Mpumalanga and North West with large rotating equipment fleets."),
          status: "completed", requested: 10, discovered: 14, duplicates: 2, relevant: 6, rejected: 3, createdByUserId: scope.userId, createdAt: at(-18), completedAt: at(-18),
        },
        {
          id: run2, ...tc, strategyId: mfgStrategy, mode: "discover", title: "Heavy manufacturing prospects", query: "Cement and steel plants in South Africa",
          interpretation: interp(["Cement", "Steel"], ["South Africa"], ["Maintenance Manager", "Plant Manager"], "I'll look for cement and steel plants in South Africa that run continuous processes."),
          status: "completed", requested: 8, discovered: 9, duplicates: 1, relevant: 4, rejected: 2, createdByUserId: scope.userId, createdAt: at(-9), completedAt: at(-9),
        },
      ])
      .run();

    // Prospects ------------------------------------------------------------
    type Seed = {
      name: string; slug: string; industry: string; location: string; status: t.CrmStatus; inCrm: boolean; run: string; strategy: string;
      what: string; why: string; opp: string; next: string; fit: FitAssessment;
      facts: string[]; inferences: string[]; unknowns: string[];
      people: { name: string | null; role: string; relevance: string; email?: string; phone?: string }[];
      lastContact?: number; rejection?: string; researchDepth?: number;
    };
    const seeds: Seed[] = [
      {
        name: "Kopano Platinum Concentrator", slug: "kopano-platinum", industry: "Mining · Platinum", location: "Rustenburg, North West", status: "meeting", inCrm: true, run: run1, strategy: miningStrategy, lastContact: -2, researchDepth: 3,
        what: "Operates a platinum group metals concentrator processing ore from two nearby shafts.",
        why: "Their concentrator runs ball mills and slurry pumps continuously — the same equipment in your platinum concentrator case study.",
        opp: "They may benefit from continuous vibration monitoring on mill drives ahead of their planned plant expansion.",
        next: "Prepare for the site walk-through: bring the platinum concentrator case study and a sample monitoring report.",
        fit: fit("strong", "strong", "strong", "moderate", "strong", "moderate", {
          company: "Large 24/7 processing plant with critical rotating equipment.",
          industry: "Platinum processing is your strongest reference industry.",
          geography: "Rustenburg is covered by your North West field team.",
          need: "Their expansion announcement suggests new equipment; we haven't confirmed a monitoring gap.",
          contact: "Named engineering and maintenance leaders found on their site.",
          evidence: "Website and a news release support the assessment; need is inferred.",
        }),
        facts: ["Processes ore from two shafts", "Announced a plant expansion this year"],
        inferences: ["Likely runs multiple ball mills and slurry pumps", "Expansion may bring new equipment needing baseline monitoring"],
        unknowns: ["Whether they already use a monitoring provider", "Budget cycle for maintenance contracts"],
        people: [
          { name: "Thabo Nkosi", role: "Engineering Manager", relevance: "Owns plant reliability and signs off on engineering service contracts.", email: "t.nkosi@kopano-platinum.example" },
          { name: "Anika van Wyk", role: "Maintenance Planner", relevance: "Plans shutdowns — would feel the benefit of predictive data first." },
        ],
      },
      {
        name: "Highveld Coal Holdings", slug: "highveld-coal", industry: "Mining · Coal", location: "Emalahleni, Mpumalanga", status: "contacted", inCrm: true, run: run1, strategy: miningStrategy, lastContact: -6,
        what: "Runs two open-cast coal mines with an on-site wash plant.",
        why: "Wash plants depend on pumps, screens and conveyors that you already monitor for similar customers.",
        opp: "A monitoring programme for the wash plant could reduce unplanned stoppages.",
        next: "Follow up on the email sent last week with the conveyor case study.",
        fit: fit("strong", "strong", "strong", "moderate", "moderate", "moderate", {
          company: "Mid-size operation with a processing plant on site.", industry: "Coal is within your mining focus.", geography: "Emalahleni is near your Mpumalanga team.",
          need: "No public sign of a specific problem; need is inferred from equipment type.", contact: "Found a named maintenance lead; engineering head not listed.", evidence: "Company website only.",
        }),
        facts: ["Two open-cast operations", "On-site coal wash plant"], inferences: ["Wash plant pumps and screens are critical to throughput"], unknowns: ["Current maintenance approach", "Who owns reliability decisions"],
        people: [
          { name: "Sipho Dlamini", role: "Maintenance Manager", relevance: "Responsible for plant maintenance at the wash plant." },
          { name: null, role: "Engineering Manager", relevance: "Would typically approve a reliability programme — not named publicly." },
        ],
      },
      {
        name: "Ridgeview Chrome Mining", slug: "ridgeview-chrome", industry: "Mining · Chrome", location: "Steelpoort, Limpopo", status: "qualified", inCrm: true, run: run1, strategy: miningStrategy,
        what: "Underground chrome mine with a small concentrator.",
        why: "Chrome concentrators rely on spirals, pumps and mills similar to your existing customer sites.",
        opp: "An introductory reliability audit could open the door to ongoing monitoring.",
        next: "Draft an introduction to the Operations Manager referencing their concentrator.",
        fit: fit("moderate", "strong", "moderate", "moderate", "moderate", "weak", {
          company: "Smaller operation — may have a lower budget.", industry: "Chrome mining matches your mining focus.", geography: "Limpopo is just outside your usual area.",
          need: "Inferred from equipment type only.", contact: "Operations Manager named on a directory listing.", evidence: "Only a directory listing and their home page.",
        }),
        facts: ["Underground chrome mine"], inferences: ["Concentrator is small, so equipment count is modest"], unknowns: ["Size of maintenance team", "Whether they outsource reliability work"],
        people: [{ name: "Ruan Botha", role: "Operations Manager", relevance: "Runs day-to-day operations including the concentrator." }],
      },
      {
        name: "Bushveld Pump & Slurry Services", slug: "bushveld-pumps", industry: "Mining services", location: "Brits, North West", status: "new", inCrm: false, run: run1, strategy: miningStrategy,
        what: "Supplies and repairs slurry pumps for mines in the platinum belt.",
        why: "They service the same pumps you monitor — a potential partner or a customer for their own workshop fleet.",
        opp: "Possibly a referral partnership: they repair, you monitor.",
        next: "Decide whether to treat them as a partner or a prospect before reaching out.",
        fit: fit("moderate", "moderate", "strong", "weak", "unknown", "moderate", {
          company: "A service company rather than an operator.", industry: "Adjacent to mining.", geography: "Brits is in your North West area.",
          need: "They may not need monitoring themselves.", contact: "No named people found.", evidence: "Website describes their services clearly.",
        }),
        facts: ["Repairs slurry pumps for platinum mines"], inferences: ["Could be a channel partner rather than a buyer"], unknowns: ["Whether they offer monitoring themselves"],
        people: [{ name: null, role: "Managing Director", relevance: "In a small services firm, the MD usually decides on partnerships." }],
      },
      {
        name: "Waterberg Minerals", slug: "waterberg-minerals", industry: "Mining · Iron ore", location: "Lephalale, Limpopo", status: "new", inCrm: false, run: run1, strategy: miningStrategy,
        what: "Iron ore mine in the early stages of expanding its processing plant.",
        why: "An expansion project means new crushers and conveyors that will need baseline monitoring.",
        opp: "Offer commissioning-phase baseline surveys on new equipment.",
        next: "Research deeper to find who is running the expansion project.",
        fit: fit("strong", "strong", "moderate", "moderate", "weak", "moderate", {
          company: "Growing site with new plant.", industry: "Iron ore mining.", geography: "Limpopo is outside your current team's base.",
          need: "Expansion suggests upcoming need.", contact: "Only generic roles identified.", evidence: "A news article mentions the expansion.",
        }),
        facts: ["Expanding its processing plant"], inferences: ["New equipment will need commissioning baselines"], unknowns: ["Project timeline", "Who manages the expansion"],
        people: [{ name: null, role: "Project Engineering Manager", relevance: "Would run the expansion and commissioning." }],
      },
      {
        name: "Summit Cement Works", slug: "summit-cement", industry: "Cement", location: "Lichtenburg, North West", status: "opportunity", inCrm: true, run: run2, strategy: mfgStrategy, lastContact: -1, researchDepth: 3,
        what: "Integrated cement plant with two kiln lines.",
        why: "Kiln fans and raw mills are exactly the kind of critical rotating equipment you monitor.",
        opp: "A proposal for monitoring both kiln lines is being discussed.",
        next: "Send the proposal with a phased rollout, starting with kiln line 2.",
        fit: fit("strong", "strong", "strong", "strong", "strong", "moderate", {
          company: "Large continuous process plant.", industry: "Cement is listed in your brochure.", geography: "Lichtenburg is in North West.",
          need: "They told you on the call that kiln fan failures caused two stoppages last year.", contact: "In conversation with the Plant Manager.", evidence: "Confirmed directly in conversation.",
        }),
        facts: ["Two kiln lines", "Two kiln fan failures last year (from the call)"], inferences: [], unknowns: ["Procurement process and timeline"],
        people: [
          { name: "Johan Pretorius", role: "Plant Manager", relevance: "Sponsor for the reliability project.", phone: "+27 18 000 0000" },
          { name: "Lerato Mokoena", role: "Reliability Engineer", relevance: "Would work with your analysts day to day." },
        ],
      },
      {
        name: "Vaal Steel Rolling", slug: "vaal-steel", industry: "Steel", location: "Vanderbijlpark, Gauteng", status: "replied", inCrm: true, run: run2, strategy: mfgStrategy, lastContact: -3,
        what: "Long-steel rolling mill producing bar and rod.",
        why: "Rolling mill gearboxes and motors are high-value assets where early fault detection pays off.",
        opp: "Motor current analysis on the main mill drives.",
        next: "Reply to their question about sensor installation downtime.",
        fit: fit("strong", "strong", "strong", "moderate", "moderate", "moderate", {
          company: "Established mill with heavy drives.", industry: "Steel is within your manufacturing strategy.", geography: "Gauteng — close to head office.",
          need: "They asked about installation, which suggests interest.", contact: "Engineering Manager replied to your email.", evidence: "Their reply confirms interest; need not yet confirmed.",
        }),
        facts: ["Replied asking about installation downtime"], inferences: ["Uptime is a priority for them"], unknowns: ["Current maintenance tools"],
        people: [{ name: "Priya Naidoo", role: "Engineering Manager", relevance: "Replied to your email and is evaluating options." }],
      },
      {
        name: "Karoo Paper Mill", slug: "karoo-paper", industry: "Pulp & paper", location: "Gqeberha, Eastern Cape", status: "new", inCrm: false, run: run2, strategy: mfgStrategy,
        what: "Paper mill producing packaging board.",
        why: "Paper machines have many rotating components — a possible new market for you.",
        opp: "Test the pulp & paper market with one reference customer.",
        next: "Decide whether pulp & paper is a market you want to explore.",
        fit: fit("moderate", "weak", "weak", "moderate", "unknown", "weak", {
          company: "Right kind of plant.", industry: "Pulp & paper isn't in your current markets.", geography: "Far from your field teams.",
          need: "Inferred only.", contact: "No people identified.", evidence: "Very little information found.",
        }),
        facts: ["Produces packaging board"], inferences: ["Many rotating assets on the paper machine"], unknowns: ["Almost everything about their maintenance setup"],
        people: [{ name: null, role: "Maintenance Manager", relevance: "Typical owner of reliability programmes." }],
      },
      {
        name: "Metro Build Contractors", slug: "metro-build", industry: "Construction", location: "Johannesburg, Gauteng", status: "rejected", inCrm: false, run: run2, strategy: mfgStrategy,
        rejection: "Not relevant: construction firms don't run continuous rotating plant",
        what: "General building contractor.", why: "Appeared because they operate heavy equipment.", opp: "Unlikely.", next: "None.",
        fit: fit("weak", "weak", "strong", "weak", "unknown", "weak", { company: "Mobile plant, not fixed rotating equipment." }),
        facts: [], inferences: [], unknowns: [], people: [],
      },
      {
        name: "Apex Civil Engineering", slug: "apex-civil", industry: "Construction", location: "Pretoria, Gauteng", status: "rejected", inCrm: false, run: run1, strategy: miningStrategy,
        rejection: "Not relevant",
        what: "Civil engineering contractor.", why: "Listed on a mining supplier directory.", opp: "Unlikely.", next: "None.",
        fit: fit("weak", "weak", "strong", "weak", "unknown", "weak", {}), facts: [], inferences: [], unknowns: [], people: [],
      },
      {
        name: "Granite Roads & Bridges", slug: "granite-roads", industry: "Construction", location: "Polokwane, Limpopo", status: "rejected", inCrm: false, run: run1, strategy: miningStrategy,
        rejection: "Not relevant",
        what: "Road construction company.", why: "Appeared for 'crushing' keywords.", opp: "Unlikely.", next: "None.",
        fit: fit("weak", "weak", "moderate", "weak", "unknown", "weak", {}), facts: [], inferences: [], unknowns: [], people: [],
      },
    ];

    const ids: Record<string, string> = {};
    for (const [i, s] of seeds.entries()) {
      const id = newId("pr");
      ids[s.slug] = id;
      const domain = `${s.slug}.example`;
      tx.insert(t.prospects)
        .values({
          id, ...tc, searchRunId: s.run, strategyId: s.strategy, name: s.name, domain, website: `https://${domain}`,
          industry: s.industry, location: s.location, whatTheyDo: s.what, whyRelevant: s.why, potentialOpportunity: s.opp, suggestedNextStep: s.next,
          fit: s.fit, confirmedFacts: s.facts, inferences: s.inferences, unknowns: s.unknowns, status: s.status, inCrm: s.inCrm,
          vetting: "presented", researchDepth: s.researchDepth ?? 2, ownerUserId: s.inCrm ? scope.userId : null,
          lastContactAt: s.lastContact !== undefined ? at(s.lastContact, 10) : null, origin: "demo", isExample: true, rejectionReason: s.rejection ?? null,
          recentActivity: s.researchDepth === 3 ? [{ title: `${s.name} announces plant upgrade (example news item)`, date: at(-30).toISOString().slice(0, 10) }] : [],
          createdAt: at(-18 + i), updatedAt: at(-10 + i),
        })
        .run();
      tx.insert(t.evidence)
        .values([
          { id: newId("ev"), ...tc, prospectId: id, kind: "website", title: `${s.name} — home page (example)`, url: `https://${domain}/`, snippet: s.what, supports: "What they do" },
          ...(s.facts.length ? [{ id: newId("ev"), ...tc, prospectId: id, kind: "news" as const, title: `${s.name} — about / news page (example)`, url: `https://${domain}/about`, snippet: s.facts.join(". "), supports: "Confirmed facts" }] : []),
        ])
        .run();
      if (s.people.length)
        tx.insert(t.contacts)
          .values(s.people.map((pp) => ({
            id: newId("ct"), ...tc, prospectId: id, name: pp.name, role: pp.role, relevance: pp.relevance, email: pp.email ?? null, phone: pp.phone ?? null,
            sourceUrl: pp.name ? `https://${domain}/team` : null, knowledge: pp.name ? ("confirmed" as const) : ("suggested" as const), origin: "demo" as const,
          })))
          .run();
      tx.insert(t.activities).values({ id: newId("act"), ...tc, prospectId: id, type: "created", title: "Discovered by Sales Scout", body: s.why, createdAt: at(-18 + i) }).run();
      if (s.rejection) {
        tx.insert(t.feedback).values({ id: newId("fb"), ...tc, prospectId: id, searchRunId: s.run, userId: scope.userId, kind: "not_relevant", dimension: "industry", value: s.industry, reason: s.rejection }).run();
      }
    }

    // Activity, follow-ups, outreach ----------------------------------------
    const act = (slug: string, type: t.ActivityType, title: string, body: string | null, days: number) =>
      tx.insert(t.activities).values({ id: newId("act"), ...tc, prospectId: ids[slug], userId: scope.userId, type, title, body, createdAt: at(days, 11) }).run();
    act("kopano-platinum", "email", "Logged an email", "Sent intro with the platinum concentrator case study.", -12);
    act("kopano-platinum", "call", "Logged a call", "Thabo interested — wants to see a sample report. Site walk-through agreed.", -5);
    act("kopano-platinum", "status", "Moved to Meeting", "From Contacted", -2);
    act("kopano-platinum", "note", "Note", "Expansion adds a third mill in Q2. Ask about commissioning timeline.", -2);
    act("highveld-coal", "outreach", "Email prepared", "Intro email referencing their wash plant.", -6);
    act("summit-cement", "meeting", "Logged a meeting", "Walked kiln line 2 with Johan and Lerato. Two kiln fan failures last year.", -4);
    act("summit-cement", "status", "Moved to Opportunity", "From Meeting", -1);
    act("vaal-steel", "email", "Logged an email", "Priya asked how long sensor installation takes and whether the mill must stop.", -3);

    const fu = (slug: string, title: string, days: number, done = false, hour = 9) =>
      tx.insert(t.followUps).values({ id: newId("fu"), ...tc, prospectId: ids[slug], userId: scope.userId, title, dueAt: at(days, hour), completedAt: done ? at(days, hour + 2) : null }).run();
    fu("vaal-steel", "Answer Priya's installation question", 0, false, 10);
    fu("summit-cement", "Send phased proposal for kiln lines", 0, false, 14);
    fu("highveld-coal", "Follow up on intro email", -2);
    fu("kopano-platinum", "Site walk-through at the concentrator", 3);
    fu("ridgeview-chrome", "Send introduction to Ruan Botha", 5);
    fu("kopano-platinum", "Send sample monitoring report", -5, true);
    const nextFor: Record<string, number> = { "vaal-steel": 0, "summit-cement": 0, "highveld-coal": -2, "kopano-platinum": 3, "ridgeview-chrome": 5 };
    for (const [slug, d] of Object.entries(nextFor)) tx.update(t.prospects).set({ nextFollowUpAt: at(d, 9) }).where(eqId(ids[slug])).run();

    const original = `Hi Sipho,\n\nI hope this message finds you well.\n\nI came across Highveld Coal's wash plant in Emalahleni. We help coal operations reduce unplanned stoppages on pumps, screens and conveyors with condition monitoring.\n\nWould a short call next week be useful to see if this is relevant?\n\n${scope.userName}`;
    tx.insert(t.outreachDrafts)
      .values({
        id: newId("od"), ...tc, prospectId: ids["highveld-coal"], userId: scope.userId, channel: "email", subject: "Wash plant uptime at Highveld Coal",
        body: original.replace("I hope this message finds you well.\n\n", ""), originalBody: original, generatedBy: "ai", status: "handed_off", createdAt: at(-6), updatedAt: at(-6),
      })
      .run();

    // Learning: three construction rejections → a pending suggestion.
    tx.insert(t.learningSuggestions)
      .values({
        id: newId("ls"), ...tc, kind: "strategy", signature: `reject-industry:construction:${miningStrategy}`,
        title: `Stop looking in Construction for "Mining operations"?`,
        body: `I noticed you've marked 3 Construction companies as not relevant. Would you like me to exclude Construction from the "Mining operations" strategy?`,
        change: { type: "strategy_exclusion", strategyId: miningStrategy, value: "Construction" },
      })
      .run();
    tx.insert(t.writingPreferences).values({ id: newId("wp"), ...tc, scope: "company", rule: "Be direct and specific. Mention one piece of equipment or site detail we actually observed.", example: null }).run();
    tx.insert(t.exclusions).values({ id: newId("ex"), ...tc, kind: "competitor", value: "reliability-rivals.example", reason: "Competitor" }).run();

    tx.insert(t.auditLog)
      .values([
        { id: newId("aud"), accountId: scope.accountId, workspaceId: ws, companyId, entityType: "company_brain", entityId: companyId, action: "generated", source: "ai", summary: "Company Brain built from 3 sources (example)", createdAt: at(-21) },
        { id: newId("aud"), accountId: scope.accountId, workspaceId: ws, companyId, userId: scope.userId, entityType: "company_brain", entityId: companyId, action: "edited", source: "user", summary: "Industries served: Manufacturing → Mining, minerals processing, heavy manufacturing", createdAt: at(-20) },
        { id: newId("aud"), accountId: scope.accountId, workspaceId: ws, companyId, entityType: "search_run", entityId: run1, action: "completed", source: "web_research", summary: "Discovery found 14 companies: 6 relevant, 3 set aside, 2 duplicates (example)", createdAt: at(-18) },
      ])
      .run();
  });
  return companyId;

  function eqId(id: string) {
    return sqlEq(t.prospects.id, id);
  }
}

