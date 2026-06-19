/* ─── Instantly.ai API Client for Cliros GTM (v2) ───
   Cold email campaigns targeting Georgia closing attorneys.
   Templates live in GA_ATTORNEY_EMAIL_SEQUENCES; send_beta_invites.ts
   pushes leads + optionally syncs sequence + activates the campaign.
*/

const API_BASE = "https://api.instantly.ai/api/v2";
const API_KEY = process.env.INSTANTLY_API_KEY || "";

const HERO_URL =
  "https://jivahkfdkduxasnzpzgx.supabase.co/storage/v1/object/public/cliros-marketing/beta-launch/hero-dashboard.png";

export interface InstantlyLead {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  custom_variables?: Record<string, string>;
}

export interface InstantlyCampaign {
  id: string;
  name: string;
  status: number;
}

async function instantlyFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instantly API error ${res.status}: ${text.slice(0, 400)}`);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export async function listCampaigns(): Promise<InstantlyCampaign[]> {
  const json = await instantlyFetch<{ items?: InstantlyCampaign[] }>(
    "/campaigns?limit=50",
  );
  return json.items ?? [];
}

export async function createCampaign(name: string): Promise<{ id: string }> {
  return instantlyFetch("/campaigns", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getCampaign(id: string) {
  return instantlyFetch<Record<string, unknown>>(`/campaigns/${id}`);
}

/** Push one lead into a campaign (v2). */
export async function addLeadToCampaign(
  campaignId: string,
  lead: InstantlyLead,
): Promise<{ id?: string; status?: string }> {
  return instantlyFetch("/leads", {
    method: "POST",
    body: JSON.stringify({
      campaign: campaignId,
      email: lead.email,
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      company_name: lead.company_name || "",
      custom_variables: lead.custom_variables || {},
    }),
  });
}

/** Bulk add — loops v2 single-lead endpoint (Instantly dedupes on email). */
export async function addLeadsToCampaign(
  campaignId: string,
  leads: InstantlyLead[],
): Promise<{ status: string; leads_added: number }> {
  let added = 0;
  for (const lead of leads) {
    await addLeadToCampaign(campaignId, lead);
    added++;
  }
  return { status: "ok", leads_added: added };
}

export async function updateCampaign(
  campaignId: string,
  patch: Record<string, unknown>,
) {
  return instantlyFetch(`/campaigns/${campaignId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function activateCampaign(campaignId: string) {
  return instantlyFetch(`/campaigns/${campaignId}/activate`, {
    method: "POST",
    body: "{}",
  });
}

function betaDay1Html(): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0f172a;max-width:580px;">
  <p>Hi {{first_name}},</p>
  <p>I'm Alex — I built <strong>Cliros</strong>, a title engine for Georgia closing attorneys. One search produces three deliverables in under 5 minutes:</p>
  <ul>
    <li><strong>Client report</strong> — plain-English property history + timeline</li>
    <li><strong>Attorney Opinion Letter</strong> — Fannie Mae B7-2-06 draft, ready for your review</li>
    <li><strong>Raw source documents</strong> — GSCCCA chain, liens, federal records, stored for your file</li>
  </ul>
  <p style="margin:18px 0;">
    <img src="${HERO_URL}" alt="Cliros dashboard — real GA title report"
         style="display:block;width:100%;max-width:580px;border-radius:8px;border:1px solid #e2e8f0;" />
    <span style="display:block;font-size:12px;color:#64748b;margin-top:6px;text-align:center;">
      Live dashboard — real Atlanta property, QC'd by 4 AI specialists before delivery
    </span>
  </p>
  <p>We're in <strong>free beta</strong> right now. I honestly need feedback from attorneys who run real closings — what's missing, what's wrong, what would make this worth using every week.</p>
  <p>At launch, bulk pricing is <strong>$200/report</strong> for the full package (client report + AOL draft + source storage). Beta testers get free unlimited runs while we tune the engine — the only ask is one line of feedback after each report (thumbs + comment box in the dashboard, goes straight to me).</p>
  <p style="margin:22px 0;">
    <a href="https://cliros.ai/signup?ref=BETA-{{first_name_lower}}"
       style="background:#0f172a;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;">
      Start free beta access →
    </a>
  </p>
  <p style="font-size:13px;color:#64748b;">Or reply with one GA address and I'll run it tonight — free, no card.</p>
  <p style="margin-top:24px;">Alex<br/><span style="font-size:13px;color:#64748b;">alex@cliros.ai</span></p>
</div>`;
}

function betaDay4Html(): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0f172a;max-width:580px;">
  <p>Hi {{first_name}},</p>
  <p>Quick follow-up on the Cliros beta. A few attorneys ran files this week and the feedback has been gold — we shipped two engine fixes in 24 hours based on what they flagged.</p>
  <p>Reminder: <strong>free during beta</strong>. At launch it's <strong>$200/report</strong> for the client report, AOL draft, and raw source document storage — built to 10x your throughput and cut abstractor costs up to 80%.</p>
  <p style="margin:22px 0;">
    <a href="https://cliros.ai/signup?ref=BETA-{{first_name_lower}}"
       style="background:#0f172a;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;">
      Try it free →
    </a>
  </p>
  <p>One real file is enough. Reply with an address (any GA county) and I'll get a report on your desk before close of business.</p>
  <p>Alex<br/><span style="font-size:13px;color:#64748b;">alex@cliros.ai</span></p>
</div>`;
}

function betaDay7Html(): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0f172a;max-width:580px;">
  <p>Hi {{first_name}},</p>
  <p>Last note — we're closing the first beta cohort soon. Launch bulk pricing is <strong>$200/report</strong> (client report + AOL draft + source storage). Beta testers who give feedback now will get preferred pricing when we exit preview.</p>
  <p>What you get per file:</p>
  <ul>
    <li>Full GSCCCA chain of title (50 years)</li>
    <li>Judgment + tax lien + federal record search</li>
    <li>Fannie Mae B7-2-06 compliant AOL draft</li>
    <li>Plain-English client summary + raw source JSON</li>
  </ul>
  <p style="margin:22px 0;">
    <a href="https://cliros.ai/signup?ref=BETA-{{first_name_lower}}"
       style="background:#0f172a;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;">
      Request beta access →
    </a>
  </p>
  <p>Free during beta. Honest feedback is the only currency.</p>
  <p>Alex<br/><span style="font-size:13px;color:#64748b;">alex@cliros.ai</span></p>
</div>`;
}

/** Instantly sequence payload for the beta cohort. */
export function buildBetaCampaignSequences() {
  return [
    {
      steps: [
        {
          type: "email",
          delay: 0,
          delay_unit: "days",
          variants: [
            {
              subject:
                "Free beta: GA title search + client report + AOL draft ($200 at launch)",
              body: betaDay1Html(),
            },
          ],
        },
        {
          type: "email",
          delay: 3,
          delay_unit: "days",
          variants: [
            {
              subject: "Re: Cliros beta — free while we tune the engine",
              body: betaDay4Html(),
            },
          ],
        },
        {
          type: "email",
          delay: 4,
          delay_unit: "days",
          variants: [
            {
              subject: "Closing the beta cohort — $200/report at launch",
              body: betaDay7Html(),
            },
          ],
        },
      ],
    },
  ];
}

export async function syncBetaCampaign(campaignId: string, senderEmail: string) {
  return updateCampaign(campaignId, {
    email_list: [senderEmail],
    sequences: buildBetaCampaignSequences(),
    daily_limit: 10,
    stop_on_reply: true,
    open_tracking: false,
    text_only: false,
    // 7-day window so weekend beta cohorts send immediately (not Mon-only).
    campaign_schedule: {
      schedules: [
        {
          name: "Beta 7-day",
          timing: { from: "08:00", to: "20:00" },
          days: { "0": true, "1": true, "2": true, "3": true, "4": true, "5": true, "6": true },
          timezone: "America/Detroit",
        },
      ],
    },
  });
}

export async function getCampaignAnalytics(campaignId: string) {
  return instantlyFetch(
    `/analytics/campaign/summary?campaign_id=${campaignId}`,
  );
}

/** Plain-text reference for send_beta_invites dry-run logging. */
export const GA_ATTORNEY_EMAIL_SEQUENCES = {
  day1: {
    subject:
      "Free beta: GA title search + client report + AOL draft ($200 at launch)",
    body: "See buildBetaCampaignSequences() — HTML email with hero image.",
  },
  day4: {
    subject: "Re: Cliros beta — free while we tune the engine",
    body: "Follow-up with $200 launch pricing + free beta CTA.",
  },
  day7: {
    subject: "Closing the beta cohort — $200/report at launch",
    body: "Final nudge with deliverable list + signup link.",
  },
};
