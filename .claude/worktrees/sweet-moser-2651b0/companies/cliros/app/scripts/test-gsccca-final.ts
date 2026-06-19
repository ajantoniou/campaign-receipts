/* ─── GSCCCA Final Drill-Down: Radio → Display Details → Deed Table ─── */

import { chromium } from "playwright";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const USERNAME = process.env.GSCCCA_USERNAME!;
const PASSWORD = process.env.GSCCCA_PASSWORD!;

async function main() {
  console.log("🚀 GSCCCA Final Drill-Down Test\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  });
  const page = await context.newPage();

  // Login
  await page.goto("https://www.gsccca.org/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.fill("#pagelayoutBox_loginForm_C004_mobileusername", USERNAME);
  await page.fill("#pagelayoutBox_loginForm_C004_mobilepassword", PASSWORD);
  await page.click("#pagelayoutBox_loginForm_C004_mobileloginbtn");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
  console.log("✅ Logged in\n");

  // ══════════════════════════════════════════════════
  // PART 1: Real Estate — Radio → Display Details → Deed Table
  // ══════════════════════════════════════════════════
  console.log("═══ PART 1: Real Estate Deed Details ═══\n");
  await page.goto("https://search.gsccca.org/RealEstate/namesearch.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await page.fill("#txtSearchName", "ANTONIOU");
  await page.fill("#txtFromDate", "01/01/2000");
  await page.fill("#txtToDate", "12/31/2025");
  await page.waitForTimeout(500);
  await page.click("#btnSubmit");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);

  // Get name list
  const reRadios = await page.$$eval('table.name_results input[name="rdoEntityName"]', (inputs) =>
    inputs.map((i) => (i as HTMLInputElement).value)
  );
  console.log(`Found ${reRadios.length} name entries: ${JSON.stringify(reRadios)}\n`);

  if (reRadios.length > 0) {
    // Select first radio
    const firstName = reRadios[0];
    console.log(`Selecting: "${firstName}"`);
    await page.click(`input[name="rdoEntityName"][value="${firstName}"]`);
    await page.waitForTimeout(1000);

    // Click Display Details
    console.log("Clicking Display Details...");
    await page.click("#btnDisplayDetails");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    console.log(`Deed detail URL: ${page.url()}\n`);
    await page.screenshot({ path: "/tmp/gsccca-deed-detail.png" });

    // Capture ALL tables on the page
    const allTables = await page.$$eval("table", (tables) =>
      tables.map((t, idx) => {
        const headers = Array.from(t.querySelectorAll("th")).map((th) => th.textContent?.trim() || "").filter((h) => h.length > 0);
        const allRows = Array.from(t.querySelectorAll("tr"));
        const dataRows = allRows.filter((tr) => {
          const tds = tr.querySelectorAll("td");
          return tds.length > 2;
        });
        const samples = dataRows.slice(0, 5).map((tr) => {
          const tds = Array.from(tr.querySelectorAll("td"));
          return tds.map((td) => {
            const text = (td.textContent?.trim() || "").slice(0, 50);
            const link = td.querySelector("a");
            return link ? `[LINK:${link.textContent?.trim()?.slice(0, 30)}|${link.href?.slice(0, 80)}]` : text;
          });
        });
        return {
          index: idx,
          headers,
          totalRows: allRows.length,
          dataRowCount: dataRows.length,
          samples,
          className: (t.className || "").slice(0, 60),
          id: t.id || "",
        };
      })
    );

    for (const t of allTables) {
      if (t.dataRowCount < 1) continue;
      console.log(`\nTable #${t.index} (class="${t.className}" id="${t.id}") — ${t.dataRowCount} data rows`);
      if (t.headers.length > 0) {
        console.log(`  Headers: [${t.headers.join(" | ")}]`);
      }
      for (const [i, row] of t.samples.entries()) {
        console.log(`  Row ${i} (${row.length} cells): [${row.join(" | ")}]`);
      }
    }

    // Also get the full HTML of the main results table for deep inspection
    const mainTableHTML = await page.$$eval("table", (tables) => {
      // Find the table with the most data rows
      let best = null;
      let bestCount = 0;
      for (const t of tables) {
        const count = Array.from(t.querySelectorAll("tr")).filter(tr => tr.querySelectorAll("td").length > 3).length;
        if (count > bestCount) { bestCount = count; best = t; }
      }
      if (!best) return "";
      // Get first 3 data rows as raw HTML
      const rows = Array.from(best.querySelectorAll("tr")).filter(tr => tr.querySelectorAll("td").length > 3).slice(0, 2);
      return rows.map(r => r.innerHTML).join("\n---ROW---\n");
    });
    if (mainTableHTML) {
      console.log("\n\n═══ RAW HTML of main results rows ═══");
      console.log(mainTableHTML.slice(0, 3000));
    }
  }

  // ══════════════════════════════════════════════════
  // PART 2: Lien — Same flow
  // ══════════════════════════════════════════════════
  console.log("\n\n═══ PART 2: Lien Details ═══\n");
  await page.goto("https://search.gsccca.org/lien/namesearch.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await page.fill("#txtSearchName", "JOHNSON");
  await page.fill("#txtFromDate", "01/01/2024");
  await page.fill("#txtToDate", "03/31/2024");
  await page.selectOption('select[name="intCountyID"]', "60"); // Fulton
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    if (typeof (window as any).fnSubmitForm === "function") (window as any).fnSubmitForm();
  });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);

  const lienRadios = await page.$$eval('table.name_results input[name="rdoEntityName"]', (inputs) =>
    inputs.map((i) => (i as HTMLInputElement).value)
  );
  console.log(`Found ${lienRadios.length} lien name entries`);
  console.log(`First 5: ${JSON.stringify(lienRadios.slice(0, 5))}\n`);

  if (lienRadios.length > 0) {
    // Pick one with multiple occurrences if possible
    const targetName = lienRadios.find(n => n.includes("ALFRED")) || lienRadios[0];
    console.log(`Selecting: "${targetName}"`);
    await page.click(`input[name="rdoEntityName"][value="${targetName}"]`);
    await page.waitForTimeout(1000);
    await page.click("#btnDisplayDetails");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    console.log(`Lien detail URL: ${page.url()}\n`);

    const lienTables = await page.$$eval("table", (tables) =>
      tables.map((t, idx) => {
        const headers = Array.from(t.querySelectorAll("th")).map((th) => th.textContent?.trim() || "").filter((h) => h.length > 0);
        const dataRows = Array.from(t.querySelectorAll("tr")).filter(tr => tr.querySelectorAll("td").length > 2);
        const samples = dataRows.slice(0, 5).map((tr) =>
          Array.from(tr.querySelectorAll("td")).map((td) => (td.textContent?.trim() || "").slice(0, 50))
        );
        return { index: idx, headers, dataRowCount: dataRows.length, samples, className: (t.className || "").slice(0, 60) };
      })
    );

    for (const t of lienTables) {
      if (t.dataRowCount < 1) continue;
      console.log(`\nLien Table #${t.index} (class="${t.className}") — ${t.dataRowCount} data rows`);
      if (t.headers.length > 0) console.log(`  Headers: [${t.headers.join(" | ")}]`);
      for (const [i, row] of t.samples.entries()) {
        console.log(`  Row ${i}: [${row.join(" | ")}]`);
      }
    }
  }

  // ══════════════════════════════════════════════════
  // PART 3: Premium PT-61 Address Search
  // ══════════════════════════════════════════════════
  console.log("\n\n═══ PART 3: Premium PT-61 Address Search ═══\n");
  await page.goto("https://search.gsccca.org/PT61Premium/AddressSearch.aspx", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  // Search for a known Atlanta address
  await page.fill("#BodyContent_txtAddress", "peachtree");

  // Select Fulton county
  try {
    await page.selectOption("#BodyContent_ddlCounties", { label: "FULTON" });
  } catch {
    // Try by partial match
    const opts = await page.$$eval("#BodyContent_ddlCounties option", (options) =>
      options.map(o => ({ value: (o as HTMLOptionElement).value, text: o.textContent?.trim() || "" }))
    );
    const fulton = opts.find(o => o.text.toLowerCase().includes("fulton"));
    if (fulton) await page.selectOption("#BodyContent_ddlCounties", fulton.value);
    console.log(`County options (first 10): ${JSON.stringify(opts.slice(0, 10))}`);
  }

  await page.fill("#BodyContent_txtDateFrom", "01/01/2024");
  await page.fill("#BodyContent_txtDateTo", "06/30/2024");
  await page.waitForTimeout(500);

  await page.click("#BodyContent_btnSearch");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);

  console.log(`PT-61 results URL: ${page.url()}`);
  await page.screenshot({ path: "/tmp/gsccca-pt61-results.png" });

  const pt61Tables = await page.$$eval("table", (tables) =>
    tables.map((t, idx) => {
      const headers = Array.from(t.querySelectorAll("th")).map((th) => th.textContent?.trim() || "").filter((h) => h.length > 0);
      const dataRows = Array.from(t.querySelectorAll("tr")).filter(tr => tr.querySelectorAll("td").length > 2);
      const samples = dataRows.slice(0, 5).map((tr) =>
        Array.from(tr.querySelectorAll("td")).map((td) => (td.textContent?.trim() || "").slice(0, 60))
      );
      return { index: idx, headers, dataRowCount: dataRows.length, samples, className: (t.className || "").slice(0, 60) };
    })
  );

  for (const t of pt61Tables) {
    if (t.dataRowCount < 1) continue;
    console.log(`\nPT-61 Table #${t.index} (class="${t.className}") — ${t.dataRowCount} data rows`);
    if (t.headers.length > 0) console.log(`  Headers: [${t.headers.join(" | ")}]`);
    for (const [i, row] of t.samples.entries()) {
      console.log(`  Row ${i}: [${row.join(" | ")}]`);
    }
  }

  // Also check if results use a GridView or DataGrid (ASP.NET)
  const gridViews = await page.$$eval("[id*='GridView'], [id*='grdResults'], [id*='grid'], [id*='Grid']", (els) =>
    els.map(e => ({ id: e.id, tag: e.tagName, className: e.className?.slice(0, 50) || "" }))
  );
  if (gridViews.length > 0) {
    console.log(`\nASP.NET GridViews found: ${JSON.stringify(gridViews)}`);
  }

  await browser.close();
  console.log("\n✅ Done!");
}

main().catch(console.error);
