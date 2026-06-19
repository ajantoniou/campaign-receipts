#!/usr/bin/env node
/**
 * render-text-cards.mjs — HTML → 1280×720 PNG text cards via Puppeteer.
 *
 * Replaces FLUX-Pro stills for any clip whose visual is text-heavy
 * (source citations, scorecards, headlines, dates, big-number reveals).
 * FLUX is unreliable at small typography; HTML gives us pixel-perfect
 * typography using the SEALED book design tokens (parchment + navy ink
 * + Lora serif + gold rule + civic-red / navy stamps).
 *
 * Usage:
 *   node render-text-cards.mjs --out-dir <dir> [--ids s1-02,s2-01,...]
 *
 * Each card definition lives in CARDS below — keyed by clip_id from
 * the storyboard. Add new ones as new long-forms ship.
 */
import puppeteer from "puppeteer";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- design tokens (from companies/concise-sealed/app/globals.css) ----
const TOKENS = {
  parchment: "#faf7ef",
  ink: "#0f1f3a",
  inkSoft: "#2a3a5a",
  gold: "#b08a3e",
  civicRed: "#a4243b",
  civicBlue: "#2a4d7c",
  slate: "#5b6478",
  paperShadow: "rgba(15,31,58,0.08)",
};

// ---- cards ----
// Each renders a full 1280×720 frame. Use real spelling, real numbers.
const CARDS = {
  // sealed-aipac-iran-deal-* — text-card slots used by Iran v7 storyboard.
  // Renamed 2026-05-23 from bare s* keys → iran-* prefix so text-card-sync-qc
  // can hard-fail any cross-episode storyboard that points at these IDs from a
  // non-iran slug. Legacy v2..v6 storyboards still reference the bare s*
  // names; if rebuilt, migrate their text_card_id fields first (mirror v7).
  "iran-s1-02": {
    title: "WHO PAID TO KILL THE IRAN DEAL",
    sub: "A SEALED Investigation",
    flair: "redX",
  },
  "iran-s2-02": { type: "clock", caption: "3 YEARS — CAP HELD" },
  "iran-s2-03": { type: "source", body: "SEALED book, p.1519 — enrichment held at 3.67% under deal, surged to 60% after withdrawal." },
  "iran-s3-02": { type: "promise", num: "#73", text: "Tear Up The Iran Nuclear Deal", verdict: "KEPT", verdictColor: "navy" },
  "iran-s4-02": { type: "register", date: "MAY 8, 2018", caption: "Federal Register — withdrawal announced" },
  "iran-s5-01": { type: "flow", nodes: ["DONOR", "CANDIDATE", "POLICY"] },
  "iran-s5-03": { type: "headline", text: "THE BUYER" },
  "iran-s9-02": { type: "headline", text: "THE DEAL GOT TORN UP", sub: "Iran's program got bigger — on the record" },
  "iran-s9-03": { type: "source", body: "SEALED book, p.1519 — enrichment reached 60% by 2021, after US withdrawal from the JCPOA." },
  "iran-s10-01": {
    type: "scorecard",
    title: "THE 2016 PROMISE AUDIT",
    tiles: [
      { num: "46", label: "KEPT", color: "navy" },
      { num: "51", label: "PARTIAL", color: "slate" },
      { num: "40", label: "BROKEN", color: "red" },
      { num: "8", label: "READER-DECIDES", color: "gold" },
    ],
  },
  // Iran cards retained under their original keys because they are Iran-only
  // and not wired into v7 text-card slots — kept available for any pre-v7
  // storyboard that might still reference them. None of these may appear in a
  // non-iran slug; text-card-sync-qc will hard-fail if they do.
  "s2-01": { type: "bar2", eyebrow: "URANIUM ENRICHMENT %", a: { label: "3.67%", note: "under deal", color: "navy", value: 3.67 }, b: { label: "90%", note: "weapons-grade threshold", color: "red", value: 90 } },
  "s6-01": { type: "tiles", items: ["IRAN DEAL", "EMBASSY MOVE", "EO 13899"] },
  "s6-02": { type: "dates", items: ["2015", "2017", "2018"] },
  "s7-03": { type: "bignum", amount: "$82M", caption: "Adelson → Trump 2016 cycle" },
  "s7-04": { type: "source", body: "SEALED book, ch. Drain The Swamp, p.730–798." },
  "s8-01": { type: "headline", text: "THE FAIRNESS NOTE", sub: "What the other side gets to say" },
  "s9-01": { type: "bar2", eyebrow: "URANIUM ENRICHMENT %", a: { label: "3.67%", note: "under deal", color: "navy", value: 3.67 }, b: { label: "60%", note: "after withdrawal", color: "red", value: 60 }, caption: "AFTER WITHDRAWAL" },
  "s10-03": { type: "endcard" },
  // sealed-drain-the-swamp-v1 (Ch. 2 ethics pledge + lobbying totals)
  "swamp-s1-02": { title: "DRAIN THE SWAMP", sub: "The receipt — Ch. 2", flair: "redX" },
  // Scene 2 — flow card replacing the Iran "DONOR/CANDIDATE/POLICY" leak.
  // Drain VO at this beat: "controlled by lobbyists, donors, and special interests".
  "swamp-s2-02": { type: "flow", nodes: ["LOBBYISTS", "POLITICIANS", "POLICY"] },
  "swamp-s3-02": { type: "promise", num: "DAY 8", text: "Ethics Pledge · EO 13770", verdict: "SIGNED", verdictColor: "navy" },
  "swamp-s4-02": { type: "register", date: "JAN 28, 2017", caption: "Federal Register — Ethics Pledge" },
  // 2026-05-23: date corrected from JAN 20 → JAN 19 to match the VO line
  // ("On January nineteenth, twenty twenty-one, he signed Executive Order
  // thirteen nine eighty-three"). Effective revocation was JAN 20 (his last
  // day in office) but the headline date the VO says is JAN 19. Caption keeps
  // both ideas via "signed — pledge revoked".
  "swamp-s5-02": { type: "register", date: "JAN 19, 2021", caption: "EO 13983 signed — Ethics Pledge revoked" },
  "swamp-s6-02": { type: "headline", text: "PRIVATIZED", sub: "Not drained — on the record" },
  "swamp-s8-01": { type: "headline", text: "WE FOLLOW THE PAPER", sub: "Both parties take big money" },
  // Scene 8 verdict beat — "13 of 18 drain-the-swamp promises in the book are
  // graded broken". Replaces the Iran s10-01 scorecard leak in the verdict slot.
  "swamp-verdict-1318": {
    type: "scorecard",
    title: "DRAIN-THE-SWAMP PROMISES · CH. 2",
    tiles: [
      { num: "13", label: "BROKEN", color: "red" },
      { num: "5", label: "KEPT or PARTIAL", color: "slate" },
      { num: "18", label: "TOTAL", color: "navy" },
    ],
  },
  // sealed-aipac-embassy-v1 — IDs must match storyboard text_card_id (never reuse Iran/swamp IDs)
  "embassy-s1-02": { title: "JERUSALEM EMBASSY", sub: "May 14, 2018 · Receipt 2 of 3", flair: null },
  "embassy-s2-01": {
    type: "headline",
    text: "SIX-MONTH WAIVERS",
    sub: "1995 law · Tel Aviv stayed the address",
  },
  "embassy-s2-02": {
    type: "register",
    date: "DEC 6, 2017",
    caption: "Proclamation — Jerusalem as capital",
  },
  "embassy-s3-01": {
    type: "register",
    date: "MAY 14, 2018",
    caption: "U.S. Embassy opened · Jerusalem",
  },
  "embassy-s3-02": { type: "headline", text: "AY-PACK PRIORITY #2", sub: "Move embassy to Jerusalem — checked off" },
  "embassy-s4-01": { type: "headline", text: "SAME DAY", sub: "60 killed · Gaza border" },
  "embassy-s4-02": {
    type: "source",
    body: "SEALED book — ribbon in Jerusalem and border clashes the same afternoon, May 14, 2018.",
  },
  "embassy-s5-01": { type: "headline", text: "UN VOTE", sub: "128–9 against U.S. position" },
  "embassy-s6-01": { type: "promise", num: "#74", text: "Move Embassy to Jerusalem", verdict: "KEPT", verdictColor: "navy" },
  "embassy-s7-01": { type: "endcard" },
  // CR new-news (cr-bell-bush-aipac-primary + template)
  "hook-02-headline": {
    type: "headline",
    text: "CORI BUSH LOST MO-1 PRIMARY",
    sub: "Aug 6, 2024 · Wesley Bell 51% – 46%",
  },
  "context-outside-money": {
    type: "headline",
    text: "OUTSIDE MONEY",
    sub: "Committees buy ads in your district — not on your ballot",
  },
  "explain-mail-udp": {
    type: "source",
    body: "July 2024 mailer · Paid for by United Democracy Project — super-PAC tied to the pro-Israel lobby AY-pack.",
  },
  "overlay-election-margin": {
    // CR-only — never use bar2 (Iran uranium template). Dedicated type below.
    type: "cr-election-margin",
    eyebrow: "MO-1 PRIMARY · CERTIFIED RESULT",
    a: { label: "Bell", note: "51%", color: "navy", value: 51 },
    b: { label: "Bush", note: "46%", color: "red", value: 46 },
    caption: "MO-1 Democratic primary · certified Aug 6, 2024",
  },
  "verdict-02-cta": {
    type: "cr-endcard",
    line1: "Full receipt",
    url: "campaignreceipts.com/politician/cori-bush",
  },
  // CR new-news (cr-massie-gallrein-primary)
  "massie-hook-headline": {
    type: "headline",
    text: "MOST EXPENSIVE U.S. HOUSE PRIMARY EVER",
    sub: "May 19, 2026 · KY-4 Republican primary",
  },
  "massie-context-spending": {
    type: "headline",
    text: "$35 MILLION",
    sub: "Total race spend · ~$16M outside money against Massie",
  },
  "massie-trump-quote": {
    type: "source",
    body: "May 2026 — Donald Trump on Truth Social: \"Thomas Massie is a totally ineffective loser.\" Endorses Ed Gallrein.",
  },
  "massie-explain-no-votes": {
    type: "headline",
    text: "MASSIE'S \"NO\" VOTES",
    sub: "Big Beautiful Bill · April 2024 foreign-aid (incl. Israel) · Epstein-files release",
  },
  "massie-define-outside-money": {
    type: "headline",
    text: "OUTSIDE MONEY",
    sub: "Committees buy ads in your district — not on your ballot",
  },
  "massie-fec-source": {
    type: "source",
    body: "FEC Schedule E · Independent Expenditures · United Democracy Project (AIPAC), Republican Jewish Coalition, Preserve America PAC (Adelson, C00878801) · KY-4 cycle 2025–26.",
  },
  "massie-overlay-margin": {
    type: "cr-election-margin",
    eyebrow: "KY-4 GOP PRIMARY · CERTIFIED RESULT",
    a: { label: "Gallrein", note: "~54%", color: "navy", value: 54 },
    b: { label: "Massie", note: "~45%", color: "red", value: 45 },
    caption: "KY-4 GOP primary · ~10,280-vote margin · May 19, 2026",
  },
  "massie-cta": {
    type: "cr-endcard",
    line1: "Full receipt",
    url: "campaignreceipts.com/race/ky-04-2026-r-primary",
  },
  // CR new-news (cr-rabb-pa3-aipac-defeat — PA-3 Dem primary, May 19 2026)
  "rabb-aoc-date": {
    type: "headline",
    text: "APRIL 24, 2026",
    sub: "A.O.C. endorses Rabb on social media",
  },
  "rabb-hasan-date": {
    type: "headline",
    text: "APRIL 30, 2026",
    sub: "Hasan Piker canvasses at Malcolm X Park · live Twitch stream",
  },
  "rabb-invisibility-punchline": {
    type: "headline",
    text: "THE MONEY DIDN'T STAY INVISIBLE",
    sub: "long enough to work",
  },
  "rabb-common-dreams-headline": {
    type: "headline",
    text: "THE SHELL LOST. THE PLAYBOOK DIDN'T.",
    sub: "Kimbark Foundation · one race · zero wins",
  },
  "rabb-cta-lesson": {
    type: "cr-endcard",
    line1: "When a 91-day-old foundation turns up",
    url: "check the incorporation date first",
  },
  // CR new-news (cr-tx-senate-2026-superpacs — TX U.S. Senate 2026, FEC-verified)
  "txsen-define-superpac": {
    type: "headline",
    text: "SUPER PAC",
    sub: "Spends unlimited money on ads · cannot coordinate with the candidate · the candidate cannot control it",
  },
  "txsen-define-passthrough": {
    type: "headline",
    text: "PASS-THROUGH",
    sub: "Money runs through a second group first · the paperwork shows the middle name, not the real person who paid",
  },
  "txsen-tfcm-source": {
    type: "source",
    body: "FEC Schedule A + E · Texans for a Conservative Majority (C00542217) · $39.3M against Paxton, $10.6M for Cornyn, $10.3M against Hunt · top donor John L. Nau III $7.9M · cycle 2025–26.",
  },
  "txsen-lonestar-source": {
    type: "source",
    body: "FEC Schedule A + E · Lone Star Rising PAC (C00918268) · $8.95M against Crockett, $7.96M for Talarico · Reid Hoffman $1.5M · cycle 2025–26.",
  },
  "txsen-passthrough-source": {
    type: "source",
    body: "FEC Schedule A · $5.5M into the Cornyn side via \"Ohio Works Inc.\"; $3.75M into the Talarico side via \"Government That Works PAC.\" Original donors not itemized — the law lets them stay secret.",
  },
  "txsen-talarico-question": {
    type: "headline",
    text: "IS IT A PROBLEM?",
    sub: "Or just the rules everyone plays by? You decide.",
  },
  "txsen-design-punchline": {
    type: "headline",
    text: "NAMES THE MESSENGER",
    sub: "almost never the sender · that is the design",
  },
  "txsen-cta": {
    type: "cr-endcard",
    line1: "Full receipt + newsletter",
    url: "campaignreceipts.com/race/tx-senate-2026-general",
  },
};

// ---- HTML template ----
function html(card) {
  const t = TOKENS;
  const base = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{width:1280px;height:720px;overflow:hidden;background:${t.parchment};color:${t.ink};font-family:'Lora',Georgia,serif}
      body{
        position:relative;
        padding:64px 96px;
        display:flex;flex-direction:column;justify-content:center;align-items:center;
        background:
          radial-gradient(ellipse at top, rgba(176,138,62,0.05), transparent 60%),
          radial-gradient(ellipse at bottom, rgba(15,31,58,0.04), transparent 60%),
          ${t.parchment};
      }
      /* faint paper grain */
      body::before{
        content:"";position:absolute;inset:0;pointer-events:none;
        background-image:
          repeating-linear-gradient(0deg, rgba(15,31,58,0.012) 0 1px, transparent 1px 3px),
          repeating-linear-gradient(90deg, rgba(15,31,58,0.012) 0 1px, transparent 1px 3px);
      }
      .frame{
        position:absolute;inset:32px;border:1px solid rgba(15,31,58,0.12);
        box-shadow:0 24px 60px ${t.paperShadow};
        pointer-events:none;
      }
      .gold-rule{height:2px;width:240px;background:linear-gradient(to right, transparent, ${t.gold}, transparent);margin:24px auto}
      .eyebrow{font-family:'IBM Plex Mono',monospace;letter-spacing:0.22em;text-transform:uppercase;font-size:18px;color:${t.gold};font-weight:500}
      .ink{color:${t.ink}}
      .navy{color:${t.civicBlue}}
      .red{color:${t.civicRed}}
      .slate{color:${t.slate}}
      .gold{color:${t.gold}}
      .center{text-align:center}
      .stamp{
        display:inline-block;padding:14px 28px;border:3px solid currentColor;
        font-family:'IBM Plex Mono',monospace;font-weight:500;
        letter-spacing:0.18em;text-transform:uppercase;
        transform:rotate(-3deg);
      }
      h1{font-size:84px;line-height:1.05;font-weight:700;letter-spacing:-0.01em}
      h2{font-size:56px;line-height:1.1;font-weight:600}
      h3{font-size:36px;line-height:1.2;font-weight:600}
      .src-cite{
        max-width:920px;font-family:'IBM Plex Mono',monospace;font-size:24px;line-height:1.55;
        color:${t.ink};
      }
    </style>
    <div class="frame"></div>
  `;

  // ---- per-type ----
  if (!card.type && card.title) {
    return base + `
      <div class="eyebrow">SEALED · Investigation</div>
      <div class="gold-rule"></div>
      <h1 class="center ink" style="max-width:1000px">${card.title}</h1>
      ${card.sub ? `<div style="margin-top:32px" class="eyebrow slate">${card.sub}</div>` : ""}
      ${card.flair === "redX" ? `<svg width="160" height="160" style="margin-top:48px" viewBox="0 0 100 100"><line x1="15" y1="15" x2="85" y2="85" stroke="${t.civicRed}" stroke-width="9" stroke-linecap="round"/><line x1="85" y1="15" x2="15" y2="85" stroke="${t.civicRed}" stroke-width="9" stroke-linecap="round"/></svg>` : ""}
    `;
  }

  switch (card.type) {
    case "bar2": {
      // Iran-only (sealed-aipac-iran-deal). CR election charts MUST use cr-election-margin.
      const eyebrow = card.eyebrow || "URANIUM ENRICHMENT %";
      const heightFor = (b, other) => {
        if (typeof b.heightPct === "number") return `${b.heightPct}%`;
        const v = parseFloat(b.value);
        const ov = parseFloat(other.value);
        if (!isNaN(v) && !isNaN(ov) && v > 0 && ov > 0) {
          const max = Math.max(v, ov);
          return `${Math.round((v / max) * 90)}%`;
        }
        return "12%";
      };
      const aH = heightFor(card.a, card.b);
      const bH = heightFor(card.b, card.a);
      const heights = [aH, bH];
      const bars = [card.a, card.b].map((b, i) => {
        const color = b.color === "navy" ? t.civicBlue : t.civicRed;
        return `
          <div style="display:flex;flex-direction:column;align-items:center;width:280px">
            <div style="height:420px;width:100%;display:flex;align-items:flex-end">
              <div style="width:100%;height:${heights[i]};background:${color};border-radius:4px 4px 0 0;box-shadow:0 8px 20px ${t.paperShadow}"></div>
            </div>
            <div style="margin-top:18px;font-size:64px;font-weight:700;color:${color};font-family:'Lora',serif">${b.label}</div>
            <div style="margin-top:6px;font-family:'IBM Plex Mono',monospace;font-size:18px;color:${t.slate};letter-spacing:0.06em;text-transform:uppercase">${b.note}</div>
          </div>
        `;
      }).join("");
      return base + `
        <div class="eyebrow">${eyebrow}</div>
        <div class="gold-rule"></div>
        <div style="display:flex;gap:120px;align-items:flex-end;margin-top:8px">${bars}</div>
        ${card.caption ? `<div style="margin-top:32px;font-family:'IBM Plex Mono',monospace;font-size:22px;letter-spacing:0.16em;color:${t.ink};text-transform:uppercase">${card.caption}</div>` : ""}
      `;
    }
    case "cr-election-margin": {
      // CR new-news ONLY — two-candidate primary result bar chart.
      // Founder lock 2026-05-23: never share bar2 (Iran uranium) with election overlays.
      const eyebrow = card.eyebrow || "PRIMARY · CERTIFIED RESULT";
      const heightFor = (b, other) => {
        const v = parseFloat(b.value);
        const ov = parseFloat(other.value);
        if (isNaN(v) || isNaN(ov) || v <= 0 || ov <= 0) {
          throw new Error(`cr-election-margin requires numeric value on both bars (${b.label} vs ${other.label})`);
        }
        const max = Math.max(v, ov);
        return `${Math.round((v / max) * 90)}%`;
      };
      const aH = heightFor(card.a, card.b);
      const bH = heightFor(card.b, card.a);
      const bars = [card.a, card.b].map((b, i) => {
        const color = b.color === "navy" ? t.civicBlue : t.civicRed;
        const h = i === 0 ? aH : bH;
        return `
          <div style="display:flex;flex-direction:column;align-items:center;width:280px">
            <div style="height:420px;width:100%;display:flex;align-items:flex-end">
              <div style="width:100%;height:${h};background:${color};border-radius:4px 4px 0 0;box-shadow:0 8px 20px ${t.paperShadow}"></div>
            </div>
            <div style="margin-top:18px;font-size:64px;font-weight:700;color:${color};font-family:'Lora',serif">${b.label}</div>
            <div style="margin-top:6px;font-family:'IBM Plex Mono',monospace;font-size:18px;color:${t.slate};letter-spacing:0.06em;text-transform:uppercase">${b.note}</div>
          </div>
        `;
      }).join("");
      return base + `
        <div class="eyebrow">${eyebrow}</div>
        <div class="gold-rule"></div>
        <div style="display:flex;gap:120px;align-items:flex-end;margin-top:8px">${bars}</div>
        ${card.caption ? `<div style="margin-top:32px;font-family:'IBM Plex Mono',monospace;font-size:22px;letter-spacing:0.16em;color:${t.ink};text-transform:uppercase">${card.caption}</div>` : ""}
      `;
    }
    case "clock": {
      return base + `
        <div class="eyebrow">Compliance window</div>
        <div class="gold-rule"></div>
        <svg width="280" height="280" viewBox="0 0 100 100" style="margin-top:8px">
          <circle cx="50" cy="50" r="46" fill="none" stroke="${t.ink}" stroke-width="2"/>
          <circle cx="50" cy="50" r="36" fill="none" stroke="${t.gold}" stroke-width="6" stroke-dasharray="226" stroke-dashoffset="0" transform="rotate(-90 50 50)"/>
          <circle cx="50" cy="50" r="26" fill="none" stroke="${t.civicBlue}" stroke-width="4" opacity="0.5"/>
          <circle cx="50" cy="50" r="16" fill="none" stroke="${t.civicBlue}" stroke-width="3" opacity="0.3"/>
          <text x="50" y="56" text-anchor="middle" font-family="Lora" font-size="22" font-weight="700" fill="${t.ink}">3 YR</text>
        </svg>
        <h2 class="center" style="margin-top:36px;color:${t.ink}">${card.caption}</h2>
      `;
    }
    case "source": {
      return base + `
        <div class="eyebrow red">Source</div>
        <div class="gold-rule"></div>
        <div class="src-cite center">${card.body}</div>
        <div style="margin-top:40px;font-family:'IBM Plex Mono',monospace;font-size:14px;letter-spacing:0.18em;color:${t.slate};text-transform:uppercase">Every figure cited · sealed2016.com</div>
      `;
    }
    case "promise": {
      return base + `
        <div class="eyebrow">2016 Promise Audit</div>
        <div class="gold-rule"></div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:28px;color:${t.slate};letter-spacing:0.16em">PROMISE ${card.num}</div>
        <h2 class="center" style="margin-top:24px;max-width:1000px">${card.text}</h2>
        <div class="stamp ${card.verdictColor}" style="margin-top:48px;font-size:32px">${card.verdict}</div>
      `;
    }
    case "register": {
      return base + `
        <div class="eyebrow">Federal Register</div>
        <div class="gold-rule"></div>
        <h1 style="font-size:120px;letter-spacing:0.02em">${card.date}</h1>
        <div style="margin-top:24px;max-width:760px;text-align:center;color:${t.slate};font-size:24px;font-style:italic">${card.caption}</div>
        <div style="margin-top:36px;display:flex;flex-direction:column;gap:8px;align-items:center;width:760px;opacity:0.35">
          ${Array.from({length:6}).map((_,i)=>`<div style="height:6px;width:${[760,720,700,740,680,640][i]}px;background:${t.ink};border-radius:2px"></div>`).join("")}
        </div>
      `;
    }
    case "flow": {
      const boxes = card.nodes.map((n,i)=>`
        <div style="padding:28px 36px;border:2px solid ${t.ink};background:${t.parchment};font-family:'Lora',serif;font-size:32px;font-weight:600;letter-spacing:0.04em;box-shadow:0 6px 16px ${t.paperShadow}">${n}</div>
        ${i<card.nodes.length-1 ? `<div style="font-size:48px;color:${t.gold};font-weight:300">→</div>` : ""}
      `).join("");
      return base + `
        <div class="eyebrow">Money flow</div>
        <div class="gold-rule"></div>
        <div style="display:flex;align-items:center;gap:32px;margin-top:24px">${boxes}</div>
        <div style="margin-top:64px;font-family:'IBM Plex Mono',monospace;font-size:18px;color:${t.slate};letter-spacing:0.16em;text-transform:uppercase">Three lines. One ledger.</div>
      `;
    }
    case "headline": {
      return base + `
        <div class="eyebrow">SEALED Receipt</div>
        <div class="gold-rule"></div>
        <h1 class="center" style="font-size:140px">${card.text}</h1>
        ${card.sub ? `<div style="margin-top:24px;font-style:italic;color:${t.slate};font-size:28px">${card.sub}</div>` : ""}
      `;
    }
    case "tiles": {
      const tiles = card.items.map(x=>`
        <div style="flex:1;padding:48px 24px;border:2px solid ${t.ink};text-align:center;background:${t.parchment};box-shadow:0 8px 20px ${t.paperShadow}">
          <div style="font-family:'Lora',serif;font-weight:700;font-size:36px;letter-spacing:0.02em">${x}</div>
          <div style="margin-top:18px;display:inline-block;padding:6px 14px;border:2px solid ${t.civicBlue};color:${t.civicBlue};font-family:'IBM Plex Mono',monospace;font-size:14px;letter-spacing:0.18em">KEPT</div>
        </div>
      `).join("");
      return base + `
        <div class="eyebrow">Three for three</div>
        <div class="gold-rule"></div>
        <div style="display:flex;gap:32px;width:100%;max-width:1080px;margin-top:8px">${tiles}</div>
      `;
    }
    case "dates": {
      const items = card.items.map((d,i)=>`
        <div style="text-align:center">
          <div style="font-family:'Lora',serif;font-weight:700;font-size:96px;color:${t.ink}">${d}</div>
          <div style="margin-top:8px;height:2px;width:120px;background:${t.gold};margin-left:auto;margin-right:auto"></div>
        </div>
      `).join("");
      return base + `
        <div class="eyebrow">From the record</div>
        <div class="gold-rule"></div>
        <div style="display:flex;gap:96px;margin-top:16px">${items}</div>
        <div style="margin-top:48px;font-family:'IBM Plex Mono',monospace;font-size:20px;color:${t.slate};letter-spacing:0.18em;text-transform:uppercase">Headlines on file</div>
      `;
    }
    case "bignum": {
      return base + `
        <div class="eyebrow red">Disclosed donation</div>
        <div class="gold-rule"></div>
        <div style="font-family:'Lora',serif;font-weight:700;font-size:280px;line-height:1;color:${t.ink}">${card.amount}</div>
        <div style="margin-top:24px;font-family:'IBM Plex Mono',monospace;font-size:22px;color:${t.slate};letter-spacing:0.16em;text-transform:uppercase">${card.caption}</div>
      `;
    }
    case "scorecard": {
      const tiles = card.tiles.map(tl => {
        const color = tl.color === "navy" ? t.civicBlue : tl.color === "red" ? t.civicRed : tl.color === "gold" ? t.gold : t.slate;
        return `
          <div style="flex:1;padding:32px 16px;border:2px solid ${color};text-align:center;background:${t.parchment};box-shadow:0 8px 20px ${t.paperShadow}">
            <div style="font-family:'Lora',serif;font-weight:700;font-size:88px;line-height:1;color:${color}">${tl.num}</div>
            <div style="margin-top:14px;font-family:'IBM Plex Mono',monospace;font-size:16px;letter-spacing:0.18em;color:${t.ink};text-transform:uppercase">${tl.label}</div>
          </div>
        `;
      }).join("");
      return base + `
        <h2 class="center" style="font-size:48px">${card.title}</h2>
        <div class="gold-rule"></div>
        <div style="display:flex;gap:20px;width:100%;max-width:1100px;margin-top:8px">${tiles}</div>
        <div style="margin-top:28px;font-family:'IBM Plex Mono',monospace;font-size:14px;color:${t.slate};letter-spacing:0.18em;text-transform:uppercase">145 graded · sealed2016.com</div>
      `;
    }
    case "endcard": {
      return base + `
        <div class="eyebrow">SEALED</div>
        <div class="gold-rule"></div>
        <h1 class="center" style="font-size:72px;max-width:1080px">The 2016 Promises.<br/>Before the Deals.</h1>
        <div style="margin-top:48px;font-family:'IBM Plex Mono',monospace;font-size:28px;letter-spacing:0.18em;color:${t.civicBlue};text-transform:uppercase">SEALED2016.COM</div>
        <div style="margin-top:18px;font-family:'IBM Plex Mono',monospace;font-size:16px;letter-spacing:0.22em;color:${t.slate};text-transform:uppercase">Subscribe · New receipts daily</div>
      `;
    }
    case "cr-endcard": {
      return base + `
        <div class="eyebrow">Campaign Receipts</div>
        <div class="gold-rule"></div>
        <h2 class="center" style="font-size:56px">${card.line1}</h2>
        <div style="margin-top:40px;font-family:'IBM Plex Mono',monospace;font-size:26px;letter-spacing:0.12em;color:${t.civicBlue}">${card.url}</div>
        <div style="margin-top:18px;font-family:'IBM Plex Mono',monospace;font-size:16px;letter-spacing:0.22em;color:${t.slate};text-transform:uppercase">Political money · on the record</div>
      `;
    }
    default:
      return base + `<div>${JSON.stringify(card)}</div>`;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const outDirIdx = args.indexOf("--out-dir");
  if (outDirIdx === -1) {
    console.error("usage: render-text-cards.mjs --out-dir <dir> [--ids id1,id2]");
    process.exit(1);
  }
  const outDir = resolve(args[outDirIdx + 1]);
  await mkdir(outDir, { recursive: true });

  const idsIdx = args.indexOf("--ids");
  const ids = idsIdx === -1 ? Object.keys(CARDS) : args[idsIdx + 1].split(",");

  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    for (const id of ids) {
      const card = CARDS[id];
      if (!card) { console.error(`skip ${id}: no card def`); continue; }
      const body = html(card);
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"/></head><body>${body}</body></html>`, { waitUntil: "domcontentloaded", timeout: 15000 });
      // Give webfonts a moment (allow up to 10s for Google Fonts)
      try {
        await page.evaluate(() => Promise.race([
          document.fonts.ready,
          new Promise(r => setTimeout(r, 10000)),
        ]));
      } catch {}
      await new Promise(r => setTimeout(r, 400));
      const out = resolve(outDir, `${id}.png`);
      await page.screenshot({ path: out, type: "png", clip: { x: 0, y: 0, width: 1280, height: 720 } });
      console.log(`wrote ${out}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
