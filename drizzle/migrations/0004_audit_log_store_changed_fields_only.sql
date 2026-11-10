CREATE OR REPLACE FUNCTION public.track_shared_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid; v_old jsonb; v_new jsonb; v_o jsonb := '{}'::jsonb; v_n jsonb := '{}'::jsonb; k text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.row_version := OLD.row_version + 1;
    NEW.last_modified_by := auth.uid();
    v_old := to_jsonb(OLD) - 'row_version' - 'last_modified_by' - 'updated_at';
    v_new := to_jsonb(NEW) - 'row_version' - 'last_modified_by' - 'updated_at';
    FOR k IN SELECT jsonb_object_keys(v_new) LOOP
      IF (v_old -> k) IS DISTINCT FROM (v_new -> k) THEN
        v_o := v_o || jsonb_build_object(k, v_old -> k);
        v_n := v_n || jsonb_build_object(k, v_new -> k);
      END IF;
    END LOOP;
    IF v_n <> '{}'::jsonb THEN
      v_o := v_o || jsonb_build_object('id', OLD.id);
      v_n := v_n || jsonb_build_object('id', NEW.id);
      INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data, new_data)
      VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), v_o, v_n);
    END IF;
    RETURN NEW;
  END IF;
  NEW.last_modified_by := auth.uid();
  INSERT INTO public.audit_log(table_name, record_id, action, changed_by, new_data)
  VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), to_jsonb(NEW));
  RETURN NEW;
END; $$;
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON public.audit_log (table_name, record_id, changed_at DESC);