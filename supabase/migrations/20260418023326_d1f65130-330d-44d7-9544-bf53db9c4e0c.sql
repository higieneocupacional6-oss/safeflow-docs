
-- ============================================
-- 1. Fix admin privilege escalation in handle_new_user
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    true
  );

  -- Always default to 'usuario'. Admins are promoted explicitly via Usuarios page.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'usuario'::app_role);

  RETURN NEW;
END;
$function$;

-- ============================================
-- 2. Fix update_updated_at_column search_path
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- ============================================
-- 3. Lock down all business tables to authenticated users
-- ============================================

-- Helper macro pattern: drop all anon policies and recreate as authenticated

-- empresas
DROP POLICY IF EXISTS "Anyone can view empresas" ON public.empresas;
DROP POLICY IF EXISTS "Anyone can insert empresas" ON public.empresas;
DROP POLICY IF EXISTS "Anyone can update empresas" ON public.empresas;
DROP POLICY IF EXISTS "Anyone can delete empresas" ON public.empresas;
CREATE POLICY "Authenticated can view empresas" ON public.empresas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert empresas" ON public.empresas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update empresas" ON public.empresas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete empresas" ON public.empresas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- empresa_contatos
DROP POLICY IF EXISTS "Anyone can view empresa_contatos" ON public.empresa_contatos;
DROP POLICY IF EXISTS "Anyone can insert empresa_contatos" ON public.empresa_contatos;
DROP POLICY IF EXISTS "Anyone can update empresa_contatos" ON public.empresa_contatos;
DROP POLICY IF EXISTS "Anyone can delete empresa_contatos" ON public.empresa_contatos;
CREATE POLICY "Authenticated can view empresa_contatos" ON public.empresa_contatos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert empresa_contatos" ON public.empresa_contatos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update empresa_contatos" ON public.empresa_contatos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete empresa_contatos" ON public.empresa_contatos FOR DELETE TO authenticated USING (true);

-- setores
DROP POLICY IF EXISTS "Anyone can view setores" ON public.setores;
DROP POLICY IF EXISTS "Anyone can insert setores" ON public.setores;
DROP POLICY IF EXISTS "Anyone can update setores" ON public.setores;
DROP POLICY IF EXISTS "Anyone can delete setores" ON public.setores;
CREATE POLICY "Authenticated can view setores" ON public.setores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert setores" ON public.setores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update setores" ON public.setores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete setores" ON public.setores FOR DELETE TO authenticated USING (true);

-- funcoes
DROP POLICY IF EXISTS "Anyone can view funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "Anyone can insert funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "Anyone can update funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "Anyone can delete funcoes" ON public.funcoes;
CREATE POLICY "Authenticated can view funcoes" ON public.funcoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert funcoes" ON public.funcoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update funcoes" ON public.funcoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete funcoes" ON public.funcoes FOR DELETE TO authenticated USING (true);

-- riscos
DROP POLICY IF EXISTS "Anyone can view riscos" ON public.riscos;
DROP POLICY IF EXISTS "Anyone can insert riscos" ON public.riscos;
DROP POLICY IF EXISTS "Anyone can update riscos" ON public.riscos;
DROP POLICY IF EXISTS "Anyone can delete riscos" ON public.riscos;
CREATE POLICY "Authenticated can view riscos" ON public.riscos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert riscos" ON public.riscos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update riscos" ON public.riscos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete riscos" ON public.riscos FOR DELETE TO authenticated USING (true);

-- epi_epc
DROP POLICY IF EXISTS "Anyone can view epi_epc" ON public.epi_epc;
DROP POLICY IF EXISTS "Anyone can insert epi_epc" ON public.epi_epc;
DROP POLICY IF EXISTS "Anyone can update epi_epc" ON public.epi_epc;
DROP POLICY IF EXISTS "Anyone can delete epi_epc" ON public.epi_epc;
CREATE POLICY "Authenticated can view epi_epc" ON public.epi_epc FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert epi_epc" ON public.epi_epc FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update epi_epc" ON public.epi_epc FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete epi_epc" ON public.epi_epc FOR DELETE TO authenticated USING (true);

-- epi_epc_riscos
DROP POLICY IF EXISTS "Anyone can view epi_epc_riscos" ON public.epi_epc_riscos;
DROP POLICY IF EXISTS "Anyone can insert epi_epc_riscos" ON public.epi_epc_riscos;
DROP POLICY IF EXISTS "Anyone can delete epi_epc_riscos" ON public.epi_epc_riscos;
CREATE POLICY "Authenticated can view epi_epc_riscos" ON public.epi_epc_riscos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert epi_epc_riscos" ON public.epi_epc_riscos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete epi_epc_riscos" ON public.epi_epc_riscos FOR DELETE TO authenticated USING (true);

-- templates
DROP POLICY IF EXISTS "Anyone can view templates" ON public.templates;
DROP POLICY IF EXISTS "Anyone can insert templates" ON public.templates;
DROP POLICY IF EXISTS "Anyone can delete templates" ON public.templates;
CREATE POLICY "Authenticated can view templates" ON public.templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert templates" ON public.templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can delete templates" ON public.templates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- documentos
DROP POLICY IF EXISTS "Anyone can view documentos" ON public.documentos;
DROP POLICY IF EXISTS "Anyone can insert documentos" ON public.documentos;
DROP POLICY IF EXISTS "Anyone can update documentos" ON public.documentos;
DROP POLICY IF EXISTS "Anyone can delete documentos" ON public.documentos;
CREATE POLICY "Authenticated can view documentos" ON public.documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert documentos" ON public.documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update documentos" ON public.documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete documentos" ON public.documentos FOR DELETE TO authenticated USING (true);

-- ltcat_avaliacoes
DROP POLICY IF EXISTS "Anyone can view ltcat_avaliacoes" ON public.ltcat_avaliacoes;
DROP POLICY IF EXISTS "Anyone can insert ltcat_avaliacoes" ON public.ltcat_avaliacoes;
DROP POLICY IF EXISTS "Anyone can update ltcat_avaliacoes" ON public.ltcat_avaliacoes;
DROP POLICY IF EXISTS "Anyone can delete ltcat_avaliacoes" ON public.ltcat_avaliacoes;
CREATE POLICY "Authenticated can view ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR DELETE TO authenticated USING (true);

-- ltcat_pareceres (already has authenticated policies - just drop public ones)
DROP POLICY IF EXISTS "Anyone can view ltcat_pareceres" ON public.ltcat_pareceres;
DROP POLICY IF EXISTS "Anyone can insert ltcat_pareceres" ON public.ltcat_pareceres;
DROP POLICY IF EXISTS "Anyone can update ltcat_pareceres" ON public.ltcat_pareceres;
DROP POLICY IF EXISTS "Anyone can delete ltcat_pareceres" ON public.ltcat_pareceres;

-- ltcat_av_componentes
DROP POLICY IF EXISTS "Anyone can view ltcat_av_componentes" ON public.ltcat_av_componentes;
DROP POLICY IF EXISTS "Anyone can insert ltcat_av_componentes" ON public.ltcat_av_componentes;
DROP POLICY IF EXISTS "Anyone can update ltcat_av_componentes" ON public.ltcat_av_componentes;
DROP POLICY IF EXISTS "Anyone can delete ltcat_av_componentes" ON public.ltcat_av_componentes;
CREATE POLICY "Authenticated can view ltcat_av_componentes" ON public.ltcat_av_componentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ltcat_av_componentes" ON public.ltcat_av_componentes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ltcat_av_componentes" ON public.ltcat_av_componentes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete ltcat_av_componentes" ON public.ltcat_av_componentes FOR DELETE TO authenticated USING (true);

-- ltcat_av_calor
DROP POLICY IF EXISTS "Anyone can view ltcat_av_calor" ON public.ltcat_av_calor;
DROP POLICY IF EXISTS "Anyone can insert ltcat_av_calor" ON public.ltcat_av_calor;
DROP POLICY IF EXISTS "Anyone can update ltcat_av_calor" ON public.ltcat_av_calor;
DROP POLICY IF EXISTS "Anyone can delete ltcat_av_calor" ON public.ltcat_av_calor;
CREATE POLICY "Authenticated can view ltcat_av_calor" ON public.ltcat_av_calor FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ltcat_av_calor" ON public.ltcat_av_calor FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ltcat_av_calor" ON public.ltcat_av_calor FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete ltcat_av_calor" ON public.ltcat_av_calor FOR DELETE TO authenticated USING (true);

-- ltcat_av_vibracao
DROP POLICY IF EXISTS "Anyone can view ltcat_av_vibracao" ON public.ltcat_av_vibracao;
DROP POLICY IF EXISTS "Anyone can insert ltcat_av_vibracao" ON public.ltcat_av_vibracao;
DROP POLICY IF EXISTS "Anyone can update ltcat_av_vibracao" ON public.ltcat_av_vibracao;
DROP POLICY IF EXISTS "Anyone can delete ltcat_av_vibracao" ON public.ltcat_av_vibracao;
CREATE POLICY "Authenticated can view ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR DELETE TO authenticated USING (true);

-- ltcat_av_resultados
DROP POLICY IF EXISTS "Anyone can view ltcat_av_resultados" ON public.ltcat_av_resultados;
DROP POLICY IF EXISTS "Anyone can insert ltcat_av_resultados" ON public.ltcat_av_resultados;
DROP POLICY IF EXISTS "Anyone can update ltcat_av_resultados" ON public.ltcat_av_resultados;
DROP POLICY IF EXISTS "Anyone can delete ltcat_av_resultados" ON public.ltcat_av_resultados;
CREATE POLICY "Authenticated can view ltcat_av_resultados" ON public.ltcat_av_resultados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ltcat_av_resultados" ON public.ltcat_av_resultados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ltcat_av_resultados" ON public.ltcat_av_resultados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete ltcat_av_resultados" ON public.ltcat_av_resultados FOR DELETE TO authenticated USING (true);

-- ltcat_av_equipamentos
DROP POLICY IF EXISTS "Anyone can view ltcat_av_equipamentos" ON public.ltcat_av_equipamentos;
DROP POLICY IF EXISTS "Anyone can insert ltcat_av_equipamentos" ON public.ltcat_av_equipamentos;
DROP POLICY IF EXISTS "Anyone can update ltcat_av_equipamentos" ON public.ltcat_av_equipamentos;
DROP POLICY IF EXISTS "Anyone can delete ltcat_av_equipamentos" ON public.ltcat_av_equipamentos;
CREATE POLICY "Authenticated can view ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR DELETE TO authenticated USING (true);

-- ltcat_av_epi_epc
DROP POLICY IF EXISTS "Anyone can view ltcat_av_epi_epc" ON public.ltcat_av_epi_epc;
DROP POLICY IF EXISTS "Anyone can insert ltcat_av_epi_epc" ON public.ltcat_av_epi_epc;
DROP POLICY IF EXISTS "Anyone can update ltcat_av_epi_epc" ON public.ltcat_av_epi_epc;
DROP POLICY IF EXISTS "Anyone can delete ltcat_av_epi_epc" ON public.ltcat_av_epi_epc;
CREATE POLICY "Authenticated can view ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR DELETE TO authenticated USING (true);

-- equipamentos_ho
DROP POLICY IF EXISTS "Anyone can view equipamentos_ho" ON public.equipamentos_ho;
DROP POLICY IF EXISTS "Anyone can insert equipamentos_ho" ON public.equipamentos_ho;
DROP POLICY IF EXISTS "Anyone can update equipamentos_ho" ON public.equipamentos_ho;
DROP POLICY IF EXISTS "Anyone can delete equipamentos_ho" ON public.equipamentos_ho;
CREATE POLICY "Authenticated can view equipamentos_ho" ON public.equipamentos_ho FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert equipamentos_ho" ON public.equipamentos_ho FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update equipamentos_ho" ON public.equipamentos_ho FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete equipamentos_ho" ON public.equipamentos_ho FOR DELETE TO authenticated USING (true);

-- equipamentos_avaliacao
DROP POLICY IF EXISTS "Anyone can view equipamentos_avaliacao" ON public.equipamentos_avaliacao;
DROP POLICY IF EXISTS "Anyone can insert equipamentos_avaliacao" ON public.equipamentos_avaliacao;
DROP POLICY IF EXISTS "Anyone can update equipamentos_avaliacao" ON public.equipamentos_avaliacao;
DROP POLICY IF EXISTS "Anyone can delete equipamentos_avaliacao" ON public.equipamentos_avaliacao;
CREATE POLICY "Authenticated can view equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR DELETE TO authenticated USING (true);

-- tecnicas_amostragem
DROP POLICY IF EXISTS "Anyone can view tecnicas_amostragem" ON public.tecnicas_amostragem;
DROP POLICY IF EXISTS "Anyone can insert tecnicas_amostragem" ON public.tecnicas_amostragem;
CREATE POLICY "Authenticated can view tecnicas_amostragem" ON public.tecnicas_amostragem FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tecnicas_amostragem" ON public.tecnicas_amostragem FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- unidades
DROP POLICY IF EXISTS "Anyone can view unidades" ON public.unidades;
DROP POLICY IF EXISTS "Anyone can insert unidades" ON public.unidades;
CREATE POLICY "Authenticated can view unidades" ON public.unidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert unidades" ON public.unidades FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 4. Lock down templates storage bucket
-- ============================================
DROP POLICY IF EXISTS "Anyone can upload template files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete template files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update template files" ON storage.objects;

CREATE POLICY "Authenticated can upload templates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'templates');

CREATE POLICY "Admins can delete templates"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'templates' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can update templates"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'templates');
