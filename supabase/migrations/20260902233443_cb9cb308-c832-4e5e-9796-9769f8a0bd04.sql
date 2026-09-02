CREATE TABLE public.aep_documentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id uuid REFERENCES public.documentos(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES public.empresas(id),
  contrato_id uuid REFERENCES public.contratos(id),
  responsavel_tecnico text,
  crea text,
  cargo text,
  data_elaboracao date,
  alteracoes_documento text,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  setores jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'rascunho',
  current_step integer NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aep_documentos TO authenticated;
GRANT ALL ON public.aep_documentos TO service_role;

ALTER TABLE public.aep_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view aep" ON public.aep_documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert aep" ON public.aep_documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update aep" ON public.aep_documentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete aep" ON public.aep_documentos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_aep_documentos_updated_at
BEFORE UPDATE ON public.aep_documentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.aep_documentos;