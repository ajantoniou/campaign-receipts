/* Quick test: find the lien page Display Details button */
import { chromium } from "playwright";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();

  // Login
  await page.goto("https://www.gsccca.org/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.fill("#pagelayoutBox_loginForm_C004_mobileusername", process.env.GSCCCA_USERNAME!);
  await page.fill("#pagelayoutBox_loginForm_C004_mobilepassword", process.env.GSCCCA_PASSWORD!);
  await page.click("#pagelayoutBox_loginForm_C004_mobileloginbtn");
  await page.waitForTimeout(3000);

  // Lien search
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

  // Get ALL buttons on name list page
  const buttons = await page.$$eval("input[type=button], input[type=submit], button", (btns) =>
    btns.map((b) => ({
      value: (b as HTMLInputElement).value || b.textContent?.trim() || "",
      name: (b as HTMLInputElement).name || "",
      id: b.id || "",
      onclick: b.getAttribute("onclick")?.slice(0, 100) || "",
      visible: (b as HTMLElement).offsetParent !== null,
    }))
  );
  console.log("All buttons on lien name list:");
  for (const b of buttons) {
    console.log(`  value="${b.value}" name="${b.name}" id="${b.id}" visible=${b.visible} onclick="${b.onclick}"`);
  }

  // Select first radio
  const radios = await page.$$eval('input[name="rdoEntityName"]', (inputs) =>
    inputs.map((i) => (i as HTMLInputElement).value)
  );
  if (radios.length > 0) {
    await page.click(`input[name="rdoEntityName"][value="${radios[0]}"]`);
    await page.waitForTimeout(500);

    // Check buttons again after selection
    const btns2 = await page.$$eval("input[type=button], input[type=submit], button", (btns) =>
      btns.map((b) => ({
        value: (b as HTMLInputElement).value || "",
        id: b.id || "",
        onclick: b.getAttribute("onclick")?.slice(0, 100) || "",
        visible: (b as HTMLElement).offsetParent !== null,
      }))
    );
    console.log("\nButtons after radio selection:");
    for (const b of btns2) {
      if (b.visible) console.log(`  value="${b.value}" id="${b.id}" onclick="${b.onclick}"`);
    }

    // Try clicking "Display Details" by value
    const displayBtn = await page.$('input[value="Display Details"]');
    if (displayBtn) {
      console.log("\nFound 'Display Details' button, clicking...");
      await displayBtn.click();
    } else {
      // Try fnSubmitForm again
      console.log("\nNo Display Details button. Trying fnSubmitForm()...");
      await page.evaluate(() => { (window as any).fnSubmitForm?.(); });
    }
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    console.log(`\nResult URL: ${page.url()}`);

    // Check for table_borders
    const tableCount = await page.$$eval("table.table_borders", (t) => t.length);
    console.log(`table.table_borders count: ${tableCount}`);

    if (tableCount > 0) {
      const firstInstrument = await page.$eval("table.table_borders", (t) => {
        const cells = Array.from(t.querySelectorAll("td.reg_deed_cell_borders"));
        return cells.map((c) => c.textContent?.trim()?.slice(0, 50) || "");
      });
      console.log(`First lien instrument: [${firstInstrument.join(" | ")}]`);
    }
  }

  await browser.close();
  console.log("\n✅ Done!");
}
main().catch(console.error);
