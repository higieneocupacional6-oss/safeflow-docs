
-- 1. Catálogo de exames
CREATE TABLE public.exames_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exames_catalogo TO authenticated;
GRANT ALL ON public.exames_catalogo TO service_role;
ALTER TABLE public.exames_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view exames_catalogo" ON public.exames_catalogo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert exames_catalogo" ON public.exames_catalogo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update exames_catalogo" ON public.exames_catalogo FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete exames_catalogo" ON public.exames_catalogo FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_exames_catalogo_updated BEFORE UPDATE ON public.exames_catalogo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. eSocial Exames
CREATE TABLE public.esocial_exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  descricao text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.esocial_exames TO authenticated;
GRANT ALL ON public.esocial_exames TO service_role;
ALTER TABLE public.esocial_exames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view esocial_exames" ON public.esocial_exames FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert esocial_exames" ON public.esocial_exames FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update esocial_exames" ON public.esocial_exames FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete esocial_exames" ON public.esocial_exames FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_esocial_exames_updated BEFORE UPDATE ON public.esocial_exames FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Observações padrão PCMSO
CREATE TABLE public.pcmso_observacoes_padrao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pcmso_observacoes_padrao TO authenticated;
GRANT ALL ON public.pcmso_observacoes_padrao TO service_role;
ALTER TABLE public.pcmso_observacoes_padrao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view pcmso_obs" ON public.pcmso_observacoes_padrao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert pcmso_obs" ON public.pcmso_observacoes_padrao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update pcmso_obs" ON public.pcmso_observacoes_padrao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete pcmso_obs" ON public.pcmso_observacoes_padrao FOR DELETE TO authenticated USING (true);

-- 4. PCMSO Documentos
CREATE TABLE public.pcmso_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid,
  contrato_id uuid,
  documento_id uuid,
  current_step integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'rascunho',
  data_elaboracao date,
  responsavel_tecnico text,
  crea text,
  cargo text,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  alteracoes_documento text,
  draft_snapshot jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pcmso_documentos TO authenticated;
GRANT ALL ON public.pcmso_documentos TO service_role;
ALTER TABLE public.pcmso_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view pcmso_documentos" ON public.pcmso_documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert pcmso_documentos" ON public.pcmso_documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update pcmso_documentos" ON public.pcmso_documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete pcmso_documentos" ON public.pcmso_documentos FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_pcmso_documentos_updated BEFORE UPDATE ON public.pcmso_documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. PCMSO Setor x Exames
CREATE TABLE public.pcmso_setor_exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pcmso_id uuid NOT NULL,
  setor_id uuid NOT NULL,
  exame_id uuid,
  esocial_id uuid,
  admissional boolean NOT NULL DEFAULT false,
  periodico boolean NOT NULL DEFAULT false,
  retorno_trabalho boolean NOT NULL DEFAULT false,
  mudanca_risco boolean NOT NULL DEFAULT false,
  demissional boolean NOT NULL DEFAULT false,
  periodo text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pcmso_setor_exames TO authenticated;
GRANT ALL ON public.pcmso_setor_exames TO service_role;
ALTER TABLE public.pcmso_setor_exames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view pcmso_setor_exames" ON public.pcmso_setor_exames FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert pcmso_setor_exames" ON public.pcmso_setor_exames FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update pcmso_setor_exames" ON public.pcmso_setor_exames FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete pcmso_setor_exames" ON public.pcmso_setor_exames FOR DELETE TO authenticated USING (true);

-- Seeds
INSERT INTO public.exames_catalogo (nome, categoria) VALUES
  ('Audiometria','Audiológico'),
  ('Acuidade Visual','Oftalmológico'),
  ('ECG','Cardiológico'),
  ('EEG','Neurológico'),
  ('Espirometria','Pulmonar'),
  ('Hemograma','Laboratorial');

INSERT INTO public.esocial_exames (codigo, descricao) VALUES
  ('0295','Audiometria Ocupacional'),
  ('0281','Acuidade Visual'),
  ('0290','Espirometria'),
  ('0207','Eletrocardiograma'),
  ('0208','Eletroencefalograma'),
  ('0231','Hemograma Completo');

INSERT INTO public.pcmso_observacoes_padrao (texto) VALUES
  ('Realizar exame após afastamento superior a 30 dias.'),
  ('Exame obrigatório para exposição a ruído.'),
  ('Monitoramento conforme NR-07.');
