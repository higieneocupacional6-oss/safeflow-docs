CREATE OR REPLACE FUNCTION public.save_ltcat_documento_v2(
  _documento_id uuid,
  _empresa_id uuid,
  _tipo_documento text,
  _expected_row_version bigint,
  _document_patch jsonb,
  _avaliacoes jsonb,
  _delete_avaliacao_ids uuid[],
  _delete_child_ids jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_av jsonb;
  v_child jsonb;
  v_id uuid;
  v_current_version bigint;
  v_new_version bigint;
  v_count integer := 0;
  v_deleted integer := 0;
  v_deleted_children integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;
  IF _documento_id IS NULL OR _empresa_id IS NULL THEN
    RAISE EXCEPTION 'Documento e empresa são obrigatórios';
  END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN
    RAISE EXCEPTION 'Tipo de documento inválido';
  END IF;
  IF jsonb_typeof(COALESCE(_avaliacoes, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Avaliações devem ser uma lista';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_documento_id::text, 0));

  SELECT d.row_version
    INTO v_current_version
    FROM public.documentos d
   WHERE d.id = _documento_id
     AND d.empresa_id = _empresa_id
     AND lower(d.tipo) = _tipo_documento
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Documento não encontrado ou incompatível' USING ERRCODE = '42501';
  END IF;

  IF _expected_row_version IS NULL OR v_current_version <> _expected_row_version THEN
    RETURN jsonb_build_object(
      'ok', false,
      'conflict', true,
      'current_row_version', v_current_version
    );
  END IF;

  FOR v_av IN SELECT value FROM jsonb_array_elements(COALESCE(_avaliacoes, '[]'::jsonb))
  LOOP
    v_id := NULLIF(v_av->>'id', '')::uuid;
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Toda avaliação deve possuir identificador';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.ltcat_avaliacoes a
       WHERE a.id = v_id AND a.documento_id <> _documento_id
    ) THEN
      RAISE EXCEPTION 'Identificador de avaliação pertence a outro documento';
    END IF;

    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador,
      tipo_avaliacao, tipo_agente, agente_id, tecnica_id, equipamento_id,
      resultado, unidade_resultado_id, limite_tolerancia, unidade_limite_id,
      codigo_esocial, descricao_esocial, propagacao, tipo_exposicao,
      fonte_geradora, danos_saude, medidas_controle, parecer_tecnico,
      aposentadoria_especial, data_avaliacao, funcoes_ges, tempo_coleta,
      unidade_tempo_coleta, tipo_documento, ficha_tecnica_resultado_id, created_by
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
      CASE WHEN jsonb_typeof(v_av->'propagacao') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(v_av->'propagacao'))
        ELSE NULLIF(v_av->>'propagacao','')::text[] END,
      NULLIF(v_av->>'tipo_exposicao',''), NULLIF(v_av->>'fonte_geradora',''),
      NULLIF(v_av->>'danos_saude',''), NULLIF(v_av->>'medidas_controle',''),
      NULLIF(v_av->>'parecer_tecnico',''), NULLIF(v_av->>'aposentadoria_especial',''),
      NULLIF(v_av->>'data_avaliacao','')::date, NULLIF(v_av->>'funcoes_ges',''),
      NULLIF(v_av->>'tempo_coleta',''), NULLIF(v_av->>'unidade_tempo_coleta',''),
      _tipo_documento, NULLIF(v_av->>'ficha_tecnica_resultado_id','')::uuid, auth.uid()
    )
    ON CONFLICT (id) DO UPDATE SET
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
      tipo_documento = EXCLUDED.tipo_documento,
      ficha_tecnica_resultado_id = EXCLUDED.ficha_tecnica_resultado_id
    WHERE public.ltcat_avaliacoes.documento_id = _documento_id;

    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'componentes','[]'::jsonb)) WITH ORDINALITY LOOP
      INSERT INTO public.ltcat_av_componentes (
        id, avaliacao_id, ordem, componente, cas, resultado, unidade_resultado_id,
        limite_tolerancia, unidade_limite_id, tempo_coleta, unidade_tempo_coleta,
        dose_percentual, situacao, cod_gfip, colaborador, funcao_id, data_avaliacao,
        descricao_avaliacao, parecer_tecnico, aposentadoria_especial,
        numero_serie_bomba, amostrador, tipo_documento
      ) VALUES (
        NULLIF(v_child->>'id','')::uuid, v_id, COALESCE((v_child->>'ordem')::integer, 0),
        NULLIF(v_child->>'componente',''), NULLIF(v_child->>'cas',''), NULLIF(v_child->>'resultado','')::numeric,
        NULLIF(v_child->>'unidade_resultado_id','')::uuid, NULLIF(v_child->>'limite_tolerancia','')::numeric,
        NULLIF(v_child->>'unidade_limite_id','')::uuid, NULLIF(v_child->>'tempo_coleta',''),
        NULLIF(v_child->>'unidade_tempo_coleta',''), NULLIF(v_child->>'dose_percentual','')::numeric,
        NULLIF(v_child->>'situacao',''), NULLIF(v_child->>'cod_gfip',''), NULLIF(v_child->>'colaborador',''),
        NULLIF(v_child->>'funcao_id','')::uuid, NULLIF(v_child->>'data_avaliacao','')::date,
        NULLIF(v_child->>'descricao_avaliacao',''), NULLIF(v_child->>'parecer_tecnico',''),
        NULLIF(v_child->>'aposentadoria_especial',''), NULLIF(v_child->>'numero_serie_bomba',''),
        NULLIF(v_child->>'amostrador',''), _tipo_documento
      ) ON CONFLICT (id) DO UPDATE SET
        ordem=EXCLUDED.ordem, componente=EXCLUDED.componente, cas=EXCLUDED.cas, resultado=EXCLUDED.resultado,
        unidade_resultado_id=EXCLUDED.unidade_resultado_id, limite_tolerancia=EXCLUDED.limite_tolerancia,
        unidade_limite_id=EXCLUDED.unidade_limite_id, tempo_coleta=EXCLUDED.tempo_coleta,
        unidade_tempo_coleta=EXCLUDED.unidade_tempo_coleta, dose_percentual=EXCLUDED.dose_percentual,
        situacao=EXCLUDED.situacao, cod_gfip=EXCLUDED.cod_gfip, colaborador=EXCLUDED.colaborador,
        funcao_id=EXCLUDED.funcao_id, data_avaliacao=EXCLUDED.data_avaliacao,
        descricao_avaliacao=EXCLUDED.descricao_avaliacao, parecer_tecnico=EXCLUDED.parecer_tecnico,
        aposentadoria_especial=EXCLUDED.aposentadoria_especial, numero_serie_bomba=EXCLUDED.numero_serie_bomba,
        amostrador=EXCLUDED.amostrador, tipo_documento=EXCLUDED.tipo_documento
      WHERE public.ltcat_av_componentes.avaliacao_id = v_id;
    END LOOP;

    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'calor','[]'::jsonb)) WITH ORDINALITY LOOP
      INSERT INTO public.ltcat_av_calor (
        id, avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao,
        ibutg_medido, ibutg_limite, m_kcal_h, tipo_atividade, taxa_metabolica,
        descricao_atividade, situacao, cod_gfip, parecer_tecnico,
        aposentadoria_especial, local_atividade, equipamento_id, tempo_exposicao,
        ibutg_tipo, tbn_valores, tg_valores, tbs_valores, tipo_documento
      ) VALUES (
        NULLIF(v_child->>'id','')::uuid, v_id, COALESCE((v_child->>'ordem')::integer, 0),
        NULLIF(v_child->>'colaborador',''), NULLIF(v_child->>'funcao_id','')::uuid,
        NULLIF(v_child->>'data_avaliacao','')::date, NULLIF(v_child->>'ibutg_medido','')::numeric,
        NULLIF(v_child->>'ibutg_limite','')::numeric, NULLIF(v_child->>'m_kcal_h','')::numeric,
        NULLIF(v_child->>'tipo_atividade',''), NULLIF(v_child->>'taxa_metabolica',''),
        NULLIF(v_child->>'descricao_atividade',''), NULLIF(v_child->>'situacao',''),
        NULLIF(v_child->>'cod_gfip',''), NULLIF(v_child->>'parecer_tecnico',''),
        NULLIF(v_child->>'aposentadoria_especial',''), NULLIF(v_child->>'local_atividade',''),
        NULLIF(v_child->>'equipamento_id','')::uuid, NULLIF(v_child->>'tempo_exposicao',''),
        NULLIF(v_child->>'ibutg_tipo',''), NULLIF(v_child->>'tbn_valores',''),
        NULLIF(v_child->>'tg_valores',''), NULLIF(v_child->>'tbs_valores',''), _tipo_documento
      ) ON CONFLICT (id) DO UPDATE SET
        ordem=EXCLUDED.ordem, colaborador=EXCLUDED.colaborador, funcao_id=EXCLUDED.funcao_id,
        data_avaliacao=EXCLUDED.data_avaliacao, ibutg_medido=EXCLUDED.ibutg_medido,
        ibutg_limite=EXCLUDED.ibutg_limite, m_kcal_h=EXCLUDED.m_kcal_h,
        tipo_atividade=EXCLUDED.tipo_atividade, taxa_metabolica=EXCLUDED.taxa_metabolica,
        descricao_atividade=EXCLUDED.descricao_atividade, situacao=EXCLUDED.situacao,
        cod_gfip=EXCLUDED.cod_gfip, parecer_tecnico=EXCLUDED.parecer_tecnico,
        aposentadoria_especial=EXCLUDED.aposentadoria_especial, local_atividade=EXCLUDED.local_atividade,
        equipamento_id=EXCLUDED.equipamento_id, tempo_exposicao=EXCLUDED.tempo_exposicao,
        ibutg_tipo=EXCLUDED.ibutg_tipo, tbn_valores=EXCLUDED.tbn_valores,
        tg_valores=EXCLUDED.tg_valores, tbs_valores=EXCLUDED.tbs_valores,
        tipo_documento=EXCLUDED.tipo_documento
      WHERE public.ltcat_av_calor.avaliacao_id = v_id;
    END LOOP;

    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'vibracao','[]'::jsonb)) WITH ORDINALITY LOOP
      INSERT INTO public.ltcat_av_vibracao (
        id, avaliacao_id, ordem, tipo, colaborador, funcao_id, data_avaliacao,
        aren, vdvr, aren_limite, vdvr_limite, tempo_exposicao, situacao,
        cod_gfip, parecer_tecnico, aposentadoria_especial, tipo_documento
      ) VALUES (
        NULLIF(v_child->>'id','')::uuid, v_id, COALESCE((v_child->>'ordem')::integer, 0),
        NULLIF(v_child->>'tipo',''), NULLIF(v_child->>'colaborador',''), NULLIF(v_child->>'funcao_id','')::uuid,
        NULLIF(v_child->>'data_avaliacao','')::date, NULLIF(v_child->>'aren','')::numeric,
        NULLIF(v_child->>'vdvr','')::numeric, NULLIF(v_child->>'aren_limite','')::numeric,
        NULLIF(v_child->>'vdvr_limite','')::numeric, NULLIF(v_child->>'tempo_exposicao',''),
        NULLIF(v_child->>'situacao',''), NULLIF(v_child->>'cod_gfip',''),
        NULLIF(v_child->>'parecer_tecnico',''), NULLIF(v_child->>'aposentadoria_especial',''), _tipo_documento
      ) ON CONFLICT (id) DO UPDATE SET
        ordem=EXCLUDED.ordem, tipo=EXCLUDED.tipo, colaborador=EXCLUDED.colaborador,
        funcao_id=EXCLUDED.funcao_id, data_avaliacao=EXCLUDED.data_avaliacao, aren=EXCLUDED.aren,
        vdvr=EXCLUDED.vdvr, aren_limite=EXCLUDED.aren_limite, vdvr_limite=EXCLUDED.vdvr_limite,
        tempo_exposicao=EXCLUDED.tempo_exposicao, situacao=EXCLUDED.situacao,
        cod_gfip=EXCLUDED.cod_gfip, parecer_tecnico=EXCLUDED.parecer_tecnico,
        aposentadoria_especial=EXCLUDED.aposentadoria_especial, tipo_documento=EXCLUDED.tipo_documento
      WHERE public.ltcat_av_vibracao.avaliacao_id = v_id;
    END LOOP;

    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'resultados','[]'::jsonb)) WITH ORDINALITY LOOP
      INSERT INTO public.ltcat_av_resultados (
        id, avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao, resultado,
        unidade_resultado_id, limite_tolerancia, unidade_limite_id, tempo_coleta,
        unidade_tempo_coleta, dose_percentual, situacao, cod_gfip,
        descricao_avaliacao, parecer_tecnico, aposentadoria_especial,
        equipamento_registro_id, tipo_documento
      ) VALUES (
        NULLIF(v_child->>'id','')::uuid, v_id, COALESCE((v_child->>'ordem')::integer, 0),
        NULLIF(v_child->>'colaborador',''), NULLIF(v_child->>'funcao_id','')::uuid,
        NULLIF(v_child->>'data_avaliacao','')::date, NULLIF(v_child->>'resultado','')::numeric,
        NULLIF(v_child->>'unidade_resultado_id','')::uuid, NULLIF(v_child->>'limite_tolerancia','')::numeric,
        NULLIF(v_child->>'unidade_limite_id','')::uuid, NULLIF(v_child->>'tempo_coleta',''),
        NULLIF(v_child->>'unidade_tempo_coleta',''), NULLIF(v_child->>'dose_percentual','')::numeric,
        NULLIF(v_child->>'situacao',''), NULLIF(v_child->>'cod_gfip',''),
        NULLIF(v_child->>'descricao_avaliacao',''), NULLIF(v_child->>'parecer_tecnico',''),
        NULLIF(v_child->>'aposentadoria_especial',''), NULLIF(v_child->>'equipamento_registro_id','')::uuid,
        _tipo_documento
      ) ON CONFLICT (id) DO UPDATE SET
        ordem=EXCLUDED.ordem, colaborador=EXCLUDED.colaborador, funcao_id=EXCLUDED.funcao_id,
        data_avaliacao=EXCLUDED.data_avaliacao, resultado=EXCLUDED.resultado,
        unidade_resultado_id=EXCLUDED.unidade_resultado_id, limite_tolerancia=EXCLUDED.limite_tolerancia,
        unidade_limite_id=EXCLUDED.unidade_limite_id, tempo_coleta=EXCLUDED.tempo_coleta,
        unidade_tempo_coleta=EXCLUDED.unidade_tempo_coleta, dose_percentual=EXCLUDED.dose_percentual,
        situacao=EXCLUDED.situacao, cod_gfip=EXCLUDED.cod_gfip,
        descricao_avaliacao=EXCLUDED.descricao_avaliacao, parecer_tecnico=EXCLUDED.parecer_tecnico,
        aposentadoria_especial=EXCLUDED.aposentadoria_especial,
        equipamento_registro_id=EXCLUDED.equipamento_registro_id, tipo_documento=EXCLUDED.tipo_documento
      WHERE public.ltcat_av_resultados.avaliacao_id = v_id;
    END LOOP;

    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'equipamentos','[]'::jsonb)) WITH ORDINALITY LOOP
      INSERT INTO public.ltcat_av_equipamentos (
        id, avaliacao_id, ordem, nome_equipamento, modelo_equipamento,
        serie_equipamento, data_calibracao, data_avaliacao, agente_nome, tipo_documento
      ) VALUES (
        NULLIF(v_child->>'id','')::uuid, v_id, COALESCE((v_child->>'ordem')::integer, 0),
        NULLIF(v_child->>'nome_equipamento',''), NULLIF(v_child->>'modelo_equipamento',''),
        NULLIF(v_child->>'serie_equipamento',''), NULLIF(v_child->>'data_calibracao','')::date,
        NULLIF(v_child->>'data_avaliacao','')::date, NULLIF(v_child->>'agente_nome',''), _tipo_documento
      ) ON CONFLICT (id) DO UPDATE SET
        ordem=EXCLUDED.ordem, nome_equipamento=EXCLUDED.nome_equipamento,
        modelo_equipamento=EXCLUDED.modelo_equipamento, serie_equipamento=EXCLUDED.serie_equipamento,
        data_calibracao=EXCLUDED.data_calibracao, data_avaliacao=EXCLUDED.data_avaliacao,
        agente_nome=EXCLUDED.agente_nome, tipo_documento=EXCLUDED.tipo_documento
      WHERE public.ltcat_av_equipamentos.avaliacao_id = v_id;
    END LOOP;

    IF COALESCE(v_av->'epi_epc', '{}'::jsonb) <> '{}'::jsonb THEN
      INSERT INTO public.ltcat_av_epi_epc (
        id, avaliacao_id, epi_id, epi_ca, epi_atenuacao, epi_eficaz,
        epc_id, epc_eficaz, tipo_documento
      ) VALUES (
        COALESCE(NULLIF(v_av->'epi_epc'->>'id','')::uuid, gen_random_uuid()), v_id,
        NULLIF(v_av->'epi_epc'->>'epi_id','')::uuid,
        NULLIF(v_av->'epi_epc'->>'epi_ca',''), NULLIF(v_av->'epi_epc'->>'epi_atenuacao',''),
        NULLIF(v_av->'epi_epc'->>'epi_eficaz',''), NULLIF(v_av->'epi_epc'->>'epc_id','')::uuid,
        NULLIF(v_av->'epi_epc'->>'epc_eficaz',''), _tipo_documento
      ) ON CONFLICT (avaliacao_id) DO UPDATE SET
        epi_id=EXCLUDED.epi_id, epi_ca=EXCLUDED.epi_ca, epi_atenuacao=EXCLUDED.epi_atenuacao,
        epi_eficaz=EXCLUDED.epi_eficaz, epc_id=EXCLUDED.epc_id,
        epc_eficaz=EXCLUDED.epc_eficaz, tipo_documento=EXCLUDED.tipo_documento;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  DELETE FROM public.ltcat_av_componentes c
   WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'componentes','[]'::jsonb)))
     AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  GET DIAGNOSTICS v_deleted_children = ROW_COUNT;

  DELETE FROM public.ltcat_av_calor c
   WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'calor','[]'::jsonb)))
     AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_vibracao c
   WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'vibracao','[]'::jsonb)))
     AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_resultados c
   WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'resultados','[]'::jsonb)))
     AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_equipamentos c
   WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'equipamentos','[]'::jsonb)))
     AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_epi_epc c
   WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'epi_epc','[]'::jsonb)))
     AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);

  DELETE FROM public.ltcat_avaliacoes a
   WHERE a.documento_id = _documento_id
     AND a.id = ANY(COALESCE(_delete_avaliacao_ids, ARRAY[]::uuid[]));
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  UPDATE public.documentos d SET
    empresa_id = _empresa_id,
    empresa_nome = COALESCE(NULLIF(_document_patch->>'empresa_nome',''), d.empresa_nome),
    contrato_id = NULLIF(_document_patch->>'contrato_id','')::uuid,
    template_id = NULLIF(_document_patch->>'template_id','')::uuid,
    responsavel_tecnico = NULLIF(_document_patch->>'responsavel_tecnico',''),
    crea = NULLIF(_document_patch->>'crea',''),
    cargo = NULLIF(_document_patch->>'cargo',''),
    data_elaboracao = NULLIF(_document_patch->>'data_elaboracao','')::date,
    alteracoes_documento = NULLIF(_document_patch->>'alteracoes_documento',''),
    revisoes = COALESCE(_document_patch->'revisoes', '[]'::jsonb),
    current_step = COALESCE((_document_patch->>'current_step')::integer, 0),
    draft_snapshot = _document_patch->'draft_snapshot',
    status = COALESCE(NULLIF(_document_patch->>'status',''), 'rascunho'),
    updated_at = now()
  WHERE d.id = _documento_id
    AND d.row_version = _expected_row_version
  RETURNING d.row_version INTO v_new_version;

  IF v_new_version IS NULL THEN
    RAISE EXCEPTION 'Conflito de versão durante o salvamento' USING ERRCODE = '40001';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'conflict', false,
    'count', v_count,
    'deleted', v_deleted,
    'deleted_children', v_deleted_children,
    'row_version', v_new_version
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) TO service_role;