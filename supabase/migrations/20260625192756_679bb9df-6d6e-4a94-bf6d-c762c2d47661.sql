
-- Tabelas para módulo público de Avaliação Psicossocial
CREATE TABLE public.psico_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(9), 'base64'),
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.psico_links TO authenticated;
GRANT ALL ON public.psico_links TO service_role;
ALTER TABLE public.psico_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage links" ON public.psico_links FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_psico_links_updated BEFORE UPDATE ON public.psico_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.psico_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.psico_links(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  contrato_id uuid REFERENCES public.contratos(id) ON DELETE SET NULL,
  contrato_nome text,
  funcao_id uuid REFERENCES public.funcoes(id) ON DELETE SET NULL,
  funcao_nome text NOT NULL,
  colaborador_nome text,
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  blocos jsonb NOT NULL DEFAULT '{}'::jsonb,
  alertas jsonb NOT NULL DEFAULT '{}'::jsonb,
  resultado_psicossocial text,
  riscos_psicossociais text,
  total_positivas int DEFAULT 0,
  total_negativas int DEFAULT 0,
  copsoq_resultado_resumido text,
  copsoq_riscos_identificados text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.psico_respostas TO authenticated;
GRANT ALL ON public.psico_respostas TO service_role;
ALTER TABLE public.psico_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage respostas" ON public.psico_respostas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_psico_respostas_link ON public.psico_respostas(link_id);
CREATE INDEX idx_psico_respostas_empresa ON public.psico_respostas(empresa_id);
CREATE INDEX idx_psico_respostas_funcao ON public.psico_respostas(funcao_id);

-- RPC público: dados do link (empresa + contratos + funções)
CREATE OR REPLACE FUNCTION public.psico_get_public_link(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link record;
  v_result jsonb;
BEGIN
  SELECT l.id, l.empresa_id, l.ativo, e.razao_social
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
    'contratos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id,
        'nome', COALESCE(c.numero_contrato, c.objeto, 'Contrato'),
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
GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, authenticated;

-- RPC público: enviar resposta
CREATE OR REPLACE FUNCTION public.psico_submit_resposta(_token text, _payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link record;
  v_id uuid;
  v_funcao_id uuid;
BEGIN
  SELECT id, empresa_id, ativo INTO v_link FROM public.psico_links WHERE token = _token;
  IF NOT FOUND OR NOT v_link.ativo THEN
    RETURN jsonb_build_object('error', 'Link inválido');
  END IF;

  -- tenta localizar funcao_id pelo nome dentro da empresa+contrato (vincula já no envio se existir)
  IF (_payload ? 'contrato_id') AND (_payload->>'contrato_id') <> '' THEN
    SELECT f.id INTO v_funcao_id
    FROM public.funcoes f
    JOIN public.setores s ON s.id = f.setor_id
    WHERE s.contrato_id = (_payload->>'contrato_id')::uuid
      AND lower(trim(f.nome_funcao)) = lower(trim(_payload->>'funcao_nome'))
    LIMIT 1;
  END IF;

  INSERT INTO public.psico_respostas (
    link_id, empresa_id, contrato_id, contrato_nome, funcao_id, funcao_nome,
    colaborador_nome, data_avaliacao, respostas, blocos, alertas,
    resultado_psicossocial, riscos_psicossociais, total_positivas, total_negativas,
    copsoq_resultado_resumido, copsoq_riscos_identificados
  ) VALUES (
    v_link.id, v_link.empresa_id,
    NULLIF(_payload->>'contrato_id','')::uuid,
    _payload->>'contrato_nome',
    v_funcao_id,
    _payload->>'funcao_nome',
    _payload->>'colaborador_nome',
    COALESCE((_payload->>'data_avaliacao')::date, CURRENT_DATE),
    COALESCE(_payload->'respostas','{}'::jsonb),
    COALESCE(_payload->'blocos','{}'::jsonb),
    COALESCE(_payload->'alertas','{}'::jsonb),
    _payload->>'resultado_psicossocial',
    _payload->>'riscos_psicossociais',
    COALESCE((_payload->>'total_positivas')::int, 0),
    COALESCE((_payload->>'total_negativas')::int, 0),
    _payload->>'copsoq_resultado_resumido',
    _payload->>'copsoq_riscos_identificados'
  ) RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, authenticated;
