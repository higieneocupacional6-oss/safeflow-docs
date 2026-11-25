-- Permite excluir templates sem quebrar documentos que ainda referenciam template_id.
-- Os documentos são preservados; apenas o vínculo fica NULL.

ALTER TABLE public.documentos
  DROP CONSTRAINT IF EXISTS documentos_template_id_fkey;

ALTER TABLE public.documentos
  ADD CONSTRAINT documentos_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES public.templates(id)
  ON DELETE SET NULL;

-- PCMSO também guarda template_id (sem FK formal em alguns ambientes).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pcmso_documentos'
      AND column_name = 'template_id'
  ) THEN
    ALTER TABLE public.pcmso_documentos
      DROP CONSTRAINT IF EXISTS pcmso_documentos_template_id_fkey;
    ALTER TABLE public.pcmso_documentos
      ADD CONSTRAINT pcmso_documentos_template_id_fkey
      FOREIGN KEY (template_id) REFERENCES public.templates(id)
      ON DELETE SET NULL;
  END IF;
END $$;
