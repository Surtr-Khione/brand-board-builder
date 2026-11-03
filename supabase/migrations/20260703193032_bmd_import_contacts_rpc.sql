-- Contact-import credits: 1 per unique contact, 25 lifetime cap per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_bmd_ledger_contact_once
  ON public.bmd_credit_ledger (user_id, reason) WHERE reason LIKE 'contact:%';

CREATE OR REPLACE FUNCTION public.bmd_import_contacts(p_emails text[])
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_existing integer;
  v_added integer := 0;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;

  SELECT count(*) INTO v_existing
  FROM public.bmd_credit_ledger
  WHERE user_id = auth.uid() AND reason LIKE 'contact:%';

  FOREACH v_email IN ARRAY p_emails LOOP
    EXIT WHEN v_existing + v_added >= 25;
    v_email := lower(trim(v_email));
    CONTINUE WHEN v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$';
    BEGIN
      INSERT INTO public.bmd_credit_ledger (user_id, delta, reason)
      VALUES (auth.uid(), 1, 'contact:' || v_email);
      v_added := v_added + 1;
    EXCEPTION WHEN unique_violation THEN
      CONTINUE; -- already imported this contact
    END;
  END LOOP;

  IF v_added > 0 THEN
    UPDATE public.profiles SET credits = credits + v_added, updated_at = now()
    WHERE id = auth.uid();
  END IF;
  RETURN v_added;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bmd_import_contacts(text[]) TO authenticated;