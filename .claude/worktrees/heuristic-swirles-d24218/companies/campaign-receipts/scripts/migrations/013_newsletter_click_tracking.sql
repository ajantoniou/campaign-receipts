-- 013_newsletter_click_tracking.sql
--
-- Tracked-redirect click logging for the Friday newsletter, feeding the
-- Saturday "which article won" founder email.
--
-- DESIGN (privacy-first, matches the brand):
--   * The Friday email's three article links are rewritten to /c/<token>.
--     The token is an OPAQUE random id — it encodes nothing. The (issue,
--     article) it points to lives only in cr_newsletter_links server-side.
--     No issue_id / slug / user_id ever appears in the URL.
--   * /c/<token> (app/c/[token]/route.ts, supabaseService) logs one click
--     row then 302s to the destination. Reads/writes are SERVER-ONLY.
--     (/c not /r because /r/[id] is the public share-receipt page.)
--   * At current scale we mint ONE token per article per issue (user_id
--     null) — enough to answer "which article won". The user_id column
--     exists so we can flip to per-recipient attribution later with NO
--     schema change, once the list is large enough to care.
--
-- SECURITY: server-only tables. service_role gets full DML (it bypasses
-- RLS); anon/authenticated get nothing. RLS is enabled + forced with NO
-- public policy, so the browser anon key cannot touch these rows — the
-- same posture 012_enable_rls.sql applies to sensitive tables. IDs are
-- uuid to match cr_newsletter_issues.id (uuid, per 010).
--
-- Idempotent / re-runnable.

begin;

-- One row per tracked link, created at newsletter-build time.
create table if not exists cr_newsletter_links (
  token         text primary key,            -- base64url(randomBytes(16)); opaque
  issue_id      uuid not null references cr_newsletter_issues(id) on delete cascade,
  week_of       date not null,
  article_slug  text not null,
  user_id       uuid references cr_users(id) on delete set null,  -- null today
  destination   text not null,               -- absolute URL we 302 to (host-allowlisted)
  created_at    timestamptz not null default now()
);
create index if not exists cr_newsletter_links_issue_idx
  on cr_newsletter_links (issue_id);
create index if not exists cr_newsletter_links_slug_week_idx
  on cr_newsletter_links (article_slug, week_of);

-- One row per actual click. Identity is denormalized off the link at click
-- time so a later cr_users deletion does not erase the aggregate count.
create table if not exists cr_newsletter_clicks (
  id            uuid primary key default gen_random_uuid(),
  token         text not null references cr_newsletter_links(token) on delete cascade,
  issue_id      uuid not null,
  week_of       date not null,
  article_slug  text not null,
  user_id       uuid,                         -- denormalized snapshot, nullable
  clicked_at    timestamptz not null default now(),
  ua_hash       text                          -- sha256(user-agent)[:16]; dedupe only, never raw UA / IP
);
create index if not exists cr_newsletter_clicks_slug_week_idx
  on cr_newsletter_clicks (article_slug, week_of);
create index if not exists cr_newsletter_clicks_clicked_idx
  on cr_newsletter_clicks (clicked_at);

-- One row per founder Saturday digest send — the idempotency guard so a
-- same-day cron re-run never double-emails. week_of is the natural key.
create table if not exists cr_founder_digest_log (
  week_of    date primary key,
  sent_at    timestamptz not null default now(),
  winner_slug text,
  note       text
);

-- Explicit GRANTs (Oct-30-2026 rule). Server-only: service_role full DML,
-- anon/authenticated get NOTHING (these tables hold engagement signal that
-- the browser anon key must never read or write).
grant select, insert, update, delete on cr_newsletter_links   to service_role;
grant select, insert, update, delete on cr_newsletter_clicks  to service_role;
grant select, insert, update, delete on cr_founder_digest_log to service_role;

-- RLS: enable + force, NO public policy => anon/authenticated fully blocked,
-- service role bypasses. Mirrors the sensitive-table posture of 012.
alter table cr_newsletter_links   enable row level security;
alter table cr_newsletter_links   force  row level security;
alter table cr_newsletter_clicks  enable row level security;
alter table cr_newsletter_clicks  force  row level security;
alter table cr_founder_digest_log enable row level security;
alter table cr_founder_digest_log force  row level security;

commit;
