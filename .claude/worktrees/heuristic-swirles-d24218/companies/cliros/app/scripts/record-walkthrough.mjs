#!/usr/bin/env node
/* ─── Cliros walkthrough recorder ───
   Headless Playwright drives the local dashboard, captures ~30 frames
   at 1920×1080, then ffmpeg stitches into a 30s 30fps MP4 with text
   overlays and a final branded card.

   Replaces companies/cliros/app/public/welcome-video.mp4 in one shot.

   Usage:
     node scripts/record-walkthrough.mjs                 # full pipeline
     node scripts/record-walkthrough.mjs --capture-only  # frames only
     node scripts/record-walkthrough.mjs --stitch-only   # ffmpeg only

   Requires:
     - localhost:3000 dev server running (npm run dev)
     - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
     - ffmpeg on PATH (brew install ffmpeg)
*/

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, "..");
const FRAMES_DIR = path.join(APP_ROOT, "..", "marketing", "walkthrough-frames");
const OUT_MP4 = path.join(APP_ROOT, "public", "welcome-video.mp4");
const MARKETING_MP4 = path.join(APP_ROOT, "..", "marketing", "welcome-video.mp4");

dotenv.config({ path: path.join(APP_ROOT, ".env.local") });

const TARGET = process.env.WALKTHROUGH_BASE_URL || "http://localhost:3000";
const USER_EMAIL = "alex@antoniou.net";
// Known-good EIKHOFF report — avoids silent skip when DB query returns nothing
const FALLBACK_REPORT_ID = "87648f5f-c691-4198-8b4a-fe5f6859ae74";
const VIEWPORT = { width: 1920, height: 1080 };

const args = new Set(process.argv.slice(2));
const CAPTURE = !args.has("--stitch-only");
const STITCH = !args.has("--capture-only");

/* ─── 1. Capture frames ─── */

async function getAuthSession() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("missing supabase env in .env.local");
  const admin = createClient(url, serviceKey);
  const { data } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: USER_EMAIL,
    options: { redirectTo: `${TARGET}/dashboard` },
  });
  const r = await fetch(data.properties.action_link, { redirect: "manual" });
  const loc = r.headers.get("location") || "";
  const params = new URLSearchParams(loc.split("#")[1] || "");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const expiresAt = parseInt(params.get("expires_at") || "0");
  if (!accessToken) throw new Error("no access_token in magic-link redirect");
  const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64").toString());
  const ref = url.match(/https:\/\/([^.]+)/)[1];
  return {
    cookieKey: `sb-${ref}-auth-token`,
    cookieValue: encodeURIComponent(
      JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
        expires_at: expiresAt,
        token_type: "bearer",
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          aud: payload.aud,
          app_metadata: payload.app_metadata,
          user_metadata: payload.user_metadata,
        },
      })
    ),
  };
}

async function getAnyCompletedReportId() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const admin = createClient(url, serviceKey, { db: { schema: "cliros" } });
  const { data } = await admin
    .from("search_reports")
    .select("id")
    .or("status.eq.complete,pipeline_stage.eq.ready,pipeline_stage.eq.delivered,pipeline_stage.eq.blocked")
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0]?.id || null;
}

const HIDE_DEV_CSS = `
  [data-nextjs-toast], [data-nextjs-dialog-overlay], nextjs-portal,
  #__next-build-watcher, [data-nextjs-build-watcher],
  button[aria-label*="Dev Tools"], button[aria-label*="dev tools"],
  button[aria-label*="Issues"], [data-nextjs-dev-tools] {
    display: none !important; visibility: hidden !important;
  }
`;

async function capture() {
  if (existsSync(FRAMES_DIR)) rmSync(FRAMES_DIR, { recursive: true });
  mkdirSync(FRAMES_DIR, { recursive: true });

  console.log("[walkthrough] launching browser…");
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });

  const auth = await getAuthSession();
  const reportId =
    process.env.WALKTHROUGH_REPORT_ID ||
    (await getAnyCompletedReportId()) ||
    FALLBACK_REPORT_ID;
  console.log(`[walkthrough] auth ready (${USER_EMAIL}), report=${reportId}`);

  // Set cookie BEFORE first navigation so middleware sees the session
  await ctx.addCookies([
    {
      name: auth.cookieKey,
      value: auth.cookieValue,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  const page = await ctx.newPage();
  await page.addInitScript((css) => {
    const apply = () => {
      const s = document.createElement("style");
      s.textContent = css;
      document.head.appendChild(s);
    };
    if (document.head) apply();
    else document.addEventListener("DOMContentLoaded", apply);
  }, HIDE_DEV_CSS);

  let frameIdx = 0;
  const snap = async (label) => {
    frameIdx++;
    const fn = path.join(FRAMES_DIR, `frame-${String(frameIdx).padStart(3, "0")}-${label}.png`);
    await page.screenshot({ path: fn, fullPage: false });
    console.log(`  frame ${frameIdx}: ${label}`);
  };

  /* ── Scene 1: Dashboard home (2.5s hold = 3 frames at sub-Hz) ── */
  await page.goto(`${TARGET}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await snap("dashboard-home");

  /* ── Scene 2: New Search page ── */
  await page.click('a[href="/dashboard/new"]');
  await page.waitForTimeout(700);
  await snap("new-search-empty");

  /* ── Scene 3: Type an address ── */
  // Find the address input — try a few selectors
  const addrInput =
    (await page.$('input[placeholder*="property" i]')) ||
    (await page.$('input[placeholder*="address" i]')) ||
    (await page.$('input[type="text"]'));
  if (addrInput) {
    await addrInput.click();
    await addrInput.type("1394 Peachtree Battle Ave NW, Atlanta, GA 30318", { delay: 35 });
    await page.waitForTimeout(800);
    await snap("new-search-typed");
  }

  /* ── Scene 4: Reports list ── */
  await page.click('a[href="/dashboard/reports"]');
  await page.waitForTimeout(900);
  await snap("reports-list");

  /* ── Scene 5: Report detail (any completed report) ── */
  if (reportId) {
    await page.goto(`${TARGET}/dashboard/reports/${reportId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await snap("report-detail-top");
    // Scroll halfway to show chain/liens
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }));
    await page.waitForTimeout(500);
    await snap("report-detail-chain");
    await page.evaluate(() => window.scrollTo({ top: 1100, behavior: "instant" }));
    await page.waitForTimeout(500);
    await snap("report-detail-defects");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(300);
  }

  /* ── Scene 6: Billing page (packs) ── */
  await page.goto(`${TARGET}/dashboard/billing`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await snap("billing-top");
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: "instant" }));
  await page.waitForTimeout(300);
  await snap("billing-packs");

  /* ── Scene 7: Help & Docs ── */
  await page.goto(`${TARGET}/dashboard/help/documentation`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await snap("help-docs");

  await browser.close();
  console.log(`[walkthrough] captured ${frameIdx} frames into ${FRAMES_DIR}`);
}

/* ─── 2. Stitch frames into MP4 with text overlays + closing card ─── */

// Per-frame caption (matches the order produced by capture())
const CAPTIONS = [
  { label: "dashboard-home",       text: "Your Cliros dashboard — firm setup, dossiers, and reports" },
  { label: "new-search-empty",     text: "Step 1: Click 'New Search'" },
  { label: "new-search-typed",     text: "Step 2: Type any Georgia property address" },
  { label: "reports-list",         text: "Step 3: Every search lands here when finished" },
  { label: "report-detail-top",    text: "Each report — chain of title, liens, AOL draft" },
  { label: "report-detail-chain",  text: "Full chain of title (50-year examination)" },
  { label: "report-detail-defects",text: "Defects flagged with severity + recommendations" },
  { label: "billing-top",          text: "Run more — buy a pack starting at $250" },
  { label: "billing-packs",        text: "1 / 5 / 25 reports · $200 floor per report" },
  { label: "help-docs",            text: "Help docs answer 90% of questions instantly" },
];

const CAPTION_HOLD_SECONDS = 3.0;   // Each caption frame on screen for 3s
const CLOSING_SECONDS = 4.0;        // Final branded card duration
const FPS = 30;

function escapeFFText(s) {
  // ffmpeg drawtext requires escaping ' : \ %
  return s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%");
}

/* Use Playwright to render a caption strip as PNG, then ffmpeg overlays
 * it on top of each frame. Homebrew's ffmpeg ships without drawtext, so
 * we generate the text in Chromium where typography actually works. */
async function renderCaptionStrip(text, outPath) {
  const STRIP_H = 120;
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: STRIP_H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  await page.setContent(`<!DOCTYPE html><html><head><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700&display=swap');
    html,body { margin:0; padding:0; width:1920px; height:${STRIP_H}px; background:transparent; }
    .strip {
      width:1920px; height:${STRIP_H}px;
      display:flex; align-items:center; justify-content:center;
      background:rgba(20,20,20,0.92);
      font-family:'Inter',system-ui,sans-serif;
      font-size:38px; font-weight:600;
      color:#FFFFFF; letter-spacing:0.2px;
      padding:0 80px;
      text-align:center;
      box-sizing:border-box;
    }
  </style></head><body><div class="strip">${safe}</div></body></html>`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800); // let webfont actually load
  await page.screenshot({ path: outPath, omitBackground: true });
  await browser.close();
}

async function renderClosingCard(outPath) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(`<!DOCTYPE html><html><head><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Cormorant+Garamond:wght@500;600;700&display=swap');
    html,body { margin:0; padding:0; width:1920px; height:1080px; background:#FAF8F3; font-family:'Inter',sans-serif; color:#1A1A1A; }
    .frame { position:absolute; inset:80px; border:2.5px solid #1A1A1A; }
    .frame-inner { position:absolute; inset:96px; border:0.75px solid #1A1A1A; }
    .content { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0; }
    .icon { width:280px; height:auto; margin-bottom:24px; }
    .wordmark { font-family:'Cormorant Garamond',Georgia,serif; font-size:184px; font-weight:600; letter-spacing:22px; line-height:1; margin:24px 0 16px; }
    .label { font-family:'Inter',sans-serif; font-size:32px; font-weight:600; letter-spacing:8px; text-transform:uppercase; }
    .tagline { font-family:'Cormorant Garamond',Georgia,serif; font-style:italic; font-size:28px; opacity:0.7; margin-top:14px; letter-spacing:2px; }
    .email { font-family:'Inter',sans-serif; font-size:30px; margin-top:60px; padding:14px 28px; border:1.5px solid #1A1A1A; }
  </style></head><body>
    <div class="frame"></div>
    <div class="frame-inner"></div>
    <div class="content">
      <svg class="icon" viewBox="0 0 360 344">
        <g fill="#1A1A1A">
          <polygon points="180,0 0,72 360,72"/>
          <polygon points="180,16 24,80 336,80" fill="#FAF8F3"/>
          <polygon points="180,28 36,84 324,84"/>
          <g transform="translate(180, 56)">
            <polygon points="0,-14 4,-4 14,-4 6,3 9,13 0,7 -9,13 -6,3 -14,-4 -4,-4" fill="#FAF8F3"/>
          </g>
          <rect x="0" y="84" width="360" height="6"/><rect x="6" y="92" width="348" height="3"/>
          <rect x="0" y="116" width="360" height="3"/>
          <rect x="44" y="122" width="52" height="6"/><polygon points="50,128 90,128 84,140 56,140"/>
          <rect x="264" y="122" width="52" height="6"/><polygon points="270,128 310,128 304,140 276,140"/>
          <rect x="56" y="140" width="28" height="160"/><rect x="276" y="140" width="28" height="160"/>
          <polygon points="56,300 84,300 90,312 50,312"/><rect x="44" y="312" width="52" height="6"/>
          <polygon points="276,300 304,300 310,312 270,312"/><rect x="264" y="312" width="52" height="6"/>
          <rect x="20" y="320" width="320" height="6"/><rect x="10" y="328" width="340" height="6"/>
          <rect x="0" y="336" width="360" height="8"/>
        </g>
      </svg>
      <div class="wordmark">CLIROS</div>
      <div class="label">Property Title Search Reports</div>
      <div class="tagline">State of Georgia · Delivered in minutes</div>
      <div class="email">alex@cliros.ai</div>
    </div>
  </body></html>`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500); // let webfonts load
  await page.screenshot({ path: outPath, fullPage: false });
  await browser.close();
}

async function stitch() {
  if (!existsSync(FRAMES_DIR)) throw new Error(`no frames dir at ${FRAMES_DIR} — run capture first`);
  const frames = readdirSync(FRAMES_DIR)
    .filter((f) => f.endsWith(".png") && f.startsWith("frame-"))
    .sort();
  if (frames.length === 0) throw new Error("no frames captured");
  console.log(`[walkthrough] stitching ${frames.length} frames`);

  const tmpDir = path.join(FRAMES_DIR, "..", "walkthrough-staged");
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });
  mkdirSync(tmpDir, { recursive: true });

  // 1. Pre-render all caption strips via Playwright
  console.log("[walkthrough] rendering caption strips…");
  const captionPngs = [];
  for (let i = 0; i < frames.length; i++) {
    const cap = CAPTIONS[i]?.text;
    if (!cap) { captionPngs.push(null); continue; }
    const capPath = path.join(tmpDir, `caption-${String(i + 1).padStart(2, "0")}.png`);
    await renderCaptionStrip(cap, capPath);
    captionPngs.push(capPath);
  }

  // 2. Build per-frame clips by overlaying caption on the screenshot
  const clipPaths = [];
  frames.forEach((frame, i) => {
    const clipOut = path.join(tmpDir, `clip-${String(i + 1).padStart(2, "0")}.mp4`);
    const framePath = path.join(FRAMES_DIR, frame);
    const capPath = captionPngs[i];
    const inputs = capPath
      ? ["-loop", "1", "-i", framePath, "-loop", "1", "-i", capPath]
      : ["-loop", "1", "-i", framePath];
    // Position caption strip at y=920 (60px above bottom on 1080p)
    const filter = capPath
      ? "[0:v]scale=1920:1080:flags=lanczos[bg];[bg][1:v]overlay=0:920,format=yuv420p"
      : "[0:v]scale=1920:1080:flags=lanczos,format=yuv420p";
    spawnSync("ffmpeg", [
      "-y", "-loglevel", "error",
      ...inputs,
      "-t", String(CAPTION_HOLD_SECONDS),
      "-filter_complex", filter,
      "-r", String(FPS),
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "20",
      "-pix_fmt", "yuv420p",
      clipOut,
    ], { stdio: "inherit" });
    clipPaths.push(clipOut);
  });

  // 3. Closing card
  console.log("[walkthrough] rendering closing card…");
  const closingPng = path.join(tmpDir, "closing.png");
  await renderClosingCard(closingPng);
  const closingMp4 = path.join(tmpDir, "clip-99-closing.mp4");
  spawnSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-loop", "1", "-i", closingPng,
    "-t", String(CLOSING_SECONDS),
    "-vf", "scale=1920:1080:flags=lanczos,format=yuv420p",
    "-r", String(FPS),
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    closingMp4,
  ], { stdio: "inherit" });
  clipPaths.push(closingMp4);

  // 4. Concat
  const concatList = path.join(tmpDir, "concat.txt");
  writeFileSync(concatList, clipPaths.map((p) => `file '${p}'`).join("\n"));
  const concatResult = spawnSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0",
    "-i", concatList,
    "-c", "copy",
    OUT_MP4,
  ], { stdio: "inherit" });
  if (concatResult.status !== 0) {
    throw new Error(`ffmpeg concat failed with status ${concatResult.status}`);
  }

  spawnSync("cp", [OUT_MP4, MARKETING_MP4], { stdio: "inherit" });
  const stat = statSync(OUT_MP4);
  console.log(`[walkthrough] DONE — wrote ${OUT_MP4} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
}

/* ─── Main ─── */

(async () => {
  try {
    if (CAPTURE) await capture();
    if (STITCH) await stitch();
  } catch (err) {
    console.error("[walkthrough] FATAL:", err);
    process.exit(1);
  }
})();
