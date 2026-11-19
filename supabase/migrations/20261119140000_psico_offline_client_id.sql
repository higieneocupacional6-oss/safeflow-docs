-- Anti-duplicidade de respostas psicossociais sincronizadas offline
-- e exposição de avaliacao_id no link público (cache IndexedDB).

ALTER TABLE public.psico_respostas
  ADD COLUMN IF NOT EXISTS offline_client_id text;

CREATE UNIQUE INDEX IF NOT EXISTS psico_respostas_offline_client_id_uidx
  ON public.psico_respostas (offline_client_id)
  WHERE offline_client_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.psico_get_public_link(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_link record; v_result jsonb;
BEGIN
  SELECT l.id, l.empresa_id, l.ativo, l.avaliacao_id, l.contrato_id, e.razao_social
  INTO v_link
  FROM public.psico_links l
  JOIN public.empresas e ON e.id = l.empresa_id
  WHERE l.token = _token;

  IF NOT FOUND OR NOT v_link.ativo THEN
    RETURN jsonb_build_object('error', 'Link inválido ou desativado');
  END IF;

  SELECT jsonb_build_object(
    'link_id', v_link.id,
    'empresa_id', v_link.empresa_id,
    'empresa_nome', v_link.razao_social,
    'avaliacao_id', v_link.avaliacao_id,
    'contrato_id', v_link.contrato_id,
    'contratos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id,
        'nome', COALESCE(c.numero_contrato, c.escopo_contrato, 'Contrato'),
        'funcoes', COALESCE((
          SELECT jsonb_agg(DISTINCT jsonb_build_object('id', f.id, 'nome', f.nome_funcao))
          FROM public.setores s
          JOIN public.funcoes f ON f.setor_id = s.id
          WHERE s.contrato_id = c.id
        ), '[]'::jsonb)
      ) ORDER BY c.numero_contrato)
      FROM public.contratos c
      WHERE c.empresa_id = v_link.empresa_id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.psico_get_public_link(_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.psico_get_public_link(_token) $$;

CREATE OR REPLACE FUNCTION private.psico_submit_resposta(_token text, _payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link record;
  v_id uuid;
  v_funcao_id uuid;
  v_contrato_id uuid;
  v_client_id text;
BEGIN
  SELECT id, empresa_id, ativo, avaliacao_id, contrato_id
  INTO v_link
  FROM public.psico_links
  WHERE token = _token;

  IF NOT FOUND OR NOT v_link.ativo THEN
    RETURN jsonb_build_object('error', 'Link inválido');
  END IF;

  v_client_id := NULLIF(trim(COALESCE(_payload->>'offline_client_id', '')), '');
  IF v_client_id IS NOT NULL THEN
    SELECT id INTO v_id
    FROM public.psico_respostas
    WHERE offline_client_id = v_client_id
    LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('id', v_id, 'ok', true, 'duplicate', true);
    END IF;
  END IF;

  v_contrato_id := COALESCE(NULLIF(_payload->>'contrato_id', '')::uuid, v_link.contrato_id);
  IF v_contrato_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.contratos c
      WHERE c.id = v_contrato_id AND c.empresa_id = v_link.empresa_id
    ) THEN
      RETURN jsonb_build_object('error', 'Contrato inválido');
    END IF;
    SELECT f.id INTO v_funcao_id
    FROM public.funcoes f
    JOIN public.setores s ON s.id = f.setor_id
    WHERE s.contrato_id = v_contrato_id
      AND lower(trim(f.nome_funcao)) = lower(trim(_payload->>'funcao_nome'))
    LIMIT 1;
  END IF;

  INSERT INTO public.psico_respostas (
    link_id, empresa_id, contrato_id, contrato_nome, funcao_id, funcao_nome,
    colaborador_nome, data_avaliacao, respostas, blocos, alertas,
    resultado_psicossocial, riscos_psicossociais, total_positivas, total_negativas,
    copsoq_resultado_resumido, copsoq_riscos_identificados, avaliacao_id, offline_client_id
  )
  VALUES (
    v_link.id,
    v_link.empresa_id,
    v_contrato_id,
    _payload->>'contrato_nome',
    v_funcao_id,
    _payload->>'funcao_nome',
    _payload->>'colaborador_nome',
    COALESCE((_payload->>'data_avaliacao')::date, CURRENT_DATE),
    COALESCE(_payload->'respostas', '{}'::jsonb),
    COALESCE(_payload->'blocos', '{}'::jsonb),
    COALESCE(_payload->'alertas', '{}'::jsonb),
    _payload->>'resultado_psicossocial',
    _payload->>'riscos_psicossociais',
    COALESCE((_payload->>'total_positivas')::int, 0),
    COALESCE((_payload->>'total_negativas')::int, 0),
    _payload->>'copsoq_resultado_resumido',
    _payload->>'copsoq_riscos_identificados',
    v_link.avaliacao_id,
    v_client_id
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'ok', true, 'duplicate', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.psico_submit_resposta(_token text, _payload jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.psico_submit_resposta(_token, _payload) $$;
