-- Migração para registrar o Parecer Técnico do LTCAT
CREATE TABLE public.ltcat_pareceres (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
    funcao_id UUID NOT NULL REFERENCES public.funcoes(id) ON DELETE CASCADE,
    agente_id UUID NOT NULL REFERENCES public.riscos(id) ON DELETE CASCADE,
    colaborador_nome TEXT NOT NULL,
    parecer_tecnico TEXT,
    aposentadoria_especial TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.ltcat_pareceres ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir inserção de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Permitir exclusão de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR DELETE TO authenticated USING (true);

-- Função de trigger para atualizar updated_at (caso a DB não permita on-duplicate direto da trigger externa, criaremos explicitamente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ltcat_pareceres_modtime') THEN
    CREATE TRIGGER update_ltcat_pareceres_modtime
    BEFORE UPDATE ON public.ltcat_pareceres
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END
$$;
