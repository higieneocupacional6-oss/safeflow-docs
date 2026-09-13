CREATE OR REPLACE FUNCTION public.update_shared_record(
  _table_name text,
  _record_id uuid,
  _expected_version bigint,
  _patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF _table_name NOT IN ('empresas','contratos','setores','funcoes','riscos','documentos','aet_documentos','aep_documentos','pcmso_documentos') THEN
    RAISE EXCEPTION 'Tabela não permitida';
  END IF;
  IF _patch ?| ARRAY['id','row_version','last_modified_by','created_at','updated_at'] THEN
    RAISE EXCEPTION 'Campos de controle não podem ser alterados';
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET %s WHERE id = $1 AND row_version = $2 RETURNING to_jsonb(%I.*)',
    _table_name,
    (SELECT string_agg(format('%I = ($3->>%L)::%s', c.column_name, c.column_name, c.udt_name), ', ')
       FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = _table_name
        AND c.column_name IN (SELECT jsonb_object_keys(_patch))
        AND c.column_name NOT IN ('id','row_version','last_modified_by','created_at','updated_at')),
    _table_name
  ) INTO v_result USING _record_id, _expected_version, _patch;

  IF v_result IS NULL THEN
    EXECUTE format('SELECT to_jsonb(t.*) FROM public.%I t WHERE id = $1', _table_name)
      INTO v_result USING _record_id;
    RETURN jsonb_build_object('ok', false, 'conflict', true, 'current', v_result);
  END IF;

  RETURN jsonb_build_object('ok', true, 'conflict', false, 'record', v_result);
END;
$$;

REVOKE ALL ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) TO service_role;