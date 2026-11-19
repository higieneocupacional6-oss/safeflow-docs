-- Identificadores offline do módulo Formulário AEP/AET (documentos.tipo = 'AEP-AET').

ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS offline_client_id text;

ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS offline_device_id text;

ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS offline_device_label text;

CREATE UNIQUE INDEX IF NOT EXISTS documentos_offline_client_id_uidx
  ON public.documentos (offline_client_id)
  WHERE offline_client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS documentos_offline_device_id_idx
  ON public.documentos (offline_device_id)
  WHERE offline_device_id IS NOT NULL;
