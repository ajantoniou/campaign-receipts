/* ─── Capture Hero Image for Beta Cold Email ───
   Spawns headless Chromium, signs in as Alex via a Supabase magic link,
   navigates to a real "ready" report, screenshots the imagery + QC pills +
   download buttons region, then uploads to the public `cliros-marketing`
   bucket and prints the public URL.

   Usage:
     npx tsx scripts/capture_hero_image.ts                   # uses latest ready report
     npx tsx scripts/capture_hero_image.ts <report_id>       # specific report
     npx tsx scripts/capture_hero_image.ts --target https://cliros.ai  # default
     npx tsx scripts/capture_hero_image.ts --user alex@antoniou.net    # default

   Why headless Playwright + magic link (and not a static "/marketing/hero"
   route): the email needs a screenshot of a REAL dashboard with real data
   so the social proof is genuine. Magic link keeps Alex's credentials out
   of the script.

   Extend this — don't fork it. (founder script-bloat lock)
*/

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const TARGET = process.env.CLIROS_TARGET_URL || "https://cliros.ai";
const SIGNIN_EMAIL = process.env.CLIROS_HERO_USER || "alex@antoniou.net";
const BUCKET = "cliros-marketing";
const STORAGE_PATH = "beta-launch/hero-dashboard.png";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — source root .env first.");
  }

  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const explicitReportId = args[0];

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const clirosAdmin = createClient(url, serviceKey, { db: { schema: "cliros" }, auth: { persistSession: false } });

  let reportId = explicitReportId;
  if (!reportId) {
    const { data, error } = await clirosAdmin
      .from("search_reports")
      .select("id, created_at, property:properties(full_address)")
      .eq("pipeline_stage", "ready")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) throw new Error(`No ready report found: ${error?.message}`);
    reportId = data.id;
    const prop = Array.isArray(data.property) ? data.property[0] : data.property;
    console.log(`Using latest ready report ${reportId} (${prop?.full_address})`);
  } else {
    console.log(`Using explicit report ${reportId}`);
  }

  console.log(`Minting session for ${SIGNIN_EMAIL} via admin generateLink → verifyOtp…`);
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: SIGNIN_EMAIL,
  });
  if (linkErr || !linkData?.properties?.hashed_token) {
    throw new Error(`Could not generate magic link: ${linkErr?.message}`);
  }
  const hashedToken = linkData.properties.hashed_token;

  // Use the *anon* client to exchange the hashed_token for a real session.
  // This mirrors what Supabase Auth's hosted /verify endpoint does internally,
  // but bypasses the Site-URL redirect that was sending us to estimateproof.com.
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: sessionData, error: verifyErr } = await anon.auth.verifyOtp({
    type: "magiclink",
    token_hash: hashedToken,
  });
  if (verifyErr || !sessionData?.session) {
    throw new Error(`verifyOtp failed: ${verifyErr?.message}`);
  }
  const { access_token, refresh_token } = sessionData.session;
  console.log(`  → session minted (access_token ${access_token.length} chars)`);

  // ── Build @supabase/ssr cookies and pre-load them into the Playwright context.
  // @supabase/ssr serialises the session as `base64-<base64(JSON)>` under the
  // cookie `sb-<project_ref>-auth-token`. If the value exceeds ~3200 bytes it
  // gets chunked into `…-auth-token.0`, `…-auth-token.1`, etc.
  const projectRef = new URL(url).host.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const session = sessionData.session;
  const cookiePayload = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64");
  const CHUNK = 3180;
  const chunks: string[] = [];
  for (let i = 0; i < cookiePayload.length; i += CHUNK) {
    chunks.push(cookiePayload.slice(i, i + CHUNK));
  }
  const cookies = chunks.map((value, idx) => ({
    name: chunks.length > 1 ? `${cookieName}.${idx}` : cookieName,
    value,
    domain: new URL(TARGET).hostname,
    path: "/",
    httpOnly: false,
    secure: TARGET.startsWith("https"),
    sameSite: "Lax" as const,
    expires: Math.floor(Date.now() / 1000) + 3600,
  }));

  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    viewport: { width: 1320, height: 1600 },
    deviceScaleFactor: 2,
  });
  await ctx.addCookies(cookies);
  console.log(`  → wrote ${cookies.length} cookie chunk(s) for ${cookies[0].domain}`);
  const page = await ctx.newPage();

  console.log("Navigating to dashboard report…");
  await page.goto(`${TARGET}/dashboard/reports/${reportId}`, { waitUntil: "networkidle", timeout: 60_000 });

  console.log("Waiting for imagery + QC badges to render…");
  await page
    .waitForSelector('img[alt="Street View"], img[alt="Parcel Map"]', { timeout: 25_000 })
    .catch(() => console.warn("  (imagery selector timeout — continuing)"));
  await page
    .waitForFunction(() => Array.from(document.querySelectorAll("span")).some((s) => /QC Chain/i.test(s.textContent || "")), {
      timeout: 15_000,
    })
    .catch(() => console.warn("  (QC chain selector timeout — continuing)"));
  await page.waitForTimeout(2_500);

  const heroHandle = await page.evaluateHandle(() => {
    const all = Array.from(document.querySelectorAll<HTMLElement>("div.bg-white"));
    return all.find((el) => el.querySelector('img[alt="Street View"], img[alt="Parcel Map"]')) || null;
  });
  let buffer: Buffer | null = null;
  const heroEl = heroHandle.asElement();
  if (heroEl) {
    const box = await heroEl.boundingBox();
    if (box) {
      const fullDocCount = await page.evaluate(() => document.querySelectorAll("div.bg-white").length);
      const headerCard = await page.evaluateHandle(() => {
        const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h1.text-2xl"));
        const h1 = headings[0];
        return h1 ? h1.closest("div.bg-white") : null;
      });
      const headerEl = headerCard.asElement();
      if (headerEl) {
        const hb = await headerEl.boundingBox();
        if (hb) {
          const x = Math.max(0, Math.min(box.x, hb.x) - 16);
          const y = Math.max(0, box.y - 16);
          const right = Math.max(box.x + box.width, hb.x + hb.width);
          const bottom = hb.y + hb.height;
          const width = Math.min(1320 - x, right - x + 16);
          const height = bottom - y + 16;
          console.log(`  capturing hero region ${Math.round(width)}x${Math.round(height)} at (${Math.round(x)},${Math.round(y)}) of ${fullDocCount} cards`);
          buffer = await page.screenshot({
            clip: { x, y, width, height },
            type: "png",
          });
        }
      }
    }
  }
  if (!buffer) {
    console.warn("Hero region not found — falling back to full-viewport screenshot.");
    buffer = await page.screenshot({ type: "png" });
  }

  const outDir = path.resolve(process.cwd(), "..", "marketing", "beta-launch");
  fs.mkdirSync(outDir, { recursive: true });
  const localPath = path.join(outDir, "hero-dashboard.png");
  fs.writeFileSync(localPath, buffer);
  console.log(`  saved local copy → ${localPath} (${(buffer.length / 1024).toFixed(1)} KB)`);

  console.log(`Uploading to storage bucket "${BUCKET}" → ${STORAGE_PATH}…`);
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(STORAGE_PATH, buffer, { contentType: "image/png", upsert: true });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  const { data: pubData } = admin.storage.from(BUCKET).getPublicUrl(STORAGE_PATH);
  console.log("");
  console.log("================================================================");
  console.log(`HERO URL: ${pubData.publicUrl}`);
  console.log("================================================================");

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
