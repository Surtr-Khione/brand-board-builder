-- Applied 2026-07-11 via MCP (record). Server-side credit ledger, per-IP
-- rate limiting, and insert-only product analytics. See also bmd_config
-- (internal_key for trusted-caller rate-limit bypass), applied same day.
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

create table if not exists public.bmd_rate_limits (
  rl_key text primary key,
  count int not null default 0,
  window_start timestamptz not null default now()
);
alter table public.bmd_rate_limits enable row level security;

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

create table if not exists public.bmd_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.bmd_config enable row level security;
insert into public.bmd_config (key, value)
values ('internal_key', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;
