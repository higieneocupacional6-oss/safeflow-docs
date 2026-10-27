-- A descrição técnica qualitativa ia no JSON da avaliação, mas as duas funções
-- de gravação só persistiam esse texto nas linhas filhas. Avaliação qualitativa
-- não cria essas linhas, então o texto sumia ao reabrir o documento.

ALTER TABLE public.ltcat_avaliacoes ADD COLUMN IF NOT EXISTS descricao_avaliacao text;

DO $migration$
DECLARE
  definition text;
  marker text;
  injection text;
  signature regprocedure;
BEGIN
  FOR signature IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('save_ltcat_documento_v2', 'sync_ltcat_avaliacoes')
  LOOP
    definition := pg_get_functiondef(signature);
    IF definition LIKE '%IF v_av ? ''descricao_avaliacao'' THEN%' THEN
      CONTINUE;
    END IF;
    IF definition LIKE '%FUNCTION public.save_ltcat_documento_v2(%' THEN
      marker := '    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->''componentes'',''[]''::jsonb)) LOOP';
    ELSE
      marker := '    DELETE FROM public.ltcat_av_componentes WHERE avaliacao_id = v_id;';
    END IF;
    IF strpos(definition, marker) = 0 THEN
      RAISE EXCEPTION 'Limite da avaliação pai não encontrado em %', signature;
    END IF;
    injection := E'    IF v_av ? ''descricao_avaliacao'' THEN\n      UPDATE public.ltcat_avaliacoes SET descricao_avaliacao = NULLIF(v_av->>''descricao_avaliacao'', '''')\n      WHERE id = v_id AND documento_id = _documento_id;\n    END IF;\n\n';
    EXECUTE replace(definition, marker, injection || marker);
  END LOOP;
END;
$migration$;
