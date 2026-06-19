/* ─── GSCCCA Drill-Down Test ───
   Tests the two-step search flow:
   1. Name search → name list
   2. Click name → deed results

   Also tests navigating to UCC/PT-61 via the correct path.
*/

import { chromium } from "playwright";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const USERNAME = process.env.GSCCCA_USERNAME!;
const PASSWORD = process.env.GSCCCA_PASSWORD!;

async function main() {
  console.log("🚀 GSCCCA Drill-Down Test\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  });
  const page = await context.newPage();

  // ── Login ──
  console.log("⏳ Logging in (mobile form)...");
  await page.goto("https://www.gsccca.org/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.fill("#pagelayoutBox_loginForm_C004_mobileusername", USERNAME);
  await page.fill("#pagelayoutBox_loginForm_C004_mobilepassword", PASSWORD);
  await page.click("#pagelayoutBox_loginForm_C004_mobileloginbtn");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
  console.log(`   Logged in. URL: ${page.url()}`);

  // ── Step 1: Real Estate Name Search ──
  console.log("\n⏳ Step 1: Real Estate name search for 'JOHNSON' in Fulton...");
  await page.goto("https://search.gsccca.org/RealEstate/namesearch.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await page.fill("#txtSearchName", "JOHNSON");
  await page.fill("#txtFromDate", "01/01/2024");
  await page.fill("#txtToDate", "03/31/2024");

  // Select Fulton
  await page.selectOption('select[name="intCountyID"]', "60"); // Fulton = 60

  await page.waitForTimeout(500);
  await page.click("#btnSubmit");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);

  // ── Step 2: Parse name list ──
  console.log("\n   Name list results:");
  const nameRows = await page.$$eval("table.name_results tr", (trs: any[]) =>
    trs.map((tr: any) => {
      const cells = Array.from(tr.querySelectorAll("td")).map((td: any) => td.textContent?.trim() || "");
      const link = tr.querySelector("a");
      return {
        cells,
        href: link?.href || "",
        text: link?.textContent?.trim() || "",
      };
    }).filter((r: any) => r.cells.length > 0)
  );

  console.log(`   Found ${nameRows.length} name entries`);
  for (const row of nameRows.slice(0, 10)) {
    console.log(`   - [${row.cells.join(" | ")}] link="${row.text}" href="${row.href}"`);
  }

  // ── Step 3: Click first name to get deed records ──
  if (nameRows.length > 0 && nameRows[0].href) {
    // Find a name that looks like a person (not an LLC)
    const personRow = nameRows.find((r: any) => !r.text.includes("LLC") && !r.text.includes("INC") && !r.text.includes("CORP")) || nameRows[0];
    console.log(`\n⏳ Step 3: Clicking name: "${personRow.text}"`);

    // Click the link
    const nameLink = await page.$(`a:has-text("${personRow.text.slice(0, 30)}")`);
    if (nameLink) {
      await nameLink.click();
    } else if (personRow.href) {
      await page.goto(personRow.href, { waitUntil: "domcontentloaded" });
    }
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    console.log(`   Deed results URL: ${page.url()}`);
    await page.screenshot({ path: "/tmp/gsccca-deed-results.png" });

    // Parse the deed results table
    const tables = await page.$$eval("table", (tables: any[]) =>
      tables.map((t: any, idx: number) => {
        const headers = Array.from(t.querySelectorAll("th")).map(
          (th: any) => th.textContent?.trim() || ""
        ).filter((h: string) => h.length > 0);
        const dataRows = Array.from(t.querySelectorAll("tr"))
          .filter((tr: any) => tr.querySelectorAll("td").length > 2)
          .slice(0, 5)
          .map((tr: any) =>
            Array.from(tr.querySelectorAll("td")).map(
              (td: any) => (td.textContent?.trim() || "").slice(0, 45)
            )
          );
        return { index: idx, headers, dataRows, className: (t.className || "").slice(0, 50), totalDataRows: Array.from(t.querySelectorAll("tr")).filter((tr: any) => tr.querySelectorAll("td").length > 2).length };
      })
    );

    for (const t of tables) {
      if (t.totalDataRows < 1) continue;
      console.log(`\n   Table #${t.index} (class="${t.className}") — ${t.totalDataRows} data rows`);
      if (t.headers.length > 0) {
        console.log(`   Headers: [${t.headers.join(" | ")}]`);
      }
      for (const [i, row] of t.dataRows.entries()) {
        console.log(`   Row ${i}: [${row.join(" | ")}]`);
      }
    }
  }

  // ── Step 4: Lien search — use JavaScript submit ──
  console.log("\n⏳ Step 4: Lien search...");
  await page.goto("https://search.gsccca.org/lien/namesearch.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await page.fill("#txtSearchName", "JOHNSON");
  await page.fill("#txtFromDate", "01/01/2024");
  await page.fill("#txtToDate", "03/31/2024");
  await page.selectOption('select[name="intCountyID"]', "60");
  await page.waitForTimeout(500);

  // Use JavaScript to submit since button uses onclick:fnSubmitForm()
  await page.evaluate(() => {
    if (typeof (window as any).fnSubmitForm === "function") {
      (window as any).fnSubmitForm();
    }
  });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);

  console.log(`   Lien results URL: ${page.url()}`);

  // Check if we landed on results
  const lienTables = await page.$$eval("table", (tables: any[]) =>
    tables.map((t: any, idx: number) => {
      const headers = Array.from(t.querySelectorAll("th")).map((th: any) => th.textContent?.trim() || "").filter((h: string) => h.length > 0);
      const dataRows = Array.from(t.querySelectorAll("tr")).filter((tr: any) => tr.querySelectorAll("td").length > 2);
      const sampleRows = dataRows.slice(0, 3).map((tr: any) =>
        Array.from(tr.querySelectorAll("td")).map((td: any) => (td.textContent?.trim() || "").slice(0, 45))
      );
      return { index: idx, headers, dataRowCount: dataRows.length, sampleRows, className: (t.className || "").slice(0, 50) };
    })
  );

  for (const t of lienTables) {
    if (t.dataRowCount < 1) continue;
    console.log(`\n   Lien Table #${t.index} (class="${t.className}") — ${t.dataRowCount} data rows`);
    if (t.headers.length > 0) console.log(`   Headers: [${t.headers.join(" | ")}]`);
    for (const [i, row] of t.sampleRows.entries()) {
      console.log(`   Row ${i}: [${row.join(" | ")}]`);
    }
  }

  // ── Step 5: Check search.gsccca.org/search for main search portal ──
  console.log("\n⏳ Step 5: Search portal page...");
  await page.goto("https://www.gsccca.org/search", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Get all search index links
  const searchLinks = await page.$$eval("a", (anchors: any[]) =>
    anchors
      .filter((a: any) => a.href?.includes("search.gsccca.org"))
      .map((a: any) => ({ text: a.textContent?.trim()?.slice(0, 50), href: a.href }))
  );
  console.log("   Search portal links to search.gsccca.org:");
  for (const l of searchLinks) {
    console.log(`   - "${l.text}" → ${l.href}`);
  }

  // ── Step 6: Try UCC via proper entry path ──
  console.log("\n⏳ Step 6: UCC via default.asp...");
  await page.goto("https://search.gsccca.org/UCC_Search/default.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const uccInputs = await page.$$eval("input:not([type=hidden]), select", (els: any[]) =>
    els.map((e: any) => ({
      tag: e.tagName.toLowerCase(),
      name: e.name || "",
      id: e.id || "",
      type: e.type || "",
      visible: e.offsetParent !== null,
    })).filter((e: any) => e.visible)
  );
  console.log(`   UCC visible fields:`);
  for (const inp of uccInputs) {
    console.log(`   - <${inp.tag}> name="${inp.name}" id="${inp.id}" type="${inp.type}"`);
  }

  const uccLinks = await page.$$eval("a", (anchors: any[]) =>
    anchors.filter((a: any) => a.href?.includes("UCC")).map((a: any) => ({ text: a.textContent?.trim(), href: a.href }))
  );
  console.log("   UCC links:");
  for (const l of uccLinks) {
    console.log(`   - "${l.text}" → ${l.href}`);
  }

  // ── Step 7: Check PT-61 name search directly ──
  console.log("\n⏳ Step 7: PT-61 name search...");
  await page.goto("https://search.gsccca.org/pt61/namesearch.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const pt61Inputs = await page.$$eval("input:not([type=hidden]), select", (els: any[]) =>
    els.map((e: any) => ({
      tag: e.tagName.toLowerCase(),
      name: e.name || "",
      id: e.id || "",
      type: e.type || "",
      visible: e.offsetParent !== null,
    })).filter((e: any) => e.visible)
  );
  console.log(`   PT-61 Name Search visible fields:`);
  for (const inp of pt61Inputs) {
    console.log(`   - <${inp.tag}> name="${inp.name}" id="${inp.id}" type="${inp.type}"`);
  }

  await browser.close();
  console.log("\n✅ Done!");
}

main().catch(console.error);
