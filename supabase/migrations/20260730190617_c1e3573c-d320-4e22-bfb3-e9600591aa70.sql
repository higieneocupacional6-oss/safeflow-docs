ALTER TABLE public.pareceres_tecnicos
  ADD CONSTRAINT pareceres_tecnicos_risco_id_fkey
  FOREIGN KEY (risco_id) REFERENCES public.riscos(id) ON DELETE SET NULL;