-- Safeflow-docs / SegCRM
-- Estrutura inicial para PostgreSQL 15.20
-- Revisar antes de executar. Este arquivo não foi aplicado.
-- Não copia dados, não cria storage e não cria papéis do Supabase.
--
-- Fonte: supabase/migrations, com o estado final das colunas conferido em
-- src/integrations/supabase/types.ts.
-- O catálogo remoto do Supabase não respondeu, então nulidade, ON DELETE
-- e o corpo final das funções grandes não foram relidos no banco de produção.
--
-- As 47 tabelas de public permanecem. app.users é a estrutura local proposta
-- no lugar de auth.users. password_hash e must_change_password não existem
-- no schema public atual: substituem, respectivamente, a senha do GoTrue e
-- o metadado must_change_password. Nenhuma senha é gravada aqui.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS app;

-- Substitui auth.uid() sem copiar o schema auth.
-- A API define SET LOCAL app.current_user_id antes de gravar.
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'usuario');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE app.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Tabelas public (47)
-- =============================================================================

CREATE TABLE public.empresas (
  cnae_principal text,
  cnpj text NOT NULL,
  cnpj_contratante text,
  created_at timestamptz NOT NULL DEFAULT now(),
  endereco text,
  escopo_contrato text,
  fiscal_email text,
  fiscal_nome text,
  fiscal_telefone text,
  gestor_email text,
  gestor_nome text,
  gestor_telefone text,
  grau_risco text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jornada_trabalho text,
  last_modified_by uuid,
  local_trabalho text,
  nome_contratante text,
  nome_fantasia text,
  numero_contrato text,
  numero_funcionarios_fem integer DEFAULT 0,
  numero_funcionarios_masc integer DEFAULT 0,
  preposto_email text,
  preposto_nome text,
  preposto_telefone text,
  razao_social text NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  total_funcionarios integer DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  vigencia_fim date,
  vigencia_inicio date
);

CREATE TABLE public.contratos (
  cnpj_contratante text,
  created_at timestamptz NOT NULL DEFAULT now(),
  empresa_id uuid NOT NULL,
  escopo_contrato text,
  fiscal_email text,
  fiscal_nome text,
  fiscal_telefone text,
  gestor_email text,
  gestor_nome text,
  gestor_telefone text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jornada_trabalho text,
  last_modified_by uuid,
  local_trabalho text,
  nome_contratante text,
  numero_contrato text,
  numero_funcionarios_fem integer DEFAULT 0,
  numero_funcionarios_masc integer DEFAULT 0,
  preposto_email text,
  preposto_nome text,
  preposto_telefone text,
  row_version bigint NOT NULL DEFAULT 1,
  total_funcionarios integer DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  vigencia_fim date,
  vigencia_inicio date
);

CREATE TABLE public.empresa_contatos (
  created_at timestamptz NOT NULL DEFAULT now(),
  email text DEFAULT '',
  empresa_id uuid NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT '',
  telefone text DEFAULT '',
  tipo text NOT NULL
);

CREATE TABLE public.setores (
  contrato_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  descricao_ambiente text,
  empresa_id uuid NOT NULL,
  ghe_ges text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome_setor text NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.funcoes (
  cbo_codigo text,
  cbo_descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  descricao_atividades text,
  expostos text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome_funcao text NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  setor_id uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.templates (
  created_at timestamptz NOT NULL DEFAULT now(),
  file_path text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_system boolean NOT NULL DEFAULT false,
  title text NOT NULL
);

CREATE TABLE public.documentos (
  alteracoes_documento text,
  cargo text,
  contrato_id uuid,
  crea text,
  created_at timestamptz NOT NULL DEFAULT now(),
  current_step integer NOT NULL DEFAULT 0,
  data_elaboracao date,
  data_validade date,
  draft_snapshot jsonb,
  empresa_id uuid,
  empresa_nome text NOT NULL DEFAULT '',
  file_path text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome_documento text,
  responsavel_tecnico text,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_version bigint NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'concluido',
  template_id uuid,
  tipo text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  upload_file_path text
);

CREATE TABLE public.profiles (
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL UNIQUE
);

CREATE TABLE public.user_roles (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL DEFAULT 'usuario',
  user_id uuid NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.aet_instrucoes_usuario (
  ia_ativada boolean NOT NULL DEFAULT false,
  instrucoes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid PRIMARY KEY
);

CREATE TABLE public.audit_log (
  action text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  new_data jsonb,
  old_data jsonb,
  record_id uuid,
  table_name text NOT NULL
);

CREATE TABLE public.notificacoes (
  contrato_id uuid,
  contrato_numero text,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_vencimento date NOT NULL,
  documento_id uuid NOT NULL,
  documento_nome text,
  documento_tipo text,
  empresa_id uuid,
  empresa_nome text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lida boolean NOT NULL DEFAULT false,
  tipo text NOT NULL
);

CREATE TABLE public.riscos (
  codigo_esocial text,
  created_at timestamptz NOT NULL DEFAULT now(),
  danos_saude text,
  descricao_esocial text,
  epi_eficaz text,
  fonte_geradora text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_padrao boolean NOT NULL DEFAULT false,
  last_modified_by uuid,
  medidas_controle text,
  nome text NOT NULL,
  propagacao text[],
  row_version bigint NOT NULL DEFAULT 1,
  tipo text NOT NULL,
  tipo_epi text,
  tipo_exposicao text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.epi_epc (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome text NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  tipo text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.epi_epc_riscos (
  epi_epc_id uuid NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risco_id uuid NOT NULL
);

CREATE TABLE public.tecnicas_amostragem (
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome text NOT NULL,
  referencia text,
  row_version bigint NOT NULL DEFAULT 1
);

CREATE TABLE public.unidades (
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome text,
  row_version bigint NOT NULL DEFAULT 1,
  simbolo text NOT NULL
);

CREATE TABLE public.equipamentos_ho (
  certificado text,
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  marca text,
  nome text NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  tipo text
);

CREATE TABLE public.equipamentos_ho_registros (
  certificado_nome text,
  certificado_path text,
  certificado_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_calibracao date,
  equipamento_id uuid NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  marca_modelo text,
  numero_serie text NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  situacao_operacional text NOT NULL DEFAULT 'Aparelho calibrado',
  CONSTRAINT equipamentos_ho_registros_situacao_operacional_check CHECK (situacao_operacional IN (
    'Aparelhos enviados',
    'Calibração em andamento',
    'Aparelhos em logística',
    'Aparelho calibrado'
  ))
);

CREATE TABLE public.exames_cadastro (
  codigo_esocial text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  descricao_esocial text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome text NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.treinamentos_cadastro (
  carga_horaria text,
  codigo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  descricao text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome text NOT NULL,
  observacoes text,
  periodicidade text,
  row_version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.responsaveis (
  created_at timestamptz NOT NULL DEFAULT now(),
  funcao text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome text NOT NULL,
  registro_profissional text,
  row_version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pareceres_tecnicos (
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT app.current_user_id(),
  documento text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  parecer_tecnico text NOT NULL DEFAULT '',
  risco_id uuid,
  row_version bigint NOT NULL DEFAULT 1,
  situacao text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ia_conhecimento_pastas (
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ia_conhecimento_arquivos (
  caminho text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mime text,
  nome text NOT NULL,
  pasta_id uuid NOT NULL,
  tamanho bigint
);

CREATE TABLE public.aep_documentos (
  alteracoes_documento text,
  cargo text,
  contrato_id uuid,
  crea text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  current_step integer NOT NULL DEFAULT 1,
  data_elaboracao date,
  documento_id uuid,
  empresa_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  responsavel_tecnico text,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_version bigint NOT NULL DEFAULT 1,
  setores jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'rascunho',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.aet_documentos (
  alteracoes_documento text,
  cargo text,
  contrato_id uuid,
  crea text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT app.current_user_id(),
  current_step integer NOT NULL DEFAULT 0,
  data_elaboracao date,
  documento_id uuid,
  empresa_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  responsavel_tecnico text,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_version bigint NOT NULL DEFAULT 1,
  setores jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'rascunho',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.formularios_aep (
  contrato_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  empresa_id uuid NOT NULL,
  funcao_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_path text,
  setor_ids text[] NOT NULL DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pcmso_documentos (
  cargo text,
  contrato_id uuid,
  crea text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT app.current_user_id(),
  cronograma jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step integer NOT NULL DEFAULT 0,
  data_elaboracao date,
  documento_id uuid,
  empresa_id uuid,
  epi_blocos jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_path text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  responsavel_tecnico text,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_version bigint NOT NULL DEFAULT 1,
  setores_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'rascunho',
  template_id uuid,
  treinamento_blocos jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  vigencia_fim date,
  vigencia_inicio date
);

CREATE TABLE public.pcmso_observacoes_padrao (
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texto text NOT NULL,
  titulo text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.psico_avaliacoes (
  contrato_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  empresa_id uuid NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'rascunho',
  titulo text NOT NULL DEFAULT 'Avaliação Psicossocial',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.psico_links (
  ativo boolean NOT NULL DEFAULT true,
  avaliacao_id uuid,
  contrato_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  empresa_id uuid NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(9), 'base64'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.psico_indicadores (
  avaliacao_id uuid NOT NULL,
  contrato_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  empresa_id uuid NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.psico_relatorios (
  avaliacao_id uuid NOT NULL,
  contrato_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  empresa_id uuid NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  versao text NOT NULL DEFAULT '1.0'
);

CREATE TABLE public.psico_respostas (
  alertas jsonb NOT NULL DEFAULT '{}'::jsonb,
  avaliacao_id uuid,
  blocos jsonb NOT NULL DEFAULT '{}'::jsonb,
  colaborador_nome text,
  contrato_id uuid,
  contrato_nome text,
  copsoq_resultado_resumido text,
  copsoq_riscos_identificados text,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  empresa_id uuid NOT NULL,
  funcao_id uuid,
  funcao_nome text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  resultado_psicossocial text,
  riscos_psicossociais text,
  total_negativas integer DEFAULT 0,
  total_positivas integer DEFAULT 0
);

CREATE TABLE public.psico_base_tecnica (
  caminho text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tamanho bigint,
  user_id uuid NOT NULL DEFAULT app.current_user_id()
);

CREATE TABLE public.ergonomia_avaliacoes (
  aet_documento_id uuid,
  atividade text,
  classificacao text,
  colaborador_nome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  empresa_nome text,
  escore_final numeric,
  ferramenta text NOT NULL,
  funcao text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel_acao text,
  pdf_path text,
  recomendacoes text,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  setor_nome text,
  setor_ref text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT app.current_user_id()
);

CREATE TABLE public.ficha_tecnica_resultados (
  agente_id uuid NOT NULL,
  amostrador text,
  amostrador_serie text,
  aren numeric,
  componentes text,
  concentracao numeric,
  contrato_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT app.current_user_id(),
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  dose_q3 numeric,
  dose_q5 numeric,
  empresa_id uuid NOT NULL,
  exposicao numeric,
  funcao_id uuid NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_modified_by uuid DEFAULT app.current_user_id(),
  lavg numeric,
  limite_tolerancia numeric NOT NULL,
  nen numeric,
  row_version bigint NOT NULL DEFAULT 1,
  setor_id uuid NOT NULL,
  taxa_metabolica text,
  tipo text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  vdvr numeric
);

CREATE TABLE public.ltcat_avaliacoes (
  agente_id uuid,
  aposentadoria_especial text,
  cod_gfip text,
  codigo_esocial text,
  colaborador text,
  contrato_id uuid,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  danos_saude text,
  data_avaliacao date,
  descricao_avaliacao text,
  descricao_esocial text,
  documento_id uuid,
  dose_percentual numeric,
  empresa_id uuid,
  equipamento_id uuid,
  ficha_tecnica_resultado_id uuid,
  fonte_geradora text,
  funcao_id uuid,
  funcoes_ges text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  limite_tolerancia numeric,
  medidas_controle text,
  parecer_tecnico text,
  propagacao text,
  resultado numeric,
  setor_id uuid,
  situacao text,
  tecnica_id uuid,
  tempo_coleta text,
  tipo_agente text,
  tipo_avaliacao text,
  tipo_documento text NOT NULL,
  tipo_exposicao text,
  unidade_limite_id uuid,
  unidade_resultado_id uuid,
  unidade_tempo_coleta text
);

CREATE TABLE public.equipamentos_avaliacao (
  agente_nome text,
  avaliacao_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_avaliacao date,
  data_calibracao date,
  empresa_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_equipamento text,
  nome_equipamento text,
  serie_equipamento text,
  setor_id uuid,
  tipo_documento text NOT NULL
);

CREATE TABLE public.ltcat_av_calor (
  aposentadoria_especial text,
  avaliacao_id uuid NOT NULL,
  cod_gfip text,
  colaborador text,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_avaliacao date,
  descricao_atividade text,
  equipamento_id uuid,
  funcao_id uuid,
  ibutg_limite numeric,
  ibutg_medido numeric,
  ibutg_tipo text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_atividade text,
  m_kcal_h numeric,
  ordem integer NOT NULL DEFAULT 0,
  parecer_tecnico text,
  situacao text,
  taxa_metabolica text,
  tbn_valores text,
  tbs_valores text,
  tempo_exposicao text,
  tg_valores text,
  tipo_atividade text,
  tipo_documento text NOT NULL
);

CREATE TABLE public.ltcat_av_componentes (
  amostrador text,
  aposentadoria_especial text,
  avaliacao_id uuid NOT NULL,
  cas text,
  cod_gfip text,
  colaborador text,
  componente text,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_avaliacao date,
  descricao_avaliacao text,
  dose_percentual numeric,
  funcao_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  limite_tolerancia numeric,
  numero_serie_bomba text,
  ordem integer NOT NULL DEFAULT 0,
  parecer_tecnico text,
  resultado numeric,
  situacao text,
  tempo_coleta text,
  tipo_documento text NOT NULL,
  unidade_limite_id uuid,
  unidade_resultado_id uuid,
  unidade_tempo_coleta text
);

CREATE TABLE public.ltcat_av_epi_epc (
  avaliacao_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  epc_eficaz text,
  epc_id uuid,
  epi_atenuacao text,
  epi_ca text,
  epi_eficaz text,
  epi_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_documento text NOT NULL
);

CREATE TABLE public.ltcat_av_equipamentos (
  agente_nome text,
  avaliacao_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_avaliacao date,
  data_calibracao date,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_equipamento text,
  nome_equipamento text,
  ordem integer NOT NULL DEFAULT 0,
  serie_equipamento text,
  tipo_documento text NOT NULL
);

CREATE TABLE public.ltcat_av_resultados (
  aposentadoria_especial text,
  avaliacao_id uuid NOT NULL,
  cod_gfip text,
  colaborador text,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_avaliacao date,
  descricao_avaliacao text,
  dose_percentual numeric,
  equipamento_registro_id uuid,
  funcao_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  limite_tolerancia numeric,
  ordem integer NOT NULL DEFAULT 0,
  parecer_tecnico text,
  resultado numeric,
  situacao text,
  tempo_coleta text,
  tipo_documento text NOT NULL,
  unidade_limite_id uuid,
  unidade_resultado_id uuid,
  unidade_tempo_coleta text
);

CREATE TABLE public.ltcat_av_vibracao (
  aposentadoria_especial text,
  aren numeric,
  aren_limite numeric,
  avaliacao_id uuid NOT NULL,
  cod_gfip text,
  colaborador text,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_avaliacao date,
  funcao_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem integer NOT NULL DEFAULT 0,
  parecer_tecnico text,
  situacao text,
  tempo_exposicao text,
  tipo text,
  tipo_documento text NOT NULL,
  vdvr numeric,
  vdvr_limite numeric
);

CREATE TABLE public.ltcat_pareceres (
  agente_id uuid NOT NULL,
  aposentadoria_especial text,
  colaborador_nome text,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  empresa_id uuid NOT NULL,
  funcao_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parecer_tecnico text,
  setor_id uuid NOT NULL,
  tipo_documento text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- Chaves estrangeiras confirmadas no bootstrap e nas migrações posteriores
-- Sem ON DELETE = NO ACTION, como no bootstrap.
-- Referências a auth.users foram trocadas por app.users. As quatro existem
-- nas migrações originais; o bootstrap não as recriou. O catálogo remoto
-- não confirmou se continuam instaladas.
-- =============================================================================

ALTER TABLE public.contratos
  ADD CONSTRAINT contratos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.empresa_contatos
  ADD CONSTRAINT empresa_contatos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.setores
  ADD CONSTRAINT setores_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.setores
  ADD CONSTRAINT setores_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.funcoes
  ADD CONSTRAINT funcoes_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id);

ALTER TABLE public.documentos
  ADD CONSTRAINT documentos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.documentos
  ADD CONSTRAINT documentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.documentos
  ADD CONSTRAINT documentos_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES app.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES app.users(id) ON DELETE CASCADE;

ALTER TABLE public.aet_instrucoes_usuario
  ADD CONSTRAINT aet_instrucoes_usuario_user_id_fkey FOREIGN KEY (user_id) REFERENCES app.users(id) ON DELETE CASCADE;

ALTER TABLE public.epi_epc_riscos
  ADD CONSTRAINT epi_epc_riscos_epi_epc_id_fkey FOREIGN KEY (epi_epc_id) REFERENCES public.epi_epc(id) ON DELETE CASCADE;

ALTER TABLE public.epi_epc_riscos
  ADD CONSTRAINT epi_epc_riscos_risco_id_fkey FOREIGN KEY (risco_id) REFERENCES public.riscos(id) ON DELETE CASCADE;

ALTER TABLE public.equipamentos_ho_registros
  ADD CONSTRAINT equipamentos_ho_registros_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES public.equipamentos_ho(id) ON DELETE CASCADE;

ALTER TABLE public.pareceres_tecnicos
  ADD CONSTRAINT pareceres_tecnicos_risco_id_fkey FOREIGN KEY (risco_id) REFERENCES public.riscos(id);

ALTER TABLE public.ia_conhecimento_arquivos
  ADD CONSTRAINT ia_conhecimento_arquivos_pasta_id_fkey FOREIGN KEY (pasta_id) REFERENCES public.ia_conhecimento_pastas(id) ON DELETE CASCADE;

ALTER TABLE public.aep_documentos
  ADD CONSTRAINT aep_documentos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.aep_documentos
  ADD CONSTRAINT aep_documentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.aep_documentos
  ADD CONSTRAINT aep_documentos_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documentos(id) ON DELETE CASCADE;

ALTER TABLE public.aet_documentos
  ADD CONSTRAINT aet_documentos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.aet_documentos
  ADD CONSTRAINT aet_documentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.aet_documentos
  ADD CONSTRAINT aet_documentos_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documentos(id) ON DELETE CASCADE;

ALTER TABLE public.formularios_aep
  ADD CONSTRAINT formularios_aep_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.formularios_aep
  ADD CONSTRAINT formularios_aep_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.formularios_aep
  ADD CONSTRAINT formularios_aep_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id) ON DELETE SET NULL;

ALTER TABLE public.ergonomia_avaliacoes
  ADD CONSTRAINT ergonomia_avaliacoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES app.users(id) ON DELETE CASCADE;

ALTER TABLE public.ergonomia_avaliacoes
  ADD CONSTRAINT ergonomia_avaliacoes_aet_documento_id_fkey FOREIGN KEY (aet_documento_id) REFERENCES public.aet_documentos(id);

ALTER TABLE public.ficha_tecnica_resultados
  ADD CONSTRAINT ficha_tecnica_resultados_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.ficha_tecnica_resultados
  ADD CONSTRAINT ficha_tecnica_resultados_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.ficha_tecnica_resultados
  ADD CONSTRAINT ficha_tecnica_resultados_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id);

ALTER TABLE public.ficha_tecnica_resultados
  ADD CONSTRAINT ficha_tecnica_resultados_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id);

ALTER TABLE public.ficha_tecnica_resultados
  ADD CONSTRAINT ficha_tecnica_resultados_agente_id_fkey FOREIGN KEY (agente_id) REFERENCES public.riscos(id);

ALTER TABLE public.psico_avaliacoes
  ADD CONSTRAINT psico_avaliacoes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.psico_avaliacoes
  ADD CONSTRAINT psico_avaliacoes_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.psico_links
  ADD CONSTRAINT psico_links_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.psico_links
  ADD CONSTRAINT psico_links_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.psico_links
  ADD CONSTRAINT psico_links_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.psico_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.psico_indicadores
  ADD CONSTRAINT psico_indicadores_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.psico_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.psico_relatorios
  ADD CONSTRAINT psico_relatorios_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.psico_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.psico_respostas
  ADD CONSTRAINT psico_respostas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.psico_respostas
  ADD CONSTRAINT psico_respostas_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.psico_respostas
  ADD CONSTRAINT psico_respostas_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.psico_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.psico_respostas
  ADD CONSTRAINT psico_respostas_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.psico_links(id) ON DELETE CASCADE;

ALTER TABLE public.psico_respostas
  ADD CONSTRAINT psico_respostas_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id);

ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documentos(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id) ON DELETE SET NULL;

ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_agente_id_fkey FOREIGN KEY (agente_id) REFERENCES public.riscos(id);

ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_tecnica_id_fkey FOREIGN KEY (tecnica_id) REFERENCES public.tecnicas_amostragem(id);

ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES public.equipamentos_ho(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_ficha_tecnica_resultado_id_fkey FOREIGN KEY (ficha_tecnica_resultado_id) REFERENCES public.ficha_tecnica_resultados(id);

ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_unidade_limite_id_fkey FOREIGN KEY (unidade_limite_id) REFERENCES public.unidades(id);

ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_unidade_resultado_id_fkey FOREIGN KEY (unidade_resultado_id) REFERENCES public.unidades(id);

ALTER TABLE public.equipamentos_avaliacao
  ADD CONSTRAINT equipamentos_avaliacao_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_calor
  ADD CONSTRAINT ltcat_av_calor_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_componentes
  ADD CONSTRAINT ltcat_av_componentes_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_epi_epc
  ADD CONSTRAINT ltcat_av_epi_epc_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_equipamentos
  ADD CONSTRAINT ltcat_av_equipamentos_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_resultados
  ADD CONSTRAINT ltcat_av_resultados_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_vibracao
  ADD CONSTRAINT ltcat_av_vibracao_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_pareceres
  ADD CONSTRAINT ltcat_pareceres_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

-- =============================================================================
-- Índices
-- =============================================================================

CREATE INDEX ia_conhecimento_arquivos_pasta_idx ON public.ia_conhecimento_arquivos(pasta_id);
CREATE INDEX idx_aep_documentos_documento ON public.aep_documentos (documento_id);
CREATE INDEX idx_aet_contrato ON public.aet_documentos(contrato_id);
CREATE INDEX idx_aet_documentos_documento ON public.aet_documentos (documento_id);
CREATE INDEX idx_aet_documentos_empresa ON public.aet_documentos(empresa_id);
CREATE INDEX idx_audit_log_record_time ON public.audit_log (table_name, record_id, changed_at DESC);
CREATE INDEX idx_contratos_empresa ON public.contratos(empresa_id);
CREATE INDEX idx_contratos_empresa_created ON public.contratos (empresa_id, created_at DESC);
CREATE INDEX idx_documentos_contrato ON public.documentos(contrato_id);
CREATE INDEX idx_documentos_empresa ON public.documentos(empresa_id);
CREATE INDEX idx_documentos_empresa_contrato_tipo ON public.documentos (empresa_id, contrato_id, tipo);
CREATE INDEX idx_documentos_updated_desc ON public.documentos (updated_at DESC);
CREATE INDEX idx_empresa_contatos_empresa_id ON public.empresa_contatos(empresa_id);
CREATE INDEX idx_eq_ho_reg_equipamento_id ON public.equipamentos_ho_registros(equipamento_id);
CREATE INDEX idx_ergonomia_aet ON public.ergonomia_avaliacoes(aet_documento_id);
CREATE INDEX idx_ergonomia_user_setor ON public.ergonomia_avaliacoes (user_id, setor_nome, funcao);
CREATE INDEX idx_ficha_tecnica_agente ON public.ficha_tecnica_resultados(agente_id);
CREATE INDEX idx_ficha_tecnica_empresa_contrato ON public.ficha_tecnica_resultados(empresa_id, contrato_id, created_at DESC);
CREATE INDEX idx_ficha_tecnica_setor_funcao ON public.ficha_tecnica_resultados(setor_id, funcao_id);
CREATE INDEX idx_funcoes_setor_nome ON public.funcoes (setor_id, nome_funcao);
CREATE INDEX idx_ltcat_av_calor_av ON public.ltcat_av_calor(avaliacao_id);
CREATE INDEX idx_ltcat_av_comp_av ON public.ltcat_av_componentes(avaliacao_id);
CREATE INDEX idx_ltcat_av_eq_av ON public.ltcat_av_equipamentos(avaliacao_id);
CREATE INDEX idx_ltcat_av_res_av ON public.ltcat_av_resultados(avaliacao_id);
CREATE INDEX idx_ltcat_av_vib_av ON public.ltcat_av_vibracao(avaliacao_id);
CREATE INDEX idx_ltcat_avaliacoes_documento ON public.ltcat_avaliacoes(documento_id);
CREATE INDEX idx_ltcat_avaliacoes_documento_agente ON public.ltcat_avaliacoes (documento_id, agente_id);
CREATE INDEX idx_ltcat_avaliacoes_setor_funcao ON public.ltcat_avaliacoes (setor_id, funcao_id);
CREATE INDEX idx_ltcat_avaliacoes_tipo_doc ON public.ltcat_avaliacoes(tipo_documento, empresa_id);
CREATE INDEX idx_ltcat_contrato ON public.ltcat_avaliacoes(contrato_id);
CREATE INDEX idx_ltcat_pareceres_tipo_doc ON public.ltcat_pareceres(tipo_documento, empresa_id);
CREATE INDEX idx_pareceres_doc_sit ON public.pareceres_tecnicos (documento, situacao);
CREATE INDEX idx_pareceres_risco ON public.pareceres_tecnicos (risco_id);
CREATE INDEX idx_pcmso_contrato ON public.pcmso_documentos(contrato_id);
CREATE INDEX idx_pcmso_documentos_empresa_contrato ON public.pcmso_documentos (empresa_id, contrato_id);
CREATE INDEX idx_psico_avaliacoes_empresa_contrato ON public.psico_avaliacoes(empresa_id, contrato_id);
CREATE INDEX idx_psico_respostas_avaliacao ON public.psico_respostas(avaliacao_id);
CREATE INDEX idx_psico_respostas_empresa ON public.psico_respostas(empresa_id);
CREATE INDEX idx_psico_respostas_empresa_contrato ON public.psico_respostas (empresa_id, contrato_id);
CREATE INDEX idx_psico_respostas_funcao ON public.psico_respostas(funcao_id);
CREATE INDEX idx_psico_respostas_link ON public.psico_respostas(link_id);
CREATE INDEX idx_setores_contrato ON public.setores(contrato_id);
CREATE INDEX idx_setores_contrato_nome ON public.setores (contrato_id, nome_setor);
CREATE INDEX idx_setores_empresa_contrato ON public.setores (empresa_id, contrato_id);

CREATE UNIQUE INDEX uq_ltcat_avaliacao_ficha_documento
  ON public.ltcat_avaliacoes(documento_id, ficha_tecnica_resultado_id)
  WHERE ficha_tecnica_resultado_id IS NOT NULL;

CREATE UNIQUE INDEX ltcat_av_epi_epc_avaliacao_id_key ON public.ltcat_av_epi_epc (avaliacao_id);
CREATE UNIQUE INDEX ltcat_pareceres_unique_combo
  ON public.ltcat_pareceres (empresa_id, setor_id, funcao_id, agente_id, colaborador_nome);
CREATE UNIQUE INDEX psico_indicadores_avaliacao_id_key ON public.psico_indicadores (avaliacao_id);
CREATE UNIQUE INDEX psico_relatorios_avaliacao_id_key ON public.psico_relatorios (avaliacao_id);
CREATE UNIQUE INDEX formularios_aep_empresa_contrato_funcao_key
  ON public.formularios_aep (empresa_id, contrato_id, funcao_id)
  WHERE funcao_id IS NOT NULL;

CREATE UNIQUE INDEX tecnicas_amostragem_nome_unique ON public.tecnicas_amostragem (lower(btrim(nome)));
CREATE UNIQUE INDEX unidades_simbolo_unique ON public.unidades (lower(btrim(simbolo)));
CREATE UNIQUE INDEX equipamentos_ho_nome_unique ON public.equipamentos_ho (lower(btrim(nome)));
CREATE UNIQUE INDEX riscos_tipo_nome_unique ON public.riscos (lower(btrim(tipo)), lower(btrim(nome)));
CREATE UNIQUE INDEX epi_epc_tipo_nome_unique ON public.epi_epc (tipo, lower(btrim(nome)));
CREATE UNIQUE INDEX exames_cadastro_nome_unique ON public.exames_cadastro (lower(btrim(nome)));
CREATE UNIQUE INDEX exames_cadastro_codigo_unique ON public.exames_cadastro (lower(btrim(codigo_esocial)));
CREATE UNIQUE INDEX treinamentos_cadastro_nome_unique ON public.treinamentos_cadastro (lower(btrim(nome)));
CREATE UNIQUE INDEX equipamentos_ho_registros_serie_unique
  ON public.equipamentos_ho_registros (equipamento_id, lower(btrim(numero_serie)));

-- =============================================================================
-- Funções independentes do Supabase
-- auth.uid() foi trocado por app.current_user_id() apenas em track_shared_change.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, ativo)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), NEW.email, true);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'usuario');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_documento_validade()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.data_elaboracao IS NOT NULL THEN
    NEW.data_validade := (NEW.data_elaboracao + INTERVAL '12 months')::date;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.preserve_ficha_tecnica_origin()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.ficha_tecnica_resultado_id IS NOT NULL
     AND NEW.ficha_tecnica_resultado_id IS NULL THEN
    NEW.ficha_tecnica_resultado_id := OLD.ficha_tecnica_resultado_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_ficha_tecnica_resultado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = NEW.contrato_id AND c.empresa_id = NEW.empresa_id) THEN
    RAISE EXCEPTION 'Contrato não pertence à empresa informada' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.setores s WHERE s.id = NEW.setor_id AND s.empresa_id = NEW.empresa_id AND s.contrato_id = NEW.contrato_id) THEN
    RAISE EXCEPTION 'Setor não pertence à empresa e ao contrato informados' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.funcoes f WHERE f.id = NEW.funcao_id AND f.setor_id = NEW.setor_id) THEN
    RAISE EXCEPTION 'Função não pertence ao setor informado' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.riscos r WHERE r.id = NEW.agente_id) THEN
    RAISE EXCEPTION 'Agente inválido' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'ruido' AND (NEW.nen IS NULL OR NEW.dose_q3 IS NULL OR NEW.lavg IS NULL OR NEW.dose_q5 IS NULL OR NEW.limite_tolerancia <> 85) THEN
    RAISE EXCEPTION 'Ruído exige NEN, Dose Q3, LAVG, Dose Q5 e limite de 85 dB' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'vibracao_vmb' AND (NEW.aren IS NULL OR NEW.limite_tolerancia <> 5.0) THEN
    RAISE EXCEPTION 'Vibração de mãos e braços exige AREN e limite de 5,0 m/s²' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'vibracao_vci' AND (NEW.aren IS NULL OR NEW.vdvr IS NULL OR NEW.limite_tolerancia <> 1.1) THEN
    RAISE EXCEPTION 'Vibração de corpo inteiro exige AREN, VDVR e limite AREN de 1,1 m/s²' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'calor' AND (NEW.concentracao IS NULL OR NULLIF(trim(NEW.taxa_metabolica), '') IS NULL) THEN
    RAISE EXCEPTION 'Calor exige concentração e taxa metabólica' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo IN ('poeira_silica','quimico_quantitativo','fumos_metalicos','vapores_organicos')
     AND (NULLIF(trim(NEW.componentes), '') IS NULL OR NULLIF(trim(NEW.amostrador), '') IS NULL OR NULLIF(trim(NEW.amostrador_serie), '') IS NULL OR NEW.exposicao IS NULL) THEN
    RAISE EXCEPTION 'Resultado químico exige componentes, amostrador, número/série e exposição' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_ergonomia_to_aet()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.ergonomia_avaliacoes ea
  SET aet_documento_id = NEW.id
  WHERE ea.aet_documento_id IS NULL
    AND ea.user_id = NEW.created_by
    AND (
      (NEW.empresa_id IS NOT NULL AND ea.empresa_nome = (
        SELECT razao_social FROM public.empresas WHERE id = NEW.empresa_id
      ))
      OR NEW.empresa_id IS NULL
    );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_shared_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_id := OLD.id;
    INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data)
    VALUES (TG_TABLE_NAME, v_id, TG_OP, app.current_user_id(), to_jsonb(OLD));
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.row_version := OLD.row_version + 1;
    NEW.last_modified_by := app.current_user_id();
    v_id := NEW.id;
    INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_id, TG_OP, app.current_user_id(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;

  NEW.last_modified_by := app.current_user_id();
  v_id := NEW.id;
  INSERT INTO public.audit_log(table_name, record_id, action, changed_by, new_data)
  VALUES (TG_TABLE_NAME, v_id, TG_OP, app.current_user_id(), to_jsonb(NEW));
  RETURN NEW;
END;
$$;

-- Fora deste script, porque o corpo final foi emendado por migrações
-- posteriores e o catálogo remoto não confirmou o texto instalado:
-- save_ltcat_documento_v2, sync_ltcat_avaliacoes, import_ficha_tecnica_resultados,
-- update_shared_record, psico_get_public_link e psico_submit_resposta.
-- private.has_role também fica de fora: só existia para a RLS do Supabase.

-- =============================================================================
-- Triggers
-- =============================================================================

CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_app_user_created
  AFTER INSERT ON app.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER ergonomia_avaliacoes_updated
  BEFORE UPDATE ON public.ergonomia_avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER preserve_ficha_tecnica_origin_on_update
  BEFORE UPDATE ON public.ltcat_avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.preserve_ficha_tecnica_origin();

CREATE TRIGGER psico_indicadores_updated_at
  BEFORE UPDATE ON public.psico_indicadores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER psico_relatorios_updated_at
  BEFORE UPDATE ON public.psico_relatorios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER responsaveis_updated_at
  BEFORE UPDATE ON public.responsaveis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_treinamentos_cadastro_updated_at
  BEFORE UPDATE ON public.treinamentos_cadastro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_aet_instrucoes_updated
  BEFORE UPDATE ON public.aet_instrucoes_usuario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_documento_validade
  BEFORE INSERT OR UPDATE OF data_elaboracao ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.set_documento_validade();

CREATE TRIGGER trg_link_ergonomia_to_aet
  AFTER INSERT ON public.aet_documentos
  FOR EACH ROW EXECUTE FUNCTION public.link_ergonomia_to_aet();

CREATE TRIGGER trg_pcmso_documentos_updated
  BEFORE UPDATE ON public.pcmso_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_psico_avaliacoes_updated
  BEFORE UPDATE ON public.psico_avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_psico_links_updated
  BEFORE UPDATE ON public.psico_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_track_ficha_tecnica_change
  BEFORE INSERT OR UPDATE OR DELETE ON public.ficha_tecnica_resultados
  FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();

CREATE TRIGGER update_aep_documentos_updated_at
  BEFORE UPDATE ON public.aep_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aet_documentos_updated_at
  BEFORE UPDATE ON public.aet_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_epi_epc_updated_at
  BEFORE UPDATE ON public.epi_epc
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exames_cadastro_updated_at
  BEFORE UPDATE ON public.exames_cadastro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ficha_tecnica_resultados_updated_at
  BEFORE UPDATE ON public.ficha_tecnica_resultados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_funcoes_updated_at
  BEFORE UPDATE ON public.funcoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pareceres_tecnicos_updated_at
  BEFORE UPDATE ON public.pareceres_tecnicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pcmso_documentos_updated_at
  BEFORE UPDATE ON public.pcmso_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_riscos_updated_at
  BEFORE UPDATE ON public.riscos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_setores_updated_at
  BEFORE UPDATE ON public.setores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER validate_ficha_tecnica_resultado
  BEFORE INSERT OR UPDATE ON public.ficha_tecnica_resultados
  FOR EACH ROW EXECUTE FUNCTION public.validate_ficha_tecnica_resultado();

CREATE TRIGGER trg_track_shared_change
  BEFORE INSERT OR UPDATE OR DELETE ON public.tecnicas_amostragem
  FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();

CREATE TRIGGER trg_track_shared_change
  BEFORE INSERT OR UPDATE OR DELETE ON public.unidades
  FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();

CREATE TRIGGER trg_track_shared_change
  BEFORE INSERT OR UPDATE OR DELETE ON public.equipamentos_ho
  FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();

CREATE TRIGGER trg_track_shared_change
  BEFORE INSERT OR UPDATE OR DELETE ON public.equipamentos_ho_registros
  FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();

CREATE TRIGGER trg_track_shared_change
  BEFORE INSERT OR UPDATE OR DELETE ON public.epi_epc
  FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();

CREATE TRIGGER trg_track_shared_change
  BEFORE INSERT OR UPDATE OR DELETE ON public.pareceres_tecnicos
  FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();

CREATE TRIGGER trg_track_shared_change
  BEFORE INSERT OR UPDATE OR DELETE ON public.treinamentos_cadastro
  FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();

CREATE TRIGGER trg_track_shared_change
  BEFORE INSERT OR UPDATE OR DELETE ON public.exames_cadastro
  FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();

CREATE TRIGGER trg_track_shared_change
  BEFORE INSERT OR UPDATE OR DELETE ON public.responsaveis
  FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();
