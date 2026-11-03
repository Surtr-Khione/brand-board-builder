-- BrandMD user profiles, auto-created on signup
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Users may only change display_name; tier/credits move via SECURITY DEFINER RPCs or service role
REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.bmd_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ref text := NEW.raw_user_meta_data->>'ref_code';
BEGIN
  INSERT INTO public.profiles (id, email, display_name, referred_by, credits)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name', v_ref, 3)
  ON CONFLICT (id) DO NOTHING;

  -- Award the referrer 1 credit
  IF v_ref IS NOT NULL AND v_ref <> '' THEN
    UPDATE public.profiles SET credits = credits + 1, updated_at = now()
    WHERE ref_code = v_ref AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bmd_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bmd_handle_new_user();