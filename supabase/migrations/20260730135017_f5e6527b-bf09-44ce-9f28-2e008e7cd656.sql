ALTER TABLE public.ltcat_avaliacoes DROP CONSTRAINT ltcat_avaliacoes_setor_id_fkey;
ALTER TABLE public.ltcat_avaliacoes ADD CONSTRAINT ltcat_avaliacoes_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id) ON DELETE CASCADE;
ALTER TABLE public.ltcat_avaliacoes DROP CONSTRAINT ltcat_avaliacoes_funcao_id_fkey;
ALTER TABLE public.ltcat_avaliacoes ADD CONSTRAINT ltcat_avaliacoes_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id) ON DELETE SET NULL;