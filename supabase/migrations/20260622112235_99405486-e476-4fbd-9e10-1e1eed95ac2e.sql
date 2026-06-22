
-- 1. Create "Contrato Padrão" for each empresa that has any setor or documento without contract
WITH empresas_precisam AS (
  SELECT DISTINCT e.id AS empresa_id
  FROM public.empresas e
  WHERE EXISTS (SELECT 1 FROM public.setores s WHERE s.empresa_id = e.id)
     OR EXISTS (SELECT 1 FROM public.documentos d WHERE d.empresa_id = e.id AND d.contrato_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.pcmso_documentos p WHERE p.empresa_id = e.id AND p.contrato_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.ltcat_avaliacoes l WHERE l.empresa_id = e.id AND l.contrato_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.aet_documentos a WHERE a.empresa_id = e.id AND a.contrato_id IS NULL)
),
empresas_sem_contrato AS (
  SELECT ep.empresa_id
  FROM empresas_precisam ep
  WHERE NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.empresa_id = ep.empresa_id)
)
INSERT INTO public.contratos (empresa_id, numero_contrato, nome_contratante)
SELECT empresa_id, 'Contrato Padrão', 'Contrato Padrão'
FROM empresas_sem_contrato;

-- Helper: pick the "default" contract per empresa (oldest contract, preferring one named Contrato Padrão)
-- We'll inline this as a CTE everywhere needed.

-- 2. Add setores.contrato_id
ALTER TABLE public.setores ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES public.contratos(id) ON DELETE CASCADE;

-- 3. Backfill setores.contrato_id using the default contract per empresa
WITH default_contrato AS (
  SELECT DISTINCT ON (empresa_id) empresa_id, id AS contrato_id
  FROM public.contratos
  ORDER BY empresa_id, (numero_contrato = 'Contrato Padrão') DESC, created_at ASC
)
UPDATE public.setores s
SET contrato_id = dc.contrato_id
FROM default_contrato dc
WHERE s.empresa_id = dc.empresa_id AND s.contrato_id IS NULL;

-- 4. Backfill documentos.contrato_id
WITH default_contrato AS (
  SELECT DISTINCT ON (empresa_id) empresa_id, id AS contrato_id
  FROM public.contratos
  ORDER BY empresa_id, (numero_contrato = 'Contrato Padrão') DESC, created_at ASC
)
UPDATE public.documentos d
SET contrato_id = dc.contrato_id
FROM default_contrato dc
WHERE d.empresa_id = dc.empresa_id AND d.contrato_id IS NULL;

WITH default_contrato AS (
  SELECT DISTINCT ON (empresa_id) empresa_id, id AS contrato_id
  FROM public.contratos
  ORDER BY empresa_id, (numero_contrato = 'Contrato Padrão') DESC, created_at ASC
)
UPDATE public.pcmso_documentos d
SET contrato_id = dc.contrato_id
FROM default_contrato dc
WHERE d.empresa_id = dc.empresa_id AND d.contrato_id IS NULL;

WITH default_contrato AS (
  SELECT DISTINCT ON (empresa_id) empresa_id, id AS contrato_id
  FROM public.contratos
  ORDER BY empresa_id, (numero_contrato = 'Contrato Padrão') DESC, created_at ASC
)
UPDATE public.ltcat_avaliacoes d
SET contrato_id = dc.contrato_id
FROM default_contrato dc
WHERE d.empresa_id = dc.empresa_id AND d.contrato_id IS NULL;

WITH default_contrato AS (
  SELECT DISTINCT ON (empresa_id) empresa_id, id AS contrato_id
  FROM public.contratos
  ORDER BY empresa_id, (numero_contrato = 'Contrato Padrão') DESC, created_at ASC
)
UPDATE public.aet_documentos d
SET contrato_id = dc.contrato_id
FROM default_contrato dc
WHERE d.empresa_id = dc.empresa_id AND d.contrato_id IS NULL;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_setores_contrato ON public.setores(contrato_id);
CREATE INDEX IF NOT EXISTS idx_documentos_contrato ON public.documentos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_pcmso_contrato ON public.pcmso_documentos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_ltcat_contrato ON public.ltcat_avaliacoes(contrato_id);
CREATE INDEX IF NOT EXISTS idx_aet_contrato ON public.aet_documentos(contrato_id);

-- 6. We intentionally keep contrato_id nullable on documentos tables to avoid breaking inserts mid-refactor.
--    The application enforces required selection. A follow-up migration can tighten this once all wizards are updated.
