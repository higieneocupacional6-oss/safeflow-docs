CREATE TABLE public.pcmso_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid,
  contrato_id uuid,
  documento_id uuid,
  responsavel_tecnico text,
  crea text,
  cargo text,
  vigencia_inicio date,
  vigencia_fim date,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  setores_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_step integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'rascunho',
  file_path text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pcmso_documentos TO authenticated;
GRANT ALL ON public.pcmso_documentos TO service_role;

ALTER TABLE public.pcmso_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view pcmso_documentos" ON public.pcmso_documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert pcmso_documentos" ON public.pcmso_documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update pcmso_documentos" ON public.pcmso_documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete pcmso_documentos" ON public.pcmso_documentos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_pcmso_documentos_updated_at
BEFORE UPDATE ON public.pcmso_documentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();