CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.ativo)
    AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_active_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_member() TO authenticated, service_role;

DO $$
DECLARE p record; tbls text[] := ARRAY['ltcat_av_equipamentos','responsaveis','funcoes','contratos','templates','documentos','ergonomia_avaliacoes','psico_avaliacoes','ia_conhecimento_pastas','ltcat_avaliacoes','setores','epi_epc_riscos','psico_relatorios','psico_indicadores','aet_documentos','ia_conhecimento_arquivos','riscos','aep_documentos','formularios_aep','ltcat_av_resultados','equipamentos_ho','empresas','treinamentos_cadastro','ltcat_av_epi_epc','ltcat_av_vibracao','psico_links','psico_respostas','ltcat_av_calor','empresa_contatos','psico_base_tecnica','exames_cadastro','pcmso_observacoes_padrao','equipamentos_avaliacao','equipamentos_ho_registros','ltcat_pareceres','notificacoes','pareceres_tecnicos','ltcat_av_componentes','epi_epc','pcmso_documentos','ficha_tecnica_resultados'];
  spols text[] := ARRAY['Base tecnica upload autenticado','ia conhecimento read','faep_delete','Authenticated can upload aet-imagens','Authenticated can view templates','cert_calib_delete','Authenticated can update templates','cert_calib_select','Authenticated can upload templates','Auth can view documentos-upload','ia conhecimento insert','faep_select','Authenticated can update aet-imagens','Auth can insert documentos-upload','fab_select','fab_insert','faep_insert','Authenticated can view aet-imagens','ia conhecimento update','ia conhecimento delete','Base tecnica exclusao autenticada','faep_update','Auth can update documentos-upload','fab_delete','Base tecnica leitura autenticada','cert_calib_insert','Authenticated can delete aet-imagens','cert_calib_update','Auth can delete documentos-upload'];
BEGIN
  FOR p IN SELECT * FROM pg_policies WHERE schemaname='public' AND tablename = ANY(tbls) AND (qual='true' OR with_check='true') LOOP
    IF p.qual = 'true' THEN EXECUTE format('ALTER POLICY %I ON public.%I USING (public.is_active_member())', p.policyname, p.tablename); END IF;
    IF p.with_check = 'true' THEN EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (public.is_active_member())', p.policyname, p.tablename); END IF;
  END LOOP;
  FOR p IN SELECT * FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname = ANY(spols) LOOP
    IF p.qual IS NOT NULL THEN EXECUTE format('ALTER POLICY %I ON storage.objects USING ((%s) AND public.is_active_member())', p.policyname, p.qual); END IF;
    IF p.with_check IS NOT NULL THEN EXECUTE format('ALTER POLICY %I ON storage.objects WITH CHECK ((%s) AND public.is_active_member())', p.policyname, p.with_check); END IF;
  END LOOP;
END $$;