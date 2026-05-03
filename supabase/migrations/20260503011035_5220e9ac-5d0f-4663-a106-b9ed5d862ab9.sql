ALTER TABLE public.equipamentos_ho_registros 
ADD COLUMN IF NOT EXISTS situacao_operacional text NOT NULL DEFAULT 'Aparelho calibrado';