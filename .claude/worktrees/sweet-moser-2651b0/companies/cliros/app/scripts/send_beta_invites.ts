/* ─── Send Beta Invites via Instantly ───
   Usage:
     # Default: pull enriched leads from cliros.prospects (scrape_ga_attorneys.ts output)
     npx tsx scripts/send_beta_invites.ts --campaign "Cliros Georgia Launch — GA Closing Attorneys"
     npx tsx scripts/send_beta_invites.ts --dry-run

     # Legacy: CSV file input
     npx tsx scripts/send_beta_invites.ts --csv leads.csv

     # Filters when pulling from cliros.prospects:
     #   --limit N           cap at N leads (default 1000)
     #   --min-reviews N     only firms with at least N Google reviews (default 5)
     #   --state-only GA     only ship to a specific state (default GA)
     #   --re-only           ICP filter: real estate / closing / title firms only
     #   --ids id1,id2,...   send to specific prospect UUIDs (overrides query)
     #   --launch            sync beta sequence + sender + activate campaign

   CSV format (header required, when --csv is used):
     email,first_name,last_name,firm_name,county

   Reads GA_ATTORNEY_EMAIL_SEQUENCES from src/lib/instantly.ts so the templates
   live in one place. Creates the campaign if it doesn't exist; otherwise adds
   leads to the existing campaign. After upload, stamps each cliros.prospects
   row with outreach_status='queued' + instantly_lead_id so we never double-add.

   Founder script-bloat lock: this is the canonical send-script. Extend it,
   do not fork it. Adding new lead-source (e.g. Apollo): add a --apollo-search
   branch in this file.
*/

import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { listCampaigns, createCampaign, addLeadsToCampaign, syncBetaCampaign, activateCampaign, GA_ATTORNEY_EMAIL_SEQUENCES } from "../src/lib/instantly";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({
  path: "/Applications/DrAntoniou Projects/AgentCompanies/.env",
});

interface Lead {
  email: string;
  first_name: string;
  last_name: string;
  firm_name?: string;
  county?: string;
  prospect_id?: string;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    csv: get("--csv"),
    campaign: get("--campaign") || "Cliros Georgia Launch — GA Closing Attorneys",
    limit: parseInt(get("--limit") || "1000", 10),
    minReviews: parseInt(get("--min-reviews") || "5", 10),
    state: get("--state-only") || "GA",
    ids: get("--ids")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
    reOnly: args.includes("--re-only"),
    launch: args.includes("--launch"),
    sender: get("--sender") || "antonioualfred@gmail.com",
    dryRun: args.includes("--dry-run"),
  };
}

function rowToLead(row: {
  id: string;
  business_name: string;
  attorney_first_name: string | null;
  email: string;
  county: string | null;
  city: string | null;
}): Lead {
  const rawFirst =
    row.attorney_first_name ||
    (row.business_name.split(/[\s,&|]/)[0] ?? "");
  const firstName =
    rawFirst.length >= 2 &&
    !/^(the|law|office|firm|group|llc|atl|ga)$/i.test(rawFirst)
      ? rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase()
      : "there";
  return {
    email: row.email.trim(),
    first_name: firstName,
    last_name: "",
    firm_name: row.business_name,
    county: row.county || row.city || undefined,
    prospect_id: row.id,
  };
}

async function loadLeadsByIds(ids: string[]): Promise<Lead[]> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL/SERVICE_ROLE_KEY in env");
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .schema("cliros")
    .from("prospects")
    .select("id, business_name, attorney_first_name, email, county, city")
    .in("id", ids)
    .not("email", "is", null)
    .neq("email", "");

  if (error) throw new Error(`supabase: ${error.message}`);
  const byId = new Map((data ?? []).map((r) => [r.id as string, r]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((row) =>
      rowToLead(row as {
        id: string;
        business_name: string;
        attorney_first_name: string | null;
        email: string;
        county: string | null;
        city: string | null;
      }),
    );
}

async function loadLeadsFromProspects(opts: {
  limit: number;
  minReviews: number;
  state: string;
  reOnly: boolean;
}): Promise<Lead[]> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL/SERVICE_ROLE_KEY in env");
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .schema("cliros")
    .from("prospects")
    .select("id, business_name, attorney_first_name, email, county, city, state, google_review_count, outreach_status")
    .eq("state", opts.state)
    .not("email", "is", null)
    .neq("email", "")
    .gte("google_review_count", opts.minReviews)
    .neq("outreach_status", "queued")
    .neq("outreach_status", "sent")
    .neq("outreach_status", "replied")
    .order("google_review_count", { ascending: false })
    .limit(opts.limit);

  if (error) throw new Error(`supabase: ${error.message}`);

  let rows = data ?? [];
  if (opts.reOnly) {
    rows = rows.filter((row) => {
      const n = (row.business_name as string).toLowerCase();
      if (/injury|accident|dui|criminal|divorce|bankruptcy/.test(n)) return false;
      return /real estate|closing|title|property|conveyanc|estate law|residential/.test(n);
    });
  }

  return rows.slice(0, opts.limit).map((row) =>
    rowToLead(row as {
      id: string;
      business_name: string;
      attorney_first_name: string | null;
      email: string;
      county: string | null;
      city: string | null;
    }),
  );
}

async function stampQueued(prospectIds: string[]): Promise<void> {
  if (prospectIds.length === 0) return;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key);
  await supabase
    .schema("cliros")
    .from("prospects")
    .update({
      outreach_status: "queued",
      last_contacted_at: new Date().toISOString(),
    })
    .in("id", prospectIds);
}

function parseCsv(filePath: string): Lead[] {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const [headerLine, ...rows] = raw.split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  const idx = (k: string) => headers.indexOf(k);

  const eIdx = idx("email");
  const fnIdx = idx("first_name");
  const lnIdx = idx("last_name");
  const firmIdx = idx("firm_name");
  const countyIdx = idx("county");

  if (eIdx < 0) throw new Error("CSV must include `email` column");

  return rows
    .filter((r) => r.trim().length > 0)
    .map((row) => {
      const cells = row.split(",").map((c) => c.trim());
      return {
        email: cells[eIdx],
        first_name: fnIdx >= 0 ? cells[fnIdx] : "",
        last_name: lnIdx >= 0 ? cells[lnIdx] : "",
        firm_name: firmIdx >= 0 ? cells[firmIdx] : undefined,
        county: countyIdx >= 0 ? cells[countyIdx] : undefined,
      };
    })
    .filter((l) => l.email.includes("@"));
}

async function main() {
  const args = parseArgs();

  let leads: Lead[];
  if (args.csv) {
    const csvPath = path.resolve(args.csv);
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV not found: ${csvPath}`);
      process.exit(1);
    }
    leads = parseCsv(csvPath);
    console.log(`Parsed ${leads.length} leads from ${csvPath}`);
  } else if (args.ids.length > 0) {
    console.log(`Loading ${args.ids.length} prospect(s) by ID…`);
    leads = await loadLeadsByIds(args.ids);
    console.log(`Loaded ${leads.length} leads from cliros.prospects`);
  } else {
    console.log(
      `Pulling from cliros.prospects · state=${args.state} · min_reviews=${args.minReviews} · re_only=${args.reOnly} · limit=${args.limit}`,
    );
    leads = await loadLeadsFromProspects({
      limit: args.limit,
      minReviews: args.minReviews,
      state: args.state,
      reOnly: args.reOnly,
    });
    console.log(`Loaded ${leads.length} enriched leads from cliros.prospects`);
  }

  if (leads.length === 0) {
    console.log("No leads to send. (Did you run scrape_ga_attorneys.ts --enrich-emails first?)");
    return;
  }

  console.log(`Campaign: "${args.campaign}"`);
  console.log(`Sample template (Day 1) subject: "${GA_ATTORNEY_EMAIL_SEQUENCES.day1.subject}"`);

  if (args.dryRun) {
    console.log("--- DRY RUN ---");
    leads.slice(0, 10).forEach((l, i) => {
      console.log(
        `  [${i + 1}] ${l.first_name} <${l.email}>${l.firm_name ? ` · ${l.firm_name}` : ""}${l.county ? ` · ${l.county}` : ""}`,
      );
    });
    if (leads.length > 10) console.log(`  … and ${leads.length - 10} more`);
    console.log(
      "(would create/find campaign and push leads — pass without --dry-run to send)",
    );
    return;
  }

  if (!process.env.INSTANTLY_API_KEY) {
    console.error("INSTANTLY_API_KEY not set in env. Source root .env first.");
    process.exit(1);
  }

  const existing = await listCampaigns().catch(() => []);
  let campaignId: string | undefined = (existing as Array<{ id: string; name: string }>).find(
    (c) => c.name.toLowerCase() === args.campaign.toLowerCase()
  )?.id;

  if (!campaignId) {
    console.log(`Creating campaign "${args.campaign}"…`);
    const created = await createCampaign(args.campaign);
    campaignId = created.id;
    console.log(`  → ${campaignId}`);
  } else {
    console.log(`Reusing existing campaign ${campaignId}`);
  }

  if (args.launch) {
    console.log(`Syncing beta email sequence + sender ${args.sender}…`);
    await syncBetaCampaign(campaignId, args.sender);
    console.log("  → sequence updated");
  }

  const result = await addLeadsToCampaign(
    campaignId,
    leads.map((l) => ({
      email: l.email,
      first_name: l.first_name,
      last_name: l.last_name,
      company_name: l.firm_name,
      custom_variables: {
        county: l.county || "",
        first_name_lower: (l.first_name || "").toLowerCase(),
      },
    }))
  );
  console.log(`Added ${result.leads_added} leads. Status: ${result.status}`);

  // Stamp queued status on rows that came from cliros.prospects so re-runs
  // skip them (idempotent uploads).
  const prospectIds = leads
    .map((l) => l.prospect_id)
    .filter((id): id is string => Boolean(id));
  if (prospectIds.length > 0) {
    await stampQueued(prospectIds);
    console.log(`Stamped ${prospectIds.length} cliros.prospects rows → outreach_status=queued`);
  }

  if (args.launch) {
    console.log("Activating campaign…");
    await activateCampaign(campaignId);
    console.log("  → campaign active — Instantly will send on schedule (weekdays 9–5 ET)");
  }

  console.log("\nSent leads:");
  leads.forEach((l, i) => {
    console.log(`  [${i + 1}] ${l.first_name} <${l.email}> · ${l.firm_name}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
