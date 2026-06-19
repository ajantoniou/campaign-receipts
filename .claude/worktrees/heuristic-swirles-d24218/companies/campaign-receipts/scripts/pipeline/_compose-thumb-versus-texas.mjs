#!/usr/bin/env node
/**
 * _compose-thumb-versus-texas.mjs — VS-collision thumbnail with a TEXAS banner.
 *
 * Built for: "$110 Million Hit Texas. The Biggest Checks Lost. Paxton Won 64%."
 * Founder hard reqs (2026-06-01):
 *   1. The word TEXAS must appear prominently.
 *   2. BILLIONAIRE DONOR (money side) VS PAXTON head-to-head collision — not solo.
 *   3. Read as VIRAL at 246x138 px: one giant number, high contrast, instant gap.
 *
 * Why a new one-off (not the Rabb _compose-thumb-2face.mjs):
 *   - 2face had no TEXAS banner and no WON/LOST asymmetry.
 *   - The loser side here is a billionaire DONOR (caricature on cream), the
 *     winner side a politician (photo). We duotone both sides into solid color
 *     blocks (red=loser, blue=winner) so a line-drawing caricature and a photo
 *     read as matched shapes at feed size instead of clashing.
 *   - Asymmetric stamps: red LOST over the donor, gold WON 64% over Paxton.
 *
 * Promote to a real template (cr-new-news-versus-state) if it proves out.
 *
 * Usage:
 *   node _compose-thumb-versus-texas.mjs \
 *     --left  /abs/john-nau.png   --leftLabel  "BILLIONAIRE DONOR" \
 *     --right /abs/ken-paxton.jpg --rightLabel "PAXTON" \
 *     --banner "TEXAS" \
 *     --number "$39.3M" \
 *     --leftStamp LOST --rightStamp "WON 64%" \
 *     --out /abs/thumbnail.jpg
 */
import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { args[argv[i].slice(2)] = argv[i + 1]; i++; }
  }
  return args;
}

async function fileToDataUri(path) {
  if (!path || !existsSync(path)) return null;
  const fs = await import("node:fs/promises");
  const buf = await fs.readFile(path);
  const ext = path.split(".").pop().toLowerCase();
  const mime = ext === "png" ? "image/png" : (ext === "jpg" || ext === "jpeg") ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function html({ leftUri, rightUri, leftLabel, rightLabel, banner, number, leftStamp, rightStamp, leftPos, rightPos }) {
  const navy = "#0a1f3d";
  const cream = "#f5ecd7";
  const gold = "#e0b53e";
  const civicRed = "#c0392b";
  const deepRed = "#7a1f15";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  @import url("https://fonts.googleapis.com/css2?family=Archivo+Black&family=Anton&display=swap");
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1280px; height: 720px; overflow: hidden; }
  body { background: ${navy}; color: ${cream}; font-family: "Archivo Black", sans-serif; position: relative; }

  /* ---- Two portrait halves, angled split ---- */
  .portrait { position: absolute; top: 0; width: 560px; height: 720px; overflow: hidden; z-index: 1; }
  .portrait.left  { left: 0;  clip-path: polygon(0 0, 100% 0, 86% 100%, 0 100%); }
  .portrait.right { right: 0; clip-path: polygon(14% 0, 100% 0, 100% 100%, 0 100%); }
  .portrait img { width: 100%; height: 100%; object-fit: cover; }
  .portrait.left  img { object-position: ${leftPos || "center 28%"}; }
  .portrait.right img { object-position: ${rightPos || "center 22%"}; }

  /* Duotone washes: loser=red, winner=navy/blue. Unifies caricature + photo. */
  .portrait.left::before {
    content: ""; position: absolute; inset: 0; z-index: 2;
    background: linear-gradient(150deg, rgba(122,31,21,0.30) 0%, rgba(192,57,43,0.55) 70%, rgba(122,31,21,0.85) 100%);
    mix-blend-mode: multiply;
  }
  .portrait.right::before {
    content: ""; position: absolute; inset: 0; z-index: 2;
    background: linear-gradient(210deg, rgba(10,31,61,0.25) 0%, rgba(10,31,61,0.45) 70%, rgba(10,31,61,0.85) 100%);
    mix-blend-mode: multiply;
  }
  /* fade the inner edges toward the center spine */
  .portrait.left::after {
    content: ""; position: absolute; inset: 0; z-index: 3;
    background: linear-gradient(to right, rgba(10,31,61,0) 55%, rgba(10,31,61,0.95) 100%);
  }
  .portrait.right::after {
    content: ""; position: absolute; inset: 0; z-index: 3;
    background: linear-gradient(to left, rgba(10,31,61,0) 55%, rgba(10,31,61,0.95) 100%);
  }

  /* Center dark spine */
  .spine { position: absolute; left: 50%; top: 0; transform: translateX(-50%);
    width: 470px; height: 720px;
    background: radial-gradient(ellipse 60% 70% at center, rgba(10,31,61,0.99) 0%, rgba(10,31,61,0.92) 55%, rgba(10,31,61,0) 100%);
    z-index: 4; }

  /* ---- TEXAS banner across the top ---- */
  .banner {
    position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
    font-family: "Anton", sans-serif; font-size: 132px; line-height: 0.9;
    letter-spacing: 0.06em; color: ${gold};
    -webkit-text-stroke: 3px ${navy};
    text-shadow: 0 6px 0 ${deepRed}, 0 9px 22px rgba(0,0,0,0.8);
    z-index: 8; white-space: nowrap;
  }

  /* ---- Center number + VS ---- */
  .center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -42%);
    width: 720px; text-align: center; z-index: 7; }
  .number {
    font-family: "Anton", sans-serif; font-size: 150px; line-height: 0.84;
    letter-spacing: -0.01em; color: ${cream}; white-space: nowrap;
    text-shadow: 0 0 36px rgba(0,0,0,0.95), 0 8px 22px rgba(0,0,0,0.9), 0 0 3px #000, 0 0 60px rgba(0,0,0,0.85);
  }
  .numlabel {
    font-family: "Archivo Black", sans-serif; font-size: 38px; letter-spacing: 0.10em;
    color: ${gold}; text-transform: uppercase; margin-top: 6px;
    text-shadow: 0 3px 12px rgba(0,0,0,0.85);
  }

  /* big VS badge sitting on the spine */
  .vs {
    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-4deg);
    font-family: "Anton", sans-serif; font-size: 96px; color: ${civicRed};
    -webkit-text-stroke: 4px ${cream};
    text-shadow: 0 6px 18px rgba(0,0,0,0.9); z-index: 9;
    display: none; /* number is the dominant idea; VS lives in the labels */
  }

  /* ---- Name labels along the bottom ---- */
  .label { position: absolute; bottom: 22px; font-family: "Anton", sans-serif;
    letter-spacing: 0.04em; z-index: 8; text-shadow: 0 4px 14px rgba(0,0,0,0.9); }
  .label.left  { left: 30px;  text-align: left;  color: ${cream}; }
  .label.right { right: 30px; text-align: right; color: ${cream}; }
  .label .big  { font-size: 60px; line-height: 0.92; display: block; }
  .label .small{ font-family: "Archivo Black", sans-serif; font-size: 24px; letter-spacing: 0.08em;
    display: block; }
  .label.left  .small { color: ${civicRed}; }
  .label.right .small { color: ${gold}; }

  /* ---- Stamps ---- */
  .stamp { position: absolute; font-family: "Anton", sans-serif; text-transform: uppercase;
    padding: 6px 22px 4px; box-shadow: 0 6px 18px rgba(0,0,0,0.5); z-index: 10; }
  .stamp.lost { top: 250px; left: 56px; transform: rotate(-11deg);
    border: 7px solid ${civicRed}; color: ${civicRed}; background: rgba(245,236,215,0.95);
    font-size: 76px; letter-spacing: 0.06em; }
  .stamp.won  { top: 300px; right: 40px; transform: rotate(9deg);
    border: 7px solid ${gold}; color: ${navy}; background: ${gold};
    font-size: 60px; letter-spacing: 0.04em; }

  .corner { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
    font-family: "Archivo Black", sans-serif; font-size: 15px; letter-spacing: 0.28em;
    color: rgba(224,181,62,0.65); z-index: 8; }
</style></head>
<body>
  <div class="portrait left"><img src="${leftUri}" /></div>
  <div class="portrait right"><img src="${rightUri}" /></div>
  <div class="spine"></div>

  <div class="banner">${banner}</div>

  <div class="center">
    <div class="number">${number}</div>
    <div class="numlabel">BIGGEST CHECK</div>
  </div>
  <div class="vs">VS</div>

  <div class="stamp lost">${leftStamp}</div>
  <div class="stamp won">${rightStamp}</div>

  <div class="label left"><span class="big">${leftLabel}</span><span class="small">SPENT IT ALL</span></div>
  <div class="label right"><span class="big">${rightLabel}</span><span class="small">WON ANYWAY</span></div>

  <div class="corner">CAMPAIGN · RECEIPTS</div>
</body></html>`;
}

async function main() {
  const a = parseArgs();
  const out = resolve(a.out);
  await mkdir(dirname(out), { recursive: true });
  const leftUri  = await fileToDataUri(resolve(a.left));
  const rightUri = await fileToDataUri(resolve(a.right));
  if (!leftUri || !rightUri) { console.error("[compose] missing portrait(s)"); process.exit(2); }
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.setContent(html({
    leftUri, rightUri,
    leftLabel:  a.leftLabel  || "DONOR",
    rightLabel: a.rightLabel || "PAXTON",
    banner:     (a.banner || "TEXAS").toUpperCase(),
    number:     a.number || "$39.3M",
    leftStamp:  (a.leftStamp  || "LOST").toUpperCase(),
    rightStamp: (a.rightStamp || "WON").toUpperCase(),
    leftPos:    a.leftPos,
    rightPos:   a.rightPos,
  }), { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, type: "jpeg", quality: 92, fullPage: false });
  await browser.close();
  const fs = await import("node:fs/promises");
  const stat = await fs.stat(out);
  console.log(`[compose] saved ${(stat.size / 1024).toFixed(1)} KB → ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
