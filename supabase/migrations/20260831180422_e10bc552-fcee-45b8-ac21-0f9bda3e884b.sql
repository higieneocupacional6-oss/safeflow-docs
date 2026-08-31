-- 1) Ergonomia: compartilhada entre usuários autenticados
DROP POLICY IF EXISTS "own_select" ON public.ergonomia_avaliacoes;
DROP POLICY IF EXISTS "own_update" ON public.ergonomia_avaliacoes;
DROP POLICY IF EXISTS "own_delete" ON public.ergonomia_avaliacoes;

CREATE POLICY "auth_select_ergonomia" ON public.ergonomia_avaliacoes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_ergonomia" ON public.ergonomia_avaliacoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_ergonomia" ON public.ergonomia_avaliacoes
  FOR DELETE TO authenticated USING (true);

-- 2) Realtime para todas as tabelas do app
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;