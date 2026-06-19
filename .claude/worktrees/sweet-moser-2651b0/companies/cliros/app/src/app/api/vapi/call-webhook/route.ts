/**
 * POST /api/vapi/call-webhook — Caroline's post-call follow-up.
 *
 * On the VAPI end-of-call-report, if the attorney confirmed an email (or we have
 * the dialed number), send the Founding-Attorney self-serve signup link by BOTH
 * channels: Resend email + Twilio SMS. We NEVER create an account on the call —
 * the message carries the self-serve /signup link; they sign up themselves.
 *
 * Mirrors the proven EstimateProof James webhook (email+SMS), rebranded for
 * Cliros + Caroline + the Founding-Attorney offer.
 *
 * Auth: shared secret in the `x-vapi-secret` header (CLIROS_VAPI_WEBHOOK_SECRET),
 * matching the secret configured on Caroline's assistant server settings.
 * Idempotent: a prospect already stamped signup_link_sent_at is not re-sent.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = process.env.RESEND_FROM || "Alex Antoniou <alex@cliros.ai>";
const REPLY_TO = "alex@cliros.ai";
const SITE = process.env.CLIROS_SITE_URL || "https://cliros.ai";
const FOUNDER_PHONE = "(770) 404-7590"; // Caroline / Cliros line

function isEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.trim());
}
function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );
}
// E.164 US normalize for SMS (the dialed number may arrive as +1NXXNXXXXXX).
function e164(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const d = s.replace(/[^\d+]/g, "");
  if (/^\+1\d{10}$/.test(d)) return d;
  const digits = d.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function signupUrl(ref: string) {
  return `${SITE}/signup?ref=${encodeURIComponent(ref)}`;
}

/**
 * Validate a spoken address against the Google Geocoding API and require it to
 * resolve to a GEORGIA street address. Returns the formatted address + place id,
 * or null if Google can't confidently match a GA address (so we don't run a real
 * GSCCCA search on a garbled/out-of-state address). Best-effort: on any error or
 * missing key, returns null and the request is flagged address_invalid for review.
 */
async function validateGaAddress(
  raw: string,
): Promise<{ formatted: string; placeId: string } | null> {
  const key =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      raw + (/\bGA\b|georgia/i.test(raw) ? "" : ", GA"),
    )}&components=administrative_area:GA|country:US&key=${key}`;
    const r = await fetch(url);
    const j = (await r.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        place_id?: string;
        types?: string[];
        address_components?: Array<{ short_name?: string; types?: string[] }>;
      }>;
    };
    if (j.status !== "OK" || !j.results?.length) return null;
    const hit = j.results[0];
    // Require GA + a street-level result (has a street number), not a city/zip centroid.
    const inGA = hit.address_components?.some(
      (c) => c.types?.includes("administrative_area_level_1") && c.short_name === "GA",
    );
    const hasStreet =
      hit.types?.includes("street_address") ||
      hit.types?.includes("premise") ||
      hit.types?.includes("subpremise") ||
      hit.address_components?.some((c) => c.types?.includes("street_number"));
    if (!inGA || !hasStreet || !hit.formatted_address || !hit.place_id) return null;
    return { formatted: hit.formatted_address, placeId: hit.place_id };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.CLIROS_VAPI_WEBHOOK_SECRET?.trim();
  if (secret) {
    const hdr = request.headers.get("x-vapi-secret")?.trim();
    if (hdr !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const message = (payload?.message ?? payload) as Record<string, unknown> | undefined;
  const type = message?.type as string | undefined;
  if (type !== "end-of-call-report") {
    return NextResponse.json({ received: type ?? "unknown" });
  }

  const analysis = (message?.analysis ?? {}) as Record<string, unknown>;
  const structured = (analysis?.structuredData ?? {}) as Record<string, unknown>;
  const customer = (message?.customer ?? {}) as Record<string, unknown>;

  const email =
    [structured.firm_email, structured.email, structured.attorney_email, customer.email].find(isEmail) ?? null;
  const phone = e164(customer.number);
  const rawAddress =
    typeof structured.property_address === "string" ? structured.property_address.trim() : "";

  if (!email && !phone) {
    return NextResponse.json({ received: type, action: "no_contact_captured" });
  }

  const sb = db();

  // Find the prospect by the dialed number (we placed the call, so customer.number
  // is the prospect's phone). Used for idempotency + funnel stamping + ref code.
  type ProspectRow = { id: string; attorney_first_name: string | null; signup_link_sent_at?: string | null };
  let prospect: ProspectRow | null = null;
  if (phone) {
    const last10 = phone.slice(-10);
    const { data } = await sb
      .from("prospects")
      .select("id, attorney_first_name, signup_link_sent_at, phone")
      .ilike("phone", `%${last10}%`)
      .limit(1)
      .maybeSingle();
    prospect = (data as unknown as ProspectRow) ?? null;
  }

  const firstName = (prospect?.attorney_first_name || "").trim();
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

  // ── DO-IT-FOR-THEM PATH ──
  // If the attorney gave a firm email AND a property address, validate the
  // address (Google) and queue a free founding report. A worker runs it and,
  // on QC pass, emails them the magic-link "report ready" email. Here we just
  // capture + validate + acknowledge ("we're running it now"). Capped downstream.
  if (email && rawAddress && rawAddress.length >= 8) {
    const validated = await validateGaAddress(rawAddress);
    const { data: inserted, error: insErr } = await sb
      .from("founding_report_requests")
      .insert({
        prospect_id: prospect?.id ?? null,
        firm_email: email.trim().toLowerCase(),
        raw_address: rawAddress,
        validated_address: validated?.formatted ?? null,
        google_place_id: validated?.placeId ?? null,
        formatted_address: validated?.formatted ?? null,
        status: validated ? "address_valid" : "address_invalid",
        status_detail: validated ? "google-validated" : "google could not match a GA address",
        source: "caroline_call",
        validated_at: validated ? new Date().toISOString() : null,
      })
      .select("id, status")
      .maybeSingle();

    // Stamp the prospect funnel (intent captured — strongest signal we get).
    if (prospect) {
      await sb
        .from("prospects")
        .update({
          outreach_status: "contacted",
          outreach_stage: 2,
          last_contacted_at: new Date().toISOString(),
          notes: `Caroline call → free report requested (${validated ? "addr ok" : "addr unverified"})`,
        })
        .eq("id", prospect.id);
    }

    // Acknowledge by email so they know it's coming (the magic-link "ready"
    // email is sent later by the worker after the report passes QC).
    if (process.env.RESEND_API_KEY && !insErr) {
      const ackText = `${greeting}

Thank you for the call — I'm running your free Cliros title report now on:
${validated?.formatted ?? rawAddress}

I'll pull the chain of title, liens, and a draft Fannie Mae B7-2-06 opinion letter, double-check it, and email you the moment it's ready — you'll just click a link to sign in (no password to set up front) and it'll be waiting in your dashboard, on your letterhead.

You're also set up as a Cliros Founding Attorney: ten more full closing reports, free. All we ask is a quick note of feedback after each.

A quick honest note: Cliros is informational title research and document assembly — a draft for your review and signature, not title insurance and not a substitute for your legal judgment. You always review and sign.

Questions? Just reply or call me at ${FOUNDER_PHONE}.

— Alex
Founder, Cliros`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to: [email.trim().toLowerCase()],
          reply_to: REPLY_TO,
          subject: "Cliros — running your free title report now",
          text: ackText,
          html: ackText.split("\n\n").map((p) => `<p style="margin:0 0 14px;line-height:1.55;color:#2A2622;font-size:15px">${p.replace(/\n/g, "<br>")}</p>`).join(""),
          tags: [{ name: "campaign", value: "caroline-founding-ack" }],
        }),
      }).catch((e) => console.warn("[vapi/call-webhook] ack email failed", e));
    }

    return NextResponse.json({
      received: type,
      action: "founding_report_queued",
      requestId: inserted?.id ?? null,
      addressValidated: !!validated,
      prospectId: prospect?.id ?? null,
    });
  }

  // ── LINK-ONLY PATH (no address) — send the self-serve signup link. ──
  // Idempotency: don't re-send if this prospect already got the link.
  if (prospect?.signup_link_sent_at) {
    return NextResponse.json({ received: type, action: "already_sent", prospectId: prospect.id });
  }
  const ref = prospect ? `CALL-${prospect.id.slice(0, 8)}` : "CALL";
  const url = signupUrl(ref);

  const smsBody =
    `Cliros — great talking with you. As a Founding Attorney you get 10 full closing reports ` +
    `FREE (about a $2,000 value), all we ask is a quick note of feedback after each. ` +
    `Sign up here: ${url} — Alex, ${FOUNDER_PHONE}`;

  const emailSubject = "Cliros — your Founding Attorney link from our call";
  const emailText = `${greeting}

Thank you for taking my call. As promised, here's the link to get set up as a Cliros Founding Attorney.

What that means: ten full Georgia closing reports, end to end, completely free — about a $2,000 value. All we ask in return is a quick note of feedback after each run, so we can keep making it better for you.

Set up your account (no card, no password — we send a magic link):
${url}

A quick, honest note on what Cliros is: it's informational title research and document assembly that hands you a draft closing package — title search, a draft Fannie Mae B7-2-06 opinion letter, the curative action plan, and the supporting documents — on your own letterhead, ready for YOUR review and signature. It is not title insurance and not a substitute for your legal judgment. You always review and sign.

Run one on a real, live file and see the draft for yourself. If anything's off, you tell me and I'll fix it.

Any questions, just reply to this email or call me at ${FOUNDER_PHONE}.

— Alex
Founder, Cliros`;

  const emailHtml = emailText
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 14px;line-height:1.55;color:#2A2622;font-size:15px">${p.replace(/\n/g, "<br>").replace(url, `<a href="${url}" style="color:#BA4A1F">${url}</a>`)}</p>`)
    .join("");

  let emailSent = false;
  let smsSent = false;

  // ── Email (Resend) ──
  if (email && process.env.RESEND_API_KEY) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [email.trim().toLowerCase()],
          reply_to: REPLY_TO,
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
          tracking: { opens: true, clicks: true },
          tags: [
            { name: "campaign", value: "caroline-vapi-followup" },
            ...(prospect ? [{ name: "prospect_id", value: prospect.id }] : []),
          ],
        }),
      });
      emailSent = resp.ok;
      if (resp.ok && prospect) {
        await sb.from("outreach_emails").insert({
          prospect_id: prospect.id,
          subject: emailSubject,
          body: emailHtml,
          template_id: "caroline-vapi-followup",
          delivered_at: new Date().toISOString(),
          raw_payload: { from: FROM, to: email, channel: "vapi_followup" },
        });
      }
    } catch (err) {
      console.warn("[vapi/call-webhook] email failed", err);
    }
  }

  // ── SMS (Twilio) ── to the dialed number.
  const twSid = process.env.TWILIO_ACCOUNT_SID;
  const twToken = process.env.TWILIO_AUTH_TOKEN;
  const twFrom = process.env.CLIROS_SMS_FROM_NUMBER || "+17704047590";
  if (phone && twSid && twToken) {
    try {
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${twSid}:${twToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, From: twFrom, Body: smsBody }),
      });
      smsSent = r.ok;
      if (!r.ok) console.warn("[vapi/call-webhook] sms failed", r.status, (await r.text()).slice(0, 200));
    } catch (err) {
      console.warn("[vapi/call-webhook] sms threw", err);
    }
  }

  // Stamp the prospect funnel — link sent, contacted, by which channels.
  if (prospect && (emailSent || smsSent)) {
    await sb
      .from("prospects")
      .update({
        outreach_status: "contacted",
        outreach_stage: 1,
        last_contacted_at: new Date().toISOString(),
        signup_link_sent_at: new Date().toISOString(),
        notes: `Caroline call → link sent (${[emailSent && "email", smsSent && "sms"].filter(Boolean).join("+")})`,
      })
      .eq("id", prospect.id);
  }

  return NextResponse.json({
    received: type,
    action: emailSent || smsSent ? "followup_sent" : "send_failed",
    emailSent,
    smsSent,
    prospectId: prospect?.id ?? null,
  });
}
