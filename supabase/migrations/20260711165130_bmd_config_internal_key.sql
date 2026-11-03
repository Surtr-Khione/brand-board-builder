-- Service-role-only config (no client policies). Holds the internal-caller
-- key that lets trusted scripts/functions bypass per-IP rate limits.
create table if not exists public.bmd_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.bmd_config enable row level security;

insert into public.bmd_config (key, value)
values ('internal_key', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;