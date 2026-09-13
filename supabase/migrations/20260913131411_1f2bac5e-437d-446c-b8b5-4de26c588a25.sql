DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ficha_tecnica_resultados'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ficha_tecnica_resultados;
  END IF;
END
$$;