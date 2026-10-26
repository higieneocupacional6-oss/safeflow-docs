-- Cadastros Gerais: persistência, concorrência e RLS.
-- Não remove dados. RLS permanece ativo. Anônimo continua sem política de acesso.
-- Admin e usuário autenticado gravam os catálogos da tela Cadastros Gerais,
-- no mesmo modelo já usado por riscos, EPI/EPC, equipamentos, exames e treinamentos.

-- Campo obrigatório que o formulário não enviava e que estava sem default no banco.
UPDATE public.equipamentos_ho_registros
   SET situacao_operacional = 'Aparelho calibrado'
 WHERE situacao_operacional IS NULL;

ALTER TABLE public.equipamentos_ho_registros
  ALTER COLUMN situacao_operacional SET DEFAULT 'Aparelho calibrado';

ALTER TABLE public.equipamentos_ho_registros
  DROP CONSTRAINT IF EXISTS equipamentos_ho_registros_situacao_operacional_check;

ALTER TABLE public.equipamentos_ho_registros
  ADD CONSTRAINT equipamentos_ho_registros_situacao_operacional_check
  CHECK (situacao_operacional IN (
    'Aparelhos enviados',
    'Calibração em andamento',
    'Aparelhos em logística',
    'Aparelho calibrado'
  ));

-- Versão otimista nos catálogos editados por mais de uma pessoa.
ALTER TABLE public.tecnicas_amostragem
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.unidades
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.equipamentos_ho
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.equipamentos_ho_registros
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.epi_epc
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.pareceres_tecnicos
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.treinamentos_cadastro
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.exames_cadastro
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.responsaveis
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_modified_by uuid;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tecnicas_amostragem','unidades','equipamentos_ho','equipamentos_ho_registros',
    'epi_epc','pareceres_tecnicos','treinamentos_cadastro','exames_cadastro','responsaveis'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_track_shared_change ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_track_shared_change BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.track_shared_change()',
      t
    );
  END LOOP;
END $$;

-- Impede duplicata quando dois usuários salvam o mesmo item ao mesmo tempo.
-- Só é criado porque a verificação prévia não encontrou duplicatas existentes.
CREATE UNIQUE INDEX IF NOT EXISTS tecnicas_amostragem_nome_unique
  ON public.tecnicas_amostragem (lower(btrim(nome)));
CREATE UNIQUE INDEX IF NOT EXISTS unidades_simbolo_unique
  ON public.unidades (lower(btrim(simbolo)));
CREATE UNIQUE INDEX IF NOT EXISTS equipamentos_ho_nome_unique
  ON public.equipamentos_ho (lower(btrim(nome)));
CREATE UNIQUE INDEX IF NOT EXISTS riscos_tipo_nome_unique
  ON public.riscos (lower(btrim(tipo)), lower(btrim(nome)));
CREATE UNIQUE INDEX IF NOT EXISTS epi_epc_tipo_nome_unique
  ON public.epi_epc (tipo, lower(btrim(nome)));
CREATE UNIQUE INDEX IF NOT EXISTS exames_cadastro_nome_unique
  ON public.exames_cadastro (lower(btrim(nome)));
CREATE UNIQUE INDEX IF NOT EXISTS exames_cadastro_codigo_unique
  ON public.exames_cadastro (lower(btrim(codigo_esocial)));
CREATE UNIQUE INDEX IF NOT EXISTS treinamentos_cadastro_nome_unique
  ON public.treinamentos_cadastro (lower(btrim(nome)));
CREATE UNIQUE INDEX IF NOT EXISTS equipamentos_ho_registros_serie_unique
  ON public.equipamentos_ho_registros (equipamento_id, lower(btrim(numero_serie)));

-- Técnicas e unidades só tinham INSERT de admin e nenhuma política de UPDATE/DELETE.
-- A tela é usada pelos dois perfis autenticados. Anônimo segue sem política.
DROP POLICY IF EXISTS "Admins can insert tecnicas_amostragem" ON public.tecnicas_amostragem;
DROP POLICY IF EXISTS "Anyone can insert tecnicas_amostragem" ON public.tecnicas_amostragem;
DROP POLICY IF EXISTS "Authenticated can insert tecnicas_amostragem" ON public.tecnicas_amostragem;
DROP POLICY IF EXISTS "Authenticated can update tecnicas_amostragem" ON public.tecnicas_amostragem;
DROP POLICY IF EXISTS "Authenticated can delete tecnicas_amostragem" ON public.tecnicas_amostragem;
CREATE POLICY "Authenticated can insert tecnicas_amostragem"
  ON public.tecnicas_amostragem FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tecnicas_amostragem"
  ON public.tecnicas_amostragem FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete tecnicas_amostragem"
  ON public.tecnicas_amostragem FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert unidades" ON public.unidades;
DROP POLICY IF EXISTS "Anyone can insert unidades" ON public.unidades;
DROP POLICY IF EXISTS "Authenticated can insert unidades" ON public.unidades;
DROP POLICY IF EXISTS "Authenticated can update unidades" ON public.unidades;
DROP POLICY IF EXISTS "Authenticated can delete unidades" ON public.unidades;
CREATE POLICY "Authenticated can insert unidades"
  ON public.unidades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update unidades"
  ON public.unidades FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete unidades"
  ON public.unidades FOR DELETE TO authenticated USING (true);

-- Atualização concorrente: preserva tipos (inclusive arrays), rejeita NULL em campo
-- obrigatório e só grava se a versão lida pelo cliente ainda for a atual.
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
  v_set text := '';
  v_col record;
  v_expr text;
  v_cast text;
  v_nullish boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;

  IF _table_name NOT IN (
    'empresas','contratos','setores','funcoes','riscos','documentos',
    'aet_documentos','aep_documentos','pcmso_documentos',
    'tecnicas_amostragem','unidades','equipamentos_ho','equipamentos_ho_registros',
    'epi_epc','pareceres_tecnicos','treinamentos_cadastro','exames_cadastro','responsaveis'
  ) THEN
    RAISE EXCEPTION 'Tabela não permitida';
  END IF;

  IF _patch ?| ARRAY['id','row_version','last_modified_by','created_at','updated_at'] THEN
    RAISE EXCEPTION 'Campos de controle não podem ser alterados';
  END IF;

  FOR v_col IN
    SELECT a.attname AS column_name,
           pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
           a.attnotnull AS not_null,
           t.typcategory AS category
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_type t ON t.oid = a.atttypid
     WHERE n.nspname = 'public'
       AND c.relname = _table_name
       AND a.attnum > 0
       AND NOT a.attisdropped
       AND a.attname IN (SELECT jsonb_object_keys(_patch))
       AND a.attname NOT IN ('id','row_version','last_modified_by','created_at','updated_at')
  LOOP
    v_nullish := jsonb_typeof(_patch -> v_col.column_name) = 'null'
      OR (
        jsonb_typeof(_patch -> v_col.column_name) = 'string'
        AND btrim(_patch ->> v_col.column_name) = ''
        AND v_col.category <> 'S'
      );
    IF v_nullish AND v_col.not_null THEN
      RAISE EXCEPTION 'O campo obrigatório "%" não pode ser nulo', v_col.column_name
        USING ERRCODE = '23502';
    END IF;

    v_cast := regexp_replace(v_col.data_type, '\(.*\)$', '');

    IF v_col.category = 'A' THEN
      v_expr := format(
        '(CASE WHEN jsonb_typeof($3 -> %1$L) = ''null'' THEN NULL WHEN jsonb_typeof($3 -> %1$L) <> ''array'' THEN NULL ELSE COALESCE((SELECT array_agg(value) FROM jsonb_array_elements_text($3 -> %1$L)), ARRAY[]::text[]) END)::%2$s',
        v_col.column_name,
        v_col.data_type
      );
    ELSIF v_col.data_type IN ('jsonb', 'json') THEN
      v_expr := format(
        'CASE WHEN jsonb_typeof($3 -> %1$L) = ''null'' THEN NULL ELSE $3 -> %1$L END',
        v_col.column_name
      );
    ELSIF v_col.category IN ('N', 'B', 'D') OR v_col.data_type = 'uuid' THEN
      v_expr := format(
        'NULLIF($3 ->> %1$L, '''')::%2$s',
        v_col.column_name,
        v_cast
      );
    ELSE
      v_expr := format(
        'CASE WHEN jsonb_typeof($3 -> %1$L) = ''null'' THEN NULL ELSE $3 ->> %1$L END',
        v_col.column_name
      );
    END IF;

    v_set := v_set || CASE WHEN v_set = '' THEN '' ELSE ', ' END || format('%I = %s', v_col.column_name, v_expr);
  END LOOP;

  IF v_set = '' THEN
    RAISE EXCEPTION 'Nenhum campo válido para atualizar';
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET %s WHERE id = $1 AND row_version = $2 RETURNING to_jsonb(%I.*)',
    _table_name,
    v_set,
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

-- A publicação realtime estava vazia: outro computador não recebia as gravações.
DO $$
DECLARE t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RAISE EXCEPTION 'Publicação supabase_realtime não encontrada';
  END IF;
  FOR t IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
