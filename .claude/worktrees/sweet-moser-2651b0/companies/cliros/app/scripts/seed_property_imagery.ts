#!/usr/bin/env node
/* One-off: seed cliros.properties.imagery for an existing property.
   Useful when re-running an already-searched report through the persona
   chain without re-running stageSearching. Idempotent — exits 0 if the
   property already has imagery.

   USAGE:
     CLIROS_PROPERTY_ID=<id> CLIROS_ADDRESS="<full address>" \
       npx tsx scripts/seed_property_imagery.ts
*/
import { ensurePropertyImagery } from "../src/lib/agents/property-imagery";

async function main() {
  const id = process.env.CLIROS_PROPERTY_ID;
  const addr = process.env.CLIROS_ADDRESS;
  if (!id || !addr) {
    console.error("Need CLIROS_PROPERTY_ID and CLIROS_ADDRESS env vars.");
    process.exit(1);
  }
  const out = await ensurePropertyImagery(id, addr);
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
