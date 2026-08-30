CREATE TABLE public.responsaveis (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  funcao text,
  registro_profissional text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responsaveis TO authenticated;
GRANT ALL ON public.responsaveis TO service_role;
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage responsaveis" ON public.responsaveis FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.psico_indicadores (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.psico_avaliacoes(id) on delete cascade,
  empresa_id uuid not null,
  contrato_id uuid,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (avaliacao_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.psico_indicadores TO authenticated;
GRANT ALL ON public.psico_indicadores TO service_role;
ALTER TABLE public.psico_indicadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage psico indicadores" ON public.psico_indicadores FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.psico_relatorios (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.psico_avaliacoes(id) on delete cascade,
  empresa_id uuid not null,
  contrato_id uuid,
  versao text not null default '1.0',
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (avaliacao_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.psico_relatorios TO authenticated;
GRANT ALL ON public.psico_relatorios TO service_role;
ALTER TABLE public.psico_relatorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage psico relatorios" ON public.psico_relatorios FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER responsaveis_updated_at BEFORE UPDATE ON public.responsaveis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER psico_indicadores_updated_at BEFORE UPDATE ON public.psico_indicadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER psico_relatorios_updated_at BEFORE UPDATE ON public.psico_relatorios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();