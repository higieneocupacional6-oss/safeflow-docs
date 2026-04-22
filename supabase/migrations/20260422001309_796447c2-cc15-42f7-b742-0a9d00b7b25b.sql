
-- Tabela principal da AET
CREATE TABLE public.aet_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID REFERENCES public.documentos(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  responsavel_tecnico TEXT,
  crea TEXT,
  cargo TEXT,
  data_elaboracao DATE,
  alteracoes_documento TEXT,
  revisoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  setores JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.aet_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view aet_documentos"
  ON public.aet_documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert aet_documentos"
  ON public.aet_documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update aet_documentos"
  ON public.aet_documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete aet_documentos"
  ON public.aet_documentos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_aet_documentos_updated_at
  BEFORE UPDATE ON public.aet_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_aet_documentos_empresa ON public.aet_documentos(empresa_id);
CREATE INDEX idx_aet_documentos_documento ON public.aet_documentos(documento_id);

-- Bucket público para imagens AET
INSERT INTO storage.buckets (id, name, public)
VALUES ('aet-imagens', 'aet-imagens', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view aet-imagens"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'aet-imagens');

CREATE POLICY "Authenticated can upload aet-imagens"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aet-imagens');

CREATE POLICY "Authenticated can update aet-imagens"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'aet-imagens');

CREATE POLICY "Authenticated can delete aet-imagens"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'aet-imagens');
