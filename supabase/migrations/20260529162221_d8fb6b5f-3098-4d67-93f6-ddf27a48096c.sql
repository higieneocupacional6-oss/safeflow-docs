CREATE TABLE public.pcmso_observacoes_padrao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID DEFAULT auth.uid()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pcmso_observacoes_padrao TO authenticated;
GRANT ALL ON public.pcmso_observacoes_padrao TO service_role;

ALTER TABLE public.pcmso_observacoes_padrao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view pcmso_observacoes_padrao"
  ON public.pcmso_observacoes_padrao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert pcmso_observacoes_padrao"
  ON public.pcmso_observacoes_padrao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update pcmso_observacoes_padrao"
  ON public.pcmso_observacoes_padrao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete pcmso_observacoes_padrao"
  ON public.pcmso_observacoes_padrao FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_pcmso_observacoes_padrao_updated_at
  BEFORE UPDATE ON public.pcmso_observacoes_padrao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();