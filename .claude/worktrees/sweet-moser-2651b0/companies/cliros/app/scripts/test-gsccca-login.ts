/* ─── GSCCCA Login Test ───
   Run: npx tsx scripts/test-gsccca-login.ts

   Tests login and captures form field names from each search page
   so we can calibrate the browser agent selectors.
*/

import { chromium } from "playwright";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const USERNAME = process.env.GSCCCA_USERNAME!;
const PASSWORD = process.env.GSCCCA_PASSWORD!;

async function capturePageInfo(page: any, label: string) {
  const url = page.url();
  const title = await page.title();

  const inputs = await page.$$eval("input, select, textarea", (els: any[]) =>
    els.map((e: any) => ({
      tag: e.tagName.toLowerCase(),
      name: e.name || "",
      id: e.id || "",
      type: e.type || "",
      placeholder: e.placeholder || "",
      className: e.className?.toString()?.slice(0, 50) || "",
    }))
  );

  const tables = await page.$$eval("table", (tables: any[]) =>
    tables.map((t: any) => {
      const ths = t.querySelectorAll("th");
      return {
        headers: Array.from(ths).map((th: any) => th.textContent?.trim() || ""),
        rowCount: t.querySelectorAll("tr").length,
      };
    })
  );

  const links = await page.$$eval("a", (anchors: any[]) =>
    anchors
      .filter((a: any) => a.href && a.textContent?.trim())
      .slice(0, 30)
      .map((a: any) => ({
        text: a.textContent?.trim()?.slice(0, 50),
        href: a.href,
      }))
  );

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📄 ${label}`);
  console.log(`   URL: ${url}`);
  console.log(`   Title: ${title}`);
  console.log(`\n   Form fields (${inputs.length}):`);
  for (const inp of inputs) {
    if (inp.type === "hidden") continue;
    console.log(`   - <${inp.tag}> name="${inp.name}" id="${inp.id}" type="${inp.type}" placeholder="${inp.placeholder}"`);
  }
  if (tables.length > 0) {
    console.log(`\n   Tables (${tables.length}):`);
    for (const t of tables) {
      console.log(`   - ${t.rowCount} rows, headers: [${t.headers.join(", ")}]`);
    }
  }
  console.log(`\n   Links (first 15):`);
  for (const l of links.slice(0, 15)) {
    console.log(`   - "${l.text}" → ${l.href}`);
  }
}

async function main() {
  console.log("🚀 GSCCCA Login Test");
  console.log(`   Username: ${USERNAME}`);
  console.log(`   Password: ${"*".repeat(PASSWORD.length)}`);

  const browser = await chromium.launch({ headless: false }); // visible for debugging
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Step 1: Go to login page
  console.log("\n⏳ Navigating to GSCCCA login...");
  await page.goto("https://www.gsccca.org/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await capturePageInfo(page, "LOGIN PAGE");

  // Try the identity portal instead
  console.log("\n⏳ Trying identity portal...");
  await page.goto("https://identity.gsccca.org/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await capturePageInfo(page, "IDENTITY PORTAL");

  // Try account portal
  console.log("\n⏳ Trying account portal...");
  await page.goto("https://account.gsccca.org/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await capturePageInfo(page, "ACCOUNT PORTAL");

  // Try to find and fill login form
  console.log("\n⏳ Attempting login...");

  // Check current page for login form
  const passwordField = await page.$('input[type="password"]');
  if (passwordField) {
    // Find associated username/email field
    const emailField = await page.$('input[type="email"], input[type="text"][name*="user" i], input[type="text"][name*="login" i], input[name*="email" i]');
    if (emailField) {
      await emailField.fill(USERNAME);
      await page.waitForTimeout(500);
      await passwordField.fill(PASSWORD);
      await page.waitForTimeout(500);

      const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        console.log(`\n✅ After login attempt — URL: ${page.url()}`);
        await capturePageInfo(page, "POST-LOGIN");
      }
    }
  } else {
    console.log("   No password field found on current page");
    // Take screenshot for debugging
    await page.screenshot({ path: "gsccca-login-page.png" });
    console.log("   Screenshot saved: gsccca-login-page.png");
  }

  // Step 2: Try to access Real Estate search
  console.log("\n⏳ Accessing Real Estate Name Search...");
  await page.goto("https://search.gsccca.org/RealEstate/namesearch.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await capturePageInfo(page, "REAL ESTATE NAME SEARCH");

  // Step 3: Try Lien search
  console.log("\n⏳ Accessing Lien Index...");
  await page.goto("https://search.gsccca.org/lien/namesearch.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await capturePageInfo(page, "LIEN NAME SEARCH");

  // Step 4: Try UCC search
  console.log("\n⏳ Accessing UCC Search...");
  await page.goto("https://search.gsccca.org/UCC_Search/search.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await capturePageInfo(page, "UCC SEARCH");

  // Step 5: Try PT-61 search
  console.log("\n⏳ Accessing PT-61 Search...");
  await page.goto("https://search.gsccca.org/pt61/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await capturePageInfo(page, "PT-61 SEARCH");

  // Step 6: Try Premium Real Estate search
  console.log("\n⏳ Accessing Premium Real Estate Search...");
  await page.goto("https://search.gsccca.org/RealEstatePremium/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await capturePageInfo(page, "PREMIUM REAL ESTATE SEARCH");

  console.log("\n✅ Done! Keeping browser open for 30 seconds for manual inspection...");
  await page.waitForTimeout(30000);

  await browser.close();
}

main().catch(console.error);
