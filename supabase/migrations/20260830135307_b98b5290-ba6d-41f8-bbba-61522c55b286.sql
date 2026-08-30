CREATE TABLE public.psico_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  contrato_id uuid REFERENCES public.contratos(id) ON DELETE SET NULL,
  titulo text NOT NULL DEFAULT 'Avaliação Psicossocial',
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'rascunho',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.psico_avaliacoes TO authenticated;
GRANT ALL ON public.psico_avaliacoes TO service_role;

ALTER TABLE public.psico_avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth manage psico avaliacoes"
ON public.psico_avaliacoes FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE TRIGGER trg_psico_avaliacoes_updated
BEFORE UPDATE ON public.psico_avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.psico_respostas
  ADD COLUMN avaliacao_id uuid REFERENCES public.psico_avaliacoes(id) ON DELETE CASCADE;

ALTER TABLE public.psico_links
  ADD COLUMN avaliacao_id uuid REFERENCES public.psico_avaliacoes(id) ON DELETE CASCADE,
  ADD COLUMN contrato_id uuid REFERENCES public.contratos(id) ON DELETE SET NULL;

CREATE INDEX idx_psico_respostas_avaliacao ON public.psico_respostas(avaliacao_id);
CREATE INDEX idx_psico_avaliacoes_empresa_contrato ON public.psico_avaliacoes(empresa_id, contrato_id);

CREATE OR REPLACE FUNCTION public.psico_submit_resposta(_token text, _payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_link record;
  v_id uuid;
  v_funcao_id uuid;
  v_contrato_id uuid;
BEGIN
  SELECT id, empresa_id, ativo, avaliacao_id, contrato_id INTO v_link FROM public.psico_links WHERE token = _token;
  IF NOT FOUND OR NOT v_link.ativo THEN
    RETURN jsonb_build_object('error', 'Link inválido');
  END IF;

  v_contrato_id := COALESCE(NULLIF(_payload->>'contrato_id','')::uuid, v_link.contrato_id);

  IF v_contrato_id IS NOT NULL THEN
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
    copsoq_resultado_resumido, copsoq_riscos_identificados, avaliacao_id
  ) VALUES (
    v_link.id, v_link.empresa_id,
    v_contrato_id,
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
    _payload->>'copsoq_riscos_identificados',
    v_link.avaliacao_id
  ) RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'ok', true);
END;
$function$;
