-- 007_cr_races_and_article_politicians.sql
--
-- Two related backfills for the article detail page (/articles/[slug]):
--
--   (a) Add cr_articles.politician_ids text[] so video_companion and
--       race_funding articles can render clickable politician chips
--       under the existing "Race page →" pill.
--
--   (b) Insert two cr_races rows that don't exist yet — MO-1 2024
--       (Bush vs Bell) and PA-3 2026 (Rabb open seat). KY-04 2026
--       (Massie vs Gallrein) already exists as ky-04-2026-r-primary.
--
--   (c) Wire the three live video_companion articles
--       (cr-bell-bush-aipac-primary, cr-massie-gallrein-primary,
--       cr-rabb-pa3-aipac-defeat) to their race rows via
--       related_race_id and populate politician_ids with the slugs
--       that actually exist in cr_politicians.
--
-- Politicians NOT yet in cr_politicians (skipped from politician_ids
-- to avoid 404 chips — these need their own one-shot inserts when
-- their profile pages get built):
--   - ed-gallrein, miriam-adelson
--   - chris-rabb, ala-stanford, sharif-street, dwight-evans
--   - hasan-piker
--
-- Already present: cori-bush, wesley-bell, thomas-massie,
-- alexandria-ocasio-cortez.

-- ── (a) politician_ids column ───────────────────────────────
alter table public.cr_articles
  add column if not exists politician_ids text[] default '{}'::text[];

create index if not exists idx_cr_articles_politician_ids
  on public.cr_articles using gin (politician_ids);

-- ── (b) cr_races rows for MO-1 2024 and PA-3 2026 ───────────
-- Slug convention matches existing ky-04-2026-r-primary.

insert into public.cr_races (
  slug, race_type, state, district, cycle,
  primary_date, election_date, headline, blurb,
  candidates, total_ie_usd, total_spend_usd, top_pacs,
  is_active, result_summary, primary_sources
) values
(
  'mo-01-2024-d-primary',
  'house_primary',
  'MO',
  'MO-01',
  '2024',
  '2024-08-06',
  null,
  'Missouri 1st — 2024 Democratic Primary',
  'AIPAC''s super-PAC United Democracy Project spent ~$8.5M to oust incumbent Rep. Cori Bush. Challenger Wesley Bell won 51-46. The 5-point margin — despite $8M+ in outside spending — became the template CR uses to show that lobby money buys volume, not landslides.',
  '[
    {
      "slug": "cori-bush",
      "name": "Cori Bush",
      "party": "Democratic",
      "incumbent": true,
      "ie_for_usd": 0,
      "ie_against_usd": 8500000,
      "campaign_raised_usd": null,
      "polling_pct": 46.0,
      "notes": "Squad member. Voted against military aid to Israel post-Oct 2023; called for ceasefire. Lost by ~5 points despite $8.5M outside spend against her.",
      "endorsed_by": []
    },
    {
      "slug": "wesley-bell",
      "name": "Wesley Bell",
      "party": "Democratic",
      "incumbent": false,
      "ie_for_usd": 8500000,
      "ie_against_usd": 0,
      "campaign_raised_usd": null,
      "polling_pct": 51.0,
      "notes": "St. Louis County prosecutor. Backed by AIPAC-affiliated United Democracy Project.",
      "endorsed_by": ["United Democracy Project"]
    }
  ]'::jsonb,
  8500000,
  null,
  '[
    {
      "name": "United Democracy Project",
      "affiliation": "AIPAC-affiliated (FEC C00761668)",
      "total_usd": 8500000,
      "support_oppose": "against_bush",
      "target_candidate": "Cori Bush"
    }
  ]'::jsonb,
  false,
  'Wesley Bell defeated Cori Bush 51-46 on Aug 6, 2024.',
  '[
    {"publication": "FEC — United Democracy Project (C00761668)", "url": "https://www.fec.gov/data/committee/C00761668/", "retrieved_at": "2026-05-26"},
    {"publication": "Mondoweiss — AIPAC spent $9M to oust Cori Bush", "url": "https://mondoweiss.net/2024/08/aipac-spent-9-million-to-help-oust-cori-bush/", "retrieved_at": "2026-05-26"},
    {"publication": "Axios — Cori Bush primary loss to Wesley Bell", "url": "https://www.axios.com/2024/08/07/cori-bush-primary-results-loss-wesley-bell", "retrieved_at": "2026-05-26"}
  ]'::jsonb
),
(
  'pa-03-2026-d-primary',
  'house_primary',
  'PA',
  'PA-03',
  '2026',
  '2026-05-19',
  null,
  'Pennsylvania 3rd — 2026 Democratic Primary',
  'Open-seat Philadelphia primary (Rep. Dwight Evans retiring). 314 Action Fund spent ~$3.5M backing Ala Stanford — partly seeded via the Delaware-registered Kimbark Foundation dark-money shell. Chris Rabb won anyway (~44%) with cross-spectrum boost from AOC, Hasan Piker, Cori Bush, and Thomas Massie.',
  '[
    {
      "slug": "chris-rabb",
      "name": "Chris Rabb",
      "party": "Democratic",
      "incumbent": false,
      "ie_for_usd": 0,
      "ie_against_usd": 0,
      "campaign_raised_usd": null,
      "polling_pct": 44.2,
      "notes": "PA state representative. Won the open primary despite $3.5M of outside spending for his top opponent. Endorsed by AOC, Cori Bush, Sharif Street; boosted by Hasan Piker.",
      "endorsed_by": ["Alexandria Ocasio-Cortez", "Cori Bush", "Sharif Street"]
    },
    {
      "slug": "ala-stanford",
      "name": "Ala Stanford",
      "party": "Democratic",
      "incumbent": false,
      "ie_for_usd": 3500000,
      "ie_against_usd": 0,
      "campaign_raised_usd": null,
      "polling_pct": 24.1,
      "notes": "Backed by 314 Action Fund (~$3.5M), partly seeded by the Delaware-registered Kimbark Foundation dark-money shell.",
      "endorsed_by": ["314 Action Fund"]
    },
    {
      "slug": "sharif-street",
      "name": "Sharif Street",
      "party": "Democratic",
      "incumbent": false,
      "ie_for_usd": 0,
      "ie_against_usd": 0,
      "campaign_raised_usd": null,
      "polling_pct": null,
      "notes": "PA state senator. Finished second tier in the field.",
      "endorsed_by": []
    },
    {
      "slug": "dwight-evans",
      "name": "Dwight Evans",
      "party": "Democratic",
      "incumbent": true,
      "ie_for_usd": 0,
      "ie_against_usd": 0,
      "campaign_raised_usd": null,
      "polling_pct": null,
      "notes": "Retiring incumbent; did not seek re-election. Seat is open.",
      "endorsed_by": []
    }
  ]'::jsonb,
  3500000,
  null,
  '[
    {
      "name": "314 Action Fund",
      "affiliation": "Science-PAC; received Kimbark Foundation seed money (FEC C00633248)",
      "total_usd": 3500000,
      "support_oppose": "for_stanford",
      "target_candidate": "Ala Stanford"
    }
  ]'::jsonb,
  false,
  'Chris Rabb won the open PA-03 Democratic primary May 19, 2026, with ~44.2%. Ala Stanford finished second with ~24.1% despite $3.5M of outside spending.',
  '[
    {"publication": "FEC — 314 Action Fund (C00633248)", "url": "https://www.fec.gov/data/committee/C00633248/", "retrieved_at": "2026-05-26"},
    {"publication": "Drop Site News — AIPAC, UDP, Ala Stanford, Philadelphia congressional race", "url": "https://www.dropsitenews.com/p/aipac-udp-ala-stanford-philadelphia-congress-race", "retrieved_at": "2026-05-26"},
    {"publication": "Common Dreams — Philly Dem secret AIPAC", "url": "https://www.commondreams.org/news/philly-dem-secret-aipac", "retrieved_at": "2026-05-26"}
  ]'::jsonb
)
on conflict (slug) do nothing;

-- ── (c) Wire the 3 video_companion articles ─────────────────
update public.cr_articles
set
  related_race_id = (select id from public.cr_races where slug = 'mo-01-2024-d-primary'),
  politician_ids = array['cori-bush', 'wesley-bell']
where slug = 'cr-bell-bush-aipac-primary';

update public.cr_articles
set
  related_race_id = (select id from public.cr_races where slug = 'ky-04-2026-r-primary'),
  politician_ids = array['thomas-massie']
where slug = 'cr-massie-gallrein-primary';

update public.cr_articles
set
  related_race_id = (select id from public.cr_races where slug = 'pa-03-2026-d-primary'),
  politician_ids = array['alexandria-ocasio-cortez']
where slug = 'cr-rabb-pa3-aipac-defeat';

-- service_role already has full access to public schema by default;
-- anon/authenticated select grant on cr_articles covers the new column.
