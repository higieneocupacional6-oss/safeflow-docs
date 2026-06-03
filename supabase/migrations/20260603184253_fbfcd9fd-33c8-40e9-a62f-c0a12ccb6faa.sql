CREATE TABLE public.treinamentos_cadastro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text,
  descricao text,
  carga_horaria text,
  periodicidade text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.treinamentos_cadastro TO authenticated;
GRANT ALL ON public.treinamentos_cadastro TO service_role;

ALTER TABLE public.treinamentos_cadastro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view treinamentos_cadastro" ON public.treinamentos_cadastro FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert treinamentos_cadastro" ON public.treinamentos_cadastro FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update treinamentos_cadastro" ON public.treinamentos_cadastro FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete treinamentos_cadastro" ON public.treinamentos_cadastro FOR DELETE TO authenticated USING (true);

CREATE TRIGGER set_treinamentos_cadastro_updated_at
BEFORE UPDATE ON public.treinamentos_cadastro
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();