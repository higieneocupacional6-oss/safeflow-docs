
-- =========================================================
-- LTCAT: Tabelas para persistência completa de subdados
-- =========================================================

-- 1) Componentes químicos por avaliação (resultados_componentes)
CREATE TABLE IF NOT EXISTS public.ltcat_av_componentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  componente TEXT,
  cas TEXT,
  resultado NUMERIC,
  unidade_resultado_id UUID,
  limite_tolerancia NUMERIC,
  unidade_limite_id UUID,
  tempo_coleta TEXT,
  unidade_tempo_coleta TEXT,
  dose_percentual NUMERIC,
  situacao TEXT,
  cod_gfip TEXT,
  colaborador TEXT,
  funcao_id UUID,
  data_avaliacao DATE,
  descricao_avaliacao TEXT,
  parecer_tecnico TEXT,
  aposentadoria_especial TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Linhas de calor (resultados_calor)
CREATE TABLE IF NOT EXISTS public.ltcat_av_calor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  colaborador TEXT,
  funcao_id UUID,
  data_avaliacao DATE,
  ibutg_medido NUMERIC,
  ibutg_limite NUMERIC,
  m_kcal_h NUMERIC,
  tipo_atividade TEXT,
  taxa_metabolica TEXT,
  descricao_atividade TEXT,
  situacao TEXT,
  cod_gfip TEXT,
  parecer_tecnico TEXT,
  aposentadoria_especial TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Linhas de vibração (resultados_vibracao - VCI/VMB)
CREATE TABLE IF NOT EXISTS public.ltcat_av_vibracao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  tipo TEXT, -- 'VCI' ou 'VMB'
  colaborador TEXT,
  funcao_id UUID,
  data_avaliacao DATE,
  aren NUMERIC,
  vdvr NUMERIC,
  aren_limite NUMERIC,
  vdvr_limite NUMERIC,
  tempo_exposicao TEXT,
  situacao TEXT,
  cod_gfip TEXT,
  parecer_tecnico TEXT,
  aposentadoria_especial TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Resultados detalhados genéricos (resultados_detalhados - ruído etc)
CREATE TABLE IF NOT EXISTS public.ltcat_av_resultados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  colaborador TEXT,
  funcao_id UUID,
  data_avaliacao DATE,
  resultado NUMERIC,
  unidade_resultado_id UUID,
  limite_tolerancia NUMERIC,
  unidade_limite_id UUID,
  tempo_coleta TEXT,
  unidade_tempo_coleta TEXT,
  dose_percentual NUMERIC,
  situacao TEXT,
  cod_gfip TEXT,
  descricao_avaliacao TEXT,
  parecer_tecnico TEXT,
  aposentadoria_especial TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Equipamentos vinculados à avaliação (lista do modal)
CREATE TABLE IF NOT EXISTS public.ltcat_av_equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  nome_equipamento TEXT,
  modelo_equipamento TEXT,
  serie_equipamento TEXT,
  data_calibracao DATE,
  data_avaliacao DATE,
  agente_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) EPI/EPC por risco (1 linha por avaliacao_id)
CREATE TABLE IF NOT EXISTS public.ltcat_av_epi_epc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL UNIQUE REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  epi_id UUID,
  epi_ca TEXT,
  epi_atenuacao TEXT,
  epi_eficaz TEXT,
  epc_id UUID,
  epc_eficaz TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) Vincular avaliações ao documento (para edição focar só no doc)
ALTER TABLE public.ltcat_avaliacoes
  ADD COLUMN IF NOT EXISTS documento_id UUID REFERENCES public.documentos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_documento ON public.ltcat_avaliacoes(documento_id);
CREATE INDEX IF NOT EXISTS idx_ltcat_av_comp_av ON public.ltcat_av_componentes(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_ltcat_av_calor_av ON public.ltcat_av_calor(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_ltcat_av_vib_av ON public.ltcat_av_vibracao(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_ltcat_av_res_av ON public.ltcat_av_resultados(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_ltcat_av_eq_av ON public.ltcat_av_equipamentos(avaliacao_id);

-- =========================================================
-- RLS: Acesso público (mesmo padrão das demais tabelas LTCAT)
-- =========================================================
ALTER TABLE public.ltcat_av_componentes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_av_calor        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_av_vibracao     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_av_resultados   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_av_equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltcat_av_epi_epc      ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'ltcat_av_componentes','ltcat_av_calor','ltcat_av_vibracao',
    'ltcat_av_resultados','ltcat_av_equipamentos','ltcat_av_epi_epc'
  ]) LOOP
    EXECUTE format('CREATE POLICY "Anyone can view %1$s"   ON public.%1$s FOR SELECT USING (true);', t);
    EXECUTE format('CREATE POLICY "Anyone can insert %1$s" ON public.%1$s FOR INSERT WITH CHECK (true);', t);
    EXECUTE format('CREATE POLICY "Anyone can update %1$s" ON public.%1$s FOR UPDATE USING (true);', t);
    EXECUTE format('CREATE POLICY "Anyone can delete %1$s" ON public.%1$s FOR DELETE USING (true);', t);
  END LOOP;
END $$;
