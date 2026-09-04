CREATE POLICY "cert_calib_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'certificados-calibracao');
CREATE POLICY "cert_calib_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificados-calibracao');
CREATE POLICY "cert_calib_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'certificados-calibracao') WITH CHECK (bucket_id = 'certificados-calibracao');
CREATE POLICY "cert_calib_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'certificados-calibracao');