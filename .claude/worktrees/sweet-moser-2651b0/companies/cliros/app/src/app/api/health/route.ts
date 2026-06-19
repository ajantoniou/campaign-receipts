/* ─── Health Check ───
   GET /api/health — verifies Supabase connectivity and required env vars
*/

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  const checks: Record<string, boolean> = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    gsccca_creds: !!process.env.GSCCCA_USERNAME && !!process.env.GSCCCA_PASSWORD,
    anthropic_key: !!process.env.ANTHROPIC_API_KEY,
    lemonsqueezy_key: !!process.env.LEMONSQUEEZY_API_KEY,
    supabase_connection: false,
  };

  // Test Supabase connectivity
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("users").select("id").limit(1);
    checks.supabase_connection = !error;
  } catch {
    checks.supabase_connection = false;
  }

  const allHealthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
