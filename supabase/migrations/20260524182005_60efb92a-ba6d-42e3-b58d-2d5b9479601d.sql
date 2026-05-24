
-- Add columns to documentos
ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS data_validade date,
  ADD COLUMN IF NOT EXISTS upload_file_path text,
  ADD COLUMN IF NOT EXISTS nome_documento text;

-- Function/trigger to auto-calc data_validade from data_elaboracao
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

DROP TRIGGER IF EXISTS trg_documento_validade ON public.documentos;
CREATE TRIGGER trg_documento_validade
  BEFORE INSERT OR UPDATE OF data_elaboracao ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.set_documento_validade();

-- Backfill existing rows
UPDATE public.documentos
SET data_validade = (data_elaboracao + INTERVAL '12 months')::date
WHERE data_elaboracao IS NOT NULL AND data_validade IS NULL;

-- Notificacoes table
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid NOT NULL,
  empresa_id uuid,
  contrato_id uuid,
  empresa_nome text,
  contrato_numero text,
  documento_tipo text,
  documento_nome text,
  tipo text NOT NULL CHECK (tipo IN ('30_dias','15_dias','vencimento')),
  data_vencimento date NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (documento_id, tipo)
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view notificacoes" ON public.notificacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert notificacoes" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update notificacoes" ON public.notificacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete notificacoes" ON public.notificacoes FOR DELETE TO authenticated USING (true);

-- Storage bucket for user uploads (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-upload', 'documentos-upload', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth can view documentos-upload"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-upload');

CREATE POLICY "Auth can insert documentos-upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-upload');

CREATE POLICY "Auth can update documentos-upload"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos-upload');

CREATE POLICY "Auth can delete documentos-upload"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-upload');
