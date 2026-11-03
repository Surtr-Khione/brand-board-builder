-- BrandMD server-side credit ledger for the anonymous/email tier.
-- Spending is enforced in edge functions (service role); clients never
-- read or write this table directly.
create table if not exists public.bmd_anon_credits (
  token uuid primary key default gen_random_uuid(),
  email text unique not null,
  credits int not null default 3,
  tier text not null default 'registered',
  earned jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bmd_anon_credits enable row level security;
-- no client policies: service-role access only

-- Per-IP rate limiting for the expensive AI edge functions
create table if not exists public.bmd_rate_limits (
  rl_key text primary key,
  count int not null default 0,
  window_start timestamptz not null default now()
);
alter table public.bmd_rate_limits enable row level security;
-- no client policies: service-role access only

-- Product analytics: insert-only from clients, readable only via service role
create table if not exists public.bmd_events (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  event text not null,
  path text,
  board_id text,
  meta jsonb
);
alter table public.bmd_events enable row level security;
create policy bmd_events_insert_clients on public.bmd_events
  for insert to anon, authenticated with check (true);