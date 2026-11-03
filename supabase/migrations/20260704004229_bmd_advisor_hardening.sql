-- Trigger function should not be callable via the API
REVOKE EXECUTE ON FUNCTION public.bmd_handle_new_user() FROM anon, authenticated, public;

-- Tighten update policy: WITH CHECK mirrors USING (column grants already block user_id changes)
DROP POLICY "boards_update_own_or_editor" ON public.brand_boards;
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
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.board_shares s
      WHERE s.board_id = brand_boards.board_id
        AND s.role = 'editor'
        AND lower(s.shared_with_email) = lower(coalesce(auth.jwt()->>'email',''))
    )
  );

-- Public bucket serves files by URL without RLS; restrict listing to the owner's folder
DROP POLICY "brand_assets_read" ON storage.objects;
CREATE POLICY "brand_assets_list_own_folder" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);