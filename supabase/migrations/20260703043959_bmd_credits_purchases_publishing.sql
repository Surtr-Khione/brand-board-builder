-- Credit ledger + purchases (bmd_ prefix: this DB is shared with other apps)
CREATE TABLE public.bmd_credit_ledger (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bmd_ledger_user ON public.bmd_credit_ledger (user_id);
-- One-time earn actions: one row per user per earn reason
CREATE UNIQUE INDEX uq_bmd_ledger_earn_once ON public.bmd_credit_ledger (user_id, reason) WHERE reason LIKE 'earn:%';

ALTER TABLE public.bmd_credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ledger_select_own" ON public.bmd_credit_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.bmd_credit_ledger FROM anon, authenticated;

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
CREATE INDEX idx_bmd_purchases_user ON public.bmd_purchases (user_id);

ALTER TABLE public.bmd_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_select_own" ON public.bmd_purchases
  FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.bmd_purchases FROM anon, authenticated;

-- Spend credits atomically
CREATE OR REPLACE FUNCTION public.bmd_spend_credits(p_amount integer, p_reason text DEFAULT 'generation')
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_remaining integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;

  UPDATE public.profiles
  SET credits = credits - p_amount, updated_at = now()
  WHERE id = auth.uid() AND credits >= p_amount
  RETURNING credits INTO v_remaining;

  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient credits' USING ERRCODE = 'P0001'; END IF;

  INSERT INTO public.bmd_credit_ledger (user_id, delta, reason)
  VALUES (auth.uid(), -p_amount, p_reason);
  RETURN v_remaining;
END;
$$;

-- One-time earn actions (shares, referrals) award 1 credit each
CREATE OR REPLACE FUNCTION public.bmd_claim_earn_action(p_action text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_remaining integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  IF p_action NOT IN ('share_fb','share_li','share_x','share_link','refer_friend') THEN
    RAISE EXCEPTION 'unknown action';
  END IF;

  BEGIN
    INSERT INTO public.bmd_credit_ledger (user_id, delta, reason)
    VALUES (auth.uid(), 1, 'earn:' || p_action);
  EXCEPTION WHEN unique_violation THEN
    SELECT credits INTO v_remaining FROM public.profiles WHERE id = auth.uid();
    RETURN v_remaining; -- already claimed, no double award
  END;

  UPDATE public.profiles SET credits = credits + 1, updated_at = now()
  WHERE id = auth.uid()
  RETURNING credits INTO v_remaining;
  RETURN v_remaining;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bmd_spend_credits(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bmd_claim_earn_action(text) TO authenticated;

-- public_brands: user publishing
ALTER TABLE public.public_brands
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submitted_by_email text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','pending','removed'));

CREATE POLICY "public_brands_insert_authed" ON public.public_brands
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "public_brands_update_own" ON public.public_brands
  FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid())
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "public_brands_delete_own" ON public.public_brands
  FOR DELETE TO authenticated
  USING (submitted_by = auth.uid());