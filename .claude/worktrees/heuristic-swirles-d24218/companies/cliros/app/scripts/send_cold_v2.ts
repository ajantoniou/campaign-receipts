/* ─── Cold email v2 (Option C: tight + end-to-end + image) ───
   Picks N fresh GA closing-attorney prospects (not already contacted,
   not bounced, has email), sends through Resend with opens/clicks
   tracking ON. Persists each send to outreach_emails so the webhook
   can stamp opened/clicked later.

   Usage:
     # Dry run (prints picks, no sends):
     npx tsx scripts/send_cold_v2.ts --dry

     # Send 10 picks:
     npx tsx scripts/send_cold_v2.ts --limit 10

     # Schedule for tomorrow 7am ET — DOES send immediately; use cron
     # or `at` if you need true deferred. Resend has no native delayed
     # send for free tier.
*/

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: "/Applications/DrAntoniou Projects/AgentCompanies/.env" });

import { createClient } from "@supabase/supabase-js";
import { sendColdEmail } from "../src/lib/cold-email";

interface ProspectRow {
  id: string;
  email: string;
  business_name: string;
  attorney_first_name: string | null;
  city: string | null;
  county: string | null;
  website?: string | null;
}

function args() {
  const a = process.argv.slice(2);
  const get = (k: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  return {
    limit: parseInt(get("--limit") || "10", 10),
    dry: a.includes("--dry"),
    ids: get("--ids")?.split(",").filter(Boolean) || [],
  };
}

function firstName(row: ProspectRow): string {
  const raw = row.attorney_first_name || (row.business_name.split(/[\s,&|]/)[0] ?? "");
  if (raw.length < 2 || /^(the|law|office|firm|group|llc|atl|ga|inc)$/i.test(raw)) return "there";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function renderHtml(row: ProspectRow): { subject: string; html: string; text: string } {
  const name = firstName(row);
  const firm = row.business_name;
  const subject = `${firm}: 10 closing docs in 5 minutes for one GA file`;

  const imgUrl = "https://cliros.ai/email/product-preview.png";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;line-height:1.55;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;padding:24px;">
  <tr><td style="padding-bottom:16px;">
    <p style="margin:0 0 14px;">Hi ${name},</p>
    <p style="margin:0 0 14px;">I built <a href="https://cliros.ai" style="color:#C75300;text-decoration:none;font-weight:600;">Cliros</a> — end-to-end title work for GA closings. One address in, ten closing documents out in under five minutes (title search, commitment, AOL, warranty deed, settlement statement, PT-61, seller's affidavit, 1099-S, owner's policy affidavit, homeowner summary).</p>
    <p style="margin:0 0 18px;">I'm looking for 10 GA closing attorneys to try it on one real file. If you're open to it, reply with the email you want on the account and one Georgia property address you want us to prepare. We'll build the account, add 10 free title-closing dossiers, and send the first file back ready for review. No card, no code, no contract.</p>
  </td></tr>
  <tr><td style="padding-bottom:18px;">
    <a href="https://cliros.ai" style="display:block;">
      <img src="${imgUrl}" alt="Cliros report — chain of title + closing docs" width="512" style="display:block;width:100%;max-width:512px;height:auto;border:1px solid #e5e5e5;border-radius:6px;"/>
    </a>
  </td></tr>
  <tr><td>
    <p style="margin:0 0 6px;">— Alex Antoniou<br/>founder, Cliros · <a href="https://cliros.ai" style="color:#1a1a1a;">cliros.ai</a></p>
    <p style="margin:14px 0 0;color:#888;font-size:12px;">Cliros, PBC · 999 Peachtree St NE, Atlanta GA 30309 · 10% of revenue → the Cliros Mission Fund. Reply STOP and I won't email again.</p>
  </td></tr>
</table>
</body></html>`;

  const text = `Hi ${name},

I built Cliros — end-to-end title work for GA closings. One address in, ten closing documents out in under five minutes (title search, commitment, AOL, warranty deed, settlement statement, PT-61, seller's affidavit, 1099-S, owner's policy affidavit, homeowner summary).

See it: https://cliros.ai

I'm looking for 10 GA closing attorneys to try it on one real file. If you're open to it, reply with the email you want on the account and one Georgia property address you want us to prepare. We'll build the account, add 10 free title-closing dossiers, and send the first file back ready for review. No card, no code, no contract.

— Alex Antoniou
founder, Cliros · cliros.ai
Cliros, PBC · 999 Peachtree St NE, Atlanta GA 30309
10% of revenue → the Cliros Mission Fund. Reply STOP and I won't email again.`;

  return { subject, html, text };
}

async function pickProspects(sb: ReturnType<typeof createClient>, limit: number, ids: string[]): Promise<ProspectRow[]> {
  if (ids.length > 0) {
    const { data, error } = await sb
      .schema("cliros").from("prospects")
      .select("id,email,business_name,attorney_first_name,city,county,website")
      .in("id", ids);
    if (error) throw new Error(error.message);
    return (data || []) as ProspectRow[];
  }
  // Fresh picks: GA, has email, has not been contacted, not bounced/DNC,
  // some Google reviews so it's a real firm. Closing/title/real-estate
  // language preferred.
  const { data, error } = await sb
    .schema("cliros").from("prospects")
    .select("id,email,business_name,attorney_first_name,city,county,website,google_review_count,outreach_status")
    .eq("state", "GA")
    .not("email", "is", null)
    .neq("email", "")
    .eq("do_not_contact", false)
    .is("last_contacted_at", null)
    .gte("google_review_count", 3)
    .order("google_review_count", { ascending: false })
    .limit(800); // overfetch then filter
  if (error) throw new Error(error.message);
  const rows = (data || []) as Array<ProspectRow & { google_review_count: number }>;
  // ICP: closing/title/real-estate firms ONLY. Exclude PI, elder, family,
  // generic large firms, and obvious non-attorney inboxes.
  const re = /real estate|closing|closings|title|property|residential|conveyanc|realtylaw|relaw/i;
  const skip = /injury|accident|dui|criminal|divorce|bankruptcy|immigration|elder|family|estate plan|estate planning|probate|disability|workers.?comp|personal injury|nugent|hostilo/i;
  // scholarship@ is a hard skip (PI firm intake form); everything else is fine
  // for small-firm cold outreach where attorney reads the main inbox.
  const badEmail = /^(scholarship|no-?reply|donotreply|user|test|sample)@|@(yourdomain|domain)\./i;
  const ranked = rows
    .filter((r) => {
      const haystack = `${r.business_name} ${r.email} ${r.website || ""}`;
      return re.test(haystack) && !skip.test(haystack);
    })
    .filter((r) => !badEmail.test(r.email))
    .sort((a, b) => (b.google_review_count || 0) - (a.google_review_count || 0));
  return ranked.slice(0, limit);
}

async function main() {
  const a = args();
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const picks = await pickProspects(sb, a.limit, a.ids);
  console.log(`Picked ${picks.length} prospect(s):`);
  picks.forEach((p, i) => console.log(`  [${i + 1}] ${firstName(p)} <${p.email}> · ${p.business_name} · ${p.city || p.county || "—"}`));

  if (a.dry) {
    const sample = picks[0];
    if (sample) {
      const { subject } = renderHtml(sample);
      console.log(`\nSample subject: "${subject}"`);
    }
    console.log("\n(dry run — no sends)");
    return;
  }

  console.log(`\nSending via Resend with opens+clicks tracking ON…`);
  let ok = 0, fail = 0;
  for (const row of picks) {
    const { subject, html, text } = renderHtml(row);
    const res = await sendColdEmail({
      to: row.email,
      subject, html, text,
      prospect: { id: row.id, email: row.email, business_name: row.business_name },
      templateId: "cold_v2_2026_05_27_tight_endtoend",
    });
    if (res.ok) {
      ok++;
      console.log(`  ✓ ${row.email}  resend_id=${res.resendId}`);
      // Stamp prospect row so re-runs don't double-send.
      await sb.schema("cliros").from("prospects").update({
        outreach_status: "contacted",
        last_contacted_at: new Date().toISOString(),
        outreach_stage: 3, // tight v2
      }).eq("id", row.id);
    } else {
      fail++;
      console.log(`  ✗ ${row.email}  ${res.error}`);
    }
    // Throttle to ~2/s — Resend free tier 100/day, this stays well under.
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`\nDone — sent ${ok}, failed ${fail}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
