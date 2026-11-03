-- Public-read bucket for brand assets (logos, moodboard images, files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets', 'brand-assets', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','application/pdf','font/ttf','font/otf','font/woff','font/woff2']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users write only inside their own folder: {auth.uid()}/...
CREATE POLICY "brand_assets_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'brand-assets');

CREATE POLICY "brand_assets_insert_own_folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "brand_assets_update_own_folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "brand_assets_delete_own_folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);