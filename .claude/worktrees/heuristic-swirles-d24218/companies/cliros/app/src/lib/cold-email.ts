/* ─── Cold email helper ───
   One canonical send function for Cliros founder cold outreach.
   - Tracking pixels + click-rewriting ON (so the webhook can stamp
     opened_at / clicked_at).
   - Logs every send to cliros.outreach_emails so we can correlate
     opens/clicks back to a prospect.
   - Caller passes the html body and prospect row; we handle Resend
     call + persistence.
*/

import { createClient } from "@supabase/supabase-js";

interface Prospect {
  id: string;
  email: string;
  business_name?: string;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  prospect: Prospect;
  templateId: string;
  from?: string;
  replyTo?: string;
}

interface SendResult {
  ok: boolean;
  resendId?: string;
  error?: string;
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );
}

export async function sendColdEmail(args: SendArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };

  const from = args.from || "Alex Antoniou <alex@cliros.ai>";
  const replyTo = args.replyTo || "alex@cliros.ai";

  // Resend tracking: opens + clicks ON. Without these, the webhook will
  // never see email.opened / email.clicked events.
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      reply_to: replyTo,
      subject: args.subject,
      html: args.html,
      text: args.text,
      tracking: { opens: true, clicks: true },
      tags: [
        { name: "campaign", value: args.templateId },
        { name: "prospect_id", value: args.prospect.id },
      ],
    }),
  });

  const json = (await resp.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!resp.ok || !json.id) {
    return { ok: false, error: json.message || `HTTP ${resp.status}` };
  }

  // Persist the send so the webhook can stamp later events.
  const sb = db();
  await sb.from("outreach_emails").insert({
    prospect_id: args.prospect.id,
    subject: args.subject,
    body: args.html,
    template_id: args.templateId,
    external_id: json.id,
    delivered_at: new Date().toISOString(),
    raw_payload: { from, to: args.to, reply_to: replyTo },
  });

  return { ok: true, resendId: json.id };
}
