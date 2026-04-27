-- Enable realtime for cadastros tables so changes propagate live to all clients
ALTER TABLE public.riscos REPLICA IDENTITY FULL;
ALTER TABLE public.tecnicas_amostragem REPLICA IDENTITY FULL;
ALTER TABLE public.equipamentos_ho REPLICA IDENTITY FULL;
ALTER TABLE public.unidades REPLICA IDENTITY FULL;
ALTER TABLE public.epi_epc REPLICA IDENTITY FULL;
ALTER TABLE public.epi_epc_riscos REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.riscos; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tecnicas_amostragem; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.equipamentos_ho; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.unidades; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.epi_epc; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.epi_epc_riscos; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;