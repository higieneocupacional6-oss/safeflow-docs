-- O salvamento do risco no LTCAT usa ON CONFLICT em colunas que não tinham
-- índice único. O Postgres recusava a gravação antes de alterar qualquer linha.
-- Não remove dados. RLS permanece ativo e sem política para anônimo.

CREATE UNIQUE INDEX IF NOT EXISTS ltcat_av_epi_epc_avaliacao_id_key
  ON public.ltcat_av_epi_epc (avaliacao_id);

CREATE UNIQUE INDEX IF NOT EXISTS ltcat_pareceres_unique_combo
  ON public.ltcat_pareceres (empresa_id, setor_id, funcao_id, agente_id, colaborador_nome);

-- Os mesmos upserts existem no relatório psicossocial e não tinham chave de conflito.
CREATE UNIQUE INDEX IF NOT EXISTS psico_indicadores_avaliacao_id_key
  ON public.psico_indicadores (avaliacao_id);

CREATE UNIQUE INDEX IF NOT EXISTS psico_relatorios_avaliacao_id_key
  ON public.psico_relatorios (avaliacao_id);
