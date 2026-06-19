/* ─── GSCCCA Live Search Test ───
   Run: npx tsx scripts/test-gsccca-search.ts
*/

import { chromium } from "playwright";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const USERNAME = process.env.GSCCCA_USERNAME!;
const PASSWORD = process.env.GSCCCA_PASSWORD!;

async function main() {
  console.log("🚀 GSCCCA Live Search Test\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, // Full desktop size
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  // ── Step 1: Login ──
  console.log("⏳ Logging in...");
  await page.goto("https://www.gsccca.org/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  // Debug: check which login fields are visible
  const usernameVisible = await page.isVisible("#username");
  const mobileUsernameVisible = await page.isVisible("#pagelayoutBox_loginForm_C004_mobileusername");
  console.log(`   Desktop #username visible: ${usernameVisible}`);
  console.log(`   Mobile username visible: ${mobileUsernameVisible}`);

  // Take screenshot to see the actual page
  await page.screenshot({ path: "/tmp/gsccca-login.png" });
  console.log("   Screenshot saved: /tmp/gsccca-login.png");

  // Try filling whichever form is visible
  if (usernameVisible) {
    await page.fill("#username", USERNAME);
    await page.fill("#password", PASSWORD);
    await page.click("#loginbtn");
  } else if (mobileUsernameVisible) {
    await page.fill("#pagelayoutBox_loginForm_C004_mobileusername", USERNAME);
    await page.fill("#pagelayoutBox_loginForm_C004_mobilepassword", PASSWORD);
    await page.click("#pagelayoutBox_loginForm_C004_mobileloginbtn");
  } else {
    // Try input type=password as fallback
    const allInputs = await page.$$eval("input", (els) =>
      els.map((e) => ({
        name: e.name, id: e.id, type: e.type,
        visible: e.offsetParent !== null,
        rect: e.getBoundingClientRect(),
      }))
    );
    console.log("   All inputs with visibility:");
    for (const inp of allInputs) {
      if (inp.type === "hidden") continue;
      console.log(`   - name="${inp.name}" id="${inp.id}" type="${inp.type}" visible=${inp.visible} rect=${JSON.stringify(inp.rect)}`);
    }
    console.error("   ❌ No visible login form found");
    await browser.close();
    return;
  }

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
  console.log(`   Post-login URL: ${page.url()}`);
  await page.screenshot({ path: "/tmp/gsccca-post-login.png" });

  // Check if login succeeded by looking for logout link or search access
  const pageText = await page.textContent("body");
  const isLoggedIn = pageText?.includes("Logout") || pageText?.includes("Log Out") || pageText?.includes("Welcome");
  console.log(`   Login successful: ${isLoggedIn}`);

  // ── Step 2: Real Estate Name Search ──
  console.log("\n⏳ Real Estate Name Search (test: 'SMITH' in Fulton County)...");
  await page.goto("https://search.gsccca.org/RealEstate/namesearch.asp", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(2000);

  // Debug: check search form visibility
  const searchNameVisible = await page.isVisible("#txtSearchName");
  console.log(`   txtSearchName visible: ${searchNameVisible}`);

  if (!searchNameVisible) {
    await page.screenshot({ path: "/tmp/gsccca-re-search.png" });
    console.log("   Screenshot saved: /tmp/gsccca-re-search.png");
    // Check if there's a login redirect
    console.log(`   Current URL: ${page.url()}`);
    const allInputsRE = await page.$$eval("input:not([type=hidden])", (els) =>
      els.map((e) => ({ name: e.name, id: e.id, type: e.type, visible: e.offsetParent !== null }))
    );
    console.log("   Available inputs:", JSON.stringify(allInputsRE));
    await browser.close();
    return;
  }

  // Fill search form
  await page.fill("#txtSearchName", "SMITH");
  await page.fill("#txtFromDate", "01/01/2024");
  await page.fill("#txtToDate", "06/30/2024");

  // Select Fulton County
  try {
    const countyOptions = await page.$$eval('select[name="intCountyID"] option', (opts: any[]) =>
      opts.slice(0, 10).map((o: any) => ({ value: o.value, text: o.textContent?.trim() || "" }))
    );
    console.log(`   First 10 county options: ${JSON.stringify(countyOptions)}`);

    const fulton = await page.$$eval('select[name="intCountyID"] option', (opts: any[]) => {
      const f = opts.find((o: any) => o.textContent?.toLowerCase().includes("fulton"));
      return f ? { value: f.value, text: f.textContent?.trim() } : null;
    });
    if (fulton) {
      await page.selectOption('select[name="intCountyID"]', fulton.value);
      console.log(`   Selected: ${fulton.text} (value=${fulton.value})`);
    }
  } catch (err) {
    console.log(`   County selection error: ${err}`);
  }

  await page.waitForTimeout(1000);

  // Screenshot before submit
  await page.screenshot({ path: "/tmp/gsccca-search-filled.png" });

  // Submit
  await page.click("#btnSubmit");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);

  console.log(`   Results URL: ${page.url()}`);
  await page.screenshot({ path: "/tmp/gsccca-results.png" });

  // Capture results table structure
  await captureResultsPage(page, "REAL ESTATE RESULTS");

  // ── Step 3: Lien Search ──
  console.log("\n⏳ Lien Name Search...");
  await page.goto("https://search.gsccca.org/lien/namesearch.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await page.fill("#txtSearchName", "SMITH");
  await page.fill("#txtFromDate", "01/01/2024");
  await page.fill("#txtToDate", "06/30/2024");

  try {
    const fulton = await page.$$eval('select[name="intCountyID"] option', (opts: any[]) => {
      const f = opts.find((o: any) => o.textContent?.toLowerCase().includes("fulton"));
      return f ? { value: f.value } : null;
    });
    if (fulton) await page.selectOption('select[name="intCountyID"]', fulton.value);
  } catch { /* ignore */ }

  await page.waitForTimeout(1000);

  // Find submit button on lien page
  const lienBtns = await page.$$eval('input[type="button"]', (btns: any[]) =>
    btns.map((b: any) => ({ name: b.name, value: b.value, id: b.id, onclick: b.getAttribute("onclick")?.slice(0, 80) || "" }))
  );
  console.log("   Lien page buttons:", JSON.stringify(lienBtns));

  // Click the search/submit button
  const searchBtn = lienBtns.find((b: any) => b.value?.toLowerCase().includes("search") || b.onclick?.includes("submit") || b.onclick?.includes("Search"));
  if (searchBtn) {
    if (searchBtn.id) {
      await page.click(`#${searchBtn.id}`);
    } else if (searchBtn.value) {
      await page.click(`input[value="${searchBtn.value}"]`);
    }
  } else if (lienBtns.length > 0) {
    // Try the last button (often the submit)
    const lastBtn = lienBtns[lienBtns.length - 1];
    console.log(`   Trying last button: ${JSON.stringify(lastBtn)}`);
  }

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);
  await captureResultsPage(page, "LIEN RESULTS");

  // ── Step 4: UCC Search (after login) ──
  console.log("\n⏳ UCC Search...");
  await page.goto("https://search.gsccca.org/UCC_Search/search.asp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const uccInputs = await page.$$eval("input:not([type=hidden]), select, textarea", (els: any[]) =>
    els.map((e: any) => ({
      tag: e.tagName.toLowerCase(),
      name: e.name || "",
      id: e.id || "",
      type: e.type || "",
      visible: e.offsetParent !== null,
    }))
  );
  console.log(`   UCC form fields (visible):`);
  for (const inp of uccInputs.filter((i: any) => i.visible)) {
    console.log(`   - <${inp.tag}> name="${inp.name}" id="${inp.id}" type="${inp.type}"`);
  }

  // ── Step 5: PT-61 ──
  console.log("\n⏳ PT-61 Search...");
  await page.goto("https://search.gsccca.org/pt61/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const pt61Inputs = await page.$$eval("input:not([type=hidden]), select, textarea", (els: any[]) =>
    els.map((e: any) => ({
      tag: e.tagName.toLowerCase(),
      name: e.name || "",
      id: e.id || "",
      type: e.type || "",
      visible: e.offsetParent !== null,
    }))
  );
  console.log(`   PT-61 form fields (visible):`);
  for (const inp of pt61Inputs.filter((i: any) => i.visible)) {
    console.log(`   - <${inp.tag}> name="${inp.name}" id="${inp.id}" type="${inp.type}"`);
  }

  const pt61Links = await page.$$eval("a", (anchors: any[]) =>
    anchors
      .filter((a: any) => a.textContent?.trim() && a.offsetParent !== null)
      .map((a: any) => ({ text: a.textContent?.trim()?.slice(0, 60), href: a.href }))
  );
  console.log("   PT-61 visible links:");
  for (const l of pt61Links.slice(0, 20)) {
    if (l.href.includes("pt61") || l.href.includes("search") || l.href.includes("PT61")) {
      console.log(`   - "${l.text}" → ${l.href}`);
    }
  }

  // ── Step 6: Premium Search ──
  console.log("\n⏳ Premium Real Estate Search...");
  await page.goto("https://search.gsccca.org/RealEstatePremium/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  console.log(`   Premium URL: ${page.url()}`);
  await page.screenshot({ path: "/tmp/gsccca-premium.png" });

  const premiumInputs = await page.$$eval("input:not([type=hidden]), select, textarea", (els: any[]) =>
    els.map((e: any) => ({
      tag: e.tagName.toLowerCase(),
      name: e.name || "",
      id: e.id || "",
      type: e.type || "",
      visible: e.offsetParent !== null,
      placeholder: e.placeholder || "",
    }))
  );
  console.log(`   Premium form fields:`);
  for (const inp of premiumInputs) {
    console.log(`   - <${inp.tag}> name="${inp.name}" id="${inp.id}" type="${inp.type}" visible=${inp.visible} placeholder="${inp.placeholder}"`);
  }

  await browser.close();
  console.log("\n✅ Done!");
}

async function captureResultsPage(page: any, label: string) {
  console.log(`\n   ── ${label} ──`);
  console.log(`   URL: ${page.url()}`);

  // Check for error/no results
  const bodyText = (await page.textContent("body")) || "";
  if (/no records|no results|0 records/i.test(bodyText)) {
    console.log("   ⚠️ No results found");
  }

  // Get all tables
  const tables = await page.$$eval("table", (tables: any[]) =>
    tables.map((t: any, idx: number) => {
      const headers = Array.from(t.querySelectorAll("th")).map(
        (th: any) => th.textContent?.trim() || ""
      );
      const allRows = Array.from(t.querySelectorAll("tr"));
      const dataRows = allRows.filter((tr: any) => tr.querySelectorAll("td").length > 0);
      const sampleRows = dataRows.slice(0, 3).map((tr: any) =>
        Array.from(tr.querySelectorAll("td")).map(
          (td: any) => (td.textContent?.trim() || "").slice(0, 50)
        )
      );
      return {
        index: idx,
        headers: headers.filter((h: string) => h.length > 0),
        totalRows: allRows.length,
        dataRows: dataRows.length,
        sampleRows,
        className: (t.className || "").slice(0, 60),
        id: t.id || "",
      };
    })
  );

  for (const t of tables) {
    if (t.dataRows < 1) continue;
    console.log(`\n   Table #${t.index} (class="${t.className}" id="${t.id}")`);
    console.log(`   Rows: ${t.dataRows} data rows, ${t.totalRows} total`);
    if (t.headers.length > 0) {
      console.log(`   Headers: [${t.headers.join(" | ")}]`);
    }
    for (const [i, row] of t.sampleRows.entries()) {
      console.log(`   Sample row ${i}: [${row.join(" | ")}]`);
    }
  }
}

main().catch(console.error);
