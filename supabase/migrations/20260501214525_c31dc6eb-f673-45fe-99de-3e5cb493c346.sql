ALTER TABLE public.ltcat_av_calor
  ADD COLUMN IF NOT EXISTS local_atividade text,
  ADD COLUMN IF NOT EXISTS equipamento_id uuid,
  ADD COLUMN IF NOT EXISTS tempo_exposicao text,
  ADD COLUMN IF NOT EXISTS ibutg_tipo text,
  ADD COLUMN IF NOT EXISTS tbn_valores text,
  ADD COLUMN IF NOT EXISTS tg_valores text,
  ADD COLUMN IF NOT EXISTS tbs_valores text;