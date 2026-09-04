ALTER TABLE public.equipamentos_ho_registros ADD COLUMN IF NOT EXISTS certificado_path text;
ALTER TABLE public.equipamentos_ho_registros ADD COLUMN IF NOT EXISTS certificado_nome text;
ALTER TABLE public.equipamentos_ho_registros ADD COLUMN IF NOT EXISTS certificado_updated_at timestamptz;