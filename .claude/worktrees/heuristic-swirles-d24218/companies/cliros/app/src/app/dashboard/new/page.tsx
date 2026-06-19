"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { computeTitleMetrics } from "@/lib/title-metrics";

const GA_COUNTIES = [
  "Appling","Atkinson","Bacon","Baker","Baldwin","Banks","Barrow","Bartow","Ben Hill",
  "Berrien","Bibb","Bleckley","Brantley","Brooks","Bryan","Bulloch","Burke","Butts",
  "Calhoun","Camden","Candler","Carroll","Catoosa","Charlton","Chatham","Chattahoochee",
  "Chattooga","Cherokee","Clarke","Clay","Clayton","Clinch","Cobb","Coffee","Colquitt",
  "Columbia","Cook","Coweta","Crawford","Crisp","Dade","Dawson","Decatur","DeKalb",
  "Dodge","Dooly","Dougherty","Douglas","Early","Echols","Effingham","Elbert","Emanuel",
  "Evans","Fannin","Fayette","Floyd","Forsyth","Franklin","Fulton","Gilmer","Glascock",
  "Glynn","Gordon","Grady","Greene","Gwinnett","Habersham","Hall","Hancock","Haralson",
  "Harris","Hart","Heard","Henry","Houston","Irwin","Jackson","Jasper","Jeff Davis",
  "Jefferson","Jenkins","Johnson","Jones","Lamar","Lanier","Laurens","Lee","Liberty",
  "Lincoln","Long","Lowndes","Lumpkin","Macon","Madison","Marion","McDuffie","McIntosh",
  "Meriwether","Miller","Mitchell","Monroe","Montgomery","Morgan","Murray","Muscogee",
  "Newton","Oconee","Oglethorpe","Paulding","Peach","Pickens","Pierce","Pike","Polk",
  "Pulaski","Putnam","Quitman","Rabun","Randolph","Richmond","Rockdale","Schley",
  "Screven","Seminole","Spalding","Stephens","Stewart","Sumter","Talbot","Taliaferro",
  "Tattnall","Taylor","Telfair","Terrell","Thomas","Tift","Toombs","Towns","Treutlen",
  "Troup","Turner","Twiggs","Union","Upson","Walker","Walton","Ware","Warren",
  "Washington","Wayne","Webster","Wheeler","White","Whitfield","Wilcox","Wilkes",
  "Wilkinson","Worth"
];

type SearchState = "idle" | "searching" | "complete" | "error" | "payment_required";

function NewSearchInner() {
  const searchParams = useSearchParams();
  const [address, setAddress] = useState(searchParams.get("address") || "");
  const [county, setCounty] = useState("");
  const [status, setStatus] = useState<SearchState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  // Optional "Improve accuracy" hints — all default empty; each one
  // independently narrows the GSCCCA search if filled.
  const [priorOwnerName, setPriorOwnerName] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerName2, setBuyerName2] = useState("");
  const [jointTenancy, setJointTenancy] = useState(false);

  useEffect(() => {
    if (searchParams.get("address") && !result) {
      // Auto-search if address passed in URL
    }
  }, [searchParams, result]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;

    setStatus("searching");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          county: county || undefined,
          prior_owner_name: priorOwnerName.trim() || undefined,
          sale_date: saleDate || undefined,
          loan_amount: loanAmount ? Math.round(parseFloat(loanAmount) * 100) : undefined,
          listing_url: listingUrl.trim() || undefined,
          buyer_name: buyerName.trim() || undefined,
          buyer_name_2: buyerName2.trim() || undefined,
          joint_tenancy: jointTenancy || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402 || data.code === "PAYMENT_REQUIRED") {
          setStatus("payment_required");
          setError(data.message || "Free trial expired. $200 per report.");
          return;
        }
        if (res.status === 422 && data.code === "PARCEL_NOT_FOUND") {
          setStatus("error");
          setError(
            data.error ||
              "We couldn't find this address in the county tax parcel database. " +
                "Please verify the street number, street name, and ZIP — or pick the closest " +
                "matching suggestion from the autocomplete dropdown."
          );
          return;
        }
        throw new Error(data.error || "Search failed");
      }

      setResult(data);
      setStatus("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setStatus("error");
    }
  }

  async function handlePayAndSearch() {
    try {
      const res = await fetch("/api/lemon/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: `rpt_${Date.now()}`,
          address: address.trim(),
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Failed to create payment session");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">New Title Search</h1>
      <p className="text-sm text-muted mb-8">Enter a Georgia property address to run a full title search.</p>

      <form onSubmit={handleSearch} className="space-y-4">
        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Property Address</label>
          <div className="border border-border rounded-lg focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 bg-white">
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onCountyDetected={(c) => setCounty(c)}
              placeholder="123 Peachtree St NE, Atlanta, GA 30309"
              className="w-full"
              inputClassName="w-full px-4 py-3 text-sm bg-transparent outline-none"
            />
          </div>
        </div>

        {/* County (optional) */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">County (optional)</label>
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg bg-white text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
          >
            <option value="">Auto-detect from address</option>
            {GA_COUNTIES.map((c) => (
              <option key={c} value={c}>{c} County</option>
            ))}
          </select>
        </div>

        {/* Optional accuracy hints — closed by default. Filling any of these
            measurably sharpens the GSCCCA search and cuts the kill rate. */}
        <details className="group rounded-lg border border-border bg-white">
          <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between text-sm font-medium text-foreground hover:bg-surface/50 rounded-lg">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent transition-transform group-open:rotate-90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              Improve accuracy <span className="text-muted text-xs font-normal">(optional, ~30 seconds)</span>
            </span>
            <span className="text-xs text-muted">5 fields</span>
          </summary>

          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border">
            {/* Prior owner name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Prior owner / seller name</label>
              <p className="text-xs text-muted mb-2">
                Copy it from the Purchase &amp; Sale Agreement. The vesting deed is indexed under the
                seller&apos;s surname, so this single field is the highest-leverage hint you can give us.
              </p>
              <input
                type="text"
                value={priorOwnerName}
                onChange={(e) => setPriorOwnerName(e.target.value)}
                placeholder="John & Jane Smith"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
              <p className="text-[11px] text-muted mt-1.5 leading-relaxed">
                Any format works: <span className="font-mono text-foreground">John &amp; Jane Smith</span>,
                {" "}<span className="font-mono text-foreground">Smith, John R.</span>,
                {" "}<span className="font-mono text-foreground">The Smith Family Trust</span>, or
                {" "}<span className="font-mono text-foreground">Peachtree 1314 LLC</span>.
              </p>
            </div>

            {/* Sale date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Recent sale date</label>
              <p className="text-xs text-muted mb-2">
                Narrows the GSCCCA window so the vesting deed surfaces above older refinancing noise.
                If unknown, leave blank — we search the full 50-year title window by default.
              </p>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
            </div>

            {/* Loan amount */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Buyer&apos;s loan amount (USD)</label>
              <p className="text-xs text-muted mb-2">
                Used as a sanity check — if indexed liens total more than 5× the loan,
                we flag likely surname overmatches so you don&apos;t chase ghosts.
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="500000"
                  className="w-full pl-8 pr-4 py-2.5 border border-border rounded-lg bg-white text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </div>

            {/* Active listing URL — Zillow / Redfin / Realtor.com only */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Active listing URL (optional)</label>
              <p className="text-xs text-muted mb-2">
                Paste a Zillow, Redfin, or Realtor.com link and we&apos;ll auto-fill the
                last sale date and sale price for the sanity check above. We only read
                the listing&apos;s metadata — never the full property page.
              </p>
              <input
                type="url"
                value={listingUrl}
                onChange={(e) => setListingUrl(e.target.value)}
                placeholder="https://www.zillow.com/homedetails/..."
                pattern="https?://(www\.)?(zillow|redfin|realtor)\.com/.*"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
              <p className="text-[11px] text-muted mt-1.5 leading-relaxed">
                Supported: <span className="font-mono text-foreground">zillow.com</span>,
                {" "}<span className="font-mono text-foreground">redfin.com</span>,
                {" "}<span className="font-mono text-foreground">realtor.com</span>. Other domains are ignored.
              </p>
            </div>

            {/* Buyer name(s) — for the draft warranty deed */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Buyer name(s) (optional)</label>
              <p className="text-xs text-muted mb-2">
                Used to pre-fill the draft warranty deed Cliros generates. Leave blank to get a deed
                template with a buyer-name placeholder you fill in yourself.
              </p>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Mary Smith"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 mb-2"
              />
              <input
                type="text"
                value={buyerName2}
                onChange={(e) => setBuyerName2(e.target.value)}
                placeholder="Second buyer (optional — for joint deeds)"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
              {buyerName2.trim() && (
                <label className="mt-2 flex items-center gap-2 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jointTenancy}
                    onChange={(e) => setJointTenancy(e.target.checked)}
                    className="rounded border-border"
                  />
                  Joint tenancy with right of survivorship (otherwise: tenants in common)
                </label>
              )}
            </div>
          </div>
        </details>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "searching" || !address.trim()}
          className="w-full bg-primary text-white font-semibold py-3.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 text-sm"
        >
          {status === "searching" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Searching GSCCCA & Federal Records...
            </span>
          ) : "Run Title Search — Georgia"}
        </button>
      </form>

      {/* Status messages */}
      {status === "error" && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {status === "payment_required" && (
        <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <p className="text-amber-800 font-bold mb-1">Free Trial Complete</p>
          <p className="text-sm text-amber-700 mb-4">{error}</p>
          <button
            onClick={handlePayAndSearch}
            className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition text-sm"
          >
            Pay $200 & Run Search
          </button>
        </div>
      )}

      {status === "complete" && result && (() => {
        const metrics = computeTitleMetrics({
          riskScore: (result.riskScore as number) || 0,
          liens: (result.liens as Array<{ status?: string }>) || [],
          defects: (result.defects as Array<{ severity?: string }>) || [],
        });
        return (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-bold mb-1">Search Complete — {metrics.marketabilityLabel}</p>
          <p className="text-sm text-green-600">
            {(result.chainOfTitle as { entries?: unknown[] })?.entries?.length || 0} deeds ·{" "}
            {(result.liens as unknown[])?.length || 0} liens · {metrics.curativeItemCount} checklist item{metrics.curativeItemCount === 1 ? "" : "s"}
          </p>
          <a
            href={`/dashboard/reports/${result.id}`}
            className="inline-block mt-3 text-sm font-semibold text-accent hover:text-accent-light"
          >
            View Full Report →
          </a>
        </div>
        );
      })()}

      {/* Info box */}
      <div className="mt-8 p-4 bg-surface rounded-xl border border-border">
        <p className="text-xs font-bold text-foreground mb-2">What we search:</p>
        <ul className="text-xs text-muted space-y-1">
          <li>✓ GSCCCA Real Estate Index — deeds, chain of title</li>
          <li>✓ GSCCCA Lien Index — judgment liens, tax liens, lis pendens</li>
          <li>✓ GSCCCA UCC Index — UCC filings</li>
          <li>✓ Federal Courts — bankruptcy, federal tax liens</li>
          <li>✓ AI Engine — risk analysis, defect identification, AOL draft</li>
        </ul>
      </div>
    </div>
  );
}

export default function NewSearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted">Loading...</div></div>}>
      <NewSearchInner />
    </Suspense>
  );
}
