-- 011: magic-link abuse hardening (2026-06-10).
-- Context: a spam crawler has been POSTing harvested emails to
-- /api/auth/start (~60/day, batches every ~20 min). Corporate mail
-- scanners then GET the verify link, consuming it and creating phantom
-- accounts. This migration adds request-attribution columns so the app
-- can rate-limit per email and per IP; the code change moves consumption
-- from GET to POST.

alter table public.cr_magic_links
  add column if not exists ip text,
  add column if not exists user_agent text;

-- Rate-limit lookups: "links minted for this email/IP in the last hour".
create index if not exists cr_magic_links_created_idx
  on public.cr_magic_links (created_at);
create index if not exists cr_magic_links_ip_created_idx
  on public.cr_magic_links (ip, created_at);
