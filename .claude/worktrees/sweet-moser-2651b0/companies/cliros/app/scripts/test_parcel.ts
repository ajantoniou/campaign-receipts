import { resolveParcelAnchor, parseStreetAddress, extractOwnerSearchNames } from "../src/lib/agents/parcel";

async function main() {
  for (const addr of [
    "1396 Peachtree Street NE, Atlanta, GA 30309",
    "1394 Peachtree Battle Ave NW, Atlanta, GA 30318",
    "1393 Peachtree St NE, Atlanta, GA 30309",
    "1409 Peachtree St NE, Atlanta, GA 30309",
  ]) {
    console.log(`\n══ ${addr} ══`);
    console.log("  parsed:", parseStreetAddress(addr));
    const anchor = await resolveParcelAnchor(addr, "Fulton");
    if (!anchor) {
      console.log("  ❌ NO PARCEL FOUND — would block the report");
      continue;
    }
    console.log(`  ✓ parcel=${anchor.parcelId}`);
    console.log(`  ✓ owner="${anchor.owner}"`);
    console.log(`  ✓ siteAddress="${anchor.siteAddress}"`);
    console.log(`  ✓ valued at $${anchor.totalAppraisedValue?.toLocaleString()} on ${anchor.landAcres} ac`);
    console.log(`  ✓ ownerSearchNames=${JSON.stringify(extractOwnerSearchNames(anchor.owner))}`);
  }
}
main().catch(console.error);
