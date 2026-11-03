-- Paid credits on the email tier (the tier the site runs on), and re-registration
-- that no longer hands an email's existing balance to whoever types the address.
--
-- 1. bmd_purchases gets an `anon_token` so a Stripe purchase can credit a
--    bmd_anon_credits row (user_id becomes optional: no Supabase auth user exists
--    on this tier). Fulfilment is idempotent on stripe_session_id as before.
-- 2. bmd_anon_credits gets a verification state. A second `register` for an email
--    that already has a row creates a pending claim with a 6-digit code instead of
--    returning the existing token; the token is handed over only when the code is
--    entered. Until an email sender exists the code is delivered out of band (or
--    not at all, in which case re-registration simply stops returning the token).
-- Service-role only, like the rest of the bmd_ email-tier tables.

alter table public.bmd_purchases
  alter column user_id drop not null,
  add column if not exists anon_token uuid references public.bmd_anon_credits(token) on delete set null,
  add constraint bmd_purchases_owner_present
    check (user_id is not null or anon_token is not null);
create index if not exists idx_bmd_purchases_anon on public.bmd_purchases (anon_token);

create table if not exists public.bmd_anon_claims (
  id bigint generated always as identity primary key,
  email text not null,
  code_hash text not null,                 -- sha256 of the 6-digit code; never the code
  attempts int not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_bmd_anon_claims_email on public.bmd_anon_claims (email, created_at desc);
alter table public.bmd_anon_claims enable row level security;
-- no client policies: service-role access only

-- 3. Fulfilment is one transaction: the purchase flips to paid AND the credits land,
--    or neither does. The webhook calls this and returns 500 on error so Stripe
--    retries against an unchanged pending row. Returns true when credits were
--    awarded now, false when the session was already fulfilled (duplicate delivery).
--    The credit add is a single UPDATE (credits = credits + n), so a concurrent
--    spend (optimistic-locked in gate.ts) can never lose or double a pack.
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
  if p_anon_token is null and p_user_id is null then raise exception 'no owner'; end if;

  insert into public.bmd_purchases (anon_token, user_id, pack_id, credits, amount_cents, stripe_session_id, status)
  values (p_anon_token, p_user_id, coalesce(p_pack_id, 'unknown'), p_credits, coalesce(p_amount_cents, 0), p_session_id, 'paid')
  on conflict (stripe_session_id) do update
    set status = 'paid', updated_at = now()
    where public.bmd_purchases.status <> 'paid'
  returning id into v_id;
  if v_id is null then return false; end if;          -- already paid: award nothing

  if p_anon_token is not null then
    update public.bmd_anon_credits
      set credits = credits + p_credits, tier = 'pro', updated_at = now()
      where token = p_anon_token;
    get diagnostics v_n = row_count;
    if v_n = 0 then raise exception 'unknown credit token'; end if;   -- rolls back the flip too
  else
    update public.profiles
      set credits = credits + p_credits, tier = 'pro', updated_at = now()
      where id = p_user_id;
    get diagnostics v_n = row_count;
    if v_n = 0 then raise exception 'unknown user'; end if;
    insert into public.bmd_credit_ledger (user_id, delta, reason, ref)
    values (p_user_id, p_credits, 'purchase:' || coalesce(p_pack_id, 'pack'), p_session_id);
  end if;
  return true;
end;
$$;
revoke all on function public.bmd_fulfil_purchase(text, uuid, uuid, int, text, int) from public, anon, authenticated;
