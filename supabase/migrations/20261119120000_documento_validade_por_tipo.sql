-- Validade por tipo: 12 meses (PGR/PCMSO), 24 meses (demais controlados).
-- Exclui APR-ERGO*, AET-VALE-PLANO e AET-VALE gerado pelo módulo (status <> 'manual').

CREATE OR REPLACE FUNCTION public.set_documento_validade()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  meses integer;
BEGIN
  IF NEW.tipo IN ('APR-ERGO', 'APR-ERGO-PLANO', 'AET-VALE-PLANO') THEN
    NEW.data_validade := NULL;
    RETURN NEW;
  END IF;

  -- AET-VALE do módulo APR/AET Vale não entra no controle; apenas cadastro manual.
  IF NEW.tipo = 'AET-VALE' AND COALESCE(NEW.status, '') IS DISTINCT FROM 'manual' THEN
    NEW.data_validade := NULL;
    RETURN NEW;
  END IF;

  IF NEW.data_elaboracao IS NULL THEN
    NEW.data_validade := NULL;
    RETURN NEW;
  END IF;

  IF NEW.tipo IN ('PGR', 'PCMSO') THEN
    meses := 12;
  ELSIF NEW.tipo IN (
    'LTCAT', 'INSALUBRIDADE', 'AET', 'AEP', 'AET-VALE', 'AEP-VALE', 'PERICULOSIDADE'
  ) THEN
    meses := 24;
  ELSE
    -- Tipos sem regra explícita: não força validade.
    RETURN NEW;
  END IF;

  NEW.data_validade := (NEW.data_elaboracao + make_interval(months => meses))::date;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_documento_validade ON public.documentos;
CREATE TRIGGER trg_documento_validade
  BEFORE INSERT OR UPDATE OF data_elaboracao, tipo, status
  ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_documento_validade();

-- Backfill: limpa excluídos
UPDATE public.documentos
SET data_validade = NULL
WHERE tipo IN ('APR-ERGO', 'APR-ERGO-PLANO', 'AET-VALE-PLANO')
   OR (tipo = 'AET-VALE' AND COALESCE(status, '') IS DISTINCT FROM 'manual');

-- Backfill: 12 meses
UPDATE public.documentos
SET data_validade = (data_elaboracao + INTERVAL '12 months')::date
WHERE data_elaboracao IS NOT NULL
  AND tipo IN ('PGR', 'PCMSO');

-- Backfill: 24 meses
UPDATE public.documentos
SET data_validade = (data_elaboracao + INTERVAL '24 months')::date
WHERE data_elaboracao IS NOT NULL
  AND (
    tipo IN ('LTCAT', 'INSALUBRIDADE', 'AET', 'AEP', 'AEP-VALE', 'PERICULOSIDADE')
    OR (tipo = 'AET-VALE' AND status = 'manual')
  );
