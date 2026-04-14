
CREATE TABLE public.riscos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  codigo_esocial TEXT,
  descricao_esocial TEXT,
  propagacao TEXT[],
  tipo_exposicao TEXT,
  fonte_geradora TEXT,
  danos_saude TEXT,
  medidas_controle TEXT,
  tipo_epi TEXT,
  epi_eficaz TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.riscos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view riscos" ON public.riscos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert riscos" ON public.riscos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update riscos" ON public.riscos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete riscos" ON public.riscos FOR DELETE USING (true);

CREATE TRIGGER update_riscos_updated_at
  BEFORE UPDATE ON public.riscos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
