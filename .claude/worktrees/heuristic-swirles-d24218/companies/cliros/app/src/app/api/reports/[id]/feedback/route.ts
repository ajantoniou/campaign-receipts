/* POST /api/reports/[id]/feedback
   Beta-only feedback widget. Saves to cliros.beta_feedback and emails Alex
   via Resend so we see new feedback without polling the dashboard.

   Body: { rating: 'up'|'down'|'neutral', comment?: string }
   Returns: { ok: true } on success.
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Routes to alex@cliros.ai (forwards to antonioualfred-cliros@gmail.com).
// Override via CLIROS_FEEDBACK_EMAIL env if the forwarder changes.
const FEEDBACK_TO = process.env.CLIROS_FEEDBACK_EMAIL || "alex@cliros.ai";
const FROM = process.env.RESEND_FROM || "team@healthbrew.com";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  const body = await request.json().catch(() => ({}));
  const rating = (body.rating as string) || "neutral";
  const comment = ((body.comment as string) || "").trim().slice(0, 4000);

  if (!["up", "down", "neutral"].includes(rating)) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }
  if (rating === "neutral" && !comment) {
    return NextResponse.json({ error: "Please leave a thumbs up/down or a comment" }, { status: 400 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );

  // Pull report context so the email Alex gets is actually useful.
  const { data: report } = await db
    .from("search_reports")
    .select("id, pipeline_stage, panel_verdict, ai_spend_cents, property:properties(full_address, county)")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const { data: inserted, error: insertErr } = await db
    .from("beta_feedback")
    .insert({
      report_id: reportId,
      user_id: user.id,
      rating,
      comment: comment || null,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("[feedback] insert failed:", insertErr);
    return NextResponse.json({ error: "Could not save feedback" }, { status: 500 });
  }

  // Fire-and-forget notification to Alex. Failure here doesn't block the user.
  const resendKey = process.env.RESEND_API_KEY;
  const property = Array.isArray(report.property) ? report.property[0] : report.property;
  if (resendKey) {
    try {
      const ratingEmoji = rating === "up" ? "👍" : rating === "down" ? "👎" : "💬";
      const subject = `[Cliros beta] ${ratingEmoji} ${property?.full_address || "report"} feedback`;
      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;color:#0f172a;">
          <h2 style="font-size:18px;margin:0 0 12px;">New beta feedback ${ratingEmoji}</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 8px;color:#64748b;">User</td><td style="padding:4px 8px;">${user.email || user.id}</td></tr>
            <tr><td style="padding:4px 8px;color:#64748b;">Property</td><td style="padding:4px 8px;">${property?.full_address || "(unknown)"}</td></tr>
            <tr><td style="padding:4px 8px;color:#64748b;">Stage</td><td style="padding:4px 8px;">${report.pipeline_stage}</td></tr>
            <tr><td style="padding:4px 8px;color:#64748b;">Panel verdict</td><td style="padding:4px 8px;">${report.panel_verdict ?? "—"}</td></tr>
            <tr><td style="padding:4px 8px;color:#64748b;">AI spend</td><td style="padding:4px 8px;">$${((report.ai_spend_cents ?? 0) / 100).toFixed(2)}</td></tr>
            <tr><td style="padding:4px 8px;color:#64748b;">Rating</td><td style="padding:4px 8px;font-weight:600;">${rating}</td></tr>
          </table>
          ${comment ? `<div style="margin-top:14px;padding:12px 14px;border-left:3px solid #0ea5e9;background:#f0f9ff;border-radius:4px;white-space:pre-wrap;">${escapeHtml(comment)}</div>` : ""}
          <p style="margin-top:18px;font-size:13px;color:#64748b;">
            <a href="https://cliros.ai/dashboard/reports/${reportId}" style="color:#0ea5e9;">Open report →</a>
          </p>
        </div>
      `;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: FEEDBACK_TO,
          reply_to: user.email || undefined,
          subject,
          html,
        }),
      });
      if (res.ok) {
        await db
          .from("beta_feedback")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("id", inserted.id);
      } else {
        const txt = await res.text().catch(() => "");
        console.error("[feedback] resend failed:", res.status, txt.slice(0, 200));
      }
    } catch (err) {
      console.error("[feedback] notify error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] || c));
}
