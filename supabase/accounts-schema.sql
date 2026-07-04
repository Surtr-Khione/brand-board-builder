-- ═══════════════════════════════════════════════════════════════════
-- BrandMD account system — APPLIED to the live Supabase project
-- (bukgitgwwmzdjibekmzb) on 2026-07-02/03 as migrations:
--   bmd_profiles_and_auth_trigger
--   bmd_brand_boards_and_shares
--   bmd_credits_purchases_publishing
--   bmd_brand_assets_bucket
--   bmd_import_contacts_rpc
--   bmd_save_board_token_hygiene
--   bmd_advisor_hardening
-- This file is the repo-side record; do not re-run blindly.
-- ═══════════════════════════════════════════════════════════════════

-- ── profiles: one row per auth user, created by trigger ─────────────
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  display_name text,
  tier text NOT NULL DEFAULT 'registered' CHECK (tier IN ('free','registered','pro')),
  credits integer NOT NULL DEFAULT 3 CHECK (credits >= 0),
  ref_code text UNIQUE NOT NULL DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  referred_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: select/update own row only; column grant restricts client updates
-- to display_name. tier/credits change only via SECURITY DEFINER RPCs,
-- the auth trigger, or the service role (Stripe webhook).
-- Trigger: bmd_on_auth_user_created → bmd_handle_new_user()
--   inserts the profile with 3 starter credits and awards +1 credit to
--   the referrer when raw_user_meta_data.ref_code matches a ref_code.

-- ── brand_boards: user-owned or anonymous (edit_token) ──────────────
CREATE TABLE public.brand_boards (
  id bigserial PRIMARY KEY,
  board_id text UNIQUE NOT NULL,
  edit_token uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  brand_data jsonb NOT NULL DEFAULT '{}',
  email text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- edit_token is excluded from client SELECT via column-level grants.
-- Reads: public boards, own boards, or boards shared to your email.
-- Writes: owners and editor-shares via RLS; every save goes through
--   bmd_save_board(board_id, edit_token, brand_data, email, title)
--   which also handles anonymous creators (token proves ownership) and
--   only returns the token to whoever already holds it (or on create).
-- bmd_claim_boards(uuid[]) attaches anonymous boards to a new account.

-- ── board_shares: viewer/editor permissions ─────────────────────────
CREATE TABLE public.board_shares (
  id bigserial PRIMARY KEY,
  board_id text NOT NULL REFERENCES public.brand_boards(board_id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer','editor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (board_id, shared_with_email)
);
-- RLS: owner manages shares; recipients (matched by JWT email) can read.

-- ── credits & purchases ──────────────────────────────────────────────
CREATE TABLE public.bmd_credit_ledger (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,   -- 'generation', 'earn:<action>', 'contact:<email>', 'purchase:<pack>'
  ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Partial unique indexes enforce one-time earn actions and per-contact awards.

CREATE TABLE public.bmd_purchases (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id text NOT NULL,
  credits integer NOT NULL DEFAULT 0,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  stripe_session_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- RPCs: bmd_spend_credits(n, reason) — atomic, fails on insufficient credits
--       bmd_claim_earn_action(action) — +1 credit, once per action
--       bmd_import_contacts(text[]) — +1/contact, 25 lifetime cap

-- ── public_brands: user publishing ───────────────────────────────────
-- Added columns: submitted_by uuid, submitted_by_email text,
--                status text DEFAULT 'published'
-- Added policies: authenticated INSERT/UPDATE/DELETE on own submissions.

-- ── storage: brand-assets bucket ─────────────────────────────────────
-- Public-read bucket (10 MB limit; images/pdf/fonts). Authenticated users
-- write only inside their own {user_id}/ folder; listing restricted to
-- the owner's folder.

-- ── edge functions ───────────────────────────────────────────────────
-- create-checkout (verify_jwt ON):  Stripe Checkout session for a pack;
--   needs secret STRIPE_SECRET_KEY.
-- stripe-webhook (verify_jwt OFF):  signature-verified fulfillment;
--   needs secret STRIPE_WEBHOOK_SECRET. Marks purchase paid, adds
--   credits, sets tier='pro', writes ledger. Idempotent per session.
