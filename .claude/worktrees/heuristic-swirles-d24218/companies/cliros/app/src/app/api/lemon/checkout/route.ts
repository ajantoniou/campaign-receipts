/* ─── LemonSqueezy Checkout Session Creator ─── */
/* POST /api/lemon/checkout { reportId, address }
   Creates a LemonSqueezy Checkout for $200 report purchase.
   Requires authenticated user who has exceeded free trial.
   Note: Route path now at /api/lemon/checkout.
*/

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createReportCheckout } from "@/lib/lemonsqueezy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, address } = body;

    if (!reportId || !address) {
      return NextResponse.json(
        { error: "reportId and address are required" },
        { status: 400 }
      );
    }

    // Authenticate user
    let userId: string | null = null;
    let userEmail: string | null = null;

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const { createClient } = await import("@supabase/supabase-js");

      // Try Bearer token first (API clients)
      const authHeader = request.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const tempClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data } = await tempClient.auth.getUser();
        userId = data?.user?.id || null;
        userEmail = data?.user?.email || null;
      }

      // Fallback to cookie auth (browser/dashboard)
      if (!userId) {
        const ref = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || "";
        const cookieStr = request.headers.get("cookie") || "";
        const tokenMatch = cookieStr.match(new RegExp(`sb-${ref}-auth-token(?:\\.0)?=([^;]+)`));
        if (tokenMatch) {
          const decoded = decodeURIComponent(tokenMatch[1]);
          const parsed = JSON.parse(decoded);
          if (parsed?.access_token) {
            const tempClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
              global: { headers: { Authorization: `Bearer ${parsed.access_token}` } },
            });
            const { data } = await tempClient.auth.getUser();
            userId = data?.user?.id || null;
            userEmail = data?.user?.email || null;
          }
        }
      }
    } catch {
      // Auth failed
    }

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create LemonSqueezy checkout
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { url } = await createReportCheckout({
      userId,
      reportId,
      address,
      userEmail,
      successUrl: `${siteUrl}/dashboard/reports/${reportId}?payment=success`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[LemonSqueezy Checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
