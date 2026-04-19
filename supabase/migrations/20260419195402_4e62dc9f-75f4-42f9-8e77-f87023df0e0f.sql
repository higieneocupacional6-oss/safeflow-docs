-- Adiciona discriminador de tipo de documento nas tabelas LTCAT (reutilizadas para Insalubridade)
ALTER TABLE public.ltcat_avaliacoes
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'ltcat';

ALTER TABLE public.ltcat_pareceres
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'ltcat';

ALTER TABLE public.ltcat_av_calor
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'ltcat';

ALTER TABLE public.ltcat_av_componentes
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'ltcat';

ALTER TABLE public.ltcat_av_resultados
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'ltcat';

ALTER TABLE public.ltcat_av_vibracao
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'ltcat';

ALTER TABLE public.ltcat_av_equipamentos
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'ltcat';

ALTER TABLE public.ltcat_av_epi_epc
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'ltcat';

ALTER TABLE public.equipamentos_avaliacao
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'ltcat';

-- Validação dos valores aceitos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ltcat_avaliacoes_tipo_documento_check') THEN
    ALTER TABLE public.ltcat_avaliacoes ADD CONSTRAINT ltcat_avaliacoes_tipo_documento_check CHECK (tipo_documento IN ('ltcat','insalubridade'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ltcat_pareceres_tipo_documento_check') THEN
    ALTER TABLE public.ltcat_pareceres ADD CONSTRAINT ltcat_pareceres_tipo_documento_check CHECK (tipo_documento IN ('ltcat','insalubridade'));
  END IF;
END $$;

-- Índices para filtros rápidos por tipo
CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_tipo_doc ON public.ltcat_avaliacoes(tipo_documento, empresa_id);
CREATE INDEX IF NOT EXISTS idx_ltcat_pareceres_tipo_doc ON public.ltcat_pareceres(tipo_documento, empresa_id);