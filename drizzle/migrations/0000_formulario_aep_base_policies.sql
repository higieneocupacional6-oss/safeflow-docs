CREATE POLICY "fab_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'formulario-aep-base');
CREATE POLICY "fab_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'formulario-aep-base');
CREATE POLICY "fab_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'formulario-aep-base');