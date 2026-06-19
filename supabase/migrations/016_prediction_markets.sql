create table public.cr_prediction_markets (
  slug text primary key,
  question text not null,
  group_name text not null,
  volume_usd numeric,
  end_date timestamp with time zone,
  source_url text not null,
  outcomes jsonb not null default '[]'::jsonb,
  edge_headline text,
  edge_insight text,
  edge_lobby_strength integer,
  edge_lobby_pct integer,
  edge_outside_spend numeric,
  edge_true_odds numeric,
  last_analyzed_at timestamp with time zone default now()
);

-- Index for querying active/highest volume markets
create index cr_prediction_markets_vol_idx on public.cr_prediction_markets (volume_usd desc);

-- Secure access
alter table public.cr_prediction_markets enable row level security;
create policy "Prediction markets are publicly viewable"
  on public.cr_prediction_markets for select using (true);
