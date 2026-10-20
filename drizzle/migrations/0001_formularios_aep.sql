CREATE TABLE public.formularios_aep (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  setor_ids uuid[] NOT NULL DEFAULT '{}',
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_path text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.formularios_aep TO authenticated;
GRANT ALL ON public.formularios_aep TO service_role;
ALTER TABLE public.formularios_aep ENABLE ROW LEVEL SECURITY;
CREATE POLICY "formularios_aep_auth_all" ON public.formularios_aep FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX formularios_aep_empresa_contrato_idx ON public.formularios_aep(empresa_id, contrato_id);
CREATE TRIGGER formularios_aep_updated_at BEFORE UPDATE ON public.formularios_aep FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "faep_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'formularios-aep');
CREATE POLICY "faep_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'formularios-aep');
CREATE POLICY "faep_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'formularios-aep');
CREATE POLICY "faep_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'formularios-aep');