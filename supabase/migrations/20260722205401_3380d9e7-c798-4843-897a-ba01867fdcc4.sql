DROP POLICY IF EXISTS "Template files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view aet-imagens" ON storage.objects;

CREATE POLICY "Authenticated can view templates" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'templates');

CREATE POLICY "Authenticated can view aet-imagens" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'aet-imagens');