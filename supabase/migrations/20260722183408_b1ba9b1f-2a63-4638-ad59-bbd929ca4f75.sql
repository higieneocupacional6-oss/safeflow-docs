
-- Ergonomic assessment persistence
CREATE TABLE public.ergonomia_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  aet_documento_id uuid REFERENCES public.aet_documentos(id) ON DELETE CASCADE,
  setor_ref text,
  ferramenta text NOT NULL,
  colaborador_nome text,
  funcao text,
  empresa_nome text,
  setor_nome text,
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  escore_final numeric,
  classificacao text,
  nivel_acao text,
  recomendacoes text,
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ergonomia_avaliacoes TO authenticated;
GRANT ALL ON public.ergonomia_avaliacoes TO service_role;

ALTER TABLE public.ergonomia_avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.ergonomia_avaliacoes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.ergonomia_avaliacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.ergonomia_avaliacoes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.ergonomia_avaliacoes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER ergonomia_avaliacoes_updated
BEFORE UPDATE ON public.ergonomia_avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ergonomia_aet ON public.ergonomia_avaliacoes(aet_documento_id);

-- Storage policies for private bucket ergonomia-relatorios (user-scoped by first path segment = auth.uid())
CREATE POLICY "ergonomia_read_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "ergonomia_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "ergonomia_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "ergonomia_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);
