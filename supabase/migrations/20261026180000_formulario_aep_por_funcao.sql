-- Cada função do Formulário AEP passa a ter o próprio registro.
-- Formulários antigos ficam com funcao_id nulo e continuam válidos.
-- Apagar a função no cadastro não apaga o formulário já gravado.

ALTER TABLE public.formularios_aep
  ADD COLUMN IF NOT EXISTS funcao_id uuid REFERENCES public.funcoes(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS formularios_aep_empresa_contrato_funcao_key
  ON public.formularios_aep (empresa_id, contrato_id, funcao_id)
  WHERE funcao_id IS NOT NULL;
