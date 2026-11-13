-- BrandMD schema on the self-hosted Supabase (VPS, "supabrain"), 2026-11-12.
--
-- Consolidates what the hosted project bukgitgwwmzdjibekmzb holds for BrandMD (the 11 files in
-- ../migrations plus public_brands / brand_snapshots / feedback, which predate the migration record and
-- were reproduced from the live catalog). Adapted for this database, which also holds the Second Brain:
--
--   * Accounts tier NOT migrated (name collision: this DB already has its own public.profiles + an
--     on_auth_user_created trigger). Skipped: profiles, bmd_handle_new_user + its auth.users trigger,
--     bmd_credit_ledger, board_shares, bmd_spend_credits, bmd_claim_earn_action, bmd_import_contacts,
--     bmd_claim_boards, and bmd_save_board (references board_shares; no function calls it, save-board
--     writes the table with the service role). Hosted rows backed up before the cutover (1 profile, 0 ledger, 0 shares).
--   * No FKs to auth.users: brand_boards.user_id, bmd_purchases.user_id, public_brands.submitted_by stay as
--     plain uuid columns (this auth.users is the Second Brain's, not BrandMD's).
--   * bmd_fulfil_purchase credits the email tier only (anon_token); the profiles branch is gone.
--   * Least privilege: this DB's default ACL grants anon/authenticated everything on new tables and
--     functions, and supabrain's REST API is reachable. So every grant is revoked here and only the
--     browser's two insert-only writes are re-granted (anon INSERT on feedback and bmd_events).
--     Everything else is service_role only (the edge functions).
--   * No storage bucket: logos ship with the site (public/logos), the library is public/data/brands.json.

begin;

-- ---------- library ----------
create table public.public_brands (
  id uuid default gen_random_uuid() not null,
  slug text not null,
  brand_name text not null,
  industry text,
  fortune500_rank integer,
  archetype text,
  secondary_archetype text,
  website text,
  tagline text,
  description text,
  mission text,
  vision text,
  elevator text,
  brand_promise text,
  origin_story text,
  boilerplate text,
  why_different text,
  core_values text[],
  competitor_diff text[],
  primary_color text default '#000000'::text,
  secondary_color text default '#ffffff'::text,
  accent_color text default '#666666'::text,
  neutral_light text default '#f5f5f5'::text,
  neutral_dark text default '#333333'::text,
  primary_font text,
  body_font text,
  accent_font text,
  tone_attributes text[],
  brand_personality text[],
  do_say text[],
  dont_say text[],
  phrases text[],
  hashtags text[],
  cta_primary text,
  cta_secondary text,
  email_signoff text,
  social_personality text,
  voice_example text,
  photo_style text,
  photo_subjects text,
  photo_lighting text,
  photo_composition text,
  photo_filters text,
  photo_dont_use text,
  stock_vs_original text,
  logo_description text,
  icon_style text,
  motion_style text,
  video_style text,
  music_style text,
  color_usage_rules text,
  typography_rules text,
  contrast_minimum text default '4.5:1'::text,
  inclusive_language text,
  key_messages text[],
  enemy text,
  enemy_description text,
  victim text,
  victim_pain_points text[],
  victim_desired_outcome text,
  sb_character_wants text,
  sb_external_problem text,
  sb_internal_problem text,
  sb_philosophical_problem text,
  sb_guide_empathy text,
  sb_guide_authority text,
  sb_plan_steps text[],
  sb_direct_cta text,
  sb_transitional_cta text,
  sb_success_ending text,
  sb_failure_ending text,
  sb_transformation text,
  sb_one_liner text,
  awareness_messaging text,
  consideration_messaging text,
  decision_messaging text,
  touchpoint_website text,
  touchpoint_social text,
  touchpoint_email text,
  touchpoint_ads text,
  touchpoint_sales text,
  touchpoint_support text,
  content_pillars jsonb default '[]'::jsonb,
  brand_data jsonb default '{}'::jsonb,
  founded_year integer,
  country text default 'United States'::text,
  is_featured boolean default false,
  is_verified boolean default false,
  view_count integer default 0,
  fts tsvector generated always as (to_tsvector('english'::regconfig, ((((((((((((COALESCE(brand_name, ''::text) || ' '::text) || COALESCE(industry, ''::text)) || ' '::text) || COALESCE(archetype, ''::text)) || ' '::text) || COALESCE(tagline, ''::text)) || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || COALESCE(elevator, ''::text)) || ' '::text) || COALESCE(mission, ''::text)))) stored,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  hero_images text[] default '{}'::text[],
  color_confidence jsonb default '{}'::jsonb,
  submitted_by uuid,
  submitted_by_email text,
  status text default 'published'::text not null,
  logo_url text,
  constraint public_brands_pkey primary key (id),
  constraint public_brands_slug_key unique (slug),
  constraint public_brands_status_check check (status = any (array['published'::text, 'pending'::text, 'removed'::text]))
);
create index idx_pb_archetype on public.public_brands using btree (archetype);
create index idx_pb_fts on public.public_brands using gin (fts);
create index idx_pb_industry on public.public_brands using btree (industry);
create index idx_pb_rank on public.public_brands using btree (fortune500_rank);
create index idx_pb_featured on public.public_brands using btree (is_featured) where (is_featured = true);
create index idx_pb_views on public.public_brands using btree (view_count desc);

create or replace function public.touch_public_brands_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
create trigger trg_pb_updated_at before update on public.public_brands
  for each row execute function public.touch_public_brands_updated_at();

create table public.brand_snapshots (
  id uuid not null default gen_random_uuid() primary key,
  brand_id uuid not null references public.public_brands(id) on delete cascade,
  year integer not null,
  snapshot_data jsonb not null,
  change_notes text,
  created_at timestamptz not null default now(),
  unique (brand_id, year)
);
create index idx_bs_brand on public.brand_snapshots using btree (brand_id, year desc);

-- ---------- boards (anonymous, edit_token) ----------
create table public.brand_boards (
  id bigserial primary key,
  board_id text unique not null,
  edit_token uuid not null default gen_random_uuid(),
  user_id uuid,                       -- accounts-tier owner; no FK on this DB
  title text,
  brand_data jsonb not null default '{}',
  email text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_brand_boards_board_id on public.brand_boards (board_id);
create index idx_brand_boards_user_id on public.brand_boards (user_id);
create index idx_brand_boards_email on public.brand_boards (email);

-- ---------- email-tier credits, purchases, rate limits, analytics, config ----------
create table public.bmd_anon_credits (
  token uuid primary key default gen_random_uuid(),
  email text unique not null,
  credits int not null default 3,
  tier text not null default 'registered',
  earned jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bmd_anon_claims (
  id bigint generated always as identity primary key,
  email text not null,
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_bmd_anon_claims_email on public.bmd_anon_claims (email, created_at desc);

create table public.bmd_purchases (
  id bigserial primary key,
  user_id uuid,                       -- accounts tier; no FK on this DB
  anon_token uuid references public.bmd_anon_credits(token) on delete set null,
  pack_id text not null,
  credits integer not null default 0,
  amount_cents integer not null,
  currency text not null default 'usd',
  stripe_session_id text unique,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bmd_purchases_owner_present check (user_id is not null or anon_token is not null)
);
create index idx_bmd_purchases_user on public.bmd_purchases (user_id);
create index idx_bmd_purchases_anon on public.bmd_purchases (anon_token);

create table public.bmd_rate_limits (
  rl_key text primary key,
  count int not null default 0,
  window_start timestamptz not null default now()
);

create table public.bmd_events (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  event text not null,
  path text,
  board_id text,
  meta jsonb
);

create table public.bmd_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
-- (internal_key row is copied from the hosted project, not regenerated, so existing scripts keep working)

create table public.feedback (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  page text,
  section text,
  message text not null,
  email text,
  url text,
  metadata jsonb default '{}'::jsonb
);

-- Stripe fulfilment, email tier only (anon_token). Atomic + idempotent on stripe_session_id.
create or replace function public.bmd_fulfil_purchase(
  p_session_id text, p_anon_token uuid, p_user_id uuid, p_credits int, p_pack_id text, p_amount_cents int
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_id bigint;
  v_n int;
begin
  if p_credits is null or p_credits <= 0 then raise exception 'bad credits'; end if;
  if p_anon_token is null then
    raise exception 'no credit token (the accounts tier is not on this database)';
  end if;

  insert into public.bmd_purchases (anon_token, user_id, pack_id, credits, amount_cents, stripe_session_id, status)
  values (p_anon_token, p_user_id, coalesce(p_pack_id, 'unknown'), p_credits, coalesce(p_amount_cents, 0), p_session_id, 'paid')
  on conflict (stripe_session_id) do update
    set status = 'paid', updated_at = now()
    where public.bmd_purchases.status <> 'paid'
  returning id into v_id;
  if v_id is null then return false; end if;

  update public.bmd_anon_credits
    set credits = credits + p_credits, tier = 'pro', updated_at = now()
    where token = p_anon_token;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'unknown credit token'; end if;
  return true;
end;
$$;

-- ---------- RLS + least-privilege grants ----------
alter table public.public_brands    enable row level security;
alter table public.brand_snapshots  enable row level security;
alter table public.brand_boards     enable row level security;
alter table public.bmd_anon_credits enable row level security;
alter table public.bmd_anon_claims  enable row level security;
alter table public.bmd_purchases    enable row level security;
alter table public.bmd_rate_limits  enable row level security;
alter table public.bmd_events       enable row level security;
alter table public.bmd_config       enable row level security;
alter table public.feedback         enable row level security;

revoke all on public.public_brands, public.brand_snapshots, public.brand_boards, public.bmd_anon_credits,
  public.bmd_anon_claims, public.bmd_purchases, public.bmd_rate_limits, public.bmd_events, public.bmd_config,
  public.feedback from public, anon, authenticated;
revoke all on sequence public.brand_boards_id_seq, public.bmd_purchases_id_seq,
  public.bmd_anon_claims_id_seq, public.bmd_events_id_seq from public, anon, authenticated;
grant all on public.public_brands, public.brand_snapshots, public.brand_boards, public.bmd_anon_credits,
  public.bmd_anon_claims, public.bmd_purchases, public.bmd_rate_limits, public.bmd_events, public.bmd_config,
  public.feedback to service_role;
grant usage, select on sequence public.brand_boards_id_seq, public.bmd_purchases_id_seq,
  public.bmd_anon_claims_id_seq, public.bmd_events_id_seq to service_role;

-- The browser's only direct writes: insert-only, no read-back (no SELECT grant or policy).
grant insert (event, path, board_id, meta) on public.bmd_events to anon;
create policy bmd_events_insert_clients on public.bmd_events for insert to anon with check (true);
grant insert (page, section, message, email, url, metadata) on public.feedback to anon;
create policy feedback_insert_clients on public.feedback for insert to anon with check (true);

revoke all on function public.bmd_fulfil_purchase(text, uuid, uuid, int, text, int) from public, anon, authenticated;
grant execute on function public.bmd_fulfil_purchase(text, uuid, uuid, int, text, int) to service_role;
revoke all on function public.touch_public_brands_updated_at() from public, anon, authenticated;

commit;
