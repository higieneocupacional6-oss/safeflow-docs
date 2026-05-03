-- 1) Tabela de contratos vinculada à empresa
CREATE TABLE IF NOT EXISTS public.contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero_contrato text,
  cnpj_contratante text,
  nome_contratante text,
  vigencia_inicio date,
  vigencia_fim date,
  local_trabalho text,
  escopo_contrato text,
  jornada_trabalho text,
  numero_funcionarios_fem integer DEFAULT 0,
  numero_funcionarios_masc integer DEFAULT 0,
  total_funcionarios integer DEFAULT 0,
  gestor_nome text,
  gestor_email text,
  gestor_telefone text,
  fiscal_nome text,
  fiscal_email text,
  fiscal_telefone text,
  preposto_nome text,
  preposto_email text,
  preposto_telefone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contratos_empresa ON public.contratos(empresa_id);

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view contratos" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert contratos" ON public.contratos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update contratos" ON public.contratos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete contratos" ON public.contratos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Migrar dados existentes de empresas -> contratos
INSERT INTO public.contratos (
  empresa_id, numero_contrato, cnpj_contratante, nome_contratante,
  vigencia_inicio, vigencia_fim, local_trabalho, escopo_contrato, jornada_trabalho,
  numero_funcionarios_fem, numero_funcionarios_masc, total_funcionarios,
  gestor_nome, gestor_email, gestor_telefone,
  fiscal_nome, fiscal_email, fiscal_telefone,
  preposto_nome, preposto_email, preposto_telefone
)
SELECT
  id, numero_contrato, cnpj_contratante, nome_contratante,
  vigencia_inicio, vigencia_fim, local_trabalho, escopo_contrato, jornada_trabalho,
  COALESCE(numero_funcionarios_fem,0), COALESCE(numero_funcionarios_masc,0), COALESCE(total_funcionarios,0),
  gestor_nome, gestor_email, gestor_telefone,
  fiscal_nome, fiscal_email, fiscal_telefone,
  preposto_nome, preposto_email, preposto_telefone
FROM public.empresas
WHERE COALESCE(numero_contrato,'') <> ''
   OR COALESCE(local_trabalho,'') <> ''
   OR COALESCE(escopo_contrato,'') <> ''
   OR vigencia_inicio IS NOT NULL
   OR vigencia_fim IS NOT NULL
   OR COALESCE(gestor_nome,'') <> ''
   OR COALESCE(fiscal_nome,'') <> ''
   OR COALESCE(preposto_nome,'') <> '';

-- 3) Vincular contrato em documentos
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES public.contratos(id) ON DELETE SET NULL;
ALTER TABLE public.aet_documentos ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES public.contratos(id) ON DELETE SET NULL;
ALTER TABLE public.ltcat_avaliacoes ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES public.contratos(id) ON DELETE SET NULL;