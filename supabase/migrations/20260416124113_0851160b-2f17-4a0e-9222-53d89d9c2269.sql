
CREATE TABLE public.empresa_contatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'fiscal', 'gestor', 'preposto'
  nome TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.empresa_contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view empresa_contatos" ON public.empresa_contatos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert empresa_contatos" ON public.empresa_contatos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update empresa_contatos" ON public.empresa_contatos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete empresa_contatos" ON public.empresa_contatos FOR DELETE USING (true);

CREATE INDEX idx_empresa_contatos_empresa_id ON public.empresa_contatos(empresa_id);
