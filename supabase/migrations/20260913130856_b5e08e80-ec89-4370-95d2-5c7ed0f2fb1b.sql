CREATE TABLE public.ficha_tecnica_resultados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  setor_id uuid NOT NULL REFERENCES public.setores(id) ON DELETE RESTRICT,
  funcao_id uuid NOT NULL REFERENCES public.funcoes(id) ON DELETE RESTRICT,
  agente_id uuid NOT NULL REFERENCES public.riscos(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('ruido','vibracao_vci','vibracao_vmb','calor','poeira_silica','quimico_quantitativo','fumos_metalicos','vapores_organicos')),
  nen numeric,
  lavg numeric,
  aren numeric,
  vdvr numeric,
  concentracao numeric,
  taxa_metabolica text,
  componentes text,
  amostrador text,
  exposicao numeric,
  limite_tolerancia numeric NOT NULL,
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  last_modified_by uuid DEFAULT auth.uid()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ficha_tecnica_resultados TO authenticated;
GRANT ALL ON public.ficha_tecnica_resultados TO service_role;

ALTER TABLE public.ficha_tecnica_resultados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Authenticated can update ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.validate_ficha_tecnica_resultado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = NEW.contrato_id AND c.empresa_id = NEW.empresa_id) THEN
    RAISE EXCEPTION 'Contrato não pertence à empresa informada' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.setores s WHERE s.id = NEW.setor_id AND s.empresa_id = NEW.empresa_id AND s.contrato_id = NEW.contrato_id) THEN
    RAISE EXCEPTION 'Setor não pertence à empresa e ao contrato informados' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.funcoes f WHERE f.id = NEW.funcao_id AND f.setor_id = NEW.setor_id) THEN
    RAISE EXCEPTION 'Função não pertence ao setor informado' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.riscos r WHERE r.id = NEW.agente_id) THEN
    RAISE EXCEPTION 'Agente inválido' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'ruido' AND (NEW.nen IS NULL OR NEW.lavg IS NULL OR NEW.limite_tolerancia <> 85) THEN
    RAISE EXCEPTION 'Ruído exige NEN, LAVG e limite de 85 dB' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'vibracao_vmb' AND (NEW.aren IS NULL OR NEW.limite_tolerancia <> 5.0) THEN
    RAISE EXCEPTION 'Vibração de mãos e braços exige AREN e limite de 5,0 m/s²' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'vibracao_vci' AND (NEW.aren IS NULL OR NEW.vdvr IS NULL OR NEW.limite_tolerancia <> 1.1) THEN
    RAISE EXCEPTION 'Vibração de corpo inteiro exige AREN, VDVR e limite AREN de 1,1 m/s²' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'calor' AND (NEW.concentracao IS NULL OR NULLIF(trim(NEW.taxa_metabolica), '') IS NULL) THEN
    RAISE EXCEPTION 'Calor exige concentração e taxa metabólica' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo IN ('poeira_silica','quimico_quantitativo','fumos_metalicos','vapores_organicos')
     AND (NULLIF(trim(NEW.componentes), '') IS NULL OR NULLIF(trim(NEW.amostrador), '') IS NULL OR NEW.exposicao IS NULL) THEN
    RAISE EXCEPTION 'Resultado químico exige componentes, amostrador e exposição' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_ficha_tecnica_resultado
BEFORE INSERT OR UPDATE ON public.ficha_tecnica_resultados
FOR EACH ROW EXECUTE FUNCTION public.validate_ficha_tecnica_resultado();

CREATE TRIGGER update_ficha_tecnica_resultados_updated_at
BEFORE UPDATE ON public.ficha_tecnica_resultados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_track_ficha_tecnica_change
BEFORE INSERT OR UPDATE OR DELETE ON public.ficha_tecnica_resultados
FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();

CREATE INDEX idx_ficha_tecnica_empresa_contrato ON public.ficha_tecnica_resultados(empresa_id, contrato_id, created_at DESC);
CREATE INDEX idx_ficha_tecnica_setor_funcao ON public.ficha_tecnica_resultados(setor_id, funcao_id);
CREATE INDEX idx_ficha_tecnica_agente ON public.ficha_tecnica_resultados(agente_id);

ALTER TABLE public.ltcat_avaliacoes
ADD COLUMN ficha_tecnica_resultado_id uuid REFERENCES public.ficha_tecnica_resultados(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX uq_ltcat_avaliacao_ficha_documento
ON public.ltcat_avaliacoes(documento_id, ficha_tecnica_resultado_id)
WHERE ficha_tecnica_resultado_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.import_ficha_tecnica_resultados(
  _documento_id uuid,
  _empresa_id uuid,
  _contrato_id uuid,
  _tipo_documento text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_resultado public.ficha_tecnica_resultados%ROWTYPE;
  v_avaliacao_id uuid;
  v_importados integer := 0;
  v_existentes integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN
    RAISE EXCEPTION 'Tipo de documento inválido' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_documento_id::text, 0));

  IF NOT EXISTS (
    SELECT 1 FROM public.documentos d
    WHERE d.id = _documento_id AND d.empresa_id = _empresa_id
      AND d.contrato_id = _contrato_id
      AND lower(d.tipo) = CASE WHEN _tipo_documento = 'ltcat' THEN 'ltcat' ELSE 'insalubridade' END
  ) THEN
    RAISE EXCEPTION 'Documento, empresa e contrato não correspondem' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = _contrato_id AND c.empresa_id = _empresa_id) THEN
    RAISE EXCEPTION 'Contrato não pertence à empresa' USING ERRCODE = '42501';
  END IF;

  FOR v_resultado IN
    SELECT * FROM public.ficha_tecnica_resultados f
    WHERE f.empresa_id = _empresa_id AND f.contrato_id = _contrato_id
    ORDER BY f.created_at, f.id
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.ltcat_avaliacoes a
      WHERE a.documento_id = _documento_id AND a.ficha_tecnica_resultado_id = v_resultado.id
    ) THEN
      v_existentes := v_existentes + 1;
      CONTINUE;
    END IF;

    v_avaliacao_id := gen_random_uuid();
    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador,
      tipo_avaliacao, tipo_agente, agente_id, resultado, limite_tolerancia,
      codigo_esocial, descricao_esocial, propagacao, tipo_exposicao, fonte_geradora,
      danos_saude, medidas_controle, parecer_tecnico, aposentadoria_especial,
      data_avaliacao, tipo_documento, created_by, ficha_tecnica_resultado_id
    )
    SELECT
      v_avaliacao_id, _documento_id, _empresa_id, _contrato_id,
      v_resultado.setor_id, v_resultado.funcao_id, '', 'quantitativa', r.tipo,
      v_resultado.agente_id,
      CASE
        WHEN v_resultado.tipo = 'ruido' THEN v_resultado.nen
        WHEN v_resultado.tipo = 'calor' THEN v_resultado.concentracao
        WHEN v_resultado.tipo IN ('poeira_silica','quimico_quantitativo','fumos_metalicos','vapores_organicos') THEN v_resultado.exposicao
        ELSE v_resultado.aren
      END,
      v_resultado.limite_tolerancia, r.codigo_esocial, r.descricao_esocial,
      r.propagacao, r.tipo_exposicao, r.fonte_geradora, r.danos_saude,
      r.medidas_controle, '', '', v_resultado.data_avaliacao,
      _tipo_documento, auth.uid(), v_resultado.id
    FROM public.riscos r WHERE r.id = v_resultado.agente_id;

    IF v_resultado.tipo = 'ruido' THEN
      INSERT INTO public.ltcat_av_resultados (
        avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao, resultado,
        limite_tolerancia, descricao_avaliacao, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        v_resultado.nen, 85, concat('LAVG: ', v_resultado.lavg, ' dB(A)'), '', '', _tipo_documento
      );
    ELSIF v_resultado.tipo IN ('vibracao_vci','vibracao_vmb') THEN
      INSERT INTO public.ltcat_av_vibracao (
        avaliacao_id, ordem, tipo, colaborador, funcao_id, data_avaliacao,
        aren, vdvr, aren_limite, vdvr_limite, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0,
        CASE WHEN v_resultado.tipo = 'vibracao_vci' THEN 'VCI' ELSE 'VMB' END,
        '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        v_resultado.aren, v_resultado.vdvr, v_resultado.limite_tolerancia,
        CASE WHEN v_resultado.tipo = 'vibracao_vci' THEN 21.0 ELSE NULL END,
        '', '', _tipo_documento
      );
    ELSIF v_resultado.tipo = 'calor' THEN
      INSERT INTO public.ltcat_av_calor (
        avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao,
        ibutg_medido, ibutg_limite, taxa_metabolica, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        v_resultado.concentracao, v_resultado.limite_tolerancia,
        v_resultado.taxa_metabolica, '', '', _tipo_documento
      );
    ELSE
      INSERT INTO public.ltcat_av_componentes (
        avaliacao_id, ordem, componente, resultado, limite_tolerancia,
        colaborador, funcao_id, data_avaliacao, descricao_avaliacao,
        parecer_tecnico, aposentadoria_especial, amostrador, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, v_resultado.componentes, v_resultado.exposicao,
        v_resultado.limite_tolerancia, '', v_resultado.funcao_id,
        v_resultado.data_avaliacao, '', '', '', v_resultado.amostrador, _tipo_documento
      );
    END IF;

    v_importados := v_importados + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'imported', v_importados,
    'existing', v_existentes,
    'total', v_importados + v_existentes
  );
END;
$$;

REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO service_role;