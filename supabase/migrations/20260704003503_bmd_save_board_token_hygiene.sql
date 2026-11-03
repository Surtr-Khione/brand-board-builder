-- Only reveal edit_token to whoever created the board (or already holds the token).
-- Owners and editor-shares authenticate via their account, not the token.
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
    -- token goes back only to callers who already proved they hold it
    RETURN QUERY SELECT v_row.board_id,
      CASE WHEN v_row.edit_token = p_edit_token THEN v_row.edit_token ELSE NULL::uuid END;
  ELSE
    RAISE EXCEPTION 'not authorized to update this board' USING ERRCODE = '42501';
  END IF;
END;
$$;