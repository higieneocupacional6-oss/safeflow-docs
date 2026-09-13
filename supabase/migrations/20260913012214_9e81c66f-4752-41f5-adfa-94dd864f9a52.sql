CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  old_data jsonb,
  new_data jsonb
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.setores ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.funcoes ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.riscos ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.aet_documentos ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.aep_documentos ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.pcmso_documentos ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;

CREATE OR REPLACE FUNCTION public.track_shared_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_id := OLD.id;
    INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data)
    VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.row_version := OLD.row_version + 1;
    NEW.last_modified_by := auth.uid();
    v_id := NEW.id;
    INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;

  NEW.last_modified_by := auth.uid();
  v_id := NEW.id;
  INSERT INTO public.audit_log(table_name, record_id, action, changed_by, new_data)
  VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(NEW));
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['empresas','contratos','setores','funcoes','riscos','documentos','aet_documentos','aep_documentos','pcmso_documentos']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_track_shared_change ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_track_shared_change BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.track_shared_change()', t);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_contratos_empresa_created ON public.contratos (empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_setores_contrato_nome ON public.setores (contrato_id, nome_setor);
CREATE INDEX IF NOT EXISTS idx_setores_empresa_contrato ON public.setores (empresa_id, contrato_id);
CREATE INDEX IF NOT EXISTS idx_funcoes_setor_nome ON public.funcoes (setor_id, nome_funcao);
CREATE INDEX IF NOT EXISTS idx_documentos_empresa_contrato_tipo ON public.documentos (empresa_id, contrato_id, tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_updated_desc ON public.documentos (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_documento_agente ON public.ltcat_avaliacoes (documento_id, agente_id);
CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_setor_funcao ON public.ltcat_avaliacoes (setor_id, funcao_id);
CREATE INDEX IF NOT EXISTS idx_aet_documentos_documento ON public.aet_documentos (documento_id);
CREATE INDEX IF NOT EXISTS idx_aep_documentos_documento ON public.aep_documentos (documento_id);
CREATE INDEX IF NOT EXISTS idx_pcmso_documentos_empresa_contrato ON public.pcmso_documentos (empresa_id, contrato_id);
CREATE INDEX IF NOT EXISTS idx_psico_respostas_empresa_contrato ON public.psico_respostas (empresa_id, contrato_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_time ON public.audit_log (table_name, record_id, changed_at DESC);