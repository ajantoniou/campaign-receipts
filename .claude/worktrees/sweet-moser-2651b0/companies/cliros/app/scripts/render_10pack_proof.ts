/* One-shot: regenerate all 10 PDFs for a given report, download them
   to /tmp/cliros-10pack/, and report size + first-page sanity. */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { ensureGeneratedPdf } from "../src/lib/pipeline/render-pdfs";
import { invalidateGeneratedPdfs } from "../src/lib/document-storage";

const DOCS = [
  "title", "aol", "homeowner", "commitment", "deed",
  "settlement", "pt61", "seller_affidavit", "form_1099s", "owners_affidavit",
] as const;

async function main() {
  const reportId = process.argv[2];
  if (!reportId) throw new Error("usage: render_10pack_proof.ts <reportId>");

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );

  const { data: r, error } = await sb
    .from("search_reports")
    .select("user_id")
    .eq("id", reportId)
    .single();
  if (error || !r) throw new Error(`Report not found: ${error?.message}`);
  const userId = r.user_id as string;

  await mkdir("/tmp/cliros-10pack", { recursive: true });
  console.log(`Invalidating cached PDFs for ${reportId}...`);
  await invalidateGeneratedPdfs(reportId);

  const results: Array<{ doc: string; ok: boolean; bytes?: number; err?: string; ms: number }> = [];
  for (const doc of DOCS) {
    const t0 = Date.now();
    try {
      const url = await ensureGeneratedPdf(reportId, userId, doc);
      const resp = await fetch(url);
      const buf = Buffer.from(await resp.arrayBuffer());
      await writeFile(`/tmp/cliros-10pack/${doc}.pdf`, buf);
      const ms = Date.now() - t0;
      results.push({ doc, ok: true, bytes: buf.length, ms });
      console.log(`  ✓ ${doc.padEnd(20)} ${buf.length.toString().padStart(7)} bytes  ${ms}ms`);
    } catch (e) {
      const ms = Date.now() - t0;
      const err = e instanceof Error ? e.message : String(e);
      results.push({ doc, ok: false, err, ms });
      console.log(`  ✗ ${doc.padEnd(20)} FAILED  ${ms}ms — ${err}`);
    }
  }
  console.log("\n=== summary ===");
  console.log(`OK: ${results.filter(r => r.ok).length}/10`);
  for (const r of results.filter(r => !r.ok)) console.log(`  ✗ ${r.doc}: ${r.err}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
