CREATE TABLE public.psico_base_tecnica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  caminho TEXT NOT NULL,
  tamanho BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.psico_base_tecnica TO authenticated;
GRANT ALL ON public.psico_base_tecnica TO service_role;
ALTER TABLE public.psico_base_tecnica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados gerenciam a base tecnica"
  ON public.psico_base_tecnica FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Base tecnica leitura autenticada"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'psico-base-tecnica');
CREATE POLICY "Base tecnica upload autenticado"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'psico-base-tecnica');
CREATE POLICY "Base tecnica exclusao autenticada"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'psico-base-tecnica');