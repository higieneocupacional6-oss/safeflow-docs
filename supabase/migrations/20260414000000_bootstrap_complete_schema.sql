-- =============================================================================
-- BOOTSTRAP: complete empty SafeFlow schema (Postgres 17 / Supabase)
-- Generated for fresh projects. See ../BOOTSTRAP_NOTES.md
-- Timestamp prefix 20260414000000 places this before historical migrations.
-- =============================================================================

-- gen_random_uuid() is provided by Supabase (pgcrypto / pg_catalog)

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- Enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'usuario');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Shared updated_at helper (no table deps)
-- public.update_updated_at_column() (from 20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- =============================================================================
-- TABLES (47)
-- =============================================================================

-- aet_instrucoes_usuario
CREATE TABLE IF NOT EXISTS public.aet_instrucoes_usuario (
  ia_ativada boolean NOT NULL DEFAULT false,
  instrucoes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  PRIMARY KEY (user_id)
);

-- audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  action text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  new_data jsonb,
  old_data jsonb,
  record_id uuid,
  table_name text NOT NULL,
  PRIMARY KEY (id)
);

-- empresas
CREATE TABLE IF NOT EXISTS public.empresas (
  cnae_principal TEXT,
  cnpj TEXT NOT NULL,
  cnpj_contratante TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  endereco TEXT,
  escopo_contrato TEXT,
  fiscal_email TEXT,
  fiscal_nome TEXT,
  fiscal_telefone TEXT,
  gestor_email TEXT,
  gestor_nome TEXT,
  gestor_telefone TEXT,
  grau_risco TEXT,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  jornada_trabalho TEXT,
  last_modified_by uuid,
  local_trabalho TEXT,
  nome_contratante TEXT,
  nome_fantasia TEXT,
  numero_contrato TEXT,
  numero_funcionarios_fem INTEGER DEFAULT 0,
  numero_funcionarios_masc INTEGER DEFAULT 0,
  preposto_email TEXT,
  preposto_nome TEXT,
  preposto_telefone TEXT,
  razao_social TEXT NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  total_funcionarios INTEGER DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  vigencia_fim DATE,
  vigencia_inicio DATE,
  PRIMARY KEY (id)
);

-- epi_epc
CREATE TABLE IF NOT EXISTS public.epi_epc (
  created_at timestamptz NOT NULL DEFAULT now(),
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- equipamentos_ho
CREATE TABLE IF NOT EXISTS public.equipamentos_ho (
  certificado text,
  created_at timestamptz DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  marca text,
  nome text NOT NULL,
  tipo text,
  PRIMARY KEY (id)
);

-- exames_cadastro
CREATE TABLE IF NOT EXISTS public.exames_cadastro (
  codigo_esocial text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  descricao_esocial text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- ia_conhecimento_pastas
CREATE TABLE IF NOT EXISTS public.ia_conhecimento_pastas (
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- notificacoes
CREATE TABLE IF NOT EXISTS public.notificacoes (
  contrato_id uuid,
  contrato_numero text,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_vencimento date NOT NULL,
  documento_id uuid NOT NULL,
  documento_nome text,
  documento_tipo text,
  empresa_id uuid,
  empresa_nome text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lida boolean NOT NULL DEFAULT false,
  tipo text NOT NULL,
  PRIMARY KEY (id)
);

-- pcmso_documentos
CREATE TABLE IF NOT EXISTS public.pcmso_documentos (
  cargo text,
  contrato_id uuid,
  crea text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  cronograma jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step integer NOT NULL DEFAULT 0,
  data_elaboracao date,
  documento_id uuid,
  empresa_id uuid,
  epi_blocos jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_path text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
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
  vigencia_inicio date,
  PRIMARY KEY (id)
);

-- pcmso_observacoes_padrao
CREATE TABLE IF NOT EXISTS public.pcmso_observacoes_padrao (
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  texto text NOT NULL,
  titulo text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email TEXT NOT NULL,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL UNIQUE,
  PRIMARY KEY (id)
);

-- psico_base_tecnica
CREATE TABLE IF NOT EXISTS public.psico_base_tecnica (
  caminho TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tamanho BIGINT,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  PRIMARY KEY (id)
);

-- responsaveis
CREATE TABLE IF NOT EXISTS public.responsaveis (
  created_at timestamptz NOT NULL DEFAULT now(),
  funcao text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  registro_profissional text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- riscos
CREATE TABLE IF NOT EXISTS public.riscos (
  codigo_esocial TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  danos_saude TEXT,
  descricao_esocial TEXT,
  epi_eficaz TEXT,
  fonte_geradora TEXT,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  is_padrao boolean NOT NULL DEFAULT false,
  last_modified_by uuid,
  medidas_controle TEXT,
  nome TEXT NOT NULL,
  propagacao TEXT[],
  row_version bigint NOT NULL DEFAULT 1,
  tipo TEXT NOT NULL,
  tipo_epi TEXT,
  tipo_exposicao TEXT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- tecnicas_amostragem
CREATE TABLE IF NOT EXISTS public.tecnicas_amostragem (
  created_at timestamptz DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  referencia text,
  PRIMARY KEY (id)
);

-- templates
CREATE TABLE IF NOT EXISTS public.templates (
  created_at timestamptz NOT NULL DEFAULT now(),
  file_path TEXT NOT NULL,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  is_system boolean NOT NULL DEFAULT false,
  title TEXT NOT NULL,
  PRIMARY KEY (id)
);

-- treinamentos_cadastro
CREATE TABLE IF NOT EXISTS public.treinamentos_cadastro (
  carga_horaria text,
  codigo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  descricao text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  observacoes text,
  periodicidade text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- unidades
CREATE TABLE IF NOT EXISTS public.unidades (
  created_at timestamptz DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text,
  simbolo text NOT NULL,
  PRIMARY KEY (id)
);

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  role app_role NOT NULL DEFAULT 'usuario'::public.app_role,
  user_id UUID NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, role)
);

-- contratos
CREATE TABLE IF NOT EXISTS public.contratos (
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
  id uuid NOT NULL DEFAULT gen_random_uuid(),
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
  vigencia_inicio date,
  PRIMARY KEY (id)
);

-- empresa_contatos
CREATE TABLE IF NOT EXISTS public.empresa_contatos (
  created_at timestamptz NOT NULL DEFAULT now(),
  email TEXT DEFAULT '',
  empresa_id UUID NOT NULL,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT '',
  telefone TEXT DEFAULT '',
  tipo TEXT NOT NULL,
  PRIMARY KEY (id)
);

-- epi_epc_riscos
CREATE TABLE IF NOT EXISTS public.epi_epc_riscos (
  epi_epc_id UUID NOT NULL,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  risco_id UUID NOT NULL,
  PRIMARY KEY (id)
);

-- equipamentos_ho_registros
CREATE TABLE IF NOT EXISTS public.equipamentos_ho_registros (
  certificado_nome text,
  certificado_path text,
  certificado_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_calibracao DATE,
  equipamento_id UUID NOT NULL,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  marca_modelo TEXT,
  numero_serie TEXT NOT NULL,
  situacao_operacional text NOT NULL,
  PRIMARY KEY (id)
);

-- ia_conhecimento_arquivos
CREATE TABLE IF NOT EXISTS public.ia_conhecimento_arquivos (
  caminho text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mime text,
  nome text NOT NULL,
  pasta_id uuid NOT NULL,
  tamanho bigint,
  PRIMARY KEY (id)
);

-- ltcat_pareceres
CREATE TABLE IF NOT EXISTS public.ltcat_pareceres (
  agente_id UUID NOT NULL,
  aposentadoria_especial TEXT,
  colaborador_nome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by uuid,
  empresa_id UUID NOT NULL,
  funcao_id UUID,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  parecer_tecnico TEXT,
  setor_id UUID NOT NULL,
  tipo_documento text NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- pareceres_tecnicos
CREATE TABLE IF NOT EXISTS public.pareceres_tecnicos (
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  documento text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parecer_tecnico text NOT NULL DEFAULT '',
  risco_id uuid,
  situacao text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- documentos
CREATE TABLE IF NOT EXISTS public.documentos (
  alteracoes_documento text,
  cargo text,
  contrato_id uuid,
  crea text,
  created_at timestamptz NOT NULL DEFAULT now(),
  current_step integer NOT NULL DEFAULT 0,
  data_elaboracao date,
  data_validade date,
  draft_snapshot jsonb,
  empresa_id UUID,
  empresa_nome TEXT NOT NULL DEFAULT '',
  file_path TEXT,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome_documento text,
  responsavel_tecnico text,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_version bigint NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'concluido',
  template_id UUID,
  tipo TEXT NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  upload_file_path text,
  PRIMARY KEY (id)
);

-- formularios_aep
CREATE TABLE IF NOT EXISTS public.formularios_aep (
  contrato_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  empresa_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pdf_path text,
  setor_ids text[] NOT NULL DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- psico_avaliacoes
CREATE TABLE IF NOT EXISTS public.psico_avaliacoes (
  contrato_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  empresa_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'rascunho',
  titulo text NOT NULL DEFAULT 'Avaliação Psicossocial',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- setores
CREATE TABLE IF NOT EXISTS public.setores (
  contrato_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  descricao_ambiente TEXT,
  empresa_id UUID NOT NULL,
  ghe_ges TEXT,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome_setor TEXT NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- aep_documentos
CREATE TABLE IF NOT EXISTS public.aep_documentos (
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
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  responsavel_tecnico text,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_version bigint NOT NULL DEFAULT 1,
  setores jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'rascunho',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- aet_documentos
CREATE TABLE IF NOT EXISTS public.aet_documentos (
  alteracoes_documento TEXT,
  cargo TEXT,
  contrato_id uuid,
  crea TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID DEFAULT auth.uid(),
  current_step integer NOT NULL DEFAULT 0,
  data_elaboracao DATE,
  documento_id UUID,
  empresa_id UUID,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  responsavel_tecnico TEXT,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_version bigint NOT NULL DEFAULT 1,
  setores JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'rascunho',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- funcoes
CREATE TABLE IF NOT EXISTS public.funcoes (
  cbo_codigo TEXT,
  cbo_descricao TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  descricao_atividades TEXT,
  expostos text,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  last_modified_by uuid,
  nome_funcao TEXT NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  setor_id UUID NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- psico_indicadores
CREATE TABLE IF NOT EXISTS public.psico_indicadores (
  avaliacao_id uuid NOT NULL,
  contrato_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  empresa_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- psico_links
CREATE TABLE IF NOT EXISTS public.psico_links (
  ativo boolean NOT NULL DEFAULT true,
  avaliacao_id uuid,
  contrato_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  empresa_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(9), 'base64'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- psico_relatorios
CREATE TABLE IF NOT EXISTS public.psico_relatorios (
  avaliacao_id uuid NOT NULL,
  contrato_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  empresa_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  versao text NOT NULL DEFAULT '1.0',
  PRIMARY KEY (id)
);

-- ergonomia_avaliacoes
CREATE TABLE IF NOT EXISTS public.ergonomia_avaliacoes (
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
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nivel_acao text,
  pdf_path text,
  recomendacoes text,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  setor_nome text,
  setor_ref text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  PRIMARY KEY (id)
);

-- ficha_tecnica_resultados
CREATE TABLE IF NOT EXISTS public.ficha_tecnica_resultados (
  agente_id uuid NOT NULL,
  amostrador text,
  amostrador_serie text,
  aren numeric,
  componentes text,
  concentracao numeric,
  contrato_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  dose_q3 numeric,
  dose_q5 numeric,
  empresa_id uuid NOT NULL,
  exposicao numeric,
  funcao_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  last_modified_by uuid DEFAULT auth.uid(),
  lavg numeric,
  limite_tolerancia numeric NOT NULL,
  nen numeric,
  row_version bigint NOT NULL DEFAULT 1,
  setor_id uuid NOT NULL,
  taxa_metabolica text,
  tipo text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  vdvr numeric,
  PRIMARY KEY (id)
);

-- psico_respostas
CREATE TABLE IF NOT EXISTS public.psico_respostas (
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
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  link_id uuid,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  resultado_psicossocial text,
  riscos_psicossociais text,
  total_negativas int DEFAULT 0,
  total_positivas int DEFAULT 0,
  PRIMARY KEY (id)
);

-- ltcat_avaliacoes
CREATE TABLE IF NOT EXISTS public.ltcat_avaliacoes (
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
  id uuid NOT NULL DEFAULT gen_random_uuid(),
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
  unidade_tempo_coleta text,
  PRIMARY KEY (id)
);

-- equipamentos_avaliacao
CREATE TABLE IF NOT EXISTS public.equipamentos_avaliacao (
  agente_nome text,
  avaliacao_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  data_avaliacao date,
  data_calibracao date,
  empresa_id uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  modelo_equipamento text,
  nome_equipamento text,
  serie_equipamento text,
  setor_id uuid,
  tipo_documento text NOT NULL,
  PRIMARY KEY (id)
);

-- ltcat_av_calor
CREATE TABLE IF NOT EXISTS public.ltcat_av_calor (
  aposentadoria_especial TEXT,
  avaliacao_id UUID NOT NULL,
  cod_gfip TEXT,
  colaborador TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_avaliacao DATE,
  descricao_atividade TEXT,
  equipamento_id uuid,
  funcao_id UUID,
  ibutg_limite NUMERIC,
  ibutg_medido NUMERIC,
  ibutg_tipo text,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  local_atividade text,
  m_kcal_h NUMERIC,
  ordem INTEGER NOT NULL DEFAULT 0,
  parecer_tecnico TEXT,
  situacao TEXT,
  taxa_metabolica TEXT,
  tbn_valores text,
  tbs_valores text,
  tempo_exposicao text,
  tg_valores text,
  tipo_atividade TEXT,
  tipo_documento text NOT NULL,
  PRIMARY KEY (id)
);

-- ltcat_av_componentes
CREATE TABLE IF NOT EXISTS public.ltcat_av_componentes (
  amostrador text,
  aposentadoria_especial TEXT,
  avaliacao_id UUID NOT NULL,
  cas TEXT,
  cod_gfip TEXT,
  colaborador TEXT,
  componente TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_avaliacao DATE,
  descricao_avaliacao TEXT,
  dose_percentual NUMERIC,
  funcao_id UUID,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  limite_tolerancia NUMERIC,
  numero_serie_bomba text,
  ordem INTEGER NOT NULL DEFAULT 0,
  parecer_tecnico TEXT,
  resultado NUMERIC,
  situacao TEXT,
  tempo_coleta TEXT,
  tipo_documento text NOT NULL,
  unidade_limite_id UUID,
  unidade_resultado_id UUID,
  unidade_tempo_coleta TEXT,
  PRIMARY KEY (id)
);

-- ltcat_av_epi_epc
CREATE TABLE IF NOT EXISTS public.ltcat_av_epi_epc (
  avaliacao_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  epc_eficaz TEXT,
  epc_id UUID,
  epi_atenuacao TEXT,
  epi_ca TEXT,
  epi_eficaz TEXT,
  epi_id UUID,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tipo_documento text NOT NULL,
  PRIMARY KEY (id)
);

-- ltcat_av_equipamentos
CREATE TABLE IF NOT EXISTS public.ltcat_av_equipamentos (
  agente_nome TEXT,
  avaliacao_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_avaliacao DATE,
  data_calibracao DATE,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  modelo_equipamento TEXT,
  nome_equipamento TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  serie_equipamento TEXT,
  tipo_documento text NOT NULL,
  PRIMARY KEY (id)
);

-- ltcat_av_resultados
CREATE TABLE IF NOT EXISTS public.ltcat_av_resultados (
  aposentadoria_especial TEXT,
  avaliacao_id UUID NOT NULL,
  cod_gfip TEXT,
  colaborador TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_avaliacao DATE,
  descricao_avaliacao TEXT,
  dose_percentual NUMERIC,
  equipamento_registro_id uuid,
  funcao_id UUID,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  limite_tolerancia NUMERIC,
  ordem INTEGER NOT NULL DEFAULT 0,
  parecer_tecnico TEXT,
  resultado NUMERIC,
  situacao TEXT,
  tempo_coleta TEXT,
  tipo_documento text NOT NULL,
  unidade_limite_id UUID,
  unidade_resultado_id UUID,
  unidade_tempo_coleta TEXT,
  PRIMARY KEY (id)
);

-- ltcat_av_vibracao
CREATE TABLE IF NOT EXISTS public.ltcat_av_vibracao (
  aposentadoria_especial TEXT,
  aren NUMERIC,
  aren_limite NUMERIC,
  avaliacao_id UUID NOT NULL,
  cod_gfip TEXT,
  colaborador TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_avaliacao DATE,
  funcao_id UUID,
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  ordem INTEGER NOT NULL DEFAULT 0,
  parecer_tecnico TEXT,
  situacao TEXT,
  tempo_exposicao TEXT,
  tipo TEXT,
  tipo_documento text NOT NULL,
  vdvr NUMERIC,
  vdvr_limite NUMERIC,
  PRIMARY KEY (id)
);

-- =============================================================================
-- FOREIGN KEYS
-- =============================================================================

ALTER TABLE public.aep_documentos
  DROP CONSTRAINT IF EXISTS aep_documentos_contrato_id_fkey;
ALTER TABLE public.aep_documentos
  ADD CONSTRAINT aep_documentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.aep_documentos
  DROP CONSTRAINT IF EXISTS aep_documentos_documento_id_fkey;
ALTER TABLE public.aep_documentos
  ADD CONSTRAINT aep_documentos_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documentos(id) ON DELETE CASCADE;

ALTER TABLE public.aep_documentos
  DROP CONSTRAINT IF EXISTS aep_documentos_empresa_id_fkey;
ALTER TABLE public.aep_documentos
  ADD CONSTRAINT aep_documentos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.aet_documentos
  DROP CONSTRAINT IF EXISTS aet_documentos_contrato_id_fkey;
ALTER TABLE public.aet_documentos
  ADD CONSTRAINT aet_documentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.aet_documentos
  DROP CONSTRAINT IF EXISTS aet_documentos_documento_id_fkey;
ALTER TABLE public.aet_documentos
  ADD CONSTRAINT aet_documentos_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documentos(id) ON DELETE CASCADE;

ALTER TABLE public.aet_documentos
  DROP CONSTRAINT IF EXISTS aet_documentos_empresa_id_fkey;
ALTER TABLE public.aet_documentos
  ADD CONSTRAINT aet_documentos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.contratos
  DROP CONSTRAINT IF EXISTS contratos_empresa_id_fkey;
ALTER TABLE public.contratos
  ADD CONSTRAINT contratos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.documentos
  DROP CONSTRAINT IF EXISTS documentos_contrato_id_fkey;
ALTER TABLE public.documentos
  ADD CONSTRAINT documentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.documentos
  DROP CONSTRAINT IF EXISTS documentos_empresa_id_fkey;
ALTER TABLE public.documentos
  ADD CONSTRAINT documentos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.documentos
  DROP CONSTRAINT IF EXISTS documentos_template_id_fkey;
ALTER TABLE public.documentos
  ADD CONSTRAINT documentos_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id);

ALTER TABLE public.empresa_contatos
  DROP CONSTRAINT IF EXISTS empresa_contatos_empresa_id_fkey;
ALTER TABLE public.empresa_contatos
  ADD CONSTRAINT empresa_contatos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.epi_epc_riscos
  DROP CONSTRAINT IF EXISTS epi_epc_riscos_epi_epc_id_fkey;
ALTER TABLE public.epi_epc_riscos
  ADD CONSTRAINT epi_epc_riscos_epi_epc_id_fkey FOREIGN KEY (epi_epc_id) REFERENCES public.epi_epc(id) ON DELETE CASCADE;

ALTER TABLE public.epi_epc_riscos
  DROP CONSTRAINT IF EXISTS epi_epc_riscos_risco_id_fkey;
ALTER TABLE public.epi_epc_riscos
  ADD CONSTRAINT epi_epc_riscos_risco_id_fkey FOREIGN KEY (risco_id) REFERENCES public.riscos(id) ON DELETE CASCADE;

ALTER TABLE public.equipamentos_avaliacao
  DROP CONSTRAINT IF EXISTS equipamentos_avaliacao_avaliacao_id_fkey;
ALTER TABLE public.equipamentos_avaliacao
  ADD CONSTRAINT equipamentos_avaliacao_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.equipamentos_ho_registros
  DROP CONSTRAINT IF EXISTS equipamentos_ho_registros_equipamento_id_fkey;
ALTER TABLE public.equipamentos_ho_registros
  ADD CONSTRAINT equipamentos_ho_registros_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES public.equipamentos_ho(id) ON DELETE CASCADE;

ALTER TABLE public.ergonomia_avaliacoes
  DROP CONSTRAINT IF EXISTS ergonomia_avaliacoes_aet_documento_id_fkey;
ALTER TABLE public.ergonomia_avaliacoes
  ADD CONSTRAINT ergonomia_avaliacoes_aet_documento_id_fkey FOREIGN KEY (aet_documento_id) REFERENCES public.aet_documentos(id);

ALTER TABLE public.ficha_tecnica_resultados
  DROP CONSTRAINT IF EXISTS ficha_tecnica_resultados_agente_id_fkey;
ALTER TABLE public.ficha_tecnica_resultados
  ADD CONSTRAINT ficha_tecnica_resultados_agente_id_fkey FOREIGN KEY (agente_id) REFERENCES public.riscos(id);

ALTER TABLE public.ficha_tecnica_resultados
  DROP CONSTRAINT IF EXISTS ficha_tecnica_resultados_contrato_id_fkey;
ALTER TABLE public.ficha_tecnica_resultados
  ADD CONSTRAINT ficha_tecnica_resultados_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.ficha_tecnica_resultados
  DROP CONSTRAINT IF EXISTS ficha_tecnica_resultados_empresa_id_fkey;
ALTER TABLE public.ficha_tecnica_resultados
  ADD CONSTRAINT ficha_tecnica_resultados_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.ficha_tecnica_resultados
  DROP CONSTRAINT IF EXISTS ficha_tecnica_resultados_funcao_id_fkey;
ALTER TABLE public.ficha_tecnica_resultados
  ADD CONSTRAINT ficha_tecnica_resultados_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id);

ALTER TABLE public.ficha_tecnica_resultados
  DROP CONSTRAINT IF EXISTS ficha_tecnica_resultados_setor_id_fkey;
ALTER TABLE public.ficha_tecnica_resultados
  ADD CONSTRAINT ficha_tecnica_resultados_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id);

ALTER TABLE public.formularios_aep
  DROP CONSTRAINT IF EXISTS formularios_aep_contrato_id_fkey;
ALTER TABLE public.formularios_aep
  ADD CONSTRAINT formularios_aep_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.formularios_aep
  DROP CONSTRAINT IF EXISTS formularios_aep_empresa_id_fkey;
ALTER TABLE public.formularios_aep
  ADD CONSTRAINT formularios_aep_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.funcoes
  DROP CONSTRAINT IF EXISTS funcoes_setor_id_fkey;
ALTER TABLE public.funcoes
  ADD CONSTRAINT funcoes_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id);

ALTER TABLE public.ia_conhecimento_arquivos
  DROP CONSTRAINT IF EXISTS ia_conhecimento_arquivos_pasta_id_fkey;
ALTER TABLE public.ia_conhecimento_arquivos
  ADD CONSTRAINT ia_conhecimento_arquivos_pasta_id_fkey FOREIGN KEY (pasta_id) REFERENCES public.ia_conhecimento_pastas(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_calor
  DROP CONSTRAINT IF EXISTS ltcat_av_calor_avaliacao_id_fkey;
ALTER TABLE public.ltcat_av_calor
  ADD CONSTRAINT ltcat_av_calor_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_componentes
  DROP CONSTRAINT IF EXISTS ltcat_av_componentes_avaliacao_id_fkey;
ALTER TABLE public.ltcat_av_componentes
  ADD CONSTRAINT ltcat_av_componentes_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_epi_epc
  DROP CONSTRAINT IF EXISTS ltcat_av_epi_epc_avaliacao_id_fkey;
ALTER TABLE public.ltcat_av_epi_epc
  ADD CONSTRAINT ltcat_av_epi_epc_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_equipamentos
  DROP CONSTRAINT IF EXISTS ltcat_av_equipamentos_avaliacao_id_fkey;
ALTER TABLE public.ltcat_av_equipamentos
  ADD CONSTRAINT ltcat_av_equipamentos_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_resultados
  DROP CONSTRAINT IF EXISTS ltcat_av_resultados_avaliacao_id_fkey;
ALTER TABLE public.ltcat_av_resultados
  ADD CONSTRAINT ltcat_av_resultados_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_av_vibracao
  DROP CONSTRAINT IF EXISTS ltcat_av_vibracao_avaliacao_id_fkey;
ALTER TABLE public.ltcat_av_vibracao
  ADD CONSTRAINT ltcat_av_vibracao_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_avaliacoes
  DROP CONSTRAINT IF EXISTS ltcat_avaliacoes_agente_id_fkey;
ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_agente_id_fkey FOREIGN KEY (agente_id) REFERENCES public.riscos(id);

ALTER TABLE public.ltcat_avaliacoes
  DROP CONSTRAINT IF EXISTS ltcat_avaliacoes_contrato_id_fkey;
ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.ltcat_avaliacoes
  DROP CONSTRAINT IF EXISTS ltcat_avaliacoes_documento_id_fkey;
ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documentos(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_avaliacoes
  DROP CONSTRAINT IF EXISTS ltcat_avaliacoes_empresa_id_fkey;
ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_avaliacoes
  DROP CONSTRAINT IF EXISTS ltcat_avaliacoes_equipamento_id_fkey;
ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES public.equipamentos_ho(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_avaliacoes
  DROP CONSTRAINT IF EXISTS ltcat_avaliacoes_ficha_tecnica_resultado_id_fkey;
ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_ficha_tecnica_resultado_id_fkey FOREIGN KEY (ficha_tecnica_resultado_id) REFERENCES public.ficha_tecnica_resultados(id);

ALTER TABLE public.ltcat_avaliacoes
  DROP CONSTRAINT IF EXISTS ltcat_avaliacoes_funcao_id_fkey;
ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id) ON DELETE SET NULL;

ALTER TABLE public.ltcat_avaliacoes
  DROP CONSTRAINT IF EXISTS ltcat_avaliacoes_setor_id_fkey;
ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id) ON DELETE CASCADE;

ALTER TABLE public.ltcat_avaliacoes
  DROP CONSTRAINT IF EXISTS ltcat_avaliacoes_tecnica_id_fkey;
ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_tecnica_id_fkey FOREIGN KEY (tecnica_id) REFERENCES public.tecnicas_amostragem(id);

ALTER TABLE public.ltcat_avaliacoes
  DROP CONSTRAINT IF EXISTS ltcat_avaliacoes_unidade_limite_id_fkey;
ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_unidade_limite_id_fkey FOREIGN KEY (unidade_limite_id) REFERENCES public.unidades(id);

ALTER TABLE public.ltcat_avaliacoes
  DROP CONSTRAINT IF EXISTS ltcat_avaliacoes_unidade_resultado_id_fkey;
ALTER TABLE public.ltcat_avaliacoes
  ADD CONSTRAINT ltcat_avaliacoes_unidade_resultado_id_fkey FOREIGN KEY (unidade_resultado_id) REFERENCES public.unidades(id);

ALTER TABLE public.ltcat_pareceres
  DROP CONSTRAINT IF EXISTS ltcat_pareceres_empresa_id_fkey;
ALTER TABLE public.ltcat_pareceres
  ADD CONSTRAINT ltcat_pareceres_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.pareceres_tecnicos
  DROP CONSTRAINT IF EXISTS pareceres_tecnicos_risco_id_fkey;
ALTER TABLE public.pareceres_tecnicos
  ADD CONSTRAINT pareceres_tecnicos_risco_id_fkey FOREIGN KEY (risco_id) REFERENCES public.riscos(id);

ALTER TABLE public.psico_avaliacoes
  DROP CONSTRAINT IF EXISTS psico_avaliacoes_contrato_id_fkey;
ALTER TABLE public.psico_avaliacoes
  ADD CONSTRAINT psico_avaliacoes_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.psico_avaliacoes
  DROP CONSTRAINT IF EXISTS psico_avaliacoes_empresa_id_fkey;
ALTER TABLE public.psico_avaliacoes
  ADD CONSTRAINT psico_avaliacoes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.psico_indicadores
  DROP CONSTRAINT IF EXISTS psico_indicadores_avaliacao_id_fkey;
ALTER TABLE public.psico_indicadores
  ADD CONSTRAINT psico_indicadores_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.psico_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.psico_links
  DROP CONSTRAINT IF EXISTS psico_links_avaliacao_id_fkey;
ALTER TABLE public.psico_links
  ADD CONSTRAINT psico_links_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.psico_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.psico_links
  DROP CONSTRAINT IF EXISTS psico_links_contrato_id_fkey;
ALTER TABLE public.psico_links
  ADD CONSTRAINT psico_links_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.psico_links
  DROP CONSTRAINT IF EXISTS psico_links_empresa_id_fkey;
ALTER TABLE public.psico_links
  ADD CONSTRAINT psico_links_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.psico_relatorios
  DROP CONSTRAINT IF EXISTS psico_relatorios_avaliacao_id_fkey;
ALTER TABLE public.psico_relatorios
  ADD CONSTRAINT psico_relatorios_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.psico_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.psico_respostas
  DROP CONSTRAINT IF EXISTS psico_respostas_avaliacao_id_fkey;
ALTER TABLE public.psico_respostas
  ADD CONSTRAINT psico_respostas_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.psico_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.psico_respostas
  DROP CONSTRAINT IF EXISTS psico_respostas_contrato_id_fkey;
ALTER TABLE public.psico_respostas
  ADD CONSTRAINT psico_respostas_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.psico_respostas
  DROP CONSTRAINT IF EXISTS psico_respostas_empresa_id_fkey;
ALTER TABLE public.psico_respostas
  ADD CONSTRAINT psico_respostas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.psico_respostas
  DROP CONSTRAINT IF EXISTS psico_respostas_funcao_id_fkey;
ALTER TABLE public.psico_respostas
  ADD CONSTRAINT psico_respostas_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id);

ALTER TABLE public.psico_respostas
  DROP CONSTRAINT IF EXISTS psico_respostas_link_id_fkey;
ALTER TABLE public.psico_respostas
  ADD CONSTRAINT psico_respostas_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.psico_links(id) ON DELETE CASCADE;

ALTER TABLE public.setores
  DROP CONSTRAINT IF EXISTS setores_contrato_id_fkey;
ALTER TABLE public.setores
  ADD CONSTRAINT setores_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

ALTER TABLE public.setores
  DROP CONSTRAINT IF EXISTS setores_empresa_id_fkey;
ALTER TABLE public.setores
  ADD CONSTRAINT setores_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

-- =============================================================================
-- FUNCTIONS (after tables; before RLS policies / triggers)
-- =============================================================================

-- private.has_role(uuid, app_role) (from 20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql)
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- public.has_role(uuid, app_role) (from 20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.has_role(_user_id, _role) $$;

-- public.handle_new_user() (from 20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    true
  );

  -- Always default to 'usuario'. Admins are promoted explicitly via Usuarios page.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'usuario'::app_role);

  RETURN NEW;
END;
$function$;

-- private.psico_get_public_link(text) (from 20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql)
CREATE OR REPLACE FUNCTION private.psico_get_public_link(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_link record; v_result jsonb;
BEGIN
  SELECT l.id, l.empresa_id, l.ativo, e.razao_social INTO v_link
  FROM public.psico_links l JOIN public.empresas e ON e.id = l.empresa_id
  WHERE l.token = _token;
  IF NOT FOUND OR NOT v_link.ativo THEN RETURN jsonb_build_object('error', 'Link inválido ou desativado'); END IF;
  SELECT jsonb_build_object(
    'link_id', v_link.id, 'empresa_id', v_link.empresa_id, 'empresa_nome', v_link.razao_social,
    'contratos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'nome', COALESCE(c.numero_contrato, c.escopo_contrato, 'Contrato'),
        'funcoes', COALESCE((SELECT jsonb_agg(DISTINCT jsonb_build_object('id', f.id, 'nome', f.nome_funcao)) FROM public.setores s JOIN public.funcoes f ON f.setor_id=s.id WHERE s.contrato_id=c.id), '[]'::jsonb)
      ) ORDER BY c.numero_contrato) FROM public.contratos c WHERE c.empresa_id=v_link.empresa_id
    ), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- public.psico_get_public_link(text) (from 20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql)
CREATE OR REPLACE FUNCTION public.psico_get_public_link(_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.psico_get_public_link(_token) $$;

-- private.psico_submit_resposta(text, jsonb) (from 20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql)
CREATE OR REPLACE FUNCTION private.psico_submit_resposta(_token text, _payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_link record; v_id uuid; v_funcao_id uuid; v_contrato_id uuid;
BEGIN
  SELECT id, empresa_id, ativo, avaliacao_id, contrato_id INTO v_link FROM public.psico_links WHERE token=_token;
  IF NOT FOUND OR NOT v_link.ativo THEN RETURN jsonb_build_object('error', 'Link inválido'); END IF;
  v_contrato_id := COALESCE(NULLIF(_payload->>'contrato_id','')::uuid, v_link.contrato_id);
  IF v_contrato_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id=v_contrato_id AND c.empresa_id=v_link.empresa_id) THEN
      RETURN jsonb_build_object('error', 'Contrato inválido');
    END IF;
    SELECT f.id INTO v_funcao_id FROM public.funcoes f JOIN public.setores s ON s.id=f.setor_id
    WHERE s.contrato_id=v_contrato_id AND lower(trim(f.nome_funcao))=lower(trim(_payload->>'funcao_nome')) LIMIT 1;
  END IF;
  INSERT INTO public.psico_respostas (link_id, empresa_id, contrato_id, contrato_nome, funcao_id, funcao_nome, colaborador_nome, data_avaliacao, respostas, blocos, alertas, resultado_psicossocial, riscos_psicossociais, total_positivas, total_negativas, copsoq_resultado_resumido, copsoq_riscos_identificados, avaliacao_id)
  VALUES (v_link.id, v_link.empresa_id, v_contrato_id, _payload->>'contrato_nome', v_funcao_id, _payload->>'funcao_nome', _payload->>'colaborador_nome', COALESCE((_payload->>'data_avaliacao')::date,CURRENT_DATE), COALESCE(_payload->'respostas','{}'::jsonb), COALESCE(_payload->'blocos','{}'::jsonb), COALESCE(_payload->'alertas','{}'::jsonb), _payload->>'resultado_psicossocial', _payload->>'riscos_psicossociais', COALESCE((_payload->>'total_positivas')::int,0), COALESCE((_payload->>'total_negativas')::int,0), _payload->>'copsoq_resultado_resumido', _payload->>'copsoq_riscos_identificados', v_link.avaliacao_id)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id',v_id,'ok',true);
END;
$$;

-- public.psico_submit_resposta(text, jsonb) (from 20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql)
CREATE OR REPLACE FUNCTION public.psico_submit_resposta(_token text, _payload jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.psico_submit_resposta(_token, _payload) $$;

-- public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) (from 20260910225228_0ee73e35-6255-4e7c-a4aa-31eb70387a76.sql)
CREATE OR REPLACE FUNCTION public.sync_ltcat_avaliacoes(
  _documento_id uuid,
  _empresa_id uuid,
  _tipo_documento text,
  _avaliacoes jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_av jsonb;
  v_id uuid;
  v_keep_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  IF _documento_id IS NULL OR _empresa_id IS NULL THEN
    RAISE EXCEPTION 'Documento e empresa são obrigatórios';
  END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN
    RAISE EXCEPTION 'Tipo de documento inválido';
  END IF;
  IF jsonb_typeof(COALESCE(_avaliacoes, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Avaliações devem ser uma lista';
  END IF;

  FOR v_av IN SELECT value FROM jsonb_array_elements(COALESCE(_avaliacoes, '[]'::jsonb))
  LOOP
    v_id := (v_av->>'id')::uuid;
    v_keep_ids := array_append(v_keep_ids, v_id);

    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador,
      tipo_avaliacao, tipo_agente, agente_id, tecnica_id, equipamento_id,
      resultado, unidade_resultado_id, limite_tolerancia, unidade_limite_id,
      codigo_esocial, descricao_esocial, propagacao, tipo_exposicao,
      fonte_geradora, danos_saude, medidas_controle, parecer_tecnico,
      aposentadoria_especial, data_avaliacao, funcoes_ges, tempo_coleta,
      unidade_tempo_coleta, tipo_documento
    ) VALUES (
      v_id, _documento_id, _empresa_id,
      NULLIF(v_av->>'contrato_id','')::uuid,
      NULLIF(v_av->>'setor_id','')::uuid,
      NULLIF(v_av->>'funcao_id','')::uuid,
      NULLIF(v_av->>'colaborador',''),
      NULLIF(v_av->>'tipo_avaliacao',''), NULLIF(v_av->>'tipo_agente',''),
      NULLIF(v_av->>'agente_id','')::uuid,
      NULLIF(v_av->>'tecnica_id','')::uuid,
      NULLIF(v_av->>'equipamento_id','')::uuid,
      NULLIF(v_av->>'resultado','')::numeric,
      NULLIF(v_av->>'unidade_resultado_id','')::uuid,
      NULLIF(v_av->>'limite_tolerancia','')::numeric,
      NULLIF(v_av->>'unidade_limite_id','')::uuid,
      NULLIF(v_av->>'codigo_esocial',''), NULLIF(v_av->>'descricao_esocial',''),
      CASE WHEN jsonb_typeof(v_av->'propagacao') = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(v_av->'propagacao')) ELSE NULLIF(v_av->>'propagacao','')::text[] END,
      NULLIF(v_av->>'tipo_exposicao',''), NULLIF(v_av->>'fonte_geradora',''),
      NULLIF(v_av->>'danos_saude',''), NULLIF(v_av->>'medidas_controle',''),
      NULLIF(v_av->>'parecer_tecnico',''), NULLIF(v_av->>'aposentadoria_especial',''),
      NULLIF(v_av->>'data_avaliacao','')::date, NULLIF(v_av->>'funcoes_ges',''),
      NULLIF(v_av->>'tempo_coleta',''), NULLIF(v_av->>'unidade_tempo_coleta',''),
      _tipo_documento
    )
    ON CONFLICT (id) DO UPDATE SET
      documento_id = EXCLUDED.documento_id, empresa_id = EXCLUDED.empresa_id,
      contrato_id = EXCLUDED.contrato_id, setor_id = EXCLUDED.setor_id,
      funcao_id = EXCLUDED.funcao_id, colaborador = EXCLUDED.colaborador,
      tipo_avaliacao = EXCLUDED.tipo_avaliacao, tipo_agente = EXCLUDED.tipo_agente,
      agente_id = EXCLUDED.agente_id, tecnica_id = EXCLUDED.tecnica_id,
      equipamento_id = EXCLUDED.equipamento_id, resultado = EXCLUDED.resultado,
      unidade_resultado_id = EXCLUDED.unidade_resultado_id,
      limite_tolerancia = EXCLUDED.limite_tolerancia,
      unidade_limite_id = EXCLUDED.unidade_limite_id,
      codigo_esocial = EXCLUDED.codigo_esocial, descricao_esocial = EXCLUDED.descricao_esocial,
      propagacao = EXCLUDED.propagacao, tipo_exposicao = EXCLUDED.tipo_exposicao,
      fonte_geradora = EXCLUDED.fonte_geradora, danos_saude = EXCLUDED.danos_saude,
      medidas_controle = EXCLUDED.medidas_controle, parecer_tecnico = EXCLUDED.parecer_tecnico,
      aposentadoria_especial = EXCLUDED.aposentadoria_especial,
      data_avaliacao = EXCLUDED.data_avaliacao, funcoes_ges = EXCLUDED.funcoes_ges,
      tempo_coleta = EXCLUDED.tempo_coleta,
      unidade_tempo_coleta = EXCLUDED.unidade_tempo_coleta,
      tipo_documento = EXCLUDED.tipo_documento;

    DELETE FROM public.ltcat_av_componentes WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_componentes (
      id, avaliacao_id, ordem, componente, cas, resultado, unidade_resultado_id,
      limite_tolerancia, unidade_limite_id, tempo_coleta, unidade_tempo_coleta,
      dose_percentual, situacao, cod_gfip, colaborador, funcao_id, data_avaliacao,
      descricao_avaliacao, parecer_tecnico, aposentadoria_especial,
      numero_serie_bomba, amostrador, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'componente',''), NULLIF(x->>'cas',''), NULLIF(x->>'resultado','')::numeric,
      NULLIF(x->>'unidade_resultado_id','')::uuid, NULLIF(x->>'limite_tolerancia','')::numeric,
      NULLIF(x->>'unidade_limite_id','')::uuid, NULLIF(x->>'tempo_coleta',''),
      NULLIF(x->>'unidade_tempo_coleta',''), NULLIF(x->>'dose_percentual','')::numeric,
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''), NULLIF(x->>'colaborador',''),
      NULLIF(x->>'funcao_id','')::uuid, NULLIF(x->>'data_avaliacao','')::date,
      NULLIF(x->>'descricao_avaliacao',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'numero_serie_bomba',''),
      NULLIF(x->>'amostrador',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'componentes','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_calor WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_calor (
      id, avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao,
      ibutg_medido, ibutg_limite, m_kcal_h, tipo_atividade, taxa_metabolica,
      descricao_atividade, situacao, cod_gfip, parecer_tecnico,
      aposentadoria_especial, local_atividade, equipamento_id, tempo_exposicao,
      ibutg_tipo, tbn_valores, tg_valores, tbs_valores, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'ibutg_medido','')::numeric,
      NULLIF(x->>'ibutg_limite','')::numeric, NULLIF(x->>'m_kcal_h','')::numeric,
      NULLIF(x->>'tipo_atividade',''), NULLIF(x->>'taxa_metabolica',''),
      NULLIF(x->>'descricao_atividade',''), NULLIF(x->>'situacao',''),
      NULLIF(x->>'cod_gfip',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'local_atividade',''),
      NULLIF(x->>'equipamento_id','')::uuid, NULLIF(x->>'tempo_exposicao',''),
      NULLIF(x->>'ibutg_tipo',''), NULLIF(x->>'tbn_valores',''),
      NULLIF(x->>'tg_valores',''), NULLIF(x->>'tbs_valores',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'calor','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_vibracao WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_vibracao (
      id, avaliacao_id, ordem, tipo, colaborador, funcao_id, data_avaliacao,
      aren, vdvr, aren_limite, vdvr_limite, tempo_exposicao, situacao,
      cod_gfip, parecer_tecnico, aposentadoria_especial, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'tipo',''), NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'aren','')::numeric,
      NULLIF(x->>'vdvr','')::numeric, NULLIF(x->>'aren_limite','')::numeric,
      NULLIF(x->>'vdvr_limite','')::numeric, NULLIF(x->>'tempo_exposicao',''),
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''),
      NULLIF(x->>'parecer_tecnico',''), NULLIF(x->>'aposentadoria_especial',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'vibracao','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_resultados WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_resultados (
      id, avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao, resultado,
      unidade_resultado_id, limite_tolerancia, unidade_limite_id, tempo_coleta,
      unidade_tempo_coleta, dose_percentual, situacao, cod_gfip,
      descricao_avaliacao, parecer_tecnico, aposentadoria_especial,
      equipamento_registro_id, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'resultado','')::numeric,
      NULLIF(x->>'unidade_resultado_id','')::uuid, NULLIF(x->>'limite_tolerancia','')::numeric,
      NULLIF(x->>'unidade_limite_id','')::uuid, NULLIF(x->>'tempo_coleta',''),
      NULLIF(x->>'unidade_tempo_coleta',''), NULLIF(x->>'dose_percentual','')::numeric,
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''),
      NULLIF(x->>'descricao_avaliacao',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'equipamento_registro_id','')::uuid,
      _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'resultados','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_equipamentos WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_equipamentos (
      id, avaliacao_id, ordem, nome_equipamento, modelo_equipamento,
      serie_equipamento, data_calibracao, data_avaliacao, agente_nome,
      tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'nome_equipamento',''), NULLIF(x->>'modelo_equipamento',''),
      NULLIF(x->>'serie_equipamento',''), NULLIF(x->>'data_calibracao','')::date,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'agente_nome',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'equipamentos','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_epi_epc WHERE avaliacao_id = v_id;
    IF COALESCE(v_av->'epi_epc', '{}'::jsonb) <> '{}'::jsonb THEN
      INSERT INTO public.ltcat_av_epi_epc (
        id, avaliacao_id, epi_id, epi_ca, epi_atenuacao, epi_eficaz,
        epc_id, epc_eficaz, tipo_documento
      ) VALUES (
        COALESCE(NULLIF(v_av->'epi_epc'->>'id','')::uuid, gen_random_uuid()), v_id,
        NULLIF(v_av->'epi_epc'->>'epi_id','')::uuid,
        NULLIF(v_av->'epi_epc'->>'epi_ca',''), NULLIF(v_av->'epi_epc'->>'epi_atenuacao',''),
        NULLIF(v_av->'epi_epc'->>'epi_eficaz',''),
        NULLIF(v_av->'epi_epc'->>'epc_id','')::uuid,
        NULLIF(v_av->'epi_epc'->>'epc_eficaz',''), _tipo_documento
      );
    END IF;
  END LOOP;

  DELETE FROM public.ltcat_avaliacoes
  WHERE documento_id = _documento_id
    AND NOT (id = ANY(v_keep_ids));

  RETURN jsonb_build_object('ok', true, 'count', cardinality(v_keep_ids));
END;
$$;

-- public.update_shared_record(text, uuid, bigint, jsonb) (from 20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql)
CREATE OR REPLACE FUNCTION public.update_shared_record(
  _table_name text,
  _record_id uuid,
  _expected_version bigint,
  _patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF _table_name NOT IN ('empresas','contratos','setores','funcoes','riscos','documentos','aet_documentos','aep_documentos','pcmso_documentos') THEN
    RAISE EXCEPTION 'Tabela não permitida';
  END IF;
  IF _patch ?| ARRAY['id','row_version','last_modified_by','created_at','updated_at'] THEN
    RAISE EXCEPTION 'Campos de controle não podem ser alterados';
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET %s WHERE id = $1 AND row_version = $2 RETURNING to_jsonb(%I.*)',
    _table_name,
    (SELECT string_agg(format('%I = ($3->>%L)::%s', c.column_name, c.column_name, c.udt_name), ', ')
       FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = _table_name
        AND c.column_name IN (SELECT jsonb_object_keys(_patch))
        AND c.column_name NOT IN ('id','row_version','last_modified_by','created_at','updated_at')),
    _table_name
  ) INTO v_result USING _record_id, _expected_version, _patch;

  IF v_result IS NULL THEN
    EXECUTE format('SELECT to_jsonb(t.*) FROM public.%I t WHERE id = $1', _table_name)
      INTO v_result USING _record_id;
    RETURN jsonb_build_object('ok', false, 'conflict', true, 'current', v_result);
  END IF;

  RETURN jsonb_build_object('ok', true, 'conflict', false, 'record', v_result);
END;
$$;

-- public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) (from 20260919140817_9532b266-5c7d-41e1-943f-61ab71876a15.sql)
CREATE OR REPLACE FUNCTION public.save_ltcat_documento_v2(
  _documento_id uuid,
  _empresa_id uuid,
  _tipo_documento text,
  _expected_row_version bigint,
  _document_patch jsonb,
  _avaliacoes jsonb,
  _delete_avaliacao_ids uuid[],
  _delete_child_ids jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_av jsonb;
  v_child jsonb;
  v_id uuid;
  v_current_version bigint;
  v_new_version bigint;
  v_count integer := 0;
  v_deleted integer := 0;
  v_deleted_children integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501'; END IF;
  IF _documento_id IS NULL OR _empresa_id IS NULL THEN RAISE EXCEPTION 'Documento e empresa são obrigatórios'; END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN RAISE EXCEPTION 'Tipo de documento inválido'; END IF;
  IF jsonb_typeof(COALESCE(_avaliacoes, '[]'::jsonb)) <> 'array' THEN RAISE EXCEPTION 'Avaliações devem ser uma lista'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_documento_id::text, 0));
  SELECT d.row_version INTO v_current_version FROM public.documentos d
   WHERE d.id = _documento_id AND d.empresa_id = _empresa_id AND lower(d.tipo) = _tipo_documento FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Documento não encontrado ou incompatível' USING ERRCODE = '42501'; END IF;
  IF _expected_row_version IS NULL OR v_current_version <> _expected_row_version THEN
    RETURN jsonb_build_object('ok', false, 'conflict', true, 'current_row_version', v_current_version);
  END IF;

  FOR v_av IN SELECT value FROM jsonb_array_elements(COALESCE(_avaliacoes, '[]'::jsonb)) LOOP
    v_id := NULLIF(v_av->>'id', '')::uuid;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Toda avaliação deve possuir identificador'; END IF;
    IF EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id = v_id AND a.documento_id <> _documento_id) THEN
      RAISE EXCEPTION 'Identificador de avaliação pertence a outro documento';
    END IF;
    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador, tipo_avaliacao, tipo_agente,
      agente_id, tecnica_id, equipamento_id, resultado, unidade_resultado_id, limite_tolerancia, unidade_limite_id,
      codigo_esocial, descricao_esocial, propagacao, tipo_exposicao, fonte_geradora, danos_saude, medidas_controle,
      parecer_tecnico, aposentadoria_especial, data_avaliacao, funcoes_ges, tempo_coleta, unidade_tempo_coleta,
      tipo_documento, ficha_tecnica_resultado_id, created_by
    ) VALUES (
      v_id, _documento_id, _empresa_id, NULLIF(v_av->>'contrato_id','')::uuid, NULLIF(v_av->>'setor_id','')::uuid,
      NULLIF(v_av->>'funcao_id','')::uuid, NULLIF(v_av->>'colaborador',''), NULLIF(v_av->>'tipo_avaliacao',''),
      NULLIF(v_av->>'tipo_agente',''), NULLIF(v_av->>'agente_id','')::uuid, NULLIF(v_av->>'tecnica_id','')::uuid,
      NULLIF(v_av->>'equipamento_id','')::uuid, NULLIF(v_av->>'resultado','')::numeric,
      NULLIF(v_av->>'unidade_resultado_id','')::uuid, NULLIF(v_av->>'limite_tolerancia','')::numeric,
      NULLIF(v_av->>'unidade_limite_id','')::uuid, NULLIF(v_av->>'codigo_esocial',''), NULLIF(v_av->>'descricao_esocial',''),
      CASE WHEN jsonb_typeof(v_av->'propagacao')='array' THEN ARRAY(SELECT jsonb_array_elements_text(v_av->'propagacao')) ELSE NULLIF(v_av->>'propagacao','')::text[] END,
      NULLIF(v_av->>'tipo_exposicao',''), NULLIF(v_av->>'fonte_geradora',''), NULLIF(v_av->>'danos_saude',''),
      NULLIF(v_av->>'medidas_controle',''), NULLIF(v_av->>'parecer_tecnico',''), NULLIF(v_av->>'aposentadoria_especial',''),
      NULLIF(v_av->>'data_avaliacao','')::date, NULLIF(v_av->>'funcoes_ges',''), NULLIF(v_av->>'tempo_coleta',''),
      NULLIF(v_av->>'unidade_tempo_coleta',''), _tipo_documento, NULLIF(v_av->>'ficha_tecnica_resultado_id','')::uuid, auth.uid()
    ) ON CONFLICT (id) DO UPDATE SET
      contrato_id=EXCLUDED.contrato_id, setor_id=EXCLUDED.setor_id, funcao_id=EXCLUDED.funcao_id,
      colaborador=EXCLUDED.colaborador, tipo_avaliacao=EXCLUDED.tipo_avaliacao, tipo_agente=EXCLUDED.tipo_agente,
      agente_id=EXCLUDED.agente_id, tecnica_id=EXCLUDED.tecnica_id, equipamento_id=EXCLUDED.equipamento_id,
      resultado=EXCLUDED.resultado, unidade_resultado_id=EXCLUDED.unidade_resultado_id,
      limite_tolerancia=EXCLUDED.limite_tolerancia, unidade_limite_id=EXCLUDED.unidade_limite_id,
      codigo_esocial=EXCLUDED.codigo_esocial, descricao_esocial=EXCLUDED.descricao_esocial, propagacao=EXCLUDED.propagacao,
      tipo_exposicao=EXCLUDED.tipo_exposicao, fonte_geradora=EXCLUDED.fonte_geradora, danos_saude=EXCLUDED.danos_saude,
      medidas_controle=EXCLUDED.medidas_controle, parecer_tecnico=EXCLUDED.parecer_tecnico,
      aposentadoria_especial=EXCLUDED.aposentadoria_especial, data_avaliacao=EXCLUDED.data_avaliacao,
      funcoes_ges=EXCLUDED.funcoes_ges, tempo_coleta=EXCLUDED.tempo_coleta,
      unidade_tempo_coleta=EXCLUDED.unidade_tempo_coleta, tipo_documento=EXCLUDED.tipo_documento,
      ficha_tecnica_resultado_id=EXCLUDED.ficha_tecnica_resultado_id
    WHERE public.ltcat_avaliacoes.documento_id = _documento_id;

    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'componentes','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_componentes (id,avaliacao_id,ordem,componente,cas,resultado,unidade_resultado_id,limite_tolerancia,unidade_limite_id,tempo_coleta,unidade_tempo_coleta,dose_percentual,situacao,cod_gfip,colaborador,funcao_id,data_avaliacao,descricao_avaliacao,parecer_tecnico,aposentadoria_especial,numero_serie_bomba,amostrador,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'componente',''),NULLIF(v_child->>'cas',''),NULLIF(v_child->>'resultado','')::numeric,NULLIF(v_child->>'unidade_resultado_id','')::uuid,NULLIF(v_child->>'limite_tolerancia','')::numeric,NULLIF(v_child->>'unidade_limite_id','')::uuid,NULLIF(v_child->>'tempo_coleta',''),NULLIF(v_child->>'unidade_tempo_coleta',''),NULLIF(v_child->>'dose_percentual','')::numeric,NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'descricao_avaliacao',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),NULLIF(v_child->>'numero_serie_bomba',''),NULLIF(v_child->>'amostrador',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,componente=EXCLUDED.componente,cas=EXCLUDED.cas,resultado=EXCLUDED.resultado,unidade_resultado_id=EXCLUDED.unidade_resultado_id,limite_tolerancia=EXCLUDED.limite_tolerancia,unidade_limite_id=EXCLUDED.unidade_limite_id,tempo_coleta=EXCLUDED.tempo_coleta,unidade_tempo_coleta=EXCLUDED.unidade_tempo_coleta,dose_percentual=EXCLUDED.dose_percentual,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,descricao_avaliacao=EXCLUDED.descricao_avaliacao,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,numero_serie_bomba=EXCLUDED.numero_serie_bomba,amostrador=EXCLUDED.amostrador,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_componentes.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'calor','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_calor (id,avaliacao_id,ordem,colaborador,funcao_id,data_avaliacao,ibutg_medido,ibutg_limite,m_kcal_h,tipo_atividade,taxa_metabolica,descricao_atividade,situacao,cod_gfip,parecer_tecnico,aposentadoria_especial,local_atividade,equipamento_id,tempo_exposicao,ibutg_tipo,tbn_valores,tg_valores,tbs_valores,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'ibutg_medido','')::numeric,NULLIF(v_child->>'ibutg_limite','')::numeric,NULLIF(v_child->>'m_kcal_h','')::numeric,NULLIF(v_child->>'tipo_atividade',''),NULLIF(v_child->>'taxa_metabolica',''),NULLIF(v_child->>'descricao_atividade',''),NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),NULLIF(v_child->>'local_atividade',''),NULLIF(v_child->>'equipamento_id','')::uuid,NULLIF(v_child->>'tempo_exposicao',''),NULLIF(v_child->>'ibutg_tipo',''),NULLIF(v_child->>'tbn_valores',''),NULLIF(v_child->>'tg_valores',''),NULLIF(v_child->>'tbs_valores',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,ibutg_medido=EXCLUDED.ibutg_medido,ibutg_limite=EXCLUDED.ibutg_limite,m_kcal_h=EXCLUDED.m_kcal_h,tipo_atividade=EXCLUDED.tipo_atividade,taxa_metabolica=EXCLUDED.taxa_metabolica,descricao_atividade=EXCLUDED.descricao_atividade,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,local_atividade=EXCLUDED.local_atividade,equipamento_id=EXCLUDED.equipamento_id,tempo_exposicao=EXCLUDED.tempo_exposicao,ibutg_tipo=EXCLUDED.ibutg_tipo,tbn_valores=EXCLUDED.tbn_valores,tg_valores=EXCLUDED.tg_valores,tbs_valores=EXCLUDED.tbs_valores,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_calor.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'vibracao','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_vibracao (id,avaliacao_id,ordem,tipo,colaborador,funcao_id,data_avaliacao,aren,vdvr,aren_limite,vdvr_limite,tempo_exposicao,situacao,cod_gfip,parecer_tecnico,aposentadoria_especial,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'tipo',''),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'aren','')::numeric,NULLIF(v_child->>'vdvr','')::numeric,NULLIF(v_child->>'aren_limite','')::numeric,NULLIF(v_child->>'vdvr_limite','')::numeric,NULLIF(v_child->>'tempo_exposicao',''),NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,tipo=EXCLUDED.tipo,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,aren=EXCLUDED.aren,vdvr=EXCLUDED.vdvr,aren_limite=EXCLUDED.aren_limite,vdvr_limite=EXCLUDED.vdvr_limite,tempo_exposicao=EXCLUDED.tempo_exposicao,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_vibracao.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'resultados','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_resultados (id,avaliacao_id,ordem,colaborador,funcao_id,data_avaliacao,resultado,unidade_resultado_id,limite_tolerancia,unidade_limite_id,tempo_coleta,unidade_tempo_coleta,dose_percentual,situacao,cod_gfip,descricao_avaliacao,parecer_tecnico,aposentadoria_especial,equipamento_registro_id,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'resultado','')::numeric,NULLIF(v_child->>'unidade_resultado_id','')::uuid,NULLIF(v_child->>'limite_tolerancia','')::numeric,NULLIF(v_child->>'unidade_limite_id','')::uuid,NULLIF(v_child->>'tempo_coleta',''),NULLIF(v_child->>'unidade_tempo_coleta',''),NULLIF(v_child->>'dose_percentual','')::numeric,NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'descricao_avaliacao',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),NULLIF(v_child->>'equipamento_registro_id','')::uuid,_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,resultado=EXCLUDED.resultado,unidade_resultado_id=EXCLUDED.unidade_resultado_id,limite_tolerancia=EXCLUDED.limite_tolerancia,unidade_limite_id=EXCLUDED.unidade_limite_id,tempo_coleta=EXCLUDED.tempo_coleta,unidade_tempo_coleta=EXCLUDED.unidade_tempo_coleta,dose_percentual=EXCLUDED.dose_percentual,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,descricao_avaliacao=EXCLUDED.descricao_avaliacao,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,equipamento_registro_id=EXCLUDED.equipamento_registro_id,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_resultados.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'equipamentos','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_equipamentos (id,avaliacao_id,ordem,nome_equipamento,modelo_equipamento,serie_equipamento,data_calibracao,data_avaliacao,agente_nome,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'nome_equipamento',''),NULLIF(v_child->>'modelo_equipamento',''),NULLIF(v_child->>'serie_equipamento',''),NULLIF(v_child->>'data_calibracao','')::date,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'agente_nome',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,nome_equipamento=EXCLUDED.nome_equipamento,modelo_equipamento=EXCLUDED.modelo_equipamento,serie_equipamento=EXCLUDED.serie_equipamento,data_calibracao=EXCLUDED.data_calibracao,data_avaliacao=EXCLUDED.data_avaliacao,agente_nome=EXCLUDED.agente_nome,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_equipamentos.avaliacao_id=v_id;
    END LOOP;
    IF COALESCE(v_av->'epi_epc','{}'::jsonb) <> '{}'::jsonb THEN
      INSERT INTO public.ltcat_av_epi_epc (id,avaliacao_id,epi_id,epi_ca,epi_atenuacao,epi_eficaz,epc_id,epc_eficaz,tipo_documento)
      VALUES (COALESCE(NULLIF(v_av->'epi_epc'->>'id','')::uuid,gen_random_uuid()),v_id,NULLIF(v_av->'epi_epc'->>'epi_id','')::uuid,NULLIF(v_av->'epi_epc'->>'epi_ca',''),NULLIF(v_av->'epi_epc'->>'epi_atenuacao',''),NULLIF(v_av->'epi_epc'->>'epi_eficaz',''),NULLIF(v_av->'epi_epc'->>'epc_id','')::uuid,NULLIF(v_av->'epi_epc'->>'epc_eficaz',''),_tipo_documento)
      ON CONFLICT (avaliacao_id) DO UPDATE SET epi_id=EXCLUDED.epi_id,epi_ca=EXCLUDED.epi_ca,epi_atenuacao=EXCLUDED.epi_atenuacao,epi_eficaz=EXCLUDED.epi_eficaz,epc_id=EXCLUDED.epc_id,epc_eficaz=EXCLUDED.epc_eficaz,tipo_documento=EXCLUDED.tipo_documento;
    END IF;
    v_count := v_count + 1;
  END LOOP;

  DELETE FROM public.ltcat_av_componentes c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'componentes','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id); GET DIAGNOSTICS v_deleted_children = ROW_COUNT;
  DELETE FROM public.ltcat_av_calor c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'calor','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_vibracao c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'vibracao','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_resultados c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'resultados','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_equipamentos c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'equipamentos','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_epi_epc c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'epi_epc','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_avaliacoes a WHERE a.documento_id=_documento_id AND a.id=ANY(COALESCE(_delete_avaliacao_ids,ARRAY[]::uuid[])); GET DIAGNOSTICS v_deleted = ROW_COUNT;

  UPDATE public.documentos d SET
    empresa_id = CASE WHEN _document_patch ? 'empresa_id' THEN NULLIF(_document_patch->>'empresa_id','')::uuid ELSE d.empresa_id END,
    empresa_nome = CASE WHEN _document_patch ? 'empresa_nome' THEN COALESCE(NULLIF(_document_patch->>'empresa_nome',''),d.empresa_nome) ELSE d.empresa_nome END,
    contrato_id = CASE WHEN _document_patch ? 'contrato_id' THEN NULLIF(_document_patch->>'contrato_id','')::uuid ELSE d.contrato_id END,
    template_id = CASE WHEN _document_patch ? 'template_id' THEN NULLIF(_document_patch->>'template_id','')::uuid ELSE d.template_id END,
    responsavel_tecnico = CASE WHEN _document_patch ? 'responsavel_tecnico' THEN NULLIF(_document_patch->>'responsavel_tecnico','') ELSE d.responsavel_tecnico END,
    crea = CASE WHEN _document_patch ? 'crea' THEN NULLIF(_document_patch->>'crea','') ELSE d.crea END,
    cargo = CASE WHEN _document_patch ? 'cargo' THEN NULLIF(_document_patch->>'cargo','') ELSE d.cargo END,
    data_elaboracao = CASE WHEN _document_patch ? 'data_elaboracao' THEN NULLIF(_document_patch->>'data_elaboracao','')::date ELSE d.data_elaboracao END,
    alteracoes_documento = CASE WHEN _document_patch ? 'alteracoes_documento' THEN NULLIF(_document_patch->>'alteracoes_documento','') ELSE d.alteracoes_documento END,
    revisoes = CASE WHEN _document_patch ? 'revisoes' THEN COALESCE(_document_patch->'revisoes','[]'::jsonb) ELSE d.revisoes END,
    current_step = CASE WHEN _document_patch ? 'current_step' THEN COALESCE((_document_patch->>'current_step')::integer,0) ELSE d.current_step END,
    draft_snapshot = CASE WHEN _document_patch ? 'draft_snapshot' THEN _document_patch->'draft_snapshot' ELSE d.draft_snapshot END,
    file_path = CASE WHEN _document_patch ? 'file_path' THEN NULLIF(_document_patch->>'file_path','') ELSE d.file_path END,
    status = CASE WHEN _document_patch ? 'status' THEN COALESCE(NULLIF(_document_patch->>'status',''),'rascunho') ELSE d.status END,
    updated_at = now()
  WHERE d.id=_documento_id AND d.row_version=_expected_row_version RETURNING d.row_version INTO v_new_version;
  IF v_new_version IS NULL THEN RAISE EXCEPTION 'Conflito de versão durante o salvamento' USING ERRCODE='40001'; END IF;
  RETURN jsonb_build_object('ok',true,'conflict',false,'count',v_count,'deleted',v_deleted,'deleted_children',v_deleted_children,'row_version',v_new_version);
END;
$$;

-- public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) (from 20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql)
CREATE OR REPLACE FUNCTION public.import_ficha_tecnica_resultados(
  _documento_id uuid,
  _empresa_id uuid,
  _contrato_id uuid,
  _tipo_documento text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_resultado public.ficha_tecnica_resultados%ROWTYPE;
  v_avaliacao_id uuid;
  v_importados integer := 0;
  v_existentes integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN
    RAISE EXCEPTION 'Tipo de documento inválido' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_documento_id::text, 0));

  IF NOT EXISTS (
    SELECT 1 FROM public.documentos d
    WHERE d.id = _documento_id AND d.empresa_id = _empresa_id
      AND d.contrato_id = _contrato_id
      AND lower(d.tipo) = CASE WHEN _tipo_documento = 'ltcat' THEN 'ltcat' ELSE 'insalubridade' END
  ) THEN
    RAISE EXCEPTION 'Documento, empresa e contrato não correspondem' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = _contrato_id AND c.empresa_id = _empresa_id) THEN
    RAISE EXCEPTION 'Contrato não pertence à empresa' USING ERRCODE = '42501';
  END IF;

  FOR v_resultado IN
    SELECT * FROM public.ficha_tecnica_resultados f
    WHERE f.empresa_id = _empresa_id AND f.contrato_id = _contrato_id
    ORDER BY f.created_at, f.id
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.ltcat_avaliacoes a
      WHERE a.documento_id = _documento_id AND a.ficha_tecnica_resultado_id = v_resultado.id
    ) THEN
      v_existentes := v_existentes + 1;
      CONTINUE;
    END IF;

    v_avaliacao_id := gen_random_uuid();
    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador,
      tipo_avaliacao, tipo_agente, agente_id, resultado, limite_tolerancia,
      dose_percentual, codigo_esocial, descricao_esocial, propagacao, tipo_exposicao,
      fonte_geradora, danos_saude, medidas_controle, parecer_tecnico,
      aposentadoria_especial, data_avaliacao, tipo_documento, created_by,
      ficha_tecnica_resultado_id
    )
    SELECT
      v_avaliacao_id, _documento_id, _empresa_id, _contrato_id,
      v_resultado.setor_id, v_resultado.funcao_id, '', 'quantitativa', r.tipo,
      v_resultado.agente_id,
      CASE
        WHEN v_resultado.tipo = 'ruido' AND _tipo_documento = 'insalubridade' THEN v_resultado.lavg
        WHEN v_resultado.tipo = 'ruido' THEN v_resultado.nen
        WHEN v_resultado.tipo = 'calor' THEN v_resultado.concentracao
        WHEN v_resultado.tipo IN ('poeira_silica','quimico_quantitativo','fumos_metalicos','vapores_organicos') THEN v_resultado.exposicao
        ELSE v_resultado.aren
      END,
      v_resultado.limite_tolerancia,
      CASE
        WHEN v_resultado.tipo = 'ruido' AND _tipo_documento = 'insalubridade' THEN v_resultado.dose_q5
        WHEN v_resultado.tipo = 'ruido' THEN v_resultado.dose_q3
        ELSE NULL
      END,
      r.codigo_esocial, r.descricao_esocial, r.propagacao, r.tipo_exposicao,
      r.fonte_geradora, r.danos_saude, r.medidas_controle, '', '',
      v_resultado.data_avaliacao, _tipo_documento, auth.uid(), v_resultado.id
    FROM public.riscos r WHERE r.id = v_resultado.agente_id;

    IF v_resultado.tipo = 'ruido' THEN
      INSERT INTO public.ltcat_av_resultados (
        avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao, resultado,
        limite_tolerancia, dose_percentual, descricao_avaliacao, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        CASE WHEN _tipo_documento = 'insalubridade' THEN v_resultado.lavg ELSE v_resultado.nen END,
        85,
        CASE WHEN _tipo_documento = 'insalubridade' THEN v_resultado.dose_q5 ELSE v_resultado.dose_q3 END,
        CASE WHEN _tipo_documento = 'insalubridade' THEN 'Critério Q5 — LAVG e Dose Q5' ELSE 'Critério Q3 — NEN e Dose Q3' END,
        '', '', _tipo_documento
      );
    ELSIF v_resultado.tipo IN ('vibracao_vci','vibracao_vmb') THEN
      INSERT INTO public.ltcat_av_vibracao (
        avaliacao_id, ordem, tipo, colaborador, funcao_id, data_avaliacao,
        aren, vdvr, aren_limite, vdvr_limite, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0,
        CASE WHEN v_resultado.tipo = 'vibracao_vci' THEN 'VCI' ELSE 'VMB' END,
        '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        v_resultado.aren, v_resultado.vdvr, v_resultado.limite_tolerancia,
        CASE WHEN v_resultado.tipo = 'vibracao_vci' THEN 21.0 ELSE NULL END,
        '', '', _tipo_documento
      );
    ELSIF v_resultado.tipo = 'calor' THEN
      INSERT INTO public.ltcat_av_calor (
        avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao,
        ibutg_medido, ibutg_limite, taxa_metabolica, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        v_resultado.concentracao, v_resultado.limite_tolerancia,
        v_resultado.taxa_metabolica, '', '', _tipo_documento
      );
    ELSE
      INSERT INTO public.ltcat_av_componentes (
        avaliacao_id, ordem, componente, resultado, limite_tolerancia,
        colaborador, funcao_id, data_avaliacao, descricao_avaliacao,
        parecer_tecnico, aposentadoria_especial, numero_serie_bomba,
        amostrador, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, v_resultado.componentes, v_resultado.exposicao,
        v_resultado.limite_tolerancia, '', v_resultado.funcao_id,
        v_resultado.data_avaliacao, '', '', '', v_resultado.amostrador_serie,
        v_resultado.amostrador, _tipo_documento
      );
    END IF;

    v_importados := v_importados + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'imported', v_importados,
    'existing', v_existentes,
    'total', v_importados + v_existentes
  );
END;
$$;

-- public.validate_ficha_tecnica_resultado() (from 20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql)
CREATE OR REPLACE FUNCTION public.validate_ficha_tecnica_resultado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
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

-- public.preserve_ficha_tecnica_origin() (from 20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql)
CREATE OR REPLACE FUNCTION public.preserve_ficha_tecnica_origin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
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

-- public.track_shared_change() (from 20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql)
CREATE OR REPLACE FUNCTION public.track_shared_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_id := OLD.id;
    INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data)
    VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.row_version := OLD.row_version + 1;
    NEW.last_modified_by := auth.uid();
    v_id := NEW.id;
    INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;

  NEW.last_modified_by := auth.uid();
  v_id := NEW.id;
  INSERT INTO public.audit_log(table_name, record_id, action, changed_by, new_data)
  VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(NEW));
  RETURN NEW;
END;
$$;

-- public.set_documento_validade() (from 20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql)
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

-- public.link_ergonomia_to_aet() (from 20260724163602_ccc65eb4-79c6-408c-9457-e071c3fc48e0.sql)
CREATE OR REPLACE FUNCTION public.link_ergonomia_to_aet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.aet_instrucoes_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epi_epc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos_ho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exames_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_conhecimento_pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcmso_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcmso_observacoes_padrao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psico_base_tecnica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riscos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tecnicas_amostragem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamentos_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epi_epc_riscos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos_ho_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_conhecimento_arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_pareceres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pareceres_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formularios_aep ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psico_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aep_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aet_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psico_indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psico_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psico_relatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ergonomia_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ficha_tecnica_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psico_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_av_calor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_av_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_av_epi_epc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_av_equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_av_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_av_vibracao ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES (final authenticated patterns)
-- =============================================================================

-- public.aep_documentos / Authenticated can delete aep
CREATE POLICY "Authenticated can delete aep" ON public.aep_documentos FOR DELETE TO authenticated USING (true);

-- public.aep_documentos / Authenticated can insert aep
CREATE POLICY "Authenticated can insert aep" ON public.aep_documentos FOR INSERT TO authenticated WITH CHECK (true);

-- public.aep_documentos / Authenticated can update aep
CREATE POLICY "Authenticated can update aep" ON public.aep_documentos FOR UPDATE TO authenticated USING (true);

-- public.aep_documentos / Authenticated can view aep
CREATE POLICY "Authenticated can view aep" ON public.aep_documentos FOR SELECT TO authenticated USING (true);

-- public.aet_documentos / Authenticated can delete aet_documentos
CREATE POLICY "Authenticated can delete aet_documentos"
  ON public.aet_documentos FOR DELETE TO authenticated USING (true);

-- public.aet_documentos / Authenticated can insert aet_documentos
CREATE POLICY "Authenticated can insert aet_documentos"
  ON public.aet_documentos FOR INSERT TO authenticated WITH CHECK (true);

-- public.aet_documentos / Authenticated can update aet_documentos
CREATE POLICY "Authenticated can update aet_documentos"
  ON public.aet_documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.aet_documentos / Authenticated can view aet_documentos
CREATE POLICY "Authenticated can view aet_documentos"
  ON public.aet_documentos FOR SELECT TO authenticated USING (true);

-- public.aet_instrucoes_usuario / user manage own aet instrucoes
CREATE POLICY "user manage own aet instrucoes" ON public.aet_instrucoes_usuario
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- public.audit_log / Admins can view audit log
CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- public.contratos / Authenticated can delete contratos
CREATE POLICY "Authenticated can delete contratos" ON public.contratos FOR DELETE TO authenticated USING (true);

-- public.contratos / Authenticated can insert contratos
CREATE POLICY "Authenticated can insert contratos" ON public.contratos FOR INSERT TO authenticated WITH CHECK (true);

-- public.contratos / Authenticated can update contratos
CREATE POLICY "Authenticated can update contratos" ON public.contratos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.contratos / Authenticated can view contratos
CREATE POLICY "Authenticated can view contratos" ON public.contratos FOR SELECT TO authenticated USING (true);

-- public.documentos / Authenticated can delete documentos
CREATE POLICY "Authenticated can delete documentos" ON public.documentos FOR DELETE TO authenticated USING (true);

-- public.documentos / Authenticated can insert documentos
CREATE POLICY "Authenticated can insert documentos" ON public.documentos FOR INSERT TO authenticated WITH CHECK (true);

-- public.documentos / Authenticated can update documentos
CREATE POLICY "Authenticated can update documentos" ON public.documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.documentos / Authenticated can view documentos
CREATE POLICY "Authenticated can view documentos" ON public.documentos FOR SELECT TO authenticated USING (true);

-- public.empresa_contatos / Authenticated can delete empresa_contatos
CREATE POLICY "Authenticated can delete empresa_contatos" ON public.empresa_contatos FOR DELETE TO authenticated USING (true);

-- public.empresa_contatos / Authenticated can insert empresa_contatos
CREATE POLICY "Authenticated can insert empresa_contatos" ON public.empresa_contatos FOR INSERT TO authenticated WITH CHECK (true);

-- public.empresa_contatos / Authenticated can update empresa_contatos
CREATE POLICY "Authenticated can update empresa_contatos" ON public.empresa_contatos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.empresa_contatos / Authenticated can view empresa_contatos
CREATE POLICY "Authenticated can view empresa_contatos" ON public.empresa_contatos FOR SELECT TO authenticated USING (true);

-- public.empresas / Admins can delete empresas
CREATE POLICY "Admins can delete empresas" ON public.empresas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- public.empresas / Authenticated can insert empresas
CREATE POLICY "Authenticated can insert empresas" ON public.empresas FOR INSERT TO authenticated WITH CHECK (true);

-- public.empresas / Authenticated can update empresas
CREATE POLICY "Authenticated can update empresas" ON public.empresas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.empresas / Authenticated can view empresas
CREATE POLICY "Authenticated can view empresas" ON public.empresas FOR SELECT TO authenticated USING (true);

-- public.epi_epc / Authenticated can delete epi_epc
CREATE POLICY "Authenticated can delete epi_epc" ON public.epi_epc FOR DELETE TO authenticated USING (true);

-- public.epi_epc / Authenticated can insert epi_epc
CREATE POLICY "Authenticated can insert epi_epc" ON public.epi_epc FOR INSERT TO authenticated WITH CHECK (true);

-- public.epi_epc / Authenticated can update epi_epc
CREATE POLICY "Authenticated can update epi_epc" ON public.epi_epc FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.epi_epc / Authenticated can view epi_epc
CREATE POLICY "Authenticated can view epi_epc" ON public.epi_epc FOR SELECT TO authenticated USING (true);

-- public.epi_epc_riscos / Authenticated can delete epi_epc_riscos
CREATE POLICY "Authenticated can delete epi_epc_riscos" ON public.epi_epc_riscos FOR DELETE TO authenticated USING (true);

-- public.epi_epc_riscos / Authenticated can insert epi_epc_riscos
CREATE POLICY "Authenticated can insert epi_epc_riscos" ON public.epi_epc_riscos FOR INSERT TO authenticated WITH CHECK (true);

-- public.epi_epc_riscos / Authenticated can view epi_epc_riscos
CREATE POLICY "Authenticated can view epi_epc_riscos" ON public.epi_epc_riscos FOR SELECT TO authenticated USING (true);

-- public.equipamentos_avaliacao / Authenticated can delete equipamentos_avaliacao
CREATE POLICY "Authenticated can delete equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR DELETE TO authenticated USING (true);

-- public.equipamentos_avaliacao / Authenticated can insert equipamentos_avaliacao
CREATE POLICY "Authenticated can insert equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR INSERT TO authenticated WITH CHECK (true);

-- public.equipamentos_avaliacao / Authenticated can update equipamentos_avaliacao
CREATE POLICY "Authenticated can update equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.equipamentos_avaliacao / Authenticated can view equipamentos_avaliacao
CREATE POLICY "Authenticated can view equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR SELECT TO authenticated USING (true);

-- public.equipamentos_ho / Authenticated can delete equipamentos_ho
CREATE POLICY "Authenticated can delete equipamentos_ho" ON public.equipamentos_ho FOR DELETE TO authenticated USING (true);

-- public.equipamentos_ho / Authenticated can insert equipamentos_ho
CREATE POLICY "Authenticated can insert equipamentos_ho" ON public.equipamentos_ho FOR INSERT TO authenticated WITH CHECK (true);

-- public.equipamentos_ho / Authenticated can update equipamentos_ho
CREATE POLICY "Authenticated can update equipamentos_ho" ON public.equipamentos_ho FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.equipamentos_ho / Authenticated can view equipamentos_ho
CREATE POLICY "Authenticated can view equipamentos_ho" ON public.equipamentos_ho FOR SELECT TO authenticated USING (true);

-- public.equipamentos_ho_registros / Authenticated can delete equipamentos_ho_registros
CREATE POLICY "Authenticated can delete equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR DELETE TO authenticated USING (true);

-- public.equipamentos_ho_registros / Authenticated can insert equipamentos_ho_registros
CREATE POLICY "Authenticated can insert equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR INSERT TO authenticated WITH CHECK (true);

-- public.equipamentos_ho_registros / Authenticated can update equipamentos_ho_registros
CREATE POLICY "Authenticated can update equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.equipamentos_ho_registros / Authenticated can view equipamentos_ho_registros
CREATE POLICY "Authenticated can view equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR SELECT TO authenticated USING (true);

-- public.ergonomia_avaliacoes / auth_delete_ergonomia
CREATE POLICY "auth_delete_ergonomia" ON public.ergonomia_avaliacoes
  FOR DELETE TO authenticated USING (true);

-- public.ergonomia_avaliacoes / auth_select_ergonomia
CREATE POLICY "auth_select_ergonomia" ON public.ergonomia_avaliacoes
  FOR SELECT TO authenticated USING (true);

-- public.ergonomia_avaliacoes / auth_update_ergonomia
CREATE POLICY "auth_update_ergonomia" ON public.ergonomia_avaliacoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.ergonomia_avaliacoes / own_insert
CREATE POLICY "own_insert" ON public.ergonomia_avaliacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- public.exames_cadastro / Authenticated can delete exames_cadastro
CREATE POLICY "Authenticated can delete exames_cadastro" ON public.exames_cadastro FOR DELETE TO authenticated USING (true);

-- public.exames_cadastro / Authenticated can insert exames_cadastro
CREATE POLICY "Authenticated can insert exames_cadastro" ON public.exames_cadastro FOR INSERT TO authenticated WITH CHECK (true);

-- public.exames_cadastro / Authenticated can update exames_cadastro
CREATE POLICY "Authenticated can update exames_cadastro" ON public.exames_cadastro FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.exames_cadastro / Authenticated can view exames_cadastro
CREATE POLICY "Authenticated can view exames_cadastro" ON public.exames_cadastro FOR SELECT TO authenticated USING (true);

-- public.ficha_tecnica_resultados / Authenticated can delete ficha tecnica resultados
CREATE POLICY "Authenticated can delete ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR DELETE TO authenticated USING (true);

-- public.ficha_tecnica_resultados / Authenticated can insert ficha tecnica resultados
CREATE POLICY "Authenticated can insert ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- public.ficha_tecnica_resultados / Authenticated can update ficha tecnica resultados
CREATE POLICY "Authenticated can update ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.ficha_tecnica_resultados / Authenticated can view ficha tecnica resultados
CREATE POLICY "Authenticated can view ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR SELECT TO authenticated USING (true);

-- public.funcoes / Authenticated can delete funcoes
CREATE POLICY "Authenticated can delete funcoes" ON public.funcoes FOR DELETE TO authenticated USING (true);

-- public.funcoes / Authenticated can insert funcoes
CREATE POLICY "Authenticated can insert funcoes" ON public.funcoes FOR INSERT TO authenticated WITH CHECK (true);

-- public.funcoes / Authenticated can update funcoes
CREATE POLICY "Authenticated can update funcoes" ON public.funcoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.funcoes / Authenticated can view funcoes
CREATE POLICY "Authenticated can view funcoes" ON public.funcoes FOR SELECT TO authenticated USING (true);

-- public.ia_conhecimento_arquivos / auth manage arquivos
CREATE POLICY "auth manage arquivos" ON public.ia_conhecimento_arquivos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- public.ia_conhecimento_pastas / auth manage pastas
CREATE POLICY "auth manage pastas" ON public.ia_conhecimento_pastas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- public.ltcat_av_calor / Authenticated can delete ltcat_av_calor
CREATE POLICY "Authenticated can delete ltcat_av_calor" ON public.ltcat_av_calor FOR DELETE TO authenticated USING (true);

-- public.ltcat_av_calor / Authenticated can insert ltcat_av_calor
CREATE POLICY "Authenticated can insert ltcat_av_calor" ON public.ltcat_av_calor FOR INSERT TO authenticated WITH CHECK (true);

-- public.ltcat_av_calor / Authenticated can update ltcat_av_calor
CREATE POLICY "Authenticated can update ltcat_av_calor" ON public.ltcat_av_calor FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.ltcat_av_calor / Authenticated can view ltcat_av_calor
CREATE POLICY "Authenticated can view ltcat_av_calor" ON public.ltcat_av_calor FOR SELECT TO authenticated USING (true);

-- public.ltcat_av_componentes / Authenticated can delete ltcat_av_componentes
CREATE POLICY "Authenticated can delete ltcat_av_componentes" ON public.ltcat_av_componentes FOR DELETE TO authenticated USING (true);

-- public.ltcat_av_componentes / Authenticated can insert ltcat_av_componentes
CREATE POLICY "Authenticated can insert ltcat_av_componentes" ON public.ltcat_av_componentes FOR INSERT TO authenticated WITH CHECK (true);

-- public.ltcat_av_componentes / Authenticated can update ltcat_av_componentes
CREATE POLICY "Authenticated can update ltcat_av_componentes" ON public.ltcat_av_componentes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.ltcat_av_componentes / Authenticated can view ltcat_av_componentes
CREATE POLICY "Authenticated can view ltcat_av_componentes" ON public.ltcat_av_componentes FOR SELECT TO authenticated USING (true);

-- public.ltcat_av_epi_epc / Authenticated can delete ltcat_av_epi_epc
CREATE POLICY "Authenticated can delete ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR DELETE TO authenticated USING (true);

-- public.ltcat_av_epi_epc / Authenticated can insert ltcat_av_epi_epc
CREATE POLICY "Authenticated can insert ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR INSERT TO authenticated WITH CHECK (true);

-- public.ltcat_av_epi_epc / Authenticated can update ltcat_av_epi_epc
CREATE POLICY "Authenticated can update ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.ltcat_av_epi_epc / Authenticated can view ltcat_av_epi_epc
CREATE POLICY "Authenticated can view ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR SELECT TO authenticated USING (true);

-- public.ltcat_av_equipamentos / Authenticated can delete ltcat_av_equipamentos
CREATE POLICY "Authenticated can delete ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR DELETE TO authenticated USING (true);

-- public.ltcat_av_equipamentos / Authenticated can insert ltcat_av_equipamentos
CREATE POLICY "Authenticated can insert ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR INSERT TO authenticated WITH CHECK (true);

-- public.ltcat_av_equipamentos / Authenticated can update ltcat_av_equipamentos
CREATE POLICY "Authenticated can update ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.ltcat_av_equipamentos / Authenticated can view ltcat_av_equipamentos
CREATE POLICY "Authenticated can view ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR SELECT TO authenticated USING (true);

-- public.ltcat_av_resultados / Authenticated can delete ltcat_av_resultados
CREATE POLICY "Authenticated can delete ltcat_av_resultados" ON public.ltcat_av_resultados FOR DELETE TO authenticated USING (true);

-- public.ltcat_av_resultados / Authenticated can insert ltcat_av_resultados
CREATE POLICY "Authenticated can insert ltcat_av_resultados" ON public.ltcat_av_resultados FOR INSERT TO authenticated WITH CHECK (true);

-- public.ltcat_av_resultados / Authenticated can update ltcat_av_resultados
CREATE POLICY "Authenticated can update ltcat_av_resultados" ON public.ltcat_av_resultados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.ltcat_av_resultados / Authenticated can view ltcat_av_resultados
CREATE POLICY "Authenticated can view ltcat_av_resultados" ON public.ltcat_av_resultados FOR SELECT TO authenticated USING (true);

-- public.ltcat_av_vibracao / Authenticated can delete ltcat_av_vibracao
CREATE POLICY "Authenticated can delete ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR DELETE TO authenticated USING (true);

-- public.ltcat_av_vibracao / Authenticated can insert ltcat_av_vibracao
CREATE POLICY "Authenticated can insert ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR INSERT TO authenticated WITH CHECK (true);

-- public.ltcat_av_vibracao / Authenticated can update ltcat_av_vibracao
CREATE POLICY "Authenticated can update ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.ltcat_av_vibracao / Authenticated can view ltcat_av_vibracao
CREATE POLICY "Authenticated can view ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR SELECT TO authenticated USING (true);

-- public.ltcat_avaliacoes / Authenticated can delete ltcat_avaliacoes
CREATE POLICY "Authenticated can delete ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR DELETE TO authenticated USING (true);

-- public.ltcat_avaliacoes / Authenticated can insert ltcat_avaliacoes
CREATE POLICY "Authenticated can insert ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR INSERT TO authenticated WITH CHECK (true);

-- public.ltcat_avaliacoes / Authenticated can update ltcat_avaliacoes
CREATE POLICY "Authenticated can update ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.ltcat_avaliacoes / Authenticated can view ltcat_avaliacoes
CREATE POLICY "Authenticated can view ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR SELECT TO authenticated USING (true);

-- public.ltcat_pareceres / Permitir atualização de ltcat_pareceres para usuários autenticados
CREATE POLICY "Permitir atualização de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR UPDATE TO authenticated USING (true);

-- public.ltcat_pareceres / Permitir exclusão de ltcat_pareceres para usuários autenticados
CREATE POLICY "Permitir exclusão de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR DELETE TO authenticated USING (true);

-- public.ltcat_pareceres / Permitir inserção de ltcat_pareceres para usuários autenticados
CREATE POLICY "Permitir inserção de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR INSERT TO authenticated WITH CHECK (true);

-- public.ltcat_pareceres / Permitir leitura de ltcat_pareceres para usuários autenticados
CREATE POLICY "Permitir leitura de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR SELECT TO authenticated USING (true);

-- public.notificacoes / Authenticated can delete notificacoes
CREATE POLICY "Authenticated can delete notificacoes" ON public.notificacoes FOR DELETE TO authenticated USING (true);

-- public.notificacoes / Authenticated can insert notificacoes
CREATE POLICY "Authenticated can insert notificacoes" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true);

-- public.notificacoes / Authenticated can update notificacoes
CREATE POLICY "Authenticated can update notificacoes" ON public.notificacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.notificacoes / Authenticated can view notificacoes
CREATE POLICY "Authenticated can view notificacoes" ON public.notificacoes FOR SELECT TO authenticated USING (true);

-- public.pareceres_tecnicos / Authenticated can delete pareceres_tecnicos
CREATE POLICY "Authenticated can delete pareceres_tecnicos" ON public.pareceres_tecnicos FOR DELETE TO authenticated USING (true);

-- public.pareceres_tecnicos / Authenticated can insert pareceres_tecnicos
CREATE POLICY "Authenticated can insert pareceres_tecnicos" ON public.pareceres_tecnicos FOR INSERT TO authenticated WITH CHECK (true);

-- public.pareceres_tecnicos / Authenticated can update pareceres_tecnicos
CREATE POLICY "Authenticated can update pareceres_tecnicos" ON public.pareceres_tecnicos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.pareceres_tecnicos / Authenticated can view pareceres_tecnicos
CREATE POLICY "Authenticated can view pareceres_tecnicos" ON public.pareceres_tecnicos FOR SELECT TO authenticated USING (true);

-- public.pcmso_documentos / Auth can delete pcmso_documentos
CREATE POLICY "Auth can delete pcmso_documentos" ON public.pcmso_documentos FOR DELETE TO authenticated USING (true);

-- public.pcmso_documentos / Auth can insert pcmso_documentos
CREATE POLICY "Auth can insert pcmso_documentos" ON public.pcmso_documentos FOR INSERT TO authenticated WITH CHECK (true);

-- public.pcmso_documentos / Auth can update pcmso_documentos
CREATE POLICY "Auth can update pcmso_documentos" ON public.pcmso_documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.pcmso_documentos / Auth can view pcmso_documentos
CREATE POLICY "Auth can view pcmso_documentos" ON public.pcmso_documentos FOR SELECT TO authenticated USING (true);

-- public.pcmso_documentos / Authenticated can delete pcmso_documentos
CREATE POLICY "Authenticated can delete pcmso_documentos" ON public.pcmso_documentos FOR DELETE TO authenticated USING (true);

-- public.pcmso_documentos / Authenticated can insert pcmso_documentos
CREATE POLICY "Authenticated can insert pcmso_documentos" ON public.pcmso_documentos FOR INSERT TO authenticated WITH CHECK (true);

-- public.pcmso_documentos / Authenticated can update pcmso_documentos
CREATE POLICY "Authenticated can update pcmso_documentos" ON public.pcmso_documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.pcmso_documentos / Authenticated can view pcmso_documentos
CREATE POLICY "Authenticated can view pcmso_documentos" ON public.pcmso_documentos FOR SELECT TO authenticated USING (true);

-- public.pcmso_observacoes_padrao / Auth can delete pcmso_obs
CREATE POLICY "Auth can delete pcmso_obs" ON public.pcmso_observacoes_padrao FOR DELETE TO authenticated USING (true);

-- public.pcmso_observacoes_padrao / Auth can insert pcmso_obs
CREATE POLICY "Auth can insert pcmso_obs" ON public.pcmso_observacoes_padrao FOR INSERT TO authenticated WITH CHECK (true);

-- public.pcmso_observacoes_padrao / Auth can update pcmso_obs
CREATE POLICY "Auth can update pcmso_obs" ON public.pcmso_observacoes_padrao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.pcmso_observacoes_padrao / Auth can view pcmso_obs
CREATE POLICY "Auth can view pcmso_obs" ON public.pcmso_observacoes_padrao FOR SELECT TO authenticated USING (true);

-- public.profiles / Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- public.profiles / Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- public.profiles / Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- public.profiles / Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

-- public.profiles / Users can view own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- public.psico_avaliacoes / auth manage psico avaliacoes
CREATE POLICY "auth manage psico avaliacoes"
ON public.psico_avaliacoes FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- public.psico_base_tecnica / Usuarios autenticados gerenciam a base tecnica
CREATE POLICY "Usuarios autenticados gerenciam a base tecnica"
  ON public.psico_base_tecnica FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- public.psico_indicadores / auth manage psico indicadores
CREATE POLICY "auth manage psico indicadores" ON public.psico_indicadores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- public.psico_links / auth manage links
CREATE POLICY "auth manage links" ON public.psico_links FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- public.psico_relatorios / auth manage psico relatorios
CREATE POLICY "auth manage psico relatorios" ON public.psico_relatorios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- public.psico_respostas / auth manage respostas
CREATE POLICY "auth manage respostas" ON public.psico_respostas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- public.responsaveis / auth manage responsaveis
CREATE POLICY "auth manage responsaveis" ON public.responsaveis FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- public.riscos / Authenticated can delete riscos
CREATE POLICY "Authenticated can delete riscos" ON public.riscos FOR DELETE TO authenticated USING (true);

-- public.riscos / Authenticated can insert riscos
CREATE POLICY "Authenticated can insert riscos" ON public.riscos FOR INSERT TO authenticated WITH CHECK (true);

-- public.riscos / Authenticated can update riscos
CREATE POLICY "Authenticated can update riscos" ON public.riscos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.riscos / Authenticated can view riscos
CREATE POLICY "Authenticated can view riscos" ON public.riscos FOR SELECT TO authenticated USING (true);

-- public.setores / Authenticated can delete setores
CREATE POLICY "Authenticated can delete setores" ON public.setores FOR DELETE TO authenticated USING (true);

-- public.setores / Authenticated can insert setores
CREATE POLICY "Authenticated can insert setores" ON public.setores FOR INSERT TO authenticated WITH CHECK (true);

-- public.setores / Authenticated can update setores
CREATE POLICY "Authenticated can update setores" ON public.setores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.setores / Authenticated can view setores
CREATE POLICY "Authenticated can view setores" ON public.setores FOR SELECT TO authenticated USING (true);

-- public.tecnicas_amostragem / Admins can insert tecnicas_amostragem
CREATE POLICY "Admins can insert tecnicas_amostragem" ON public.tecnicas_amostragem FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- public.tecnicas_amostragem / Authenticated can view tecnicas_amostragem
CREATE POLICY "Authenticated can view tecnicas_amostragem" ON public.tecnicas_amostragem FOR SELECT TO authenticated USING (true);

-- public.templates / Authenticated can delete non-system templates
CREATE POLICY "Authenticated can delete non-system templates"
ON public.templates
FOR DELETE
TO authenticated
USING (is_system = false);

-- public.templates / Authenticated can insert templates
CREATE POLICY "Authenticated can insert templates" ON public.templates FOR INSERT TO authenticated WITH CHECK (true);

-- public.templates / Authenticated can update non-system templates
CREATE POLICY "Authenticated can update non-system templates"
ON public.templates
FOR UPDATE
TO authenticated
USING (is_system = false)
WITH CHECK (is_system = false);

-- public.templates / Authenticated can view templates
CREATE POLICY "Authenticated can view templates" ON public.templates FOR SELECT TO authenticated USING (true);

-- public.treinamentos_cadastro / Authenticated can delete treinamentos_cadastro
CREATE POLICY "Authenticated can delete treinamentos_cadastro" ON public.treinamentos_cadastro FOR DELETE TO authenticated USING (true);

-- public.treinamentos_cadastro / Authenticated can insert treinamentos_cadastro
CREATE POLICY "Authenticated can insert treinamentos_cadastro" ON public.treinamentos_cadastro FOR INSERT TO authenticated WITH CHECK (true);

-- public.treinamentos_cadastro / Authenticated can update treinamentos_cadastro
CREATE POLICY "Authenticated can update treinamentos_cadastro" ON public.treinamentos_cadastro FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- public.treinamentos_cadastro / Authenticated can view treinamentos_cadastro
CREATE POLICY "Authenticated can view treinamentos_cadastro" ON public.treinamentos_cadastro FOR SELECT TO authenticated USING (true);

-- public.unidades / Admins can insert unidades
CREATE POLICY "Admins can insert unidades" ON public.unidades FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- public.unidades / Authenticated can view unidades
CREATE POLICY "Authenticated can view unidades" ON public.unidades FOR SELECT TO authenticated USING (true);

-- public.user_roles / Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- public.user_roles / Admins manage roles - delete
CREATE POLICY "Admins manage roles - delete"
ON public.user_roles FOR DELETE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- public.user_roles / Admins manage roles - insert
CREATE POLICY "Admins manage roles - insert"
ON public.user_roles FOR INSERT
TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- public.user_roles / Admins manage roles - update
CREATE POLICY "Admins manage roles - update"
ON public.user_roles FOR UPDATE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- public.user_roles / Users can view own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('aet-imagens', 'aet-imagens', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-upload', 'documentos-upload', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados-calibracao', 'certificados-calibracao', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('ergonomia-relatorios', 'ergonomia-relatorios', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('ia-conhecimento', 'ia-conhecimento', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('psico-base-tecnica', 'psico-base-tecnica', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- App-used private buckets (not INSERT'd in historical migrations; required by client)
INSERT INTO storage.buckets (id, name, public)
VALUES ('formulario-aep-base', 'formulario-aep-base', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('formularios-aep', 'formularios-aep', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Admins can delete templates
CREATE POLICY "Admins can delete templates"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'templates' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Auth can delete documentos-upload
CREATE POLICY "Auth can delete documentos-upload"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-upload');

-- Auth can insert documentos-upload
CREATE POLICY "Auth can insert documentos-upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-upload');

-- Auth can update documentos-upload
CREATE POLICY "Auth can update documentos-upload"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos-upload');

-- Auth can view documentos-upload
CREATE POLICY "Auth can view documentos-upload"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-upload');

-- Authenticated can delete aet-imagens
CREATE POLICY "Authenticated can delete aet-imagens"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'aet-imagens');

-- Authenticated can update aet-imagens
CREATE POLICY "Authenticated can update aet-imagens"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'aet-imagens');

-- Authenticated can update templates
CREATE POLICY "Authenticated can update templates"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'templates');

-- Authenticated can upload aet-imagens
CREATE POLICY "Authenticated can upload aet-imagens"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aet-imagens');

-- Authenticated can upload templates
CREATE POLICY "Authenticated can upload templates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'templates');

-- Authenticated can view aet-imagens
CREATE POLICY "Authenticated can view aet-imagens" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'aet-imagens');

-- Authenticated can view templates
CREATE POLICY "Authenticated can view templates" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'templates');

-- Base tecnica exclusao autenticada
CREATE POLICY "Base tecnica exclusao autenticada"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'psico-base-tecnica');

-- Base tecnica leitura autenticada
CREATE POLICY "Base tecnica leitura autenticada"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'psico-base-tecnica');

-- Base tecnica upload autenticado
CREATE POLICY "Base tecnica upload autenticado"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'psico-base-tecnica');

-- cert_calib_delete
CREATE POLICY "cert_calib_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'certificados-calibracao');

-- cert_calib_insert
CREATE POLICY "cert_calib_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificados-calibracao');

-- cert_calib_select
CREATE POLICY "cert_calib_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'certificados-calibracao');

-- cert_calib_update
CREATE POLICY "cert_calib_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'certificados-calibracao') WITH CHECK (bucket_id = 'certificados-calibracao');

-- ergonomia_delete_own
CREATE POLICY "ergonomia_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ergonomia_insert_own
CREATE POLICY "ergonomia_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ergonomia_read_own
CREATE POLICY "ergonomia_read_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ergonomia_update_own
CREATE POLICY "ergonomia_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ia conhecimento delete
CREATE POLICY "ia conhecimento delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ia-conhecimento');

-- ia conhecimento insert
CREATE POLICY "ia conhecimento insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ia-conhecimento');

-- ia conhecimento read
CREATE POLICY "ia conhecimento read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ia-conhecimento');

-- ia conhecimento update
CREATE POLICY "ia conhecimento update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ia-conhecimento');

-- formulario-aep-base (APR-ERGO / AEP reference Base)
CREATE POLICY "formulario_aep_base_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'formulario-aep-base');
CREATE POLICY "formulario_aep_base_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'formulario-aep-base');
CREATE POLICY "formulario_aep_base_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'formulario-aep-base') WITH CHECK (bucket_id = 'formulario-aep-base');
CREATE POLICY "formulario_aep_base_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'formulario-aep-base');

-- formularios-aep (filled AEP form PDFs/JSON)
CREATE POLICY "formularios_aep_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'formularios-aep');
CREATE POLICY "formularios_aep_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'formularios-aep');
CREATE POLICY "formularios_aep_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'formularios-aep') WITH CHECK (bucket_id = 'formularios-aep');
CREATE POLICY "formularios_aep_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'formularios-aep');

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS ia_conhecimento_arquivos_pasta_idx ON public.ia_conhecimento_arquivos(pasta_id);

CREATE INDEX IF NOT EXISTS idx_aep_documentos_documento ON public.aep_documentos (documento_id);

CREATE INDEX IF NOT EXISTS idx_aet_contrato ON public.aet_documentos(contrato_id);

CREATE INDEX IF NOT EXISTS idx_aet_documentos_documento ON public.aet_documentos (documento_id);

CREATE INDEX IF NOT EXISTS idx_aet_documentos_empresa ON public.aet_documentos(empresa_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_record_time ON public.audit_log (table_name, record_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_contratos_empresa ON public.contratos(empresa_id);

CREATE INDEX IF NOT EXISTS idx_contratos_empresa_created ON public.contratos (empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documentos_contrato ON public.documentos(contrato_id);

CREATE INDEX IF NOT EXISTS idx_documentos_empresa ON public.documentos(empresa_id);

CREATE INDEX IF NOT EXISTS idx_documentos_empresa_contrato_tipo ON public.documentos (empresa_id, contrato_id, tipo);

CREATE INDEX IF NOT EXISTS idx_documentos_updated_desc ON public.documentos (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_empresa_contatos_empresa_id ON public.empresa_contatos(empresa_id);

CREATE INDEX IF NOT EXISTS idx_eq_ho_reg_equipamento_id ON public.equipamentos_ho_registros(equipamento_id);

CREATE INDEX IF NOT EXISTS idx_ergonomia_aet ON public.ergonomia_avaliacoes(aet_documento_id);

CREATE INDEX IF NOT EXISTS idx_ergonomia_user_setor
  ON public.ergonomia_avaliacoes (user_id, setor_nome, funcao);

CREATE INDEX IF NOT EXISTS idx_ficha_tecnica_agente ON public.ficha_tecnica_resultados(agente_id);

CREATE INDEX IF NOT EXISTS idx_ficha_tecnica_empresa_contrato ON public.ficha_tecnica_resultados(empresa_id, contrato_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ficha_tecnica_setor_funcao ON public.ficha_tecnica_resultados(setor_id, funcao_id);

CREATE INDEX IF NOT EXISTS idx_funcoes_setor_nome ON public.funcoes (setor_id, nome_funcao);

CREATE INDEX IF NOT EXISTS idx_ltcat_av_calor_av ON public.ltcat_av_calor(avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_ltcat_av_comp_av ON public.ltcat_av_componentes(avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_ltcat_av_eq_av ON public.ltcat_av_equipamentos(avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_ltcat_av_res_av ON public.ltcat_av_resultados(avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_ltcat_av_vib_av ON public.ltcat_av_vibracao(avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_documento ON public.ltcat_avaliacoes(documento_id);

CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_documento_agente ON public.ltcat_avaliacoes (documento_id, agente_id);

CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_setor_funcao ON public.ltcat_avaliacoes (setor_id, funcao_id);

CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_tipo_doc ON public.ltcat_avaliacoes(tipo_documento, empresa_id);

CREATE INDEX IF NOT EXISTS idx_ltcat_contrato ON public.ltcat_avaliacoes(contrato_id);

CREATE INDEX IF NOT EXISTS idx_ltcat_pareceres_tipo_doc ON public.ltcat_pareceres(tipo_documento, empresa_id);

CREATE INDEX IF NOT EXISTS idx_pareceres_doc_sit ON public.pareceres_tecnicos (documento, situacao);

CREATE INDEX IF NOT EXISTS idx_pareceres_risco ON public.pareceres_tecnicos (risco_id);

CREATE INDEX IF NOT EXISTS idx_pcmso_contrato ON public.pcmso_documentos(contrato_id);

CREATE INDEX IF NOT EXISTS idx_pcmso_documentos_empresa_contrato ON public.pcmso_documentos (empresa_id, contrato_id);

CREATE INDEX IF NOT EXISTS idx_psico_avaliacoes_empresa_contrato ON public.psico_avaliacoes(empresa_id, contrato_id);

CREATE INDEX IF NOT EXISTS idx_psico_respostas_avaliacao ON public.psico_respostas(avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_psico_respostas_empresa ON public.psico_respostas(empresa_id);

CREATE INDEX IF NOT EXISTS idx_psico_respostas_empresa_contrato ON public.psico_respostas (empresa_id, contrato_id);

CREATE INDEX IF NOT EXISTS idx_psico_respostas_funcao ON public.psico_respostas(funcao_id);

CREATE INDEX IF NOT EXISTS idx_psico_respostas_link ON public.psico_respostas(link_id);

CREATE INDEX IF NOT EXISTS idx_setores_contrato ON public.setores(contrato_id);

CREATE INDEX IF NOT EXISTS idx_setores_contrato_nome ON public.setores (contrato_id, nome_setor);

CREATE INDEX IF NOT EXISTS idx_setores_empresa_contrato ON public.setores (empresa_id, contrato_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ltcat_avaliacao_ficha_documento
ON public.ltcat_avaliacoes(documento_id, ficha_tecnica_resultado_id)
WHERE ficha_tecnica_resultado_id IS NOT NULL;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS ergonomia_avaliacoes_updated ON public.ergonomia_avaliacoes;
CREATE TRIGGER ergonomia_avaliacoes_updated
BEFORE UPDATE ON public.ergonomia_avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS preserve_ficha_tecnica_origin_on_update ON public.ltcat_avaliacoes;
CREATE TRIGGER preserve_ficha_tecnica_origin_on_update
BEFORE UPDATE ON public.ltcat_avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.preserve_ficha_tecnica_origin();

DROP TRIGGER IF EXISTS psico_indicadores_updated_at ON public.psico_indicadores;
CREATE TRIGGER psico_indicadores_updated_at BEFORE UPDATE ON public.psico_indicadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS psico_relatorios_updated_at ON public.psico_relatorios;
CREATE TRIGGER psico_relatorios_updated_at BEFORE UPDATE ON public.psico_relatorios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS responsaveis_updated_at ON public.responsaveis;
CREATE TRIGGER responsaveis_updated_at BEFORE UPDATE ON public.responsaveis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_treinamentos_cadastro_updated_at ON public.treinamentos_cadastro;
CREATE TRIGGER set_treinamentos_cadastro_updated_at
BEFORE UPDATE ON public.treinamentos_cadastro
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_aet_instrucoes_updated ON public.aet_instrucoes_usuario;
CREATE TRIGGER trg_aet_instrucoes_updated
  BEFORE UPDATE ON public.aet_instrucoes_usuario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_documento_validade ON public.documentos;
CREATE TRIGGER trg_documento_validade
  BEFORE INSERT OR UPDATE OF data_elaboracao ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.set_documento_validade();

DROP TRIGGER IF EXISTS trg_link_ergonomia_to_aet ON public.aet_documentos;
CREATE TRIGGER trg_link_ergonomia_to_aet
AFTER INSERT ON public.aet_documentos
FOR EACH ROW
EXECUTE FUNCTION public.link_ergonomia_to_aet();

DROP TRIGGER IF EXISTS trg_pcmso_documentos_updated ON public.pcmso_documentos;
CREATE TRIGGER trg_pcmso_documentos_updated BEFORE UPDATE ON public.pcmso_documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_psico_avaliacoes_updated ON public.psico_avaliacoes;
CREATE TRIGGER trg_psico_avaliacoes_updated
BEFORE UPDATE ON public.psico_avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_psico_links_updated ON public.psico_links;
CREATE TRIGGER trg_psico_links_updated BEFORE UPDATE ON public.psico_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_track_ficha_tecnica_change ON public.ficha_tecnica_resultados;
CREATE TRIGGER trg_track_ficha_tecnica_change
BEFORE INSERT OR UPDATE OR DELETE ON public.ficha_tecnica_resultados
FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();

DROP TRIGGER IF EXISTS update_aep_documentos_updated_at ON public.aep_documentos;
CREATE TRIGGER update_aep_documentos_updated_at
BEFORE UPDATE ON public.aep_documentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_aet_documentos_updated_at ON public.aet_documentos;
CREATE TRIGGER update_aet_documentos_updated_at
  BEFORE UPDATE ON public.aet_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contratos_updated_at ON public.contratos;
CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_documentos_updated_at ON public.documentos;
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_empresas_updated_at ON public.empresas;
CREATE TRIGGER update_empresas_updated_at
BEFORE UPDATE ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_epi_epc_updated_at ON public.epi_epc;
CREATE TRIGGER update_epi_epc_updated_at
  BEFORE UPDATE ON public.epi_epc
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_exames_cadastro_updated_at ON public.exames_cadastro;
CREATE TRIGGER update_exames_cadastro_updated_at BEFORE UPDATE ON public.exames_cadastro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ficha_tecnica_resultados_updated_at ON public.ficha_tecnica_resultados;
CREATE TRIGGER update_ficha_tecnica_resultados_updated_at
BEFORE UPDATE ON public.ficha_tecnica_resultados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_funcoes_updated_at ON public.funcoes;
CREATE TRIGGER update_funcoes_updated_at
  BEFORE UPDATE ON public.funcoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pareceres_tecnicos_updated_at ON public.pareceres_tecnicos;
CREATE TRIGGER update_pareceres_tecnicos_updated_at
BEFORE UPDATE ON public.pareceres_tecnicos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pcmso_documentos_updated_at ON public.pcmso_documentos;
CREATE TRIGGER update_pcmso_documentos_updated_at
BEFORE UPDATE ON public.pcmso_documentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_riscos_updated_at ON public.riscos;
CREATE TRIGGER update_riscos_updated_at
  BEFORE UPDATE ON public.riscos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_setores_updated_at ON public.setores;
CREATE TRIGGER update_setores_updated_at
  BEFORE UPDATE ON public.setores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS validate_ficha_tecnica_resultado ON public.ficha_tecnica_resultados;
CREATE TRIGGER validate_ficha_tecnica_resultado
BEFORE INSERT OR UPDATE ON public.ficha_tecnica_resultados
FOR EACH ROW EXECUTE FUNCTION public.validate_ficha_tecnica_resultado();

-- =============================================================================
-- GRANTS / REVOKES (latest security posture)
-- =============================================================================

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.track_shared_change() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.track_shared_change() FROM anon;

REVOKE ALL ON FUNCTION public.track_shared_change() FROM authenticated;

REVOKE ALL ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) FROM anon;

GRANT EXECUTE ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.link_ergonomia_to_aet() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.link_ergonomia_to_aet() TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.psico_get_public_link(text) FROM PUBLIC, authenticated;

GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, service_role;

REVOKE EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) FROM PUBLIC, authenticated;

GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, service_role;

REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM anon;

GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO service_role;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION private.psico_get_public_link(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.psico_get_public_link(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION private.psico_submit_resposta(text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.psico_submit_resposta(text, jsonb) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM anon;

REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM authenticated;

GRANT EXECUTE ON FUNCTION public.preserve_ficha_tecnica_origin() TO service_role;

REVOKE ALL ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.save_ltcat_documento_v2(uuid,uuid,text,bigint,jsonb,jsonb,uuid[],jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid,uuid,text,bigint,jsonb,jsonb,uuid[],jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid,uuid,text,bigint,jsonb,jsonb,uuid[],jsonb) TO service_role;

REVOKE ALL ON SCHEMA private FROM PUBLIC;

GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- =============================================================================
-- END BOOTSTRAP
-- =============================================================================