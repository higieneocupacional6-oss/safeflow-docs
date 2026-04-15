
-- Add unique constraint for upsert on ltcat_pareceres
ALTER TABLE public.ltcat_pareceres
ADD CONSTRAINT ltcat_pareceres_unique_combo
UNIQUE (empresa_id, setor_id, funcao_id, agente_id, colaborador_nome);

-- Also add public RLS policies so non-authenticated users can also use this table
-- (matching the pattern of other tables in this project)
CREATE POLICY "Anyone can insert ltcat_pareceres"
ON public.ltcat_pareceres FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Anyone can update ltcat_pareceres"
ON public.ltcat_pareceres FOR UPDATE TO public
USING (true);

CREATE POLICY "Anyone can view ltcat_pareceres"
ON public.ltcat_pareceres FOR SELECT TO public
USING (true);

CREATE POLICY "Anyone can delete ltcat_pareceres"
ON public.ltcat_pareceres FOR DELETE TO public
USING (true);

-- Add RLS policies for equipamentos_ho, tecnicas_amostragem, unidades, ltcat_avaliacoes (currently missing)
CREATE POLICY "Anyone can view equipamentos_ho" ON public.equipamentos_ho FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert equipamentos_ho" ON public.equipamentos_ho FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update equipamentos_ho" ON public.equipamentos_ho FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete equipamentos_ho" ON public.equipamentos_ho FOR DELETE TO public USING (true);

CREATE POLICY "Anyone can view tecnicas_amostragem" ON public.tecnicas_amostragem FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert tecnicas_amostragem" ON public.tecnicas_amostragem FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can view unidades" ON public.unidades FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert unidades" ON public.unidades FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can view ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR DELETE TO public USING (true);
