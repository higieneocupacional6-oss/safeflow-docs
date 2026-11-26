-- Empresa independente (sem vínculo com contrato).
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS sem_contrato boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.empresas.sem_contrato IS
  'Quando true, a empresa opera sem contrato; módulos não pedem seleção de contrato.';
