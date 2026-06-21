-- 021: pro-Israel money summary per politician (support/oppose kept separate).
create table if not exists cr_pro_israel_money (
  id uuid primary key default gen_random_uuid(),
  candidate_id text, politician_id uuid references cr_politicians(id) on delete set null,
  name text, office text, state text, party text,
  camp text not null default 'aipac',
  supported_usd numeric not null default 0, opposed_usd numeric not null default 0,
  top_spender text, computed_at timestamptz not null default now(),
  unique (candidate_id, camp)
);
create index if not exists cr_pro_israel_money_supported_idx on cr_pro_israel_money (camp, supported_usd desc);
create index if not exists cr_pro_israel_money_opposed_idx on cr_pro_israel_money (camp, opposed_usd desc);
grant select on cr_pro_israel_money to anon, authenticated;
grant select, insert, update, delete on cr_pro_israel_money to service_role;
