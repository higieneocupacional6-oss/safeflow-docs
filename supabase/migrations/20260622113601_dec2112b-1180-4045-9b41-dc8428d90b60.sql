
-- Cria contratos para empresas que possuem dados de contrato inline mas ainda
-- não têm um contrato com o mesmo numero_contrato cadastrado.
INSERT INTO public.contratos (
  empresa_id, numero_contrato, cnpj_contratante, nome_contratante,
  vigencia_inicio, vigencia_fim, local_trabalho, escopo_contrato,
  jornada_trabalho, numero_funcionarios_fem, numero_funcionarios_masc, total_funcionarios,
  gestor_nome, gestor_email, gestor_telefone,
  fiscal_nome, fiscal_email, fiscal_telefone,
  preposto_nome, preposto_email, preposto_telefone
)
SELECT
  e.id, e.numero_contrato, e.cnpj_contratante, e.nome_contratante,
  e.vigencia_inicio, e.vigencia_fim, e.local_trabalho, e.escopo_contrato,
  e.jornada_trabalho, e.numero_funcionarios_fem, e.numero_funcionarios_masc, e.total_funcionarios,
  e.gestor_nome, e.gestor_email, e.gestor_telefone,
  e.fiscal_nome, e.fiscal_email, e.fiscal_telefone,
  e.preposto_nome, e.preposto_email, e.preposto_telefone
FROM public.empresas e
WHERE coalesce(e.numero_contrato,'') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.empresa_id = e.id AND c.numero_contrato = e.numero_contrato
  );
