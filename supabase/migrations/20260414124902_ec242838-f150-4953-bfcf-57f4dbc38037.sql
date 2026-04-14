
CREATE TABLE public.setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ghe_ges TEXT,
  nome_setor TEXT NOT NULL,
  descricao_ambiente TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view setores" ON public.setores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert setores" ON public.setores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update setores" ON public.setores FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete setores" ON public.setores FOR DELETE USING (true);

CREATE TRIGGER update_setores_updated_at
  BEFORE UPDATE ON public.setores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.funcoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
  nome_funcao TEXT NOT NULL,
  cbo_codigo TEXT,
  cbo_descricao TEXT,
  descricao_atividades TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.funcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view funcoes" ON public.funcoes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert funcoes" ON public.funcoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update funcoes" ON public.funcoes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete funcoes" ON public.funcoes FOR DELETE USING (true);

CREATE TRIGGER update_funcoes_updated_at
  BEFORE UPDATE ON public.funcoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
