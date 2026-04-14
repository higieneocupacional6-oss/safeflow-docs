
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnae_principal TEXT,
  grau_risco TEXT,
  endereco TEXT,
  numero_funcionarios_fem INTEGER DEFAULT 0,
  numero_funcionarios_masc INTEGER DEFAULT 0,
  total_funcionarios INTEGER DEFAULT 0,
  jornada_trabalho TEXT,
  numero_contrato TEXT,
  cnpj_contratante TEXT,
  nome_contratante TEXT,
  vigencia_inicio DATE,
  vigencia_fim DATE,
  local_trabalho TEXT,
  escopo_contrato TEXT,
  gestor_nome TEXT,
  gestor_email TEXT,
  gestor_telefone TEXT,
  fiscal_nome TEXT,
  fiscal_email TEXT,
  fiscal_telefone TEXT,
  preposto_nome TEXT,
  preposto_email TEXT,
  preposto_telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view empresas" ON public.empresas FOR SELECT USING (true);
CREATE POLICY "Anyone can insert empresas" ON public.empresas FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update empresas" ON public.empresas FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete empresas" ON public.empresas FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_empresas_updated_at
BEFORE UPDATE ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
