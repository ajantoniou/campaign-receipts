/* ─── Support Ticket Creation ───
   POST /api/support/ticket
   Body: { subject, body, page_context?, report_id?, attachments? }
   Returns: { ticket_id }

   Inserts row into cliros.support_tickets with status='new'. The triage
   cron (scripts/run_support_triage.ts) picks it up within 5 minutes and
   classifies + diagnoses. The cron also emails support@cliros.ai with the
   ticket + AI annotation for Alex's review.
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function getUserId(request: NextRequest): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Try Bearer token first
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const tempClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data } = await tempClient.auth.getUser();
    if (data?.user?.id) return data.user.id;
  }

  // Cookie fallback
  const ref = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || "";
  const cookieStr = request.headers.get("cookie") || "";
  const tokenMatch = cookieStr.match(new RegExp(`sb-${ref}-auth-token(?:\\.0)?=([^;]+)`));
  if (tokenMatch) {
    try {
      const decoded = decodeURIComponent(tokenMatch[1]);
      const parsed = JSON.parse(decoded);
      if (parsed?.access_token) {
        const tempClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${parsed.access_token}` } },
        });
        const { data } = await tempClient.auth.getUser();
        return data?.user?.id || null;
      }
    } catch {
      /* fall through */
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, body: ticketBody, page_context, report_id, attachments } = body;

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      return NextResponse.json({ error: "Subject is required (min 3 chars)" }, { status: 400 });
    }
    if (!ticketBody || typeof ticketBody !== "string" || ticketBody.trim().length < 5) {
      return NextResponse.json({ error: "Description is required (min 5 chars)" }, { status: 400 });
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: "cliros" }, auth: { persistSession: false } }
    );

    const { data, error } = await db
      .from("support_tickets")
      .insert({
        user_id: userId,
        report_id: report_id || null,
        subject: subject.trim().slice(0, 200),
        body: ticketBody.trim().slice(0, 10000),
        page_context: page_context ? String(page_context).slice(0, 500) : null,
        attachment_paths: Array.isArray(attachments) ? attachments.slice(0, 10) : [],
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[support] insert failed:", error);
      return NextResponse.json({ error: "Could not create ticket" }, { status: 500 });
    }

    return NextResponse.json({ ticket_id: data!.id, status: "received" });
  } catch (err) {
    console.error("[support] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: "cliros" }, auth: { persistSession: false } }
    );
    const { data } = await db
      .from("support_tickets")
      .select("id, subject, status, category, human_response, created_at, responded_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json({ tickets: data || [] });
  } catch (err) {
    console.error("[support] list error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
