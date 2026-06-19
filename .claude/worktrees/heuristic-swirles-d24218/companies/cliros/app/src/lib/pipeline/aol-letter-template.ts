/* ─── Professional AOL letter HTML ───
   Gold rules, property block above fold, Schedule A exceptions + Schedule B source table.
*/

import type { AOLRenderModel } from "../aol-finalize";

const GOLD = "#C4A24A";
const INK = "#2D2A26";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatOpinionBody(body: string): string {
  return esc(body)
    .split(/\n{2,}/)
    .map((p) => `<p class="para">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function renderAOLLetterHTML(model: AOLRenderModel): string {
  const firmHeader = model.logoUrl
    ? `<img src="${model.logoUrl}" alt="${esc(model.firmName || "")}" class="logo"/>`
    : model.firmName
      ? `<div class="firm-name">${esc(model.firmName)}</div>`
      : "";

  const exceptionItems = model.exceptions
    .map(
      (ex) =>
        `<li><span class="bullet">◆</span><span>${esc(ex.label)}${
          ex.bookPage ? ` <span class="cite">Book ${esc(ex.bookPage)}</span>` : ""
        }${ex.vaultRef ? ` <span class="vault">${esc(ex.vaultRef)}</span>` : ""}</span></li>`,
    )
    .join("");

  const sourceRows = model.sourceRows
    .map(
      (r) =>
        `<tr>
          <td class="mono">${esc(r.vaultRef)}</td>
          <td>${esc(r.kind)}</td>
          <td>${esc(r.instrumentType || "—")}</td>
          <td class="mono">${esc(r.bookPage || "—")}</td>
          <td>${esc(r.parties || "—")}</td>
          <td>${esc(r.recordedDate || "—")}</td>
        </tr>`,
    )
    .join("");

  const disclosures = model.disclosureBlocks
    .map((b) => `<div class="disclosure-block"><pre>${esc(b)}</pre></div>`)
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter',sans-serif; color:${INK}; font-size:10.5px; line-height:1.55; padding:36px 44px; }
.gold-bar { height:3px; background:linear-gradient(90deg,${GOLD},#E8D5A3,${GOLD}); margin-bottom:20px; }
.letterhead { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:14px; border-bottom:1px solid ${GOLD}; margin-bottom:18px; }
.logo { max-height:72px; max-width:220px; object-fit:contain; }
.firm-name { font-size:20px; font-weight:700; color:${INK}; }
.firm-meta { text-align:right; font-size:9.5px; color:#555; line-height:1.5; }
.property-card { background:#FAF8F3; border:1px solid #E5E1D8; border-left:4px solid ${GOLD}; padding:14px 16px; margin-bottom:22px; page-break-inside:avoid; }
.property-card h2 { font-size:11px; font-weight:700; letter-spacing:0.6px; text-transform:uppercase; color:${GOLD}; margin-bottom:8px; }
.property-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 24px; font-size:10px; }
.property-grid dt { color:#666; font-weight:500; }
.property-grid dd { font-weight:600; color:${INK}; }
.section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:${INK}; margin:22px 0 10px; padding-bottom:4px; border-bottom:1px solid #E5E1D8; }
.para { margin-bottom:10px; text-align:justify; }
.exceptions { list-style:none; padding:0; }
.exceptions li { display:flex; gap:8px; margin-bottom:8px; padding:8px 10px; background:#FAF8F3; border-radius:4px; page-break-inside:avoid; }
.bullet { color:${GOLD}; font-size:10px; flex-shrink:0; margin-top:1px; }
.cite { font-family:'IBM Plex Mono',monospace; font-size:9px; color:#7D6E50; background:#F5F0E5; padding:1px 5px; border-radius:3px; margin-left:4px; }
.vault { font-family:'IBM Plex Mono',monospace; font-size:9px; color:#555; margin-left:4px; }
table.sources { width:100%; border-collapse:collapse; font-size:9px; margin-top:6px; }
table.sources th { text-align:left; background:#2D2A26; color:#fff; padding:6px 8px; font-weight:600; }
table.sources td { padding:5px 8px; border-bottom:1px solid #E5E1D8; vertical-align:top; }
table.sources tr:nth-child(even) td { background:#FAF8F3; }
.mono { font-family:'IBM Plex Mono',monospace; font-size:8.5px; }
.disclosure-block { margin-top:14px; padding:10px 12px; background:#F5F0E5; border-radius:4px; font-size:9px; }
.disclosure-block pre { white-space:pre-wrap; font-family:'Inter',sans-serif; }
.signature { margin-top:28px; padding-top:16px; border-top:2px solid ${GOLD}; page-break-inside:avoid; }
.sig-line { width:240px; border-bottom:1px solid ${INK}; height:28px; margin-bottom:8px; }
.footer-id { margin-top:16px; font-size:8px; color:#888; font-family:'IBM Plex Mono',monospace; }
</style></head><body>
<div class="gold-bar"></div>
<div class="letterhead">
  <div>${firmHeader}</div>
  <div class="firm-meta">
    ${model.firmAddress ? `${esc(model.firmAddress)}<br/>` : ""}
    ${model.firmPhone ? `${esc(model.firmPhone)}<br/>` : ""}
    ${model.firmWebsite ? `${esc(model.firmWebsite)}` : ""}
  </div>
</div>

<div class="property-card">
  <h2>Subject Property</h2>
  <dl class="property-grid">
    <dt>Address</dt><dd>${esc(model.propertyAddress)}</dd>
    <dt>County</dt><dd>${esc(model.county)} County, Georgia</dd>
    <dt>Parcel ID</dt><dd>${esc(model.parcelId || "—")}</dd>
    <dt>Search period</dt><dd>${esc(model.searchWindow)}</dd>
    <dt>Current vesting</dt><dd>${esc(model.currentVesting || "—")}</dd>
    <dt>Opinion date</dt><dd>${esc(model.date)}</dd>
  </dl>
</div>

<div class="section-title">Attorney Opinion of Title</div>
<div class="opinion">${formatOpinionBody(model.opinionBody)}</div>

<div class="section-title">Schedule A — Exceptions</div>
<ul class="exceptions">${exceptionItems}</ul>

<div class="section-title">Schedule B — Records Examined (Cliros Vault)</div>
<table class="sources">
  <thead><tr>
    <th>Ref</th><th>Kind</th><th>Instrument</th><th>Book-Page</th><th>Parties</th><th>Date</th>
  </tr></thead>
  <tbody>${sourceRows || `<tr><td colspan="6">No indexed instruments.</td></tr>`}</tbody>
</table>

${disclosures}

<div class="signature">
  <div class="sig-line"></div>
  <strong>${esc(model.signature.name)}, Esq.</strong><br/>
  ${model.signature.firmName ? `${esc(model.signature.firmName)}<br/>` : ""}
  ${model.signature.firmAddress ? `${esc(model.signature.firmAddress)}<br/>` : ""}
  ${model.signature.barNumber ? `Georgia Bar No. ${esc(model.signature.barNumber)}<br/>` : ""}
  State of ${esc(model.signature.state || "Georgia")}
</div>
<div class="footer-id">Cliros Report ${esc(model.reportId)} · Fannie Mae B7-2-06 format</div>
</body></html>`;
}
