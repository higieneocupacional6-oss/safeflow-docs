-- 1) Add tipo to equipamentos_ho for filtering by agent
ALTER TABLE public.equipamentos_ho
  ADD COLUMN IF NOT EXISTS tipo text;

-- 2) Pareceres tecnicos cadastro module
CREATE TABLE IF NOT EXISTS public.pareceres_tecnicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento text NOT NULL,
  situacao text NOT NULL,
  parecer_tecnico text NOT NULL DEFAULT '',
  risco_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid()
);

ALTER TABLE public.pareceres_tecnicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view pareceres_tecnicos" ON public.pareceres_tecnicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert pareceres_tecnicos" ON public.pareceres_tecnicos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update pareceres_tecnicos" ON public.pareceres_tecnicos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete pareceres_tecnicos" ON public.pareceres_tecnicos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_pareceres_tecnicos_updated_at
BEFORE UPDATE ON public.pareceres_tecnicos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_pareceres_doc_sit ON public.pareceres_tecnicos (documento, situacao);
CREATE INDEX IF NOT EXISTS idx_pareceres_risco ON public.pareceres_tecnicos (risco_id);