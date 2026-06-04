CREATE TABLE public.exames_cadastro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo_esocial text NOT NULL,
  descricao_esocial text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exames_cadastro TO authenticated;
GRANT ALL ON public.exames_cadastro TO service_role;
ALTER TABLE public.exames_cadastro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view exames_cadastro" ON public.exames_cadastro FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert exames_cadastro" ON public.exames_cadastro FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update exames_cadastro" ON public.exames_cadastro FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete exames_cadastro" ON public.exames_cadastro FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_exames_cadastro_updated_at BEFORE UPDATE ON public.exames_cadastro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER PUBLICATION supabase_realtime ADD TABLE public.exames_cadastro;