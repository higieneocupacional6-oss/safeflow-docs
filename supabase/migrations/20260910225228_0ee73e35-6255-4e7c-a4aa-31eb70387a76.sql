CREATE OR REPLACE FUNCTION public.sync_ltcat_avaliacoes(
  _documento_id uuid,
  _empresa_id uuid,
  _tipo_documento text,
  _avaliacoes jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_av jsonb;
  v_id uuid;
  v_keep_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  IF _documento_id IS NULL OR _empresa_id IS NULL THEN
    RAISE EXCEPTION 'Documento e empresa são obrigatórios';
  END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN
    RAISE EXCEPTION 'Tipo de documento inválido';
  END IF;
  IF jsonb_typeof(COALESCE(_avaliacoes, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Avaliações devem ser uma lista';
  END IF;

  FOR v_av IN SELECT value FROM jsonb_array_elements(COALESCE(_avaliacoes, '[]'::jsonb))
  LOOP
    v_id := (v_av->>'id')::uuid;
    v_keep_ids := array_append(v_keep_ids, v_id);

    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador,
      tipo_avaliacao, tipo_agente, agente_id, tecnica_id, equipamento_id,
      resultado, unidade_resultado_id, limite_tolerancia, unidade_limite_id,
      codigo_esocial, descricao_esocial, propagacao, tipo_exposicao,
      fonte_geradora, danos_saude, medidas_controle, parecer_tecnico,
      aposentadoria_especial, data_avaliacao, funcoes_ges, tempo_coleta,
      unidade_tempo_coleta, tipo_documento
    ) VALUES (
      v_id, _documento_id, _empresa_id,
      NULLIF(v_av->>'contrato_id','')::uuid,
      NULLIF(v_av->>'setor_id','')::uuid,
      NULLIF(v_av->>'funcao_id','')::uuid,
      NULLIF(v_av->>'colaborador',''),
      NULLIF(v_av->>'tipo_avaliacao',''), NULLIF(v_av->>'tipo_agente',''),
      NULLIF(v_av->>'agente_id','')::uuid,
      NULLIF(v_av->>'tecnica_id','')::uuid,
      NULLIF(v_av->>'equipamento_id','')::uuid,
      NULLIF(v_av->>'resultado','')::numeric,
      NULLIF(v_av->>'unidade_resultado_id','')::uuid,
      NULLIF(v_av->>'limite_tolerancia','')::numeric,
      NULLIF(v_av->>'unidade_limite_id','')::uuid,
      NULLIF(v_av->>'codigo_esocial',''), NULLIF(v_av->>'descricao_esocial',''),
      CASE WHEN jsonb_typeof(v_av->'propagacao') = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(v_av->'propagacao')) ELSE NULLIF(v_av->>'propagacao','')::text[] END,
      NULLIF(v_av->>'tipo_exposicao',''), NULLIF(v_av->>'fonte_geradora',''),
      NULLIF(v_av->>'danos_saude',''), NULLIF(v_av->>'medidas_controle',''),
      NULLIF(v_av->>'parecer_tecnico',''), NULLIF(v_av->>'aposentadoria_especial',''),
      NULLIF(v_av->>'data_avaliacao','')::date, NULLIF(v_av->>'funcoes_ges',''),
      NULLIF(v_av->>'tempo_coleta',''), NULLIF(v_av->>'unidade_tempo_coleta',''),
      _tipo_documento
    )
    ON CONFLICT (id) DO UPDATE SET
      documento_id = EXCLUDED.documento_id, empresa_id = EXCLUDED.empresa_id,
      contrato_id = EXCLUDED.contrato_id, setor_id = EXCLUDED.setor_id,
      funcao_id = EXCLUDED.funcao_id, colaborador = EXCLUDED.colaborador,
      tipo_avaliacao = EXCLUDED.tipo_avaliacao, tipo_agente = EXCLUDED.tipo_agente,
      agente_id = EXCLUDED.agente_id, tecnica_id = EXCLUDED.tecnica_id,
      equipamento_id = EXCLUDED.equipamento_id, resultado = EXCLUDED.resultado,
      unidade_resultado_id = EXCLUDED.unidade_resultado_id,
      limite_tolerancia = EXCLUDED.limite_tolerancia,
      unidade_limite_id = EXCLUDED.unidade_limite_id,
      codigo_esocial = EXCLUDED.codigo_esocial, descricao_esocial = EXCLUDED.descricao_esocial,
      propagacao = EXCLUDED.propagacao, tipo_exposicao = EXCLUDED.tipo_exposicao,
      fonte_geradora = EXCLUDED.fonte_geradora, danos_saude = EXCLUDED.danos_saude,
      medidas_controle = EXCLUDED.medidas_controle, parecer_tecnico = EXCLUDED.parecer_tecnico,
      aposentadoria_especial = EXCLUDED.aposentadoria_especial,
      data_avaliacao = EXCLUDED.data_avaliacao, funcoes_ges = EXCLUDED.funcoes_ges,
      tempo_coleta = EXCLUDED.tempo_coleta,
      unidade_tempo_coleta = EXCLUDED.unidade_tempo_coleta,
      tipo_documento = EXCLUDED.tipo_documento;

    DELETE FROM public.ltcat_av_componentes WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_componentes (
      id, avaliacao_id, ordem, componente, cas, resultado, unidade_resultado_id,
      limite_tolerancia, unidade_limite_id, tempo_coleta, unidade_tempo_coleta,
      dose_percentual, situacao, cod_gfip, colaborador, funcao_id, data_avaliacao,
      descricao_avaliacao, parecer_tecnico, aposentadoria_especial,
      numero_serie_bomba, amostrador, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'componente',''), NULLIF(x->>'cas',''), NULLIF(x->>'resultado','')::numeric,
      NULLIF(x->>'unidade_resultado_id','')::uuid, NULLIF(x->>'limite_tolerancia','')::numeric,
      NULLIF(x->>'unidade_limite_id','')::uuid, NULLIF(x->>'tempo_coleta',''),
      NULLIF(x->>'unidade_tempo_coleta',''), NULLIF(x->>'dose_percentual','')::numeric,
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''), NULLIF(x->>'colaborador',''),
      NULLIF(x->>'funcao_id','')::uuid, NULLIF(x->>'data_avaliacao','')::date,
      NULLIF(x->>'descricao_avaliacao',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'numero_serie_bomba',''),
      NULLIF(x->>'amostrador',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'componentes','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_calor WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_calor (
      id, avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao,
      ibutg_medido, ibutg_limite, m_kcal_h, tipo_atividade, taxa_metabolica,
      descricao_atividade, situacao, cod_gfip, parecer_tecnico,
      aposentadoria_especial, local_atividade, equipamento_id, tempo_exposicao,
      ibutg_tipo, tbn_valores, tg_valores, tbs_valores, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'ibutg_medido','')::numeric,
      NULLIF(x->>'ibutg_limite','')::numeric, NULLIF(x->>'m_kcal_h','')::numeric,
      NULLIF(x->>'tipo_atividade',''), NULLIF(x->>'taxa_metabolica',''),
      NULLIF(x->>'descricao_atividade',''), NULLIF(x->>'situacao',''),
      NULLIF(x->>'cod_gfip',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'local_atividade',''),
      NULLIF(x->>'equipamento_id','')::uuid, NULLIF(x->>'tempo_exposicao',''),
      NULLIF(x->>'ibutg_tipo',''), NULLIF(x->>'tbn_valores',''),
      NULLIF(x->>'tg_valores',''), NULLIF(x->>'tbs_valores',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'calor','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_vibracao WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_vibracao (
      id, avaliacao_id, ordem, tipo, colaborador, funcao_id, data_avaliacao,
      aren, vdvr, aren_limite, vdvr_limite, tempo_exposicao, situacao,
      cod_gfip, parecer_tecnico, aposentadoria_especial, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'tipo',''), NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'aren','')::numeric,
      NULLIF(x->>'vdvr','')::numeric, NULLIF(x->>'aren_limite','')::numeric,
      NULLIF(x->>'vdvr_limite','')::numeric, NULLIF(x->>'tempo_exposicao',''),
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''),
      NULLIF(x->>'parecer_tecnico',''), NULLIF(x->>'aposentadoria_especial',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'vibracao','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_resultados WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_resultados (
      id, avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao, resultado,
      unidade_resultado_id, limite_tolerancia, unidade_limite_id, tempo_coleta,
      unidade_tempo_coleta, dose_percentual, situacao, cod_gfip,
      descricao_avaliacao, parecer_tecnico, aposentadoria_especial,
      equipamento_registro_id, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'resultado','')::numeric,
      NULLIF(x->>'unidade_resultado_id','')::uuid, NULLIF(x->>'limite_tolerancia','')::numeric,
      NULLIF(x->>'unidade_limite_id','')::uuid, NULLIF(x->>'tempo_coleta',''),
      NULLIF(x->>'unidade_tempo_coleta',''), NULLIF(x->>'dose_percentual','')::numeric,
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''),
      NULLIF(x->>'descricao_avaliacao',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'equipamento_registro_id','')::uuid,
      _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'resultados','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_equipamentos WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_equipamentos (
      id, avaliacao_id, ordem, nome_equipamento, modelo_equipamento,
      serie_equipamento, data_calibracao, data_avaliacao, agente_nome,
      tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'nome_equipamento',''), NULLIF(x->>'modelo_equipamento',''),
      NULLIF(x->>'serie_equipamento',''), NULLIF(x->>'data_calibracao','')::date,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'agente_nome',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'equipamentos','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_epi_epc WHERE avaliacao_id = v_id;
    IF COALESCE(v_av->'epi_epc', '{}'::jsonb) <> '{}'::jsonb THEN
      INSERT INTO public.ltcat_av_epi_epc (
        id, avaliacao_id, epi_id, epi_ca, epi_atenuacao, epi_eficaz,
        epc_id, epc_eficaz, tipo_documento
      ) VALUES (
        COALESCE(NULLIF(v_av->'epi_epc'->>'id','')::uuid, gen_random_uuid()), v_id,
        NULLIF(v_av->'epi_epc'->>'epi_id','')::uuid,
        NULLIF(v_av->'epi_epc'->>'epi_ca',''), NULLIF(v_av->'epi_epc'->>'epi_atenuacao',''),
        NULLIF(v_av->'epi_epc'->>'epi_eficaz',''),
        NULLIF(v_av->'epi_epc'->>'epc_id','')::uuid,
        NULLIF(v_av->'epi_epc'->>'epc_eficaz',''), _tipo_documento
      );
    END IF;
  END LOOP;

  DELETE FROM public.ltcat_avaliacoes
  WHERE documento_id = _documento_id
    AND NOT (id = ANY(v_keep_ids));

  RETURN jsonb_build_object('ok', true, 'count', cardinality(v_keep_ids));
END;
$$;

REVOKE ALL ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) TO service_role;