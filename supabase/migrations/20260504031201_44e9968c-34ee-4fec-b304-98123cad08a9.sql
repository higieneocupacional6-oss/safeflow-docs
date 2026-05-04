
-- Enable realtime for collaborative tables and ensure full row payloads
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'empresas','contratos','empresa_contatos',
    'setores','funcoes',
    'documentos','aet_documentos',
    'ltcat_avaliacoes','ltcat_pareceres',
    'ltcat_av_componentes','ltcat_av_calor','ltcat_av_vibracao',
    'ltcat_av_resultados','ltcat_av_equipamentos','ltcat_av_epi_epc',
    'pareceres_tecnicos','equipamentos_avaliacao','equipamentos_ho_registros'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;
