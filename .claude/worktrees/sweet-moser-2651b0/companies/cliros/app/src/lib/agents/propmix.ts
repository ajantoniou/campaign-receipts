/* ─── PropMix Public Records API Client ───
   Uses PropMix (pubrec.propmix.io) to get property owner names and
   deed/transaction history from an address. This replaces the broken
   PT-61 dependency for address → owner name resolution.

   Endpoints used:
   1. GetPropertyDetails → owner names, parcel #, assessed value, legal description
   2. GetTransactionHistory → deed chain with buyer/seller, book/page, price
   3. GetOpenMortgages → open mortgage liens

   Auth: accesstoken header with API key
   Pricing: $79/mo for 1,000 property calls, $129/mo for 1,000 deed calls
*/

export interface PropMixPropertyDetails {
  pmxPropertyId: string;
  parcelNumber: string;
  fips: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  propertyType: string;
  propertySubType: string;
  owner1FullName: string;
  owner2FullName: string;
  owner1IsCorporation: boolean;
  owner2IsCorporation: boolean;
  assessedValue: number | null;
  marketValue: number | null;
  yearBuilt: string;
  lotSizeAcres: string;
  lotSizeSqFt: string;
  livingArea: string;
  stories: number | null;
  legalSubdivision: string;
  lastSaleDate: string;
  lastSalePrice: number | null;
  lastSaleDocType: string;
  lastSaleBook: string;
  lastSalePage: string;
  lastSaleSeller: string;
  taxAnnualAmount: number | null;
  zoning: string;
}

export interface PropMixTransaction {
  recordingDate: string;
  contractDate: string;
  documentType: string;
  transactionType: string;
  buyer1FullName: string;
  buyer2FullName: string;
  buyer1IsCorporation: boolean;
  seller1FullName: string;
  seller2FullName: string;
  seller1IsCorporation: boolean;
  closePrice: number | null;
  recordingBook: string;
  recordingPage: string;
  recordingDocId: string;
  buyerMailingAddress: string;
}

export interface PropMixMortgage {
  lenderName: string;
  loanAmount: number | null;
  loanType: string;
  interestRate: number | null;
  recordingDate: string;
  recordingBook: string;
  recordingPage: string;
  maturityDate: string;
  mortgageType: string;
}

export interface PropMixSearchResults {
  property: PropMixPropertyDetails | null;
  transactions: PropMixTransaction[];
  mortgages: PropMixMortgage[];
  ownerNames: string[];
  errors: string[];
}

const API_BASE = "https://api.propmix.io";

export function createPropMixClient() {
  const apiKey = process.env.PROPMIX_API_KEY;
  if (!apiKey) {
    console.warn("[PropMix] PROPMIX_API_KEY not set — PropMix disabled");
    return null;
  }

  let orderCounter = 0;

  async function apiGet<T>(endpoint: string, params: Record<string, string>): Promise<T | null> {
    orderCounter++;
    const orderId = `cliros-${Date.now()}-${orderCounter}`;
    const searchParams = new URLSearchParams({ ...params, OrderId: orderId });
    const url = `${API_BASE}${endpoint}?${searchParams.toString()}`;

    try {
      const resp = await fetch(url, {
        headers: { accesstoken: apiKey! },
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) {
        console.error(`[PropMix] HTTP ${resp.status} from ${endpoint}`);
        return null;
      }

      const data = await resp.json();
      if (data.Status?.Code !== 200) {
        console.error(`[PropMix] API error: ${data.Status?.Message || "unknown"}`);
        return null;
      }

      return data.Data as T;
    } catch (err) {
      console.error(`[PropMix] Request failed for ${endpoint}:`, err);
      return null;
    }
  }

  function parseAddress(fullAddress: string): { street: string; zip: string; city: string; state: string } {
    const parts = fullAddress.split(",").map((s) => s.trim());
    const street = parts[0] || "";
    const city = parts[1] || "";
    const stateZip = (parts[2] || "").trim().split(/\s+/);
    const state = stateZip[0] || "";
    const zip = stateZip[1] || "";
    return { street, zip, city, state };
  }

  async function getPropertyDetails(address: string): Promise<PropMixPropertyDetails | null> {
    const { street, zip } = parseAddress(address);
    if (!street || !zip) {
      console.warn("[PropMix] Cannot parse address for property lookup:", address);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await apiGet<any>("/pubrec/assessor/v1/GetPropertyDetails", {
      StreetAddress: street,
      PostalCode: zip,
    });

    if (!data?.Listing) return null;
    const l = data.Listing;

    return {
      pmxPropertyId: l.PMXPropertyId || "",
      parcelNumber: l.ParcelNumber || "",
      fips: l.FIPS || "",
      address: {
        street: l.StreetAddress || "",
        city: l.City || "",
        state: l.StateOrProvince || "",
        zip: l.PostalCode || "",
      },
      propertyType: l.PropertyType || "",
      propertySubType: l.PropertySubType || "",
      owner1FullName: l.Owner1FullName || "",
      owner2FullName: l.Owner2FullName || "",
      owner1IsCorporation: l.Owner1IsCorporation === "T",
      owner2IsCorporation: l.Owner2IsCorporation === "T",
      assessedValue: l.AssessedValue ? parseInt(l.AssessedValue) : null,
      marketValue: l.MarketValue ? parseInt(l.MarketValue) : null,
      yearBuilt: l.YearBuilt || "",
      lotSizeAcres: l.LotSizeAcres || "",
      lotSizeSqFt: l.LotSizeSquareFeet || "",
      livingArea: l.LivingArea || "",
      stories: l.Stories || null,
      legalSubdivision: l.LegalSubdivisionName || "",
      lastSaleDate: l.LastSaleRecordingDate || "",
      lastSalePrice: l.ClosePrice ? parseInt(l.ClosePrice) : null,
      lastSaleDocType: l.LastSaleDocumentType || "",
      lastSaleBook: l.LastSaleRecordingBook || "",
      lastSalePage: l.LastSaleRecordingPage || "",
      lastSaleSeller: l.LastSaleSeller1FullName || "",
      taxAnnualAmount: l.TaxAnnualAmount ? parseFloat(l.TaxAnnualAmount) : null,
      zoning: l.Zoning || "",
    };
  }

  async function getTransactionHistory(address: string): Promise<PropMixTransaction[]> {
    const { street, zip } = parseAddress(address);
    if (!street || !zip) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await apiGet<any>("/pubrec/transaction/v1/GetTransactionHistory", {
      StreetAddress: street,
      PostalCode: zip,
    });

    if (!data?.Records) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.Records.map((r: any) => ({
      recordingDate: r.TransactionRecordingDate || "",
      contractDate: r.TransactionContractDate || "",
      documentType: r.TransactionDocumentType || "",
      transactionType: r.TransactionType || "",
      buyer1FullName: r.Buyer1FullName || "",
      buyer2FullName: r.Buyer2FullName || "",
      buyer1IsCorporation: !!r.Buyer1IsCorporation,
      seller1FullName: r.Seller1FullName || "",
      seller2FullName: r.Seller2FullName || "",
      seller1IsCorporation: !!r.Seller1IsCorporation,
      closePrice: r.ClosePrice || null,
      recordingBook: r.TransactionRecordingBook || "",
      recordingPage: r.TransactionRecordingPage || "",
      recordingDocId: r.TransactionRecordingDocumentId || "",
      buyerMailingAddress: [
        r.MailingStreetNumber,
        r.MailingStreetDirPrefix,
        r.MailingStreetName,
        r.MailingStreetSuffix,
        r.MailingStreetDirSuffix,
        r.MailingUnitPrefix,
        r.MailingUnitNumber,
      ]
        .filter(Boolean)
        .join(" "),
    }));
  }

  async function getOpenMortgages(address: string): Promise<PropMixMortgage[]> {
    const { street, zip } = parseAddress(address);
    if (!street || !zip) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await apiGet<any>("/pubrec/mortgage/v1/GetOpenMortgages", {
      StreetAddress: street,
      PostalCode: zip,
    });

    if (!data?.Records) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.Records.map((r: any) => ({
      lenderName: r.LenderName || "",
      loanAmount: r.LoanAmount || null,
      loanType: r.LoanType || "",
      interestRate: r.InterestRate || null,
      recordingDate: r.RecordingDate || "",
      recordingBook: r.RecordingBook || "",
      recordingPage: r.RecordingPage || "",
      maturityDate: r.MaturityDate || "",
      mortgageType: r.MortgageType || "",
    }));
  }

  async function searchProperty(address: string): Promise<PropMixSearchResults> {
    const results: PropMixSearchResults = {
      property: null,
      transactions: [],
      mortgages: [],
      ownerNames: [],
      errors: [],
    };

    // Run property details + transaction history in parallel
    const [property, transactions, mortgages] = await Promise.all([
      getPropertyDetails(address).catch((e) => {
        results.errors.push(`PropMix property lookup failed: ${e}`);
        return null;
      }),
      getTransactionHistory(address).catch((e) => {
        results.errors.push(`PropMix transaction history failed: ${e}`);
        return [] as PropMixTransaction[];
      }),
      getOpenMortgages(address).catch((e) => {
        results.errors.push(`PropMix mortgage lookup failed: ${e}`);
        return [] as PropMixMortgage[];
      }),
    ]);

    results.property = property;
    results.transactions = transactions;
    results.mortgages = mortgages;

    // Extract unique owner names for GSCCCA search
    const names = new Set<string>();
    if (property?.owner1FullName) names.add(property.owner1FullName.toUpperCase());
    if (property?.owner2FullName) names.add(property.owner2FullName.toUpperCase());
    for (const t of transactions) {
      if (t.buyer1FullName) names.add(t.buyer1FullName.toUpperCase());
      if (t.buyer2FullName) names.add(t.buyer2FullName.toUpperCase());
      if (t.seller1FullName) names.add(t.seller1FullName.toUpperCase());
      if (t.seller2FullName) names.add(t.seller2FullName.toUpperCase());
    }
    // Filter out empty/generic entries
    results.ownerNames = Array.from(names).filter(
      (n) => n.length > 1 && !n.startsWith("C/O ") && n !== "UNKNOWN"
    );

    console.log(
      `[PropMix] Property: ${property ? "found" : "not found"}, ` +
        `Transactions: ${transactions.length}, Mortgages: ${mortgages.length}, ` +
        `Owner names: ${results.ownerNames.join(", ")}`
    );

    return results;
  }

  return { getPropertyDetails, getTransactionHistory, getOpenMortgages, searchProperty };
}
