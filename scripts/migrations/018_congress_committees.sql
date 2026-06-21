-- 018_congress_committees.sql
--
-- Congressional committees + memberships — the missing piece for the "gatekeeper
-- of jurisdiction" money-to-vote archetype (does a bill's sponsor sit on the
-- committee with jurisdiction, and in what role?). Source: the open, maintained
-- unitedstates/congress-legislators data (committees-current + committee-membership-
-- current), which also carries the bioguide↔FEC crosswalk we use to tie members to
-- their FEC money. These are CONGRESSIONAL committees — distinct from cr_committees,
-- which holds FEC committees (PACs).

-- Congressional committees (House/Senate + subcommittees), code → name + jurisdiction.
create table if not exists cr_congress_committees (
  thomas_id   text primary key,            -- e.g. HSAG (House Agriculture)
  parent_id   text,                        -- subcommittees point to their parent
  chamber     text,                        -- house | senate | joint
  name        text not null,
  jurisdiction text,
  jurisdiction_source text,
  updated_at  timestamptz not null default now()
);
create index if not exists cr_congress_committees_chamber_idx on cr_congress_committees (chamber);

-- Member ↔ committee assignments, with role (Chair / Ranking Member / member).
create table if not exists cr_committee_assignments (
  id uuid primary key default gen_random_uuid(),
  thomas_id   text not null references cr_congress_committees(thomas_id) on delete cascade,
  bioguide    text not null,               -- member (joins cr_politicians.bioguide)
  party       text,                        -- majority | minority (as reported)
  role        text,                        -- Chair | Ranking Member | Vice Chair | member
  rank        integer,
  updated_at  timestamptz not null default now(),
  unique (thomas_id, bioguide)
);
create index if not exists cr_committee_assignments_bioguide_idx on cr_committee_assignments (bioguide);
create index if not exists cr_committee_assignments_committee_idx on cr_committee_assignments (thomas_id);

-- Bill → committee(s) of referral (jurisdiction). Populated from Congress.gov
-- referral data; nullable until backfilled. The defensible "this bill is before
-- the committee the sponsor sits on" needs this.
create table if not exists cr_bill_committees (
  id uuid primary key default gen_random_uuid(),
  bill_id   uuid not null references cr_bills(id) on delete cascade,
  thomas_id text,                          -- referred committee (may be null if unmapped)
  committee_name text,
  chamber   text,
  activity  text,                          -- "Referred to" etc.
  updated_at timestamptz not null default now(),
  unique (bill_id, committee_name)
);
create index if not exists cr_bill_committees_bill_idx on cr_bill_committees (bill_id);

grant select on cr_congress_committees, cr_committee_assignments, cr_bill_committees
  to anon, authenticated;
grant select, insert, update, delete on cr_congress_committees, cr_committee_assignments, cr_bill_committees
  to service_role;
