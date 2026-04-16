CREATE TABLE public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  empresa_nome TEXT NOT NULL DEFAULT '',
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'concluido',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view documentos" ON public.documentos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert documentos" ON public.documentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update documentos" ON public.documentos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete documentos" ON public.documentos FOR DELETE USING (true);

CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();