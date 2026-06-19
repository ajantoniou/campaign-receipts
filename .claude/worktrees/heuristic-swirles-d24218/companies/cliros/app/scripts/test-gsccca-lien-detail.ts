/* Capture lien detail page structure */
import { chromium } from "playwright";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();

  await page.goto("https://www.gsccca.org/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.fill("#pagelayoutBox_loginForm_C004_mobileusername", process.env.GSCCCA_USERNAME!);
  await page.fill("#pagelayoutBox_loginForm_C004_mobilepassword", process.env.GSCCCA_PASSWORD!);
  await page.click("#pagelayoutBox_loginForm_C004_mobileloginbtn");
  await page.waitForTimeout(3000);

  await page.goto("https://search.gsccca.org/lien/namesearch.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.fill("#txtSearchName", "SMITH");
  await page.fill("#txtFromDate", "01/01/2024");
  await page.fill("#txtToDate", "03/31/2024");
  await page.selectOption('select[name="intCountyID"]', "60");
  await page.waitForTimeout(500);
  await page.evaluate(() => { (window as any).fnSubmitForm?.(); });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);

  // Select a name with multiple occurrences
  const radios = await page.$$eval('input[name="rdoEntityName"]', (inputs) =>
    inputs.map((i) => (i as HTMLInputElement).value)
  );
  const target = radios.find(n => n.includes("ALFRED")) || radios[0];
  console.log(`Selecting: ${target}`);
  await page.click(`input[name="rdoEntityName"][value="${target}"]`);
  await page.waitForTimeout(500);
  await page.click('input[value="Display Details"]');
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);

  console.log(`URL: ${page.url()}\n`);

  // Get ALL table classes and structures
  const tables = await page.$$eval("table", (tables) =>
    tables.map((t, idx) => {
      const cls = t.className || "";
      const id = t.id || "";
      const rows = Array.from(t.querySelectorAll("tr"));
      const dataRows = rows.filter(tr => tr.querySelectorAll("td").length > 1);
      const samples = dataRows.slice(0, 3).map(tr => {
        const tds = Array.from(tr.querySelectorAll("td"));
        return tds.map(td => {
          const cls = td.className || "";
          const text = (td.textContent?.trim() || "").slice(0, 60);
          return `[${cls}]${text}`;
        });
      });
      return { idx, cls, id, totalRows: rows.length, dataRowCount: dataRows.length, samples };
    })
  );

  for (const t of tables) {
    if (t.dataRowCount < 1) continue;
    console.log(`Table #${t.idx} class="${t.cls}" id="${t.id}" — ${t.dataRowCount} data rows`);
    for (const [i, row] of t.samples.entries()) {
      console.log(`  Row ${i}: ${row.join(" | ")}`);
    }
    console.log("");
  }

  // Get raw HTML of the main content area
  const mainContent = await page.$eval("body", (body) => {
    // Find the largest content table
    const tables = Array.from(body.querySelectorAll("table"));
    let best = null;
    let bestTds = 0;
    for (const t of tables) {
      const count = t.querySelectorAll("td").length;
      if (count > bestTds) { bestTds = count; best = t; }
    }
    return best?.outerHTML?.slice(0, 4000) || "NO TABLE FOUND";
  });
  console.log("\n═══ Largest table HTML (first 4000 chars) ═══\n");
  console.log(mainContent);

  await browser.close();
  console.log("\n✅ Done!");
}
main().catch(console.error);
