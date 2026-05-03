ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS responsavel_tecnico text,
  ADD COLUMN IF NOT EXISTS crea text,
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS data_elaboracao date,
  ADD COLUMN IF NOT EXISTS alteracoes_documento text,
  ADD COLUMN IF NOT EXISTS revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS draft_snapshot jsonb;

CREATE INDEX IF NOT EXISTS idx_documentos_contrato ON public.documentos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_documentos_empresa ON public.documentos(empresa_id);