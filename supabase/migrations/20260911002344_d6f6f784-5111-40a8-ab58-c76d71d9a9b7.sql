CREATE POLICY "ia conhecimento read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ia-conhecimento');
CREATE POLICY "ia conhecimento insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ia-conhecimento');
CREATE POLICY "ia conhecimento update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ia-conhecimento');
CREATE POLICY "ia conhecimento delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ia-conhecimento');