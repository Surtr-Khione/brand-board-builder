-- Brand boards: user-owned when logged in, edit_token for anonymous boards
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

CREATE INDEX idx_brand_boards_board_id ON public.brand_boards (board_id);
CREATE INDEX idx_brand_boards_user_id ON public.brand_boards (user_id);
CREATE INDEX idx_brand_boards_email ON public.brand_boards (email);

ALTER TABLE public.brand_boards ENABLE ROW LEVEL SECURITY;

-- Never let clients read or tamper with edit_token directly
REVOKE ALL ON public.brand_boards FROM anon, authenticated;
GRANT SELECT (id, board_id, user_id, title, brand_data, email, is_public, created_at, updated_at)
  ON public.brand_boards TO anon, authenticated;
GRANT INSERT (board_id, user_id, title, brand_data, email, is_public)
  ON public.brand_boards TO authenticated;
GRANT UPDATE (title, brand_data, email, is_public, updated_at)
  ON public.brand_boards TO authenticated;
GRANT DELETE ON public.brand_boards TO authenticated;

-- Board shares (permissions)
CREATE TABLE public.board_shares (
  id bigserial PRIMARY KEY,
  board_id text NOT NULL REFERENCES public.brand_boards(board_id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer','editor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (board_id, shared_with_email)
);

CREATE INDEX idx_board_shares_board ON public.board_shares (board_id);
CREATE INDEX idx_board_shares_email ON public.board_shares (lower(shared_with_email));

ALTER TABLE public.board_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shares_owner_all" ON public.board_shares
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "shares_recipient_read" ON public.board_shares
  FOR SELECT TO authenticated
  USING (lower(shared_with_email) = lower(coalesce(auth.jwt()->>'email','')));

-- brand_boards policies
CREATE POLICY "boards_read_public_or_own_or_shared" ON public.brand_boards
  FOR SELECT TO anon, authenticated
  USING (
    is_public = true
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.board_shares s
      WHERE s.board_id = brand_boards.board_id
        AND lower(s.shared_with_email) = lower(coalesce(auth.jwt()->>'email',''))
    )
  );

CREATE POLICY "boards_insert_own" ON public.brand_boards
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "boards_update_own_or_editor" ON public.brand_boards
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.board_shares s
      WHERE s.board_id = brand_boards.board_id
        AND s.role = 'editor'
        AND lower(s.shared_with_email) = lower(coalesce(auth.jwt()->>'email',''))
    )
  )
  WITH CHECK (true);

CREATE POLICY "boards_delete_own" ON public.brand_boards
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Anonymous save path: SECURITY DEFINER RPC checks the edit token
CREATE OR REPLACE FUNCTION public.bmd_save_board(
  p_board_id text,
  p_edit_token uuid,
  p_brand_data jsonb,
  p_email text DEFAULT NULL,
  p_title text DEFAULT NULL
)
RETURNS TABLE (board_id text, edit_token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.brand_boards%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.brand_boards b WHERE b.board_id = p_board_id;

  IF NOT FOUND THEN
    INSERT INTO public.brand_boards (board_id, user_id, brand_data, email, title)
    VALUES (p_board_id, auth.uid(), p_brand_data, p_email, p_title)
    RETURNING * INTO v_row;
    RETURN QUERY SELECT v_row.board_id, v_row.edit_token;
    RETURN;
  END IF;

  -- Existing board: owner, editor-share, or matching edit token may update
  IF (v_row.user_id IS NOT NULL AND v_row.user_id = auth.uid())
     OR (v_row.edit_token = p_edit_token)
     OR EXISTS (
       SELECT 1 FROM public.board_shares s
       WHERE s.board_id = p_board_id AND s.role = 'editor'
         AND lower(s.shared_with_email) = lower(coalesce(auth.jwt()->>'email',''))
     )
  THEN
    UPDATE public.brand_boards b
    SET brand_data = p_brand_data,
        email = coalesce(p_email, b.email),
        title = coalesce(p_title, b.title),
        updated_at = now()
    WHERE b.board_id = p_board_id;
    RETURN QUERY SELECT v_row.board_id, v_row.edit_token;
  ELSE
    RAISE EXCEPTION 'not authorized to update this board' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- Claim anonymous boards after signup (edit tokens prove creation)
CREATE OR REPLACE FUNCTION public.bmd_claim_boards(p_tokens uuid[])
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 0; END IF;
  UPDATE public.brand_boards
  SET user_id = auth.uid(), updated_at = now()
  WHERE edit_token = ANY(p_tokens) AND user_id IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bmd_save_board(text, uuid, jsonb, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bmd_claim_boards(uuid[]) TO authenticated;