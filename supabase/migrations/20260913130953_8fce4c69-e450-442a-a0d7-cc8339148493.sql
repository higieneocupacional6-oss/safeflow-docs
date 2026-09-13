CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.has_role(_user_id, _role) $$;

CREATE OR REPLACE FUNCTION private.psico_get_public_link(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_link record; v_result jsonb;
BEGIN
  SELECT l.id, l.empresa_id, l.ativo, e.razao_social INTO v_link
  FROM public.psico_links l JOIN public.empresas e ON e.id = l.empresa_id
  WHERE l.token = _token;
  IF NOT FOUND OR NOT v_link.ativo THEN RETURN jsonb_build_object('error', 'Link inválido ou desativado'); END IF;
  SELECT jsonb_build_object(
    'link_id', v_link.id, 'empresa_id', v_link.empresa_id, 'empresa_nome', v_link.razao_social,
    'contratos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'nome', COALESCE(c.numero_contrato, c.escopo_contrato, 'Contrato'),
        'funcoes', COALESCE((SELECT jsonb_agg(DISTINCT jsonb_build_object('id', f.id, 'nome', f.nome_funcao)) FROM public.setores s JOIN public.funcoes f ON f.setor_id=s.id WHERE s.contrato_id=c.id), '[]'::jsonb)
      ) ORDER BY c.numero_contrato) FROM public.contratos c WHERE c.empresa_id=v_link.empresa_id
    ), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION private.psico_get_public_link(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.psico_get_public_link(text) TO anon, authenticated, service_role;

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
DECLARE v_link record; v_id uuid; v_funcao_id uuid; v_contrato_id uuid;
BEGIN
  SELECT id, empresa_id, ativo, avaliacao_id, contrato_id INTO v_link FROM public.psico_links WHERE token=_token;
  IF NOT FOUND OR NOT v_link.ativo THEN RETURN jsonb_build_object('error', 'Link inválido'); END IF;
  v_contrato_id := COALESCE(NULLIF(_payload->>'contrato_id','')::uuid, v_link.contrato_id);
  IF v_contrato_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id=v_contrato_id AND c.empresa_id=v_link.empresa_id) THEN
      RETURN jsonb_build_object('error', 'Contrato inválido');
    END IF;
    SELECT f.id INTO v_funcao_id FROM public.funcoes f JOIN public.setores s ON s.id=f.setor_id
    WHERE s.contrato_id=v_contrato_id AND lower(trim(f.nome_funcao))=lower(trim(_payload->>'funcao_nome')) LIMIT 1;
  END IF;
  INSERT INTO public.psico_respostas (link_id, empresa_id, contrato_id, contrato_nome, funcao_id, funcao_nome, colaborador_nome, data_avaliacao, respostas, blocos, alertas, resultado_psicossocial, riscos_psicossociais, total_positivas, total_negativas, copsoq_resultado_resumido, copsoq_riscos_identificados, avaliacao_id)
  VALUES (v_link.id, v_link.empresa_id, v_contrato_id, _payload->>'contrato_nome', v_funcao_id, _payload->>'funcao_nome', _payload->>'colaborador_nome', COALESCE((_payload->>'data_avaliacao')::date,CURRENT_DATE), COALESCE(_payload->'respostas','{}'::jsonb), COALESCE(_payload->'blocos','{}'::jsonb), COALESCE(_payload->'alertas','{}'::jsonb), _payload->>'resultado_psicossocial', _payload->>'riscos_psicossociais', COALESCE((_payload->>'total_positivas')::int,0), COALESCE((_payload->>'total_negativas')::int,0), _payload->>'copsoq_resultado_resumido', _payload->>'copsoq_riscos_identificados', v_link.avaliacao_id)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id',v_id,'ok',true);
END;
$$;
REVOKE ALL ON FUNCTION private.psico_submit_resposta(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.psico_submit_resposta(text, jsonb) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.psico_submit_resposta(_token text, _payload jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.psico_submit_resposta(_token, _payload) $$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, authenticated, service_role;