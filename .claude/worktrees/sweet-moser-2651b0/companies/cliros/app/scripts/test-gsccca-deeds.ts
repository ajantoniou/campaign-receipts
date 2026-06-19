/* ─── GSCCCA Deed Detail + Premium Address Test ───
   Clicks through name list to get actual deed records,
   and tests Premium PT-61 Address Search.
*/

import { chromium } from "playwright";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const USERNAME = process.env.GSCCCA_USERNAME!;
const PASSWORD = process.env.GSCCCA_PASSWORD!;

async function main() {
  console.log("🚀 GSCCCA Deed Detail + Premium Test\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  });
  const page = await context.newPage();

  // Login
  console.log("⏳ Logging in...");
  await page.goto("https://www.gsccca.org/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.fill("#pagelayoutBox_loginForm_C004_mobileusername", USERNAME);
  await page.fill("#pagelayoutBox_loginForm_C004_mobilepassword", PASSWORD);
  await page.click("#pagelayoutBox_loginForm_C004_mobileloginbtn");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
  console.log(`   Logged in.\n`);

  // ── Part 1: Real Estate search → name list → click → deed records ──
  console.log("⏳ Part 1: RE search → click name → deed details...");
  await page.goto("https://search.gsccca.org/RealEstate/namesearch.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Use a less common name to get fewer results
  await page.fill("#txtSearchName", "ANTONIOU");
  await page.fill("#txtFromDate", "01/01/2000");
  await page.fill("#txtToDate", "12/31/2025");
  // Search all counties
  await page.waitForTimeout(500);
  await page.click("#btnSubmit");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);

  console.log(`   Name list URL: ${page.url()}`);

  // Inspect the name_results table rows for click handlers
  const nameRowDetails = await page.$$eval("table.name_results tr", (trs: any[]) =>
    trs.slice(1, 6).map((tr: any) => {
      const cells = Array.from(tr.querySelectorAll("td")).map((td: any) => td.textContent?.trim() || "");
      const onclick = tr.getAttribute("onclick") || "";
      const links = Array.from(tr.querySelectorAll("a")).map((a: any) => ({ href: a.href, onclick: a.getAttribute("onclick") || "" }));
      const trClass = tr.className || "";
      const trId = tr.id || "";
      // Check each td for onclick
      const cellOnclicks = Array.from(tr.querySelectorAll("td")).map((td: any) => td.getAttribute("onclick") || "");
      return { cells, onclick, links, trClass, trId, cellOnclicks };
    })
  );

  console.log(`   Name rows with click handlers:`);
  for (const row of nameRowDetails) {
    console.log(`   - cells=[${row.cells.join(", ")}] tr.onclick="${row.onclick}" tr.class="${row.trClass}" td.onclicks=${JSON.stringify(row.cellOnclicks)}`);
    if (row.links.length > 0) console.log(`     links=${JSON.stringify(row.links)}`);
  }

  // Check if there's a radio/checkbox in the "Selection" column
  const selectionInputs = await page.$$eval("table.name_results input", (inputs: any[]) =>
    inputs.map((i: any) => ({
      type: i.type,
      name: i.name,
      id: i.id,
      value: i.value,
      onclick: i.getAttribute("onclick") || "",
    }))
  );
  console.log(`\n   Selection inputs in name_results: ${JSON.stringify(selectionInputs)}`);

  // Check if there's a "View" or "Select" button somewhere
  const allButtons = await page.$$eval("input[type=button], input[type=submit], button", (btns: any[]) =>
    btns.map((b: any) => ({
      value: (b as HTMLInputElement).value || b.textContent?.trim() || "",
      name: (b as HTMLInputElement).name || "",
      id: b.id || "",
      onclick: b.getAttribute("onclick")?.slice(0, 100) || "",
    }))
  );
  console.log(`\n   All buttons on page:`);
  for (const btn of allButtons) {
    console.log(`   - value="${btn.value}" name="${btn.name}" id="${btn.id}" onclick="${btn.onclick}"`);
  }

  // Try clicking on a name row directly
  if (nameRowDetails.length > 0) {
    console.log(`\n⏳ Clicking first name row...`);
    // Click on the name cell (third td)
    const nameCell = await page.$("table.name_results tr:nth-child(2) td:nth-child(3)");
    if (nameCell) {
      await nameCell.click();
      await page.waitForTimeout(3000);
      console.log(`   After click URL: ${page.url()}`);

      // Check if we got deed results
      const resultsTables = await page.$$eval("table", (tables: any[]) =>
        tables.map((t: any, idx: number) => {
          const headers = Array.from(t.querySelectorAll("th")).map((th: any) => th.textContent?.trim() || "").filter((h: string) => h.length > 0);
          const dataRows = Array.from(t.querySelectorAll("tr")).filter((tr: any) => tr.querySelectorAll("td").length > 3);
          const samples = dataRows.slice(0, 3).map((tr: any) =>
            Array.from(tr.querySelectorAll("td")).map((td: any) => (td.textContent?.trim() || "").slice(0, 40))
          );
          return { index: idx, headers, dataRowCount: dataRows.length, samples, className: (t.className || "").slice(0, 50) };
        })
      );

      for (const t of resultsTables) {
        if (t.dataRowCount < 1 || t.headers.length < 2) continue;
        console.log(`\n   Table #${t.index} (class="${t.className}") — ${t.dataRowCount} data rows`);
        console.log(`   Headers: [${t.headers.join(" | ")}]`);
        for (const [i, row] of t.samples.entries()) {
          console.log(`   Row ${i}: [${row.join(" | ")}]`);
        }
      }
    }
  }

  // ── Part 2: Premium PT-61 Address Search ──
  console.log("\n\n⏳ Part 2: Premium PT-61 Address Search...");
  await page.goto("https://search.gsccca.org/PT61Premium/AddressSearch.aspx", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  console.log(`   Premium Address URL: ${page.url()}`);
  await page.screenshot({ path: "/tmp/gsccca-premium-address.png" });

  const premiumFields = await page.$$eval("input:not([type=hidden]), select, textarea", (els: any[]) =>
    els.map((e: any) => ({
      tag: e.tagName.toLowerCase(),
      name: e.name || "",
      id: e.id || "",
      type: e.type || "",
      visible: e.offsetParent !== null,
      placeholder: e.placeholder || "",
      value: (e.tagName === "SELECT" ? "" : (e as HTMLInputElement).value?.slice(0, 30)) || "",
    })).filter((e: any) => e.visible)
  );
  console.log(`   Premium Address visible fields:`);
  for (const f of premiumFields) {
    console.log(`   - <${f.tag}> name="${f.name}" id="${f.id}" type="${f.type}" placeholder="${f.placeholder}" value="${f.value}"`);
  }

  // ── Part 3: UCC Article 9 Name Search ──
  console.log("\n\n⏳ Part 3: UCC Basic Name Search...");
  await page.goto("https://search.gsccca.org/UCC_Search/search.asp?searchtype=Article9", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const uccFields = await page.$$eval("input:not([type=hidden]), select", (els: any[]) =>
    els.map((e: any) => ({
      tag: e.tagName.toLowerCase(),
      name: e.name || "",
      id: e.id || "",
      type: e.type || "",
      visible: e.offsetParent !== null,
    })).filter((e: any) => e.visible)
  );
  console.log(`   UCC Article 9 visible fields:`);
  for (const f of uccFields) {
    console.log(`   - <${f.tag}> name="${f.name}" id="${f.id}" type="${f.type}"`);
  }

  await browser.close();
  console.log("\n✅ Done!");
}

main().catch(console.error);
