-- O salvamento do LTCAT conferia a versão, mas o UPDATE não a incrementava.
-- Dois usuários gravavam ao mesmo tempo e o último apagava a alteração do outro.
-- A função em produção é atualizada no lugar, sem recriar tabelas nem apagar linhas.

DO $$
DECLARE
  src text := pg_get_functiondef(
    'public.save_ltcat_documento_v2(uuid,uuid,text,bigint,jsonb,jsonb,uuid[],jsonb)'::regprocedure
  );
BEGIN
  IF src NOT LIKE '%row_version = d.row_version + 1%'
     AND src LIKE '%updated_at = now()%' THEN
    src := replace(
      src,
      'updated_at = now()',
      'row_version = d.row_version + 1,' || E'\n    updated_at = now()'
    );
    EXECUTE src;
  END IF;
END $$;
