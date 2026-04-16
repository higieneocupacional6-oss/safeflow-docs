
ALTER TABLE public.ltcat_avaliacoes
ADD COLUMN IF NOT EXISTS tempo_coleta text,
ADD COLUMN IF NOT EXISTS unidade_tempo_coleta text,
ADD COLUMN IF NOT EXISTS dose_percentual numeric,
ADD COLUMN IF NOT EXISTS situacao text,
ADD COLUMN IF NOT EXISTS cod_gfip text;
