#!/usr/bin/env node
/**
 * generate-thumbnail.mjs — Viral YouTube thumbnail generator.
 *
 * Outputs a 1280×720 JPEG for YouTube custom-thumbnail upload. Composition:
 *   - Left 60%: huge headline figure ($82M / 60% / BROKEN-stamp)
 *   - Right 40%: Betsy portrait crop, slight knowing expression
 *   - Bottom strip: verdict stamp (rotated 4°, ink-stamp civic-red)
 *   - Top-right: SEALED gold wordmark
 *   - Background: parchment with subtle paper texture
 *
 * NEVER let YouTube auto-pick a frame — they always pick a blink/transition.
 * Custom thumbnails are the difference between 200 views and 20K.
 *
 * Usage:
 *   node generate-thumbnail.mjs \
 *     --headline "$82M" \
 *     --subline "BOUGHT 3 PROMISES" \
 *     --verdict BROKEN \
 *     --portrait /abs/path/betsy-portrait.png \
 *     --out /abs/path/thumbnail.jpg
 *
 * Verdicts: KEPT, PARTIAL, BROKEN, READER
 */
import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- design tokens (mirror render-text-cards.mjs) ----
const TOKENS = {
  parchment: "#faf7ef",
  parchmentDeep: "#f3eedf",
  ink: "#0f1f3a",
  inkSoft: "#2a3a5a",
  gold: "#b08a3e",
  civicRed: "#a4243b",
  civicBlue: "#2a4d7c",
  slate: "#5b6478",
};

const VERDICT_COLOR = {
  KEPT: "#0f6b3a",      // green
  PARTIAL: TOKENS.gold,  // gold
  BROKEN: TOKENS.civicRed,
  READER: TOKENS.civicBlue,
  RECEIPT: TOKENS.civicRed,
  LOST: TOKENS.civicRed,
  WATCH: TOKENS.gold,
  "MONTH 5": TOKENS.gold,
  "PARTLY KEPT": TOKENS.gold,
};

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      // Boolean flag: no value, or the next token is itself a flag.
      if (next === undefined || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

// CR new-news template (viral panel 02 + MrBeast packaging):
//   Navy background for mobile feed legibility (cream/parchment greys-out).
//   Left 60%: huge cream number + 2-line subline. Right 40%: caricature.
//   Bottom-left stamp (civic-red) carries one tag like RECEIPT / LOST.
//   No CR logo on body — title claims the brand.
function thumbnailHTMLCRNewNews({ headline, subline, verdict, portraitDataUri }) {
  const verdictColor = VERDICT_COLOR[verdict] || TOKENS.civicRed;
  const navy = "#0a1f3d";
  const cream = "#f5ecd7";
  const stampBg = "rgba(245,236,215,0.92)";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Archivo+Black&family=Lora:wght@700&family=IBM+Plex+Mono:wght@500&display=swap");
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
    background: radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%);
    pointer-events: none;
  }
  .headline-zone {
    position: absolute; left: 56px; top: 90px;
    width: 720px; height: 540px;
    display: flex; flex-direction: column; justify-content: center;
  }
  .eyebrow {
    font-family: "IBM Plex Mono", monospace;
    font-size: 24px; font-weight: 500;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: ${TOKENS.gold};
    margin-bottom: 22px;
  }
  .headline {
    font-family: "Archivo Black", "Instrument Serif", serif;
    font-size: ${headline.length >= 6 ? 176 : headline.length >= 5 ? 200 : headline.length >= 4 ? 232 : 280}px; line-height: 0.9;
    letter-spacing: -0.025em;
    color: ${cream};
    letter-spacing: -0.02em;
    margin-bottom: 14px;
    text-shadow: 0 4px 20px rgba(0,0,0,0.45);
  }
  .subline {
    font-family: "Archivo Black", "Lora", serif;
    font-size: 60px; line-height: 1.02;
    white-space: pre-line;
    color: ${cream};
    letter-spacing: 0.01em;
    text-transform: uppercase;
    text-shadow: 0 3px 14px rgba(0,0,0,0.4);
  }
  .portrait-zone {
    position: absolute; right: 36px; top: 60px;
    width: 460px; height: 600px;
    border-radius: 6px; overflow: hidden;
    border: 4px solid ${cream};
    outline: 3px solid ${navy};
    box-shadow: 0 24px 60px rgba(0,0,0,0.55);
    background: ${navy};
  }
  .portrait-zone img {
    width: 100%; height: 100%; object-fit: cover;
    object-position: center 22%;
  }
  .stamp {
    position: absolute; bottom: 48px; left: 56px;
    transform: rotate(-6deg);
    border: 6px solid ${verdictColor};
    color: ${verdictColor};
    background: ${stampBg};
    padding: 12px 32px 8px;
    font-family: "Archivo Black", "Instrument Serif", serif;
    font-size: 64px; letter-spacing: 0.06em;
    text-transform: uppercase;
    box-shadow: 0 6px 18px rgba(0,0,0,0.35);
  }
  .stamp::before {
    content: ""; position: absolute; inset: -4px;
    border: 1px dashed ${verdictColor}; opacity: 0.45; pointer-events: none;
  }
  .corner {
    position: absolute; top: 40px; right: 44px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 20px; letter-spacing: 0.2em; color: ${TOKENS.gold};
  }
</style></head>
<body>
  <div class="vignette"></div>
  <div class="corner">CR · NEW-NEWS</div>
  <div class="headline-zone">
    <div class="eyebrow">CAMPAIGN · RECEIPTS</div>
    <div class="headline">${headline}</div>
    <div class="subline">${subline.replace(/\\n/g, "\n")}</div>
  </div>
  <div class="portrait-zone">
    ${portraitDataUri ? `<img src="${portraitDataUri}" />` : ""}
  </div>
  <div class="stamp">${verdict}</div>
</body></html>`;
}

// CR new-news SHORT variant: 9:16 (1080x1920) thumbnail for YouTube Shorts
// custom thumbnail. Layout (top → bottom on a tall canvas):
//   - top 8% : eyebrow ("CAMPAIGN · RECEIPTS")
//   - top 38%: portrait card (politician dominates)
//   - middle : massive headline number + 1-2 line subline
//   - bottom : verdict stamp angled left, no logo (title carries brand)
// MrBeast principles: one big subject, one big number, one verdict stamp,
// high-contrast navy/cream that survives the YouTube Shorts grid thumbnail
// (~360px wide on mobile).
function thumbnailHTMLCRShort({ headline, subline, verdict, portraitDataUri }) {
  const verdictColor = VERDICT_COLOR[verdict] || TOKENS.civicRed;
  const navy = "#0a1f3d";
  const cream = "#f5ecd7";
  const stampBg = "rgba(245,236,215,0.92)";
  const headlineSize = headline.length >= 5 ? 260 : headline.length >= 4 ? 340 : 460;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Archivo+Black&family=Lora:wght@700&family=IBM+Plex+Mono:wght@500&display=swap");
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1080px; height: 1920px; overflow: hidden; }
  body {
    background: ${navy};
    color: ${cream};
    font-family: "Archivo Black", "Lora", Georgia, serif;
    position: relative;
  }
  .vignette {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 35%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%);
    pointer-events: none;
  }
  .corner {
    position: absolute; top: 56px; left: 56px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 30px; letter-spacing: 0.22em; color: ${TOKENS.gold};
    text-transform: uppercase;
  }
  .portrait-zone {
    position: absolute; top: 130px; left: 50%;
    transform: translateX(-50%);
    width: 720px; height: 720px;
    border-radius: 12px; overflow: hidden;
    border: 6px solid ${cream};
    outline: 4px solid ${navy};
    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
    background: ${navy};
  }
  .portrait-zone img {
    width: 100%; height: 100%; object-fit: cover;
    object-position: center 22%;
  }
  .headline-zone {
    position: absolute; top: 920px; left: 60px;
    width: 960px;
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
  }
  .headline {
    font-family: "Archivo Black", "Instrument Serif", serif;
    font-size: ${headlineSize}px; line-height: 0.9;
    letter-spacing: -0.025em;
    color: ${cream};
    text-shadow: 0 6px 24px rgba(0,0,0,0.5);
    margin-bottom: 24px;
  }
  .subline {
    font-family: "Archivo Black", "Lora", serif;
    font-size: 78px; line-height: 1.0;
    white-space: pre-line;
    color: ${cream};
    text-transform: uppercase;
    letter-spacing: 0.01em;
    text-shadow: 0 4px 16px rgba(0,0,0,0.45);
    margin-bottom: 40px;
  }
  .stamp {
    position: absolute; bottom: 96px; left: 50%;
    transform: translateX(-50%) rotate(-6deg);
    border: 8px solid ${verdictColor};
    color: ${verdictColor};
    background: ${stampBg};
    padding: 18px 48px 14px;
    font-family: "Archivo Black", "Instrument Serif", serif;
    font-size: 96px; letter-spacing: 0.06em;
    text-transform: uppercase;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  .stamp::before {
    content: ""; position: absolute; inset: -6px;
    border: 2px dashed ${verdictColor}; opacity: 0.5; pointer-events: none;
  }
</style></head>
<body>
  <div class="vignette"></div>
  <div class="corner">CR · NEW-NEWS</div>
  ${portraitDataUri ? `<div class="portrait-zone"><img src="${portraitDataUri}" /></div>` : ""}
  <div class="headline-zone"${portraitDataUri ? "" : ' style="top:560px;"'}>
    <div class="headline">${headline}</div>
    <div class="subline">${subline.replace(/\\n/g, "\n")}</div>
  </div>
  <div class="stamp">${verdict}</div>
</body></html>`;
}

// Parchment 9:16 variant for YouTube Shorts thumbnails.
// Same paper-receipt aesthetic as `thumbnailHTML` (sealed/longform) but stacks
// vertically with no portrait — SEALED shorts (002–007) don't have a per-beat
// face, so portrait would just repeat Betsy across every tile.
function thumbnailHTMLSealedShort({ headline, subline, verdict, eyebrow }) {
  const verdictColor = VERDICT_COLOR[verdict] || TOKENS.civicRed;
  const headlineSize = headline.length <= 4 ? 520 : headline.length <= 7 ? 380 : 300;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Lora:wght@500;700&family=IBM+Plex+Mono:wght@500&display=swap");
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1080px; height: 1920px; overflow: hidden; }
  body {
    background: ${TOKENS.parchment};
    background-image:
      radial-gradient(ellipse at center, ${TOKENS.parchment} 0%, ${TOKENS.parchmentDeep} 100%),
      repeating-linear-gradient(0deg, rgba(15,31,58,0.015) 0 1px, transparent 1px 3px);
    color: ${TOKENS.ink};
    font-family: "Lora", Georgia, serif;
    position: relative;
  }
  .frame {
    position: absolute; inset: 32px;
    border: 3px solid ${TOKENS.ink};
    border-radius: 6px;
    box-shadow: 0 0 0 2px ${TOKENS.parchmentDeep} inset;
  }
  .wordmark {
    position: absolute; top: 80px; left: 50%;
    transform: translateX(-50%);
    font-family: "IBM Plex Mono", monospace;
    font-weight: 500; letter-spacing: 0.28em;
    color: ${TOKENS.gold}; font-size: 36px;
    text-transform: uppercase;
  }
  .eyebrow {
    position: absolute; top: 200px; left: 0; right: 0;
    text-align: center;
    font-family: "IBM Plex Mono", monospace;
    font-size: 32px; font-weight: 500;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: ${TOKENS.slate};
  }
  .headline {
    position: absolute; top: 340px; left: 60px; right: 60px;
    text-align: center;
    font-family: "Instrument Serif", "Lora", serif;
    font-size: ${headlineSize}px; line-height: 0.92;
    font-weight: 400; color: ${TOKENS.ink};
    letter-spacing: -0.025em;
  }
  .subline {
    position: absolute; top: 1080px; left: 60px; right: 60px;
    text-align: center;
    font-family: "Lora", serif;
    font-size: 78px; line-height: 1.1;
    font-weight: 700; letter-spacing: 0.02em;
    color: ${TOKENS.inkSoft};
    text-transform: uppercase;
  }
  .stamp {
    position: absolute; bottom: 220px; left: 50%;
    transform: translateX(-50%) rotate(-5deg);
    border: 9px solid ${verdictColor};
    color: ${verdictColor};
    background: rgba(250,247,239,0.7);
    padding: 22px 64px 16px;
    font-family: "Instrument Serif", serif;
    font-size: 144px; font-weight: 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 8px 22px rgba(0,0,0,0.12);
  }
  .stamp::before {
    content: ""; position: absolute; inset: -6px;
    border: 2px dashed ${verdictColor};
    pointer-events: none; opacity: 0.45;
  }
</style></head>
<body>
  <div class="frame"></div>
  <div class="wordmark">SEALED 2016</div>
  ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}
  <div class="headline">${headline}</div>
  <div class="subline">${subline.replace(/\\n/g, "<br>")}</div>
  <div class="stamp">${verdict}</div>
</body></html>`;
}

function thumbnailHTML({ headline, subline, verdict, portraitDataUri }) {
  const verdictColor = VERDICT_COLOR[verdict] || TOKENS.civicRed;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Lora:wght@500;700&family=IBM+Plex+Mono:wght@500&display=swap");
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1280px; height: 720px; overflow: hidden; }
  body {
    background: ${TOKENS.parchment};
    background-image:
      radial-gradient(ellipse at center, ${TOKENS.parchment} 0%, ${TOKENS.parchmentDeep} 100%),
      repeating-linear-gradient(0deg, rgba(15,31,58,0.015) 0 1px, transparent 1px 3px);
    color: ${TOKENS.ink};
    font-family: "Lora", Georgia, serif;
    position: relative;
  }
  .frame {
    position: absolute; inset: 22px;
    border: 2px solid ${TOKENS.ink};
    border-radius: 4px;
    box-shadow: 0 0 0 1px ${TOKENS.parchmentDeep} inset;
  }
  .wordmark {
    position: absolute; top: 36px; right: 44px;
    font-family: "IBM Plex Mono", monospace;
    font-weight: 500; letter-spacing: 0.22em;
    color: ${TOKENS.gold}; font-size: 22px;
  }
  .wordmark::before {
    content: ""; display: inline-block;
    width: 28px; height: 2px; background: ${TOKENS.gold};
    margin-right: 12px; vertical-align: 4px;
  }
  .headline-zone {
    position: absolute; left: 60px; top: 130px;
    width: 720px; height: 460px;
    display: flex; flex-direction: column; justify-content: center;
  }
  .eyebrow {
    font-family: "IBM Plex Mono", monospace;
    font-size: 22px; font-weight: 500;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: ${TOKENS.slate};
    margin-bottom: 18px;
  }
  .headline {
    font-family: "Instrument Serif", "Lora", serif;
    font-size: 240px; line-height: 0.95;
    font-weight: 400; color: ${TOKENS.ink};
    letter-spacing: -0.02em;
    margin-bottom: 18px;
  }
  .subline {
    font-family: "Lora", serif;
    font-size: 44px; line-height: 1.1;
    font-weight: 700; letter-spacing: 0.02em;
    color: ${TOKENS.inkSoft};
    text-transform: uppercase;
  }
  .portrait-zone {
    position: absolute; right: 60px; top: 110px;
    width: 420px; height: 500px;
    border-radius: 6px; overflow: hidden;
    box-shadow: 0 20px 50px rgba(15,31,58,0.18), 0 6px 16px rgba(15,31,58,0.12);
    border: 3px solid ${TOKENS.parchment};
    outline: 2px solid ${TOKENS.ink};
    background: ${TOKENS.parchmentDeep};
  }
  .portrait-zone img {
    width: 100%; height: 100%; object-fit: cover;
    object-position: center 25%;
  }
  .stamp {
    position: absolute; bottom: 60px; left: 60px;
    transform: rotate(-4deg);
    border: 5px solid ${verdictColor};
    color: ${verdictColor};
    background: rgba(250,247,239,0.6);
    padding: 14px 36px 10px;
    font-family: "Instrument Serif", serif;
    font-size: 78px; font-weight: 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .stamp::before, .stamp::after {
    content: ""; position: absolute; inset: -3px;
    border: 1px dashed ${verdictColor};
    pointer-events: none;
    opacity: 0.4;
  }
</style></head>
<body>
  <div class="frame"></div>
  <div class="wordmark">SEALED</div>
  <div class="headline-zone">
    <div class="eyebrow">SEALED · receipt #73</div>
    <div class="headline">${headline}</div>
    <div class="subline">${subline}</div>
  </div>
  <div class="portrait-zone">
    ${portraitDataUri ? `<img src="${portraitDataUri}" />` : ""}
  </div>
  <div class="stamp">${verdict}</div>
</body></html>`;
}

async function fileToDataUri(path) {
  if (!path || !existsSync(path)) return null;
  const fs = await import("node:fs/promises");
  const buf = await fs.readFile(path);
  const ext = path.split(".").pop().toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function main() {
  const args = parseArgs();
  const headline = args.headline || "$82M";
  const subline = args.subline || "BOUGHT 3 PROMISES";
  const verdict = (args.verdict || "BROKEN").toUpperCase();
  const template = (args.template || "sealed").toLowerCase(); // sealed | cr-new-news
  const portrait = args.portrait
    ? resolve(args.portrait)
    : resolve(__dirname, "../../brand/betsy-portrait.png");
  const out = resolve(args.out || resolve(__dirname, "../../public/thumbnail.jpg"));

  if (!VERDICT_COLOR[verdict]) {
    console.error(`Unknown verdict: ${verdict}. Use KEPT / PARTIAL / BROKEN / READER / RECEIPT / LOST / WATCH.`);
    process.exit(2);
  }

  console.log(`[thumb] template: ${template}`);
  console.log(`[thumb] portrait: ${portrait}`);
  console.log(`[thumb] out: ${out}`);
  const noPortrait = args["no-portrait"] !== undefined || args.noPortrait !== undefined;
  const portraitDataUri = noPortrait ? null : await fileToDataUri(portrait);
  if (!noPortrait && !portraitDataUri) console.warn(`[thumb] WARNING: portrait not found at ${portrait}`);

  await mkdir(dirname(out), { recursive: true });

  // template: sealed (16:9) | sealed-short (9:16, no portrait) | cr-new-news (16:9) | cr-new-news-short (9:16)
  const isShort = template === "cr-new-news-short" || template === "sealed-short";
  const html = template === "cr-new-news"
    ? thumbnailHTMLCRNewNews({ headline, subline, verdict, portraitDataUri })
    : template === "cr-new-news-short"
      ? thumbnailHTMLCRShort({ headline, subline, verdict, portraitDataUri })
      : template === "sealed-short"
        ? thumbnailHTMLSealedShort({ headline, subline, verdict, eyebrow: args.eyebrow })
        : thumbnailHTML({ headline, subline, verdict, portraitDataUri });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const viewport = isShort
    ? { width: 1080, height: 1920, deviceScaleFactor: 1 }
    : { width: 1280, height: 720, deviceScaleFactor: 1 };
  await page.setViewport(viewport);
  await page.setContent(html, { waitUntil: "networkidle0" });
  // Wait for web fonts to settle
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, type: "jpeg", quality: 92, fullPage: false });
  await browser.close();

  const fs = await import("node:fs/promises");
  const stat = await fs.stat(out);
  console.log(`[thumb] saved ${(stat.size / 1024).toFixed(1)} KB → ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
