CREATE TABLE public.ia_conhecimento_pastas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('AET','AEP')),
  nome text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_conhecimento_pastas TO authenticated;
GRANT ALL ON public.ia_conhecimento_pastas TO service_role;
ALTER TABLE public.ia_conhecimento_pastas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage pastas" ON public.ia_conhecimento_pastas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ia_conhecimento_arquivos (
  id uuid primary key default gen_random_uuid(),
  pasta_id uuid not null references public.ia_conhecimento_pastas(id) on delete cascade,
  nome text not null,
  caminho text not null,
  mime text,
  tamanho bigint,
  created_by uuid,
  created_at timestamptz not null default now()
);
CREATE INDEX ia_conhecimento_arquivos_pasta_idx ON public.ia_conhecimento_arquivos(pasta_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_conhecimento_arquivos TO authenticated;
GRANT ALL ON public.ia_conhecimento_arquivos TO service_role;
ALTER TABLE public.ia_conhecimento_arquivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage arquivos" ON public.ia_conhecimento_arquivos FOR ALL TO authenticated USING (true) WITH CHECK (true);