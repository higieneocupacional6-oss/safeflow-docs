-- Add new columns to ltcat_avaliacoes
ALTER TABLE public.ltcat_avaliacoes
ADD COLUMN IF NOT EXISTS data_avaliacao date,
ADD COLUMN IF NOT EXISTS funcoes_ges text;

-- Create equipamentos_avaliacao table
CREATE TABLE IF NOT EXISTS public.equipamentos_avaliacao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id uuid REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  empresa_id uuid,
  setor_id uuid,
  agente_nome text,
  nome_equipamento text,
  modelo_equipamento text,
  serie_equipamento text,
  data_avaliacao date,
  data_calibracao date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipamentos_avaliacao ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view equipamentos_avaliacao"
ON public.equipamentos_avaliacao FOR SELECT USING (true);

CREATE POLICY "Anyone can insert equipamentos_avaliacao"
ON public.equipamentos_avaliacao FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update equipamentos_avaliacao"
ON public.equipamentos_avaliacao FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete equipamentos_avaliacao"
ON public.equipamentos_avaliacao FOR DELETE USING (true);