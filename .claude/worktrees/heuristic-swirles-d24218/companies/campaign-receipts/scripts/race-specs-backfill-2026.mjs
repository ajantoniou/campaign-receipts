// CampaignReceipts — 2026 race backfill specs.
// GENERATED 2026-06-15 by scripts/_build-specs.py against the LIVE FEC API.
// Every fec_id below was verified via GET /candidate/{id}/ (cycle=2026):
//   real candidate, office/state/district matched, party from party_full.
// Per-race IE totals were computed via GET /schedules/schedule_e/by_candidate/
//   with election_full=FALSE — i.e. 2026-cycle IE ONLY. This is the HONEST
//   "outside money in the 2026 race" figure. election_full=TRUE folds in a
//   re-running candidate's 2024 IE and badly inflates some races (MI Rogers
//   +$63M, GA Ossoff +$6.6M from 2024) — those headlines would be fabricated.
// ⚠️ ACTION FOR THE HUMAN WIRING THIS: populate-active-races.mjs candidateIE()
//   currently calls by_candidate with election_full:"true". Flip it to "false"
//   so the rendered total_ie_usd matches these honest headlines. Otherwise the
//   MI/GA cards will show 2024-inflated totals that contradict the headline.
// Observed IE total per race (for human spot-check):
//   al-senate-2026-general             4 cand  $   9,162,159  top: DEFEND AMERICAN JOBS
//   ar-senate-2026-general             2 cand  $   1,944,562  top: AMERICA ONE
//   ga-senate-2026-general             3 cand  $   3,163,420  top: HARDWORKING AMERICANS INC.
//   il-senate-2026-general             3 cand  $  24,626,612  top: ILLINOIS FUTURE PAC
//   ia-senate-2026-general             2 cand  $   6,198,543  top: VOTEVETS
//   ky-senate-2026-general             4 cand  $  35,627,772  top: FIGHT FOR KENTUCKY
//   la-senate-2026-general             3 cand  $  11,670,963  top: LOUISIANA FREEDOM FUND
//   me-senate-2026-general             2 cand  $   5,581,679  top: PINE TREE RESULTS PAC
//   mi-senate-2026-general             2 cand  $   2,196,229  top: AMERICANS FOR PROSPERITY ACTION, INC. (AFP ACTION) DBA CVA ACTION AND DBA LIBRE ACTION
//   nc-senate-2026-general             2 cand  $   3,512,217  top: AMERICANS FOR PROSPERITY ACTION, INC. (AFP ACTION) DBA CVA ACTION AND DBA LIBRE ACTION
//   oh-senate-2026-general             2 cand  $   1,219,126  top: SLF PAC
//   il-09-2026-general                 5 cand  $   8,935,718  top: ELECT CHICAGO WOMEN AKA ECW
//   il-07-2026-general                 5 cand  $   8,564,885  top: UNITED DEMOCRACY PROJECT ('UDP')
//   ny-12-2026-general                 2 cand  $   7,720,783  top: STAND FOR NEW YORK PAC
//   tn-07-2026-general                 5 cand  $   8,606,741  top: MAGA INC.
//   il-08-2026-general                 3 cand  $   6,381,532  top: ELECT CHICAGO WOMEN AKA ECW
//   il-02-2026-general                 3 cand  $   7,183,107  top: AFFORDABLE CHICAGO NOW! (ACN)
//   nj-11-2026-general                 5 cand  $   5,828,906  top: UNITED DEMOCRACY PROJECT ('UDP')
//   fl-06-2026-general                 1 cand  $   3,749,381  top: CONSERVATIVE FIGHTER PAC
//   va-11-2026-general                 2 cand  $   2,761,410  top: OVERSIGHT ACTION FUND
//   ga-14-2026-general                 2 cand  $   2,621,028  top: CONSERVATIVES FOR AMERICAN EXCELLENCE INC.
//   ne-02-2026-general                 2 cand  $   2,476,447  top: FIGHT FOR NEBRASKA PAC
//   tx-18-2026-general                 2 cand  $   2,231,098  top: PROTECT PROGRESS
//   fl-01-2026-general                 1 cand  $   2,138,565  top: CONSERVATIVE FUTURE FUND
//   tx-08-2026-general                 1 cand  $   1,744,167  top: DEFEND AMERICAN JOBS
//   tx-32-2026-general                 2 cand  $   1,719,364  top: STRONG PAC
//   wi-07-2026-general                 1 cand  $   1,591,406  top: NORTHWOODS FUTURE PAC
//   tx-10-2026-general                 1 cand  $   1,582,302  top: AMERICAN MISSION
//   ca-04-2026-general                 2 cand  $   1,543,390  top: NEW LEADERSHIP NOW
//   nj-12-2026-general                 2 cand  $   1,225,803  top: AMERICAN PRIORITIES (AP)
//   ga-01-2026-general                 1 cand  $   1,243,883  top: AMERICAN MISSION
//   tx-35-2026-general                 3 cand  $   1,157,393  top: DEFENDING OUR VALUES PAC
//   tx-21-2026-general                 1 cand  $     930,870  top: CONSERVATIVES FOR AMERICAN EXCELLENCE INC.
//   pa-07-2026-general                 1 cand  $     818,535  top: STRONGER TOGETHER PA
//   nc-01-2026-general                 1 cand  $     871,120  top: AMERICAN MISSION
// Skipped: tx-senate (already in populate-active-races.mjs), ky-04 (hand-curated).

export const BACKFILL_RACE_SPECS = [
  {
    slug: "al-senate-2026-general",
    race_type: "senate_general",
    state: "AL",
    district: "AL-Statewide",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "Alabama U.S. Senate 2026 — $9.2M in outside money so far",
    blurb: "Outside groups have reported independent expenditures in the Alabama U.S. Senate race for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent to support or oppose a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "S6AL00476", name: "Felix Barry Moore", party: "Republican", incumbent: false },
      { fec_id: "S6AL00443", name: "Jared Hudson", party: "Republican", incumbent: false },
      { fec_id: "S6AL00450", name: "Steven T Marshall", party: "Republican", incumbent: false },
      { fec_id: "S0AL00230", name: "Thomas H Tuberville", party: "Republican", incumbent: true },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=S&candidate_state=AL&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/senate/?state=AL&cycle=2026" },
    ],
  },
  {
    slug: "ar-senate-2026-general",
    race_type: "senate_general",
    state: "AR",
    district: "AR-Statewide",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "Arkansas U.S. Senate 2026 — $1.9M in outside money so far",
    blurb: "Outside groups have reported independent expenditures in the Arkansas U.S. Senate race for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent to support or oppose a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "S6AR00199", name: "Hallie Shoffner", party: "Democratic", incumbent: false },
      { fec_id: "S4AR00103", name: "Thomas Cotton", party: "Republican", incumbent: true },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=S&candidate_state=AR&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/senate/?state=AR&cycle=2026" },
    ],
  },
  {
    slug: "ga-senate-2026-general",
    race_type: "senate_general",
    state: "GA",
    district: "GA-Statewide",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "Georgia U.S. Senate 2026 — $3.2M in outside money so far",
    blurb: "Outside groups have reported independent expenditures in the Georgia U.S. Senate race for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent to support or oppose a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "S6GA00408", name: "Derek Dooley", party: "Republican", incumbent: false },
      { fec_id: "S8GA00180", name: "T. Jonathan Ossoff", party: "Democratic", incumbent: true },
      { fec_id: "S6GA00390", name: "Michael A JR Collins", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=S&candidate_state=GA&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/senate/?state=GA&cycle=2026" },
    ],
  },
  {
    slug: "il-senate-2026-general",
    race_type: "senate_general",
    state: "IL",
    district: "IL-Statewide",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "Illinois U.S. Senate 2026 — $25M in outside money so far",
    blurb: "Outside groups have reported independent expenditures in the Illinois U.S. Senate race for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent to support or oppose a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "S6IL00458", name: "Juliana Stratton", party: "Democratic", incumbent: false },
      { fec_id: "S6IL00482", name: "S Krishnamoorthi", party: "Democratic", incumbent: false },
      { fec_id: "S6IL00474", name: "Robin Kelly", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=S&candidate_state=IL&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/senate/?state=IL&cycle=2026" },
    ],
  },
  {
    slug: "ia-senate-2026-general",
    race_type: "senate_general",
    state: "IA",
    district: "IA-Statewide",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "Iowa U.S. Senate 2026 — $6.2M in outside money so far",
    blurb: "Outside groups have reported independent expenditures in the Iowa U.S. Senate race for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent to support or oppose a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "S6IA00298", name: "Joshua Turek", party: "Democratic", incumbent: false },
      { fec_id: "S6IA00314", name: "Ashley Hinson Arenholz", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=S&candidate_state=IA&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/senate/?state=IA&cycle=2026" },
    ],
  },
  {
    slug: "ky-senate-2026-general",
    race_type: "senate_general",
    state: "KY",
    district: "KY-Statewide",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "Kentucky U.S. Senate 2026 — $36M in outside money so far",
    blurb: "Outside groups have reported independent expenditures in the Kentucky U.S. Senate race for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent to support or oppose a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "S6KY00302", name: "Nate Morris", party: "Republican", incumbent: false },
      { fec_id: "S6KY00286", name: "Garland Andy Barr", party: "Republican", incumbent: false },
      { fec_id: "S6KY00237", name: "Daniel Cameron", party: "Republican", incumbent: false },
      { fec_id: "S0KY00156", name: "Rand Paul", party: "Republican", incumbent: true },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=S&candidate_state=KY&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/senate/?state=KY&cycle=2026" },
    ],
  },
  {
    slug: "la-senate-2026-general",
    race_type: "senate_general",
    state: "LA",
    district: "LA-Statewide",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "Louisiana U.S. Senate 2026 — $12M in outside money so far",
    blurb: "Outside groups have reported independent expenditures in the Louisiana U.S. Senate race for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent to support or oppose a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "S6LA00664", name: "Julia Letlow", party: "Republican", incumbent: false },
      { fec_id: "S4LA00107", name: "William M. Cassidy", party: "Republican", incumbent: true },
      { fec_id: "S6LA00540", name: "Blake Miguez", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=S&candidate_state=LA&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/senate/?state=LA&cycle=2026" },
    ],
  },
  {
    slug: "me-senate-2026-general",
    race_type: "senate_general",
    state: "ME",
    district: "ME-Statewide",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "Maine U.S. Senate 2026 — $5.6M in outside money so far",
    blurb: "Outside groups have reported independent expenditures in the Maine U.S. Senate race for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent to support or oppose a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "S6ME00373", name: "Graham Platner", party: "Democratic", incumbent: false },
      { fec_id: "S6ME00159", name: "Susan M. Collins", party: "Republican", incumbent: true },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=S&candidate_state=ME&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/senate/?state=ME&cycle=2026" },
    ],
  },
  {
    slug: "mi-senate-2026-general",
    race_type: "senate_general",
    state: "MI",
    district: "MI-Statewide",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "Michigan U.S. Senate 2026 — $2.2M in outside money so far",
    blurb: "Outside groups have reported independent expenditures in the Michigan U.S. Senate race for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent to support or oppose a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "S4MI00595", name: "Michael J Rogers", party: "Republican", incumbent: false },
      { fec_id: "S6MI00426", name: "Haley Stevens", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=S&candidate_state=MI&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/senate/?state=MI&cycle=2026" },
    ],
  },
  {
    slug: "nc-senate-2026-general",
    race_type: "senate_general",
    state: "NC",
    district: "NC-Statewide",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "North Carolina U.S. Senate 2026 — $3.5M in outside money so far",
    blurb: "Outside groups have reported independent expenditures in the North Carolina U.S. Senate race for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent to support or oppose a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "S6NC00415", name: "Michael Whatley", party: "Republican", incumbent: false },
      { fec_id: "S6NC00407", name: "Roy Cooper", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=S&candidate_state=NC&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/senate/?state=NC&cycle=2026" },
    ],
  },
  {
    slug: "oh-senate-2026-general",
    race_type: "senate_general",
    state: "OH",
    district: "OH-Statewide",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "Ohio U.S. Senate 2026 — $1.2M in outside money so far",
    blurb: "Outside groups have reported independent expenditures in the Ohio U.S. Senate race for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent to support or oppose a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "S6OH00304", name: "Jon Husted", party: "Republican", incumbent: true },
      { fec_id: "S6OH00163", name: "Sherrod Brown", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=S&candidate_state=OH&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/senate/?state=OH&cycle=2026" },
    ],
  },
  {
    slug: "il-09-2026-general",
    race_type: "house_general",
    state: "IL",
    district: "IL-09",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "IL-09 U.S. House 2026 — $8.9M in outside money so far",
    blurb: "The IL-09 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6IL09194", name: "Laura Fine", party: "Democratic", incumbent: false },
      { fec_id: "H6IL09228", name: "Daniel Biss", party: "Democratic", incumbent: false },
      { fec_id: "H6IL09178", name: "Katherine M. Abughazaleh", party: "Democratic", incumbent: false },
      { fec_id: "H6IL09301", name: "Philip Jerome Andrew", party: "Democratic", incumbent: false },
      { fec_id: "H6IL09236", name: "Bushra Amiwala", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=IL&candidate_district=09&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=IL&district=09&cycle=2026" },
    ],
  },
  {
    slug: "il-07-2026-general",
    race_type: "house_general",
    state: "IL",
    district: "IL-07",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "IL-07 U.S. House 2026 — $8.6M in outside money so far",
    blurb: "The IL-07 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H4IL07177", name: "Melissa Conyears-Ervin", party: "Democratic", incumbent: false },
      { fec_id: "H6IL07354", name: "La Shawn K Ford", party: "Democratic", incumbent: false },
      { fec_id: "H6IL07420", name: "Anthony JR. Driver", party: "Democratic", incumbent: false },
      { fec_id: "H6IL07339", name: "Jason Friedman", party: "Democratic", incumbent: false },
      { fec_id: "H6IL07438", name: "Thomas Fisher", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=IL&candidate_district=07&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=IL&district=07&cycle=2026" },
    ],
  },
  {
    slug: "ny-12-2026-general",
    race_type: "house_general",
    state: "NY",
    district: "NY-12",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "NY-12 U.S. House 2026 — $7.7M in outside money so far",
    blurb: "The NY-12 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6NY12214", name: "Alexander Bores", party: "Democratic", incumbent: false },
      { fec_id: "H6NY12172", name: "Micah Charles Lasher", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=NY&candidate_district=12&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=NY&district=12&cycle=2026" },
    ],
  },
  {
    slug: "tn-07-2026-general",
    race_type: "house_general",
    state: "TN",
    district: "TN-07",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "TN-07 U.S. House 2026 — $8.6M in outside money so far",
    blurb: "The TN-07 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6TN07161", name: "Matthew Robert Van Epps", party: "Republican", incumbent: true },
      { fec_id: "H6TN07195", name: "Aftyn Behn", party: "Democratic", incumbent: false },
      { fec_id: "H6TN07203", name: "Joseph Michael Barrett", party: "Republican", incumbent: false },
      { fec_id: "H6TN07229", name: "Vincent Dixie", party: "Democratic", incumbent: false },
      { fec_id: "H6TN07153", name: "Jonathan Thorp", party: "Independent", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=TN&candidate_district=07&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=TN&district=07&cycle=2026" },
    ],
  },
  {
    slug: "il-08-2026-general",
    race_type: "house_general",
    state: "IL",
    district: "IL-08",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "IL-08 U.S. House 2026 — $6.4M in outside money so far",
    blurb: "The IL-08 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6IL08329", name: "Melissa Luburich Bean", party: "Democratic", incumbent: false },
      { fec_id: "H2IL08146", name: "Junaid Ahmed", party: "Democratic", incumbent: false },
      { fec_id: "H6IL08287", name: "Dan Tully", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=IL&candidate_district=08&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=IL&district=08&cycle=2026" },
    ],
  },
  {
    slug: "il-02-2026-general",
    race_type: "house_general",
    state: "IL",
    district: "IL-02",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "IL-02 U.S. House 2026 — $7.2M in outside money so far",
    blurb: "The IL-02 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6IL02355", name: "Donna Miller", party: "Democratic", incumbent: false },
      { fec_id: "H6IL02124", name: "Jesse L. JR Jackson", party: "Democratic", incumbent: false },
      { fec_id: "H6IL02298", name: "Robert James Peters", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=IL&candidate_district=02&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=IL&district=02&cycle=2026" },
    ],
  },
  {
    slug: "nj-11-2026-general",
    race_type: "house_general",
    state: "NJ",
    district: "NJ-11",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "NJ-11 U.S. House 2026 — $5.8M in outside money so far",
    blurb: "The NJ-11 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6NJ11245", name: "Tom Malinowski", party: "Democratic", incumbent: false },
      { fec_id: "H6NJ11310", name: "Tahesha Way", party: "Democratic", incumbent: false },
      { fec_id: "H6NJ11260", name: "Zach Beecher", party: "Democratic", incumbent: false },
      { fec_id: "H6NJ11211", name: "Joe Hathaway", party: "Republican", incumbent: false },
      { fec_id: "H6NJ11237", name: "Brendan W Gill", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=NJ&candidate_district=11&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=NJ&district=11&cycle=2026" },
    ],
  },
  {
    slug: "fl-06-2026-general",
    race_type: "house_general",
    state: "FL",
    district: "FL-06",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "FL-06 U.S. House 2026 — $3.7M in outside money so far",
    blurb: "The FL-06 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6FL06258", name: "Randy Fine", party: "Republican", incumbent: true },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=FL&candidate_district=06&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=FL&district=06&cycle=2026" },
    ],
  },
  {
    slug: "va-11-2026-general",
    race_type: "house_general",
    state: "VA",
    district: "VA-11",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "VA-11 U.S. House 2026 — $2.8M in outside money so far",
    blurb: "The VA-11 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6VA11066", name: "James Walkinshaw", party: "Democratic", incumbent: true },
      { fec_id: "H6VA11140", name: "Amy Roma", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=VA&candidate_district=11&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=VA&district=11&cycle=2026" },
    ],
  },
  {
    slug: "ga-14-2026-general",
    race_type: "house_general",
    state: "GA",
    district: "GA-14",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "GA-14 U.S. House 2026 — $2.6M in outside money so far",
    blurb: "The GA-14 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H0GA14030", name: "Clay Fuller", party: "Republican", incumbent: true },
      { fec_id: "H6GA14193", name: "Colton Moore", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=GA&candidate_district=14&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=GA&district=14&cycle=2026" },
    ],
  },
  {
    slug: "ne-02-2026-general",
    race_type: "house_general",
    state: "NE",
    district: "NE-02",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "NE-02 U.S. House 2026 — $2.5M in outside money so far",
    blurb: "The NE-02 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6NE02190", name: "John Cavanaugh", party: "Democratic", incumbent: false },
      { fec_id: "H6NE02174", name: "Denise Powell", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=NE&candidate_district=02&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=NE&district=02&cycle=2026" },
    ],
  },
  {
    slug: "tx-18-2026-general",
    race_type: "house_general",
    state: "TX",
    district: "TX-18",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "TX-18 U.S. House 2026 — $2.2M in outside money so far",
    blurb: "The TX-18 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6TX18232", name: "Christian Menefee", party: "Democratic", incumbent: false },
      { fec_id: "H6TX18364", name: "Jolanda Jones", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=TX&candidate_district=18&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=TX&district=18&cycle=2026" },
    ],
  },
  {
    slug: "fl-01-2026-general",
    race_type: "house_general",
    state: "FL",
    district: "FL-01",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "FL-01 U.S. House 2026 — $2.1M in outside money so far",
    blurb: "The FL-01 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6FL01390", name: "Jimmy JR. Patronis", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=FL&candidate_district=01&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=FL&district=01&cycle=2026" },
    ],
  },
  {
    slug: "tx-08-2026-general",
    race_type: "house_general",
    state: "TX",
    district: "TX-08",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "TX-08 U.S. House 2026 — $1.7M in outside money so far",
    blurb: "The TX-08 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6TX08209", name: "Jessica Hart Steinmann", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=TX&candidate_district=08&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=TX&district=08&cycle=2026" },
    ],
  },
  {
    slug: "tx-32-2026-general",
    race_type: "house_general",
    state: "TX",
    district: "TX-32",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "TX-32 U.S. House 2026 — $1.7M in outside money so far",
    blurb: "The TX-32 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6TX32225", name: "Jace Yarbrough", party: "Republican", incumbent: false },
      { fec_id: "H6TX32159", name: "Ryan Binkley", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=TX&candidate_district=32&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=TX&district=32&cycle=2026" },
    ],
  },
  {
    slug: "wi-07-2026-general",
    race_type: "house_general",
    state: "WI",
    district: "WI-07",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "WI-07 U.S. House 2026 — $1.6M in outside money so far",
    blurb: "The WI-07 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6WI07223", name: "Michael Alfonso", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=WI&candidate_district=07&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=WI&district=07&cycle=2026" },
    ],
  },
  {
    slug: "tx-10-2026-general",
    race_type: "house_general",
    state: "TX",
    district: "TX-10",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "TX-10 U.S. House 2026 — $1.6M in outside money so far",
    blurb: "The TX-10 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6TX10221", name: "Chris Gober", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=TX&candidate_district=10&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=TX&district=10&cycle=2026" },
    ],
  },
  {
    slug: "ca-04-2026-general",
    race_type: "house_general",
    state: "CA",
    district: "CA-04",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "CA-04 U.S. House 2026 — $1.5M in outside money so far",
    blurb: "The CA-04 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6CA04222", name: "Eric Jones", party: "Democratic", incumbent: false },
      { fec_id: "H8CA01109", name: "Mike Mr. Thompson", party: "Democratic", incumbent: true },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=CA&candidate_district=04&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=CA&district=04&cycle=2026" },
    ],
  },
  {
    slug: "nj-12-2026-general",
    race_type: "house_general",
    state: "NJ",
    district: "NJ-12",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "NJ-12 U.S. House 2026 — $1.2M in outside money so far",
    blurb: "The NJ-12 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6NJ12417", name: "Adam Hamawy", party: "Democratic", incumbent: false },
      { fec_id: "H6NJ12276", name: "Shanel Y Robinson", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=NJ&candidate_district=12&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=NJ&district=12&cycle=2026" },
    ],
  },
  {
    slug: "ga-01-2026-general",
    race_type: "house_general",
    state: "GA",
    district: "GA-01",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "GA-01 U.S. House 2026 — $1.2M in outside money so far",
    blurb: "The GA-01 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6GA01109", name: "James Morris Kingston", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=GA&candidate_district=01&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=GA&district=01&cycle=2026" },
    ],
  },
  {
    slug: "tx-35-2026-general",
    race_type: "house_general",
    state: "TX",
    district: "TX-35",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "TX-35 U.S. House 2026 — $1.2M in outside money so far",
    blurb: "The TX-35 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6TX35087", name: "Carlos JR. De La Cruz", party: "Republican", incumbent: false },
      { fec_id: "H6TX35095", name: "Johnny Garcia", party: "Democratic", incumbent: false },
      { fec_id: "H6TX35053", name: "John Lujan", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=TX&candidate_district=35&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=TX&district=35&cycle=2026" },
    ],
  },
  {
    slug: "tx-21-2026-general",
    race_type: "house_general",
    state: "TX",
    district: "TX-21",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "TX-21 U.S. House 2026 — $931K in outside money so far",
    blurb: "The TX-21 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6TX21301", name: "Mark Charles Teixeira", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=TX&candidate_district=21&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=TX&district=21&cycle=2026" },
    ],
  },
  {
    slug: "pa-07-2026-general",
    race_type: "house_general",
    state: "PA",
    district: "PA-07",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "PA-07 U.S. House 2026 — $819K in outside money so far",
    blurb: "The PA-07 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H6PA07188", name: "Bob Brooks", party: "Democratic", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=PA&candidate_district=07&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=PA&district=07&cycle=2026" },
    ],
  },
  {
    slug: "nc-01-2026-general",
    race_type: "house_general",
    state: "NC",
    district: "NC-01",
    cycle: "2026",
    primary_date: "2026-11-03",
    election_date: "2026-11-03",
    headline: "NC-01 U.S. House 2026 — $871K in outside money so far",
    blurb: "The NC-01 U.S. House race has drawn reported independent expenditures from outside groups for 2026. Every figure below is a verified FEC Schedule-E independent expenditure — money spent for or against a candidate without coordinating with their campaign.",
    candidates: [
      { fec_id: "H4NC01137", name: "Laurie Buckhout", party: "Republican", incumbent: false },
    ],
    sources: [
      { publication: "FEC Schedule E (by candidate)", url: "https://www.fec.gov/data/independent-expenditures/?data_type=processed&candidate_office=H&candidate_state=NC&candidate_district=01&cycle=2026" },
      { publication: "FEC candidate search", url: "https://www.fec.gov/data/candidates/house/?state=NC&district=01&cycle=2026" },
    ],
  },
]
