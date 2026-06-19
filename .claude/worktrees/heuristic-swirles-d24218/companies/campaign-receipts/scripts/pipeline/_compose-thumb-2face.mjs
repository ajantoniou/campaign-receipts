#!/usr/bin/env node
/**
 * _compose-thumb-2face.mjs — one-off 2-portrait collision thumbnail for the
 * Rabb PA-3 episode. AOC (left, savior) vs Stanford (right, AIPAC-backed,
 * LOST stamp), $3.5M between them.
 *
 * Why a one-off: the cr-new-news template is single-portrait. Title is
 * "AOC Beat AIPAC's $3.5M Attack On Chris Rabb" — the thumbnail must
 * visualize that head-to-head action. After this ships and proves out we
 * promote this layout into generate-thumbnail.mjs as `cr-new-news-versus`.
 *
 * Usage:
 *   node _compose-thumb-2face.mjs \
 *     --left  /abs/aoc.jpg --leftLabel "AOC" \
 *     --right /abs/ala-stanford.jpg --rightLabel "AIPAC" \
 *     --centerNumber "$3.5M" \
 *     --headline "BEAT" \
 *     --subline "ON CHRIS RABB" \
 *     --stamp LOST \
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
    if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

async function fileToDataUri(path) {
  if (!path || !existsSync(path)) return null;
  const fs = await import("node:fs/promises");
  const buf = await fs.readFile(path);
  const ext = path.split(".").pop().toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function html({ leftUri, rightUri, leftLabel, rightLabel, centerNumber, headline, subline, stamp }) {
  const navy = "#0a1f3d";
  const cream = "#f5ecd7";
  const gold = "#b08a3e";
  const civicRed = "#a4243b";
  const stampBg = "rgba(245,236,215,0.94)";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  @import url("https://fonts.googleapis.com/css2?family=Archivo+Black&family=Instrument+Serif:ital@0;1&family=Lora:wght@700&family=IBM+Plex+Mono:wght@500&display=swap");
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1280px; height: 720px; overflow: hidden; }
  body {
    background: ${navy};
    color: ${cream};
    font-family: "Archivo Black", "Lora", Georgia, serif;
    position: relative;
  }
  .vignette {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%);
    pointer-events: none;
    z-index: 2;
  }
  .corner {
    position: absolute; top: 28px; right: 36px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 18px; letter-spacing: 0.22em; color: ${gold};
    z-index: 6;
  }
  /* Two portrait halves */
  .portrait {
    position: absolute; top: 0; width: 480px; height: 720px;
    overflow: hidden;
    z-index: 1;
  }
  .portrait.left  { left: 0; }
  .portrait.right { right: 0; }
  .portrait img {
    width: 100%; height: 100%; object-fit: cover;
    object-position: center 22%;
    filter: contrast(1.05) saturate(1.05);
  }
  .portrait.left::after, .portrait.right::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(to right, rgba(10,31,61,0.0) 0%, rgba(10,31,61,0.0) 55%, rgba(10,31,61,0.7) 100%);
  }
  .portrait.right::after {
    background: linear-gradient(to left, rgba(10,31,61,0.0) 0%, rgba(10,31,61,0.0) 55%, rgba(10,31,61,0.7) 100%);
  }
  /* Name tags under each portrait */
  .tag {
    position: absolute; bottom: 28px;
    font-family: "Archivo Black", sans-serif;
    font-size: 44px; letter-spacing: 0.04em;
    color: ${cream};
    text-shadow: 0 4px 14px rgba(0,0,0,0.65);
    z-index: 5;
  }
  .tag.left  { left: 32px; }
  .tag.right { right: 32px; }
  .tag.right .name { color: ${cream}; }
  /* Center block: number + headline */
  .center {
    position: absolute; left: 50%; top: 50%;
    transform: translate(-50%, -52%);
    width: 560px;
    text-align: center;
    z-index: 4;
  }
  .number {
    font-family: "Archivo Black", serif;
    font-size: 220px; line-height: 0.9;
    letter-spacing: -0.04em;
    color: ${cream};
    text-shadow:
      0 0 40px rgba(0,0,0,0.85),
      0 8px 24px rgba(0,0,0,0.7),
      0 0 2px rgba(0,0,0,1);
    margin-bottom: 4px;
  }
  .headline {
    font-family: "Archivo Black", sans-serif;
    font-size: 96px; line-height: 0.95;
    color: ${cream};
    letter-spacing: 0.02em;
    text-shadow: 0 6px 18px rgba(0,0,0,0.75);
    margin-bottom: 10px;
  }
  .subline {
    font-family: "Archivo Black", sans-serif;
    font-size: 36px; line-height: 1.05;
    color: ${gold};
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-shadow: 0 3px 10px rgba(0,0,0,0.7);
  }
  /* LOST stamp over right face */
  .stamp {
    position: absolute; top: 92px; right: 56px;
    transform: rotate(-12deg);
    border: 6px solid ${civicRed};
    color: ${civicRed};
    background: ${stampBg};
    padding: 10px 28px 6px;
    font-family: "Archivo Black", serif;
    font-size: 72px; letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 6px 18px rgba(0,0,0,0.4);
    z-index: 7;
  }
  .stamp::before {
    content: ""; position: absolute; inset: -4px;
    border: 1px dashed ${civicRed}; opacity: 0.5; pointer-events: none;
  }
  /* Center dark spine to anchor type */
  .spine {
    position: absolute; left: 50%; top: 0;
    transform: translateX(-50%);
    width: 360px; height: 720px;
    background: radial-gradient(ellipse at center, rgba(10,31,61,0.95) 0%, rgba(10,31,61,0.55) 70%, rgba(10,31,61,0) 100%);
    z-index: 3;
  }
</style></head>
<body>
  <div class="portrait left"><img src="${leftUri}" /></div>
  <div class="portrait right"><img src="${rightUri}" /></div>
  <div class="spine"></div>
  <div class="vignette"></div>
  <div class="corner">CR · NEW-NEWS</div>
  <div class="tag left"><span class="name">${leftLabel}</span></div>
  <div class="tag right"><span class="name">${rightLabel}</span></div>
  <div class="center">
    <div class="number">${centerNumber}</div>
    <div class="headline">${headline}</div>
    <div class="subline">${subline}</div>
  </div>
  <div class="stamp">${stamp}</div>
</body></html>`;
}

async function main() {
  const a = parseArgs();
  const out = resolve(a.out);
  await mkdir(dirname(out), { recursive: true });
  const leftUri  = await fileToDataUri(resolve(a.left));
  const rightUri = await fileToDataUri(resolve(a.right));
  if (!leftUri || !rightUri) {
    console.error("[compose] missing portrait(s)");
    process.exit(2);
  }
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.setContent(html({
    leftUri, rightUri,
    leftLabel: a.leftLabel || "",
    rightLabel: a.rightLabel || "",
    centerNumber: a.centerNumber || "$3.5M",
    headline: a.headline || "BEAT",
    subline: a.subline || "",
    stamp: (a.stamp || "LOST").toUpperCase(),
  }), { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, type: "jpeg", quality: 92, fullPage: false });
  await browser.close();
  const fs = await import("node:fs/promises");
  const stat = await fs.stat(out);
  console.log(`[compose] saved ${(stat.size / 1024).toFixed(1)} KB → ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
