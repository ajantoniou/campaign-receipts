/* ─── Help Documentation Content ───
   Living help docs for the dashboard. Editing the content here +
   redeploying = updated help center. No CMS, no markdown library —
   typed sections rendered as semantic HTML.

   Conventions:
   - Each section has a slug (URL anchor), title, optional intro, and
     ordered subsections.
   - Subsection body can be string[] (paragraphs) or structured items
     (lists, code blocks, callouts).
   - Keep it lawyer-readable: short paragraphs, no jargon without
     explanation, no emoji except when functional.
*/

export interface DocSubsection {
  heading: string;
  body?: string[];
  list?: { label: string; detail?: string }[];
  callout?: { kind: "info" | "warning" | "tip"; text: string };
}

export interface DocSection {
  slug: string;
  title: string;
  intro?: string;
  subsections: DocSubsection[];
}

export const HELP_SECTIONS: DocSection[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    intro:
      "Cliros runs a Georgia title search end-to-end in minutes — chain of title, liens, federal records, permits, and a Fannie Mae B7-2-06 compliant Attorney Opinion Letter draft.",
    subsections: [
      {
        heading: "Your first report",
        body: [
          "1. Click \"New Search\" in the sidebar.",
          "2. Type the full property address. Use the address autocomplete to avoid typos — it's the #1 cause of \"property not found\" errors.",
          "3. The county is auto-detected from the address. Override only if Cliros gets it wrong.",
          "4. Click Search. The first stage (parcel anchor) runs in about a second and confirms we can find the property in the county tax records. If we can't, you get an immediate error — no time wasted and no free report consumed.",
          "5. Once the parcel is found, the report is queued. You'll see live stage progress: Searching → Permits → Quality Panel → Drafting → Ready.",
          "6. When the status reads Ready, you'll have three PDFs in the report: the Title Search Report, the Attorney Opinion Letter draft, and a homeowner-facing summary you can forward to your client.",
        ],
        callout: {
          kind: "tip",
          text: "First time? Use a property you've already closed on. Compare Cliros's chain of title against your abstractor's work — that's the easiest way to build confidence in what you're getting.",
        },
      },
      {
        heading: "What's included in every report",
        list: [
          { label: "Chain of title", detail: "50-year examination per OCGA § 44-2-21. Each conveyance shows grantor, grantee, deed type, book/page, and recorded date." },
          { label: "Lien & encumbrance review", detail: "State tax liens, mechanics liens, mortgage security deeds, judgments. Each lien shows status (active/released), creditor, debtor, and book/page." },
          { label: "Federal records search", detail: "Bankruptcy filings and IRS federal tax liens via CourtListener (the public PACER mirror)." },
          { label: "Building permits (Atlanta only for now)", detail: "Open vs. finaled permits with status, contractor, dates. Open permits past 90 days are flagged as a potential mechanics-lien window." },
          { label: "AI risk analysis", detail: "Automated identification of chain breaks, unreleased liens, open bankruptcies, and other title defects with severity ratings." },
          { label: "6-persona expert panel review", detail: "Every report runs through 6 AI domain experts (closing attorney, title-co owner, compliance counsel, design lead, growth lead, VC) plus an orchestrator. If quality is unacceptable, the report is held — you won't see junk." },
          { label: "Three branded PDFs", detail: "Title Search Report, Attorney Opinion Letter (B7-2-06 compliant), and a plain-English Homeowner Summary you can forward to your client." },
        ],
      },
    ],
  },
  {
    slug: "address-tips",
    title: "Address Tips & Common Errors",
    intro:
      "Most failed searches come down to address formatting. Here's how to avoid the common pitfalls.",
    subsections: [
      {
        heading: "Use the autocomplete",
        body: [
          "When you type in the New Search box, the autocomplete shows Google Places suggestions. Pick the one that exactly matches the property — don't free-type your own version.",
          "The autocomplete also captures the ZIP code, which we use to identify the correct county. Free-typed addresses often miss the ZIP, which can route the search to the wrong county.",
        ],
      },
      {
        heading: '"Property not found in county tax records"',
        body: [
          "This is the most common error. It means the address you entered doesn't match any parcel in the county's GIS database. Possible causes:",
        ],
        list: [
          { label: "Typo in street name", detail: "\"Peachtree Battle Ave\" vs \"Peachtree Bttle Ave\" — even one missing letter fails the match." },
          { label: "Wrong ZIP code", detail: "ZIP routes the search to a specific county. 30318 ≠ 30327 even though both are Atlanta-area." },
          { label: "Address recently subdivided", detail: "A new lot split from a larger parcel may not yet be in the county GIS. This is rare but happens." },
          { label: "Assembled site", detail: "Some commercial properties span multiple parcels recorded under the development authority. We're working on multi-parcel rollups." },
          { label: "Apartment/condo unit number", detail: "Most counties index condos under the master parcel. Drop the unit number for the search; the report covers the whole building." },
        ],
        callout: {
          kind: "info",
          text: "If you're sure the address is correct but Cliros can't find it, email support@cliros.ai with the address and we'll manually verify. This often surfaces edge cases we can fix in the parcel anchor.",
        },
      },
      {
        heading: "Wrong county selected",
        body: [
          "Cliros auto-detects the county from the address. If it picks the wrong one (e.g., a Dunwoody address routing to Fulton instead of DeKalb), use the county dropdown to override before clicking Search.",
          "If you keep seeing wrong-county auto-detection for a specific area, email alex@cliros.ai — we'll fix the parcel-anchor county routing.",
        ],
      },
    ],
  },
  {
    slug: "free-trial-and-credits",
    title: "Free Trial, Credits & Packs",
    intro:
      "Public accounts start with a small preview balance. Founding attorneys can reply with an account email and one Georgia property so we can set up the account and first dossier with them.",
    subsections: [
      {
        heading: "How the free trial works",
        body: [
          "Preview reports are full-quality production reports — not stripped-down demos. Run them on properties you've already closed on so you can compare to your abstractor's work.",
          "Free reports only count if the search completes successfully. If a report fails because of an address typo or a parcel-not-found error, it doesn't burn against your trial count.",
        ],
      },
      {
        heading: "After the free trial",
        body: [
          "After preview credits are used, the dashboard prompts you to buy a pack. Three options:",
        ],
        list: [
          { label: "1 report — $250", detail: "Single search at $250. Best for one-off needs after your free trial." },
          { label: "5 reports — $1,100", detail: "$220 per report (12% off). Best for solo attorneys doing 1–3 closings per month." },
          { label: "25 reports — $5,000", detail: "$200 per report (20% off). Best for firms doing 4–8 closings per month — our most popular tier." },
        ],
        callout: {
          kind: "info",
          text: "Reports expire 12 months from purchase. Buy what you need for the next year, not a decade.",
        },
      },
      {
        heading: "Need more than 25 reports per pack?",
        body: [
          "Email alex@cliros.ai for volume pricing. We work with firms doing 40+ closings per month directly — custom invoicing, white-label options if useful, and direct access to the founder for feature requests.",
        ],
      },
      {
        heading: "How credits show up in your dashboard",
        body: [
          "When you buy a pack, your card is charged through LemonSqueezy (our merchant of record). Within seconds of payment clearing, the reports appear in your dashboard under \"Credits remaining\" on the Billing page.",
          "Every report you run after that decrements your balance. You'll see the running count on the Billing page and in the sidebar.",
          "We never auto-recharge or surprise-bill. When you run out, you'll get a notice and the next search will prompt you to buy another pack.",
        ],
      },
    ],
  },
  {
    slug: "refunds-credits",
    title: "Refunds, Credits & Re-runs",
    intro:
      "Report packages are non-refundable, but we're generous with credits and re-runs.",
    subsections: [
      {
        heading: "Our policy",
        body: [
          "Packs are non-refundable. This is industry standard for prepaid SaaS credit products (PropMix, ProTitle USA, First American Title all operate this way) and is what lets us hold pricing this aggressive.",
          "However: if a report contains a material factual error in the records we examined, we will re-run the search at no charge or credit a report back to your balance. No questions asked, no haggling.",
          "Common triggers for a free re-run: wrong county pulled, address typo (yours or ours), parcel-not-found that turns out to be a valid address, AI hallucination in the analysis section, GSCCCA data source outage during your search.",
        ],
      },
      {
        heading: "Automatic no-charge on unverifiable addresses",
        body: [
          "If the pipeline cannot complete a coherent search — county tax parcel can't be located, indexed records don't reconcile (e.g. active liens with no vesting deed), or our quality panel kills the report — we credit the report back to your balance automatically. You'll see a green \"no charge applied\" banner on the report and a \"Refunded\" counter on the Billing page.",
          "You don't have to email us for this. The credit lands the moment the pipeline marks the report blocked. Re-runs against the same address that succeed later won't double-charge — the original refund stands and the new run draws a fresh credit.",
        ],
      },
      {
        heading: "How to request a re-run or credit",
        body: [
          "Email support@cliros.ai with the report ID and a one-line description of the issue.",
          "Our AI triage system categorizes your request automatically and our human team reviews within one business day. Most credits are issued within hours.",
          "The credit appears in your dashboard balance immediately — no card refund needed. You decide whether to use it on the same property or a different one.",
        ],
      },
      {
        heading: "What we won't refund",
        list: [
          { label: "Buyer's remorse", detail: "Bought a pack, decided you don't want it. We sympathize but the answer is no — that's why we offer a 5-report free trial." },
          { label: "Reports past 12 months", detail: "Unused reports expire 12 months from purchase. We send a reminder at 30 days before expiry." },
          { label: "Subjective disputes", detail: "If you disagree with our risk analysis or the AOL's framing, those are judgment calls — re-runs apply only to factual errors in the public records." },
        ],
      },
    ],
  },
  {
    slug: "feature-requests",
    title: "Feature Requests & Custom Data",
    intro:
      "Cliros is built around what closing attorneys actually need. If you need a new data source or a new feature, tell us.",
    subsections: [
      {
        heading: "How to request a feature",
        body: [
          "Email alex@cliros.ai — that's our founder's direct inbox. Every request is read.",
          "Tell us: (1) what you need, (2) which closings/clients would benefit, (3) whether you'd pay extra for it or whether it should be included.",
          "We typically prioritize requests based on how many attorneys need them and how long they take to build. Common requests turn around in 1–2 weeks.",
        ],
      },
      {
        heading: "Things we're actively working on",
        list: [
          { label: "Permits for non-Atlanta cities", detail: "We have Atlanta covered. Decatur, Sandy Springs, Marietta, Roswell, and Alpharetta are next as attorneys in those markets sign up." },
          { label: "DeKalb / Cobb / Gwinnett deep coverage", detail: "GSCCCA covers all 159 counties but parcel-level GIS coverage varies. We're adding county-by-county precision." },
          { label: "Bulk address upload", detail: "CSV upload for firms doing 10+ reports at once. In progress." },
          { label: "Direct integration with closing software", detail: "Qualia, ResWare, and SoftPro integrations are on the roadmap — talk to us if your firm uses one of these." },
          { label: "Multi-attorney firm profiles", detail: "Per-attorney bar number, signature block, E&O carrier details on AOLs. In progress." },
        ],
      },
      {
        heading: "Vision: office hours at scale",
        body: [
          "Our long-term plan: once we have 1,000 high-volume clients, we'll run weekly office hours where the founder meets with attorneys to understand exactly what they need and build the product around their workflows.",
          "Until we hit that scale, alex@cliros.ai is your direct line. Use it.",
        ],
      },
    ],
  },
  {
    slug: "panel-review",
    title: "Quality Panel Review",
    intro:
      "Every Cliros report runs through a 6-persona AI expert review before it's delivered to you. Here's what that means.",
    subsections: [
      {
        heading: "Why we built the panel",
        body: [
          "Title search reports are legal infrastructure. A bad report doesn't just embarrass us — it could expose an attorney to malpractice liability. We needed a quality gate before reports leave the building.",
          "The panel is six AI experts, each playing a different role: a Georgia closing attorney, a title company owner, a compliance counsel, a design lead, a growth lead, and a legal-tech investor. Each reviews the report from their domain perspective and emits a verdict (ship, fix, kill) with specific blocking issues.",
          "A seventh AI — the orchestrator — synthesizes the six reviews and emits the final verdict.",
        ],
      },
      {
        heading: "What you'll see in the dashboard",
        list: [
          { label: "Ship", detail: "The panel approved the report. All three PDFs are ready to use." },
          { label: "Fix", detail: "The panel approved with caveats. PDFs are delivered, but you'll see a yellow banner listing the specific issues the panel flagged. Review them before sending to a lender." },
          { label: "Kill", detail: "The panel rejected the report. It will not be delivered. You'll see a red banner explaining why. The report does NOT count against your free trial or paid balance. We re-run it once we've fixed whatever the panel found." },
        ],
      },
      {
        heading: "Real example",
        body: [
          "During development, the panel caught our own AI hallucinating a fraud allegation against a real named homeowner. Without the panel, that report would have shipped — exposing both us and the attorney to defamation liability.",
          "The panel was right. We fixed the prompt and added a post-processing sanitizer. That's the kind of catch the panel exists for.",
        ],
        callout: {
          kind: "tip",
          text: "If your report comes back \"fix\" or \"kill\" and you don't understand why, email support@cliros.ai with the report ID. We'll walk you through the panel notes.",
        },
      },
    ],
  },
  {
    slug: "contact",
    title: "Getting Help",
    subsections: [
      {
        heading: "Support requests",
        body: [
          "Email support@cliros.ai for: re-run requests, credit requests, technical bugs, login issues, billing questions, anything that should be resolved within one business day.",
          "We use an AI triage system to categorize and prioritize incoming tickets. A human always reviews before responding.",
        ],
      },
      {
        heading: "Feature requests and product feedback",
        body: [
          "Email alex@cliros.ai for: new data sources, new features, custom report sections, integration requests, anything strategic.",
          "This goes directly to the founder. We're building Cliros around what attorneys actually need — your input shapes the roadmap.",
        ],
      },
      {
        heading: "Urgent issues during a closing",
        body: [
          "If you're at a closing and something is wrong with a Cliros report, email support@cliros.ai with \"URGENT — CLOSING IN PROGRESS\" in the subject line. We monitor that line in real time during business hours.",
          "We can't substitute for your professional judgment in the room, but we can re-run a search, check our data sources, or escalate to engineering immediately.",
        ],
      },
    ],
  },
];
