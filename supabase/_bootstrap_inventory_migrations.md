# Supabase migrations bootstrap inventory

Generated from `73` files in `supabase/migrations/`.

**Counts:**
- CREATE TYPE / enums: **1**
- CREATE TABLE: **45**
- Tables ALTER'd but never CREATE'd in migrations: **4**
- Functions (distinct signatures, latest body): **17**
- Policies (final, after DROP POLICY): **191**
- Storage buckets (INSERT): **3** statements / **3** names inserted
- Storage bucket names (INSERT + policy refs): **7**
- Storage object policies (final): **27**
- Indexes: **45**
- Triggers: **31**
- Schemas: **1**
- GRANT/REVOKE: **51**

Migration files (chronological):

- `20260414113025_6e46e2b2-7c60-4e96-b93f-aacbfc561312.sql`
- `20260414123527_daa5e69e-3f30-482c-a7af-81a0884ca209.sql`
- `20260414124902_ec242838-f150-4953-bfcf-57f4dbc38037.sql`
- `20260414140230_290124e7-a280-45df-80bb-1dcdf4ce4fd0.sql`
- `20260414220000_epi_epc.sql`
- `20260414230000_ltcat_pareceres.sql`
- `20260415182910_1d721ea0-f1d3-4220-b225-d9b462f8ebac.sql`
- `20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql`
- `20260416001838_5f958ab2-3122-4fed-9189-8fe16b4428b4.sql`
- `20260416010449_ee957499-89ca-4fdd-9b8b-89c4eb360f9b.sql`
- `20260416020509_eb5c08ed-e8a7-460d-ad56-951c63ee1a73.sql`
- `20260416124113_0851160b-2f17-4a0e-9222-53d89d9c2269.sql`
- `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`
- `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`
- `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`
- `20260419195402_4e62dc9f-75f4-42f9-8e77-f87023df0e0f.sql`
- `20260420121327_93ba12e6-488d-4d55-bd31-86fe8399e6aa.sql`
- `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`
- `20260427225943_81a39ae9-a181-44a2-bcb8-11a5f5ba84f9.sql`
- `20260501214525_c31dc6eb-f673-45fe-99de-3e5cb493c346.sql`
- `20260503004952_72412598-de9a-4daf-81de-4c3fc7d90584.sql`
- `20260503011035_5220e9ac-5d0f-4663-a106-b9ed5d862ab9.sql`
- `20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql`
- `20260503023127_63042a4e-9695-4caf-9bdb-ad922a3af54f.sql`
- `20260503024229_310379ca-0791-4775-aa81-3dd685c2b3ec.sql`
- `20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql`
- `20260503182330_9e52f3ee-43c0-48dd-9142-f45ba5ab84f8.sql`
- `20260504031201_44e9968c-34ee-4fec-b304-98123cad08a9.sql`
- `20260505010440_34a82822-f1a1-455c-bfed-20aa1eabff4d.sql`
- `20260506001321_081d982b-c6cf-4b5c-9c83-cc500d7874f9.sql`
- `20260510231026_67722801-9c31-4258-8606-fb82a7268929.sql`
- `20260512143405_2e94ae5c-485e-4677-b173-90addea2ac24.sql`
- `20260512172207_5564ac80-c9e9-44a4-8b2a-a34274053cdf.sql`
- `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`
- `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`
- `20260529143129_e69f1509-9d1f-404c-b91e-ae587e7145a7.sql`
- `20260529162855_f03978d1-3a35-46e0-b51e-f7a52891270b.sql`
- `20260603184253_fbfcd9fd-33c8-40e9-a62f-c0a12ccb6faa.sql`
- `20260604190948_70d23a89-530b-418a-aa5c-e05b5f63f30a.sql`
- `20260605191032_254a71b3-456b-48a4-80b9-c76d45579827.sql`
- `20260622112235_99405486-e476-4fbd-9e10-1e1eed95ac2e.sql`
- `20260622113601_dec2112b-1180-4045-9b41-dc8428d90b60.sql`
- `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`
- `20260722141704_e8e1a4fc-9d16-4028-8311-1ef18c47cef7.sql`
- `20260722144007_063a238c-2542-4c9f-9711-3db1e9c9140c.sql`
- `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`
- `20260722205401_3380d9e7-c798-4843-897a-ba01867fdcc4.sql`
- `20260724163602_ccc65eb4-79c6-408c-9457-e071c3fc48e0.sql`
- `20260730132250_d925b837-d6a7-4ff9-a314-602a43c28e10.sql`
- `20260730135017_f5e6527b-bf09-44ce-9f28-2e008e7cd656.sql`
- `20260730190617_c1e3573c-d320-4e22-bfb3-e9600591aa70.sql`
- `20260830135307_b98b5290-ba6d-41f8-bbba-61522c55b286.sql`
- `20260830135625_671f8c20-a156-4fa5-999c-d414fac4d500.sql`
- `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`
- `20260830182719_ad96df8f-1fec-428a-b3e0-6ce301a8be93.sql`
- `20260831180422_e10bc552-fcee-45b8-ac21-0f9bda3e884b.sql`
- `20260902233443_cb9cb308-c832-4e5e-9796-9769f8a0bd04.sql`
- `20260904180853_438f8e0b-91a4-4c49-8b09-261ff8035ce4.sql`
- `20260904180922_f99c4ba4-6180-49f4-9df3-4a377888f1ed.sql`
- `20260910225228_0ee73e35-6255-4e7c-a4aa-31eb70387a76.sql`
- `20260911002319_a5e92a58-5d0f-40b2-a764-4ab2673cb8cb.sql`
- `20260911002344_d6f6f784-5111-40a8-ab58-c76d71d9a9b7.sql`
- `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`
- `20260913012234_dc525c6d-cd02-48f0-b32a-de5a7472eadb.sql`
- `20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql`
- `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql`
- `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`
- `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`
- `20260913131411_1f2bac5e-437d-446c-b8b5-4de26c588a25.sql`
- `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql`
- `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql`
- `20260919132348_43027d3e-0829-4e46-bbfc-cab1e302928a.sql`
- `20260919140817_9532b266-5c7d-41e1-943f-61ab71876a15.sql`

---

## 1. CREATE TYPE / enums

### `public.app_role`

Source: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'usuario');
```


## 2. CREATE TABLE / ALTER TABLE

### CREATE TABLE (45)

#### `public.aep_documentos`

Source: `20260902233443_cb9cb308-c832-4e5e-9796-9769f8a0bd04.sql`

```sql
CREATE TABLE public.aep_documentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id uuid REFERENCES public.documentos(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES public.empresas(id),
  contrato_id uuid REFERENCES public.contratos(id),
  responsavel_tecnico text,
  crea text,
  cargo text,
  data_elaboracao date,
  alteracoes_documento text,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  setores jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'rascunho',
  current_step integer NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### `public.aet_documentos`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE TABLE public.aet_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID REFERENCES public.documentos(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  responsavel_tecnico TEXT,
  crea TEXT,
  cargo TEXT,
  data_elaboracao DATE,
  alteracoes_documento TEXT,
  revisoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  setores JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.aet_instrucoes_usuario`

Source: `20260722141704_e8e1a4fc-9d16-4028-8311-1ef18c47cef7.sql`

```sql
CREATE TABLE public.aet_instrucoes_usuario (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  instrucoes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.audit_log`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  old_data jsonb,
  new_data jsonb
);
```

#### `public.contratos`

Source: `20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql`

```sql
CREATE TABLE IF NOT EXISTS public.contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero_contrato text,
  cnpj_contratante text,
  nome_contratante text,
  vigencia_inicio date,
  vigencia_fim date,
  local_trabalho text,
  escopo_contrato text,
  jornada_trabalho text,
  numero_funcionarios_fem integer DEFAULT 0,
  numero_funcionarios_masc integer DEFAULT 0,
  total_funcionarios integer DEFAULT 0,
  gestor_nome text,
  gestor_email text,
  gestor_telefone text,
  fiscal_nome text,
  fiscal_email text,
  fiscal_telefone text,
  preposto_nome text,
  preposto_email text,
  preposto_telefone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### `public.documentos`

Source: `20260416020509_eb5c08ed-e8a7-460d-ad56-951c63ee1a73.sql`

```sql
CREATE TABLE public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  empresa_nome TEXT NOT NULL DEFAULT '',
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'concluido',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `public.empresa_contatos`

Source: `20260416124113_0851160b-2f17-4a0e-9222-53d89d9c2269.sql`

```sql
CREATE TABLE public.empresa_contatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, 
  nome TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `public.empresas`

Source: `20260414123527_daa5e69e-3f30-482c-a7af-81a0884ca209.sql`

```sql
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnae_principal TEXT,
  grau_risco TEXT,
  endereco TEXT,
  numero_funcionarios_fem INTEGER DEFAULT 0,
  numero_funcionarios_masc INTEGER DEFAULT 0,
  total_funcionarios INTEGER DEFAULT 0,
  jornada_trabalho TEXT,
  numero_contrato TEXT,
  cnpj_contratante TEXT,
  nome_contratante TEXT,
  vigencia_inicio DATE,
  vigencia_fim DATE,
  local_trabalho TEXT,
  escopo_contrato TEXT,
  gestor_nome TEXT,
  gestor_email TEXT,
  gestor_telefone TEXT,
  fiscal_nome TEXT,
  fiscal_email TEXT,
  fiscal_telefone TEXT,
  preposto_nome TEXT,
  preposto_email TEXT,
  preposto_telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `public.epi_epc`

Source: `20260414220000_epi_epc.sql`

```sql
CREATE TABLE public.epi_epc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('EPI', 'EPC')),
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `public.epi_epc_riscos`

Source: `20260414220000_epi_epc.sql`

```sql
CREATE TABLE public.epi_epc_riscos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  epi_epc_id UUID NOT NULL REFERENCES public.epi_epc(id) ON DELETE CASCADE,
  risco_id UUID NOT NULL REFERENCES public.riscos(id) ON DELETE CASCADE,
  UNIQUE (epi_epc_id, risco_id)
);
```

#### `public.equipamentos_avaliacao`

Source: `20260416001838_5f958ab2-3122-4fed-9189-8fe16b4428b4.sql`

```sql
CREATE TABLE IF NOT EXISTS public.equipamentos_avaliacao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id uuid REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  empresa_id uuid,
  setor_id uuid,
  agente_nome text,
  nome_equipamento text,
  modelo_equipamento text,
  serie_equipamento text,
  data_avaliacao date,
  data_calibracao date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### `public.equipamentos_ho_registros`

Source: `20260503004952_72412598-de9a-4daf-81de-4c3fc7d90584.sql`

```sql
CREATE TABLE public.equipamentos_ho_registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos_ho(id) ON DELETE CASCADE,
  numero_serie TEXT NOT NULL,
  marca_modelo TEXT,
  data_calibracao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `public.ergonomia_avaliacoes`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE TABLE public.ergonomia_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  aet_documento_id uuid REFERENCES public.aet_documentos(id) ON DELETE CASCADE,
  setor_ref text,
  ferramenta text NOT NULL,
  colaborador_nome text,
  funcao text,
  empresa_nome text,
  setor_nome text,
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  escore_final numeric,
  classificacao text,
  nivel_acao text,
  recomendacoes text,
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### `public.esocial_exames`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE TABLE public.esocial_exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  descricao text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### `public.exames_cadastro`

Source: `20260604190948_70d23a89-530b-418a-aa5c-e05b5f63f30a.sql`

```sql
CREATE TABLE public.exames_cadastro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo_esocial text NOT NULL,
  descricao_esocial text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### `public.exames_catalogo`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE TABLE public.exames_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### `public.ficha_tecnica_resultados`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE TABLE public.ficha_tecnica_resultados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  setor_id uuid NOT NULL REFERENCES public.setores(id) ON DELETE RESTRICT,
  funcao_id uuid NOT NULL REFERENCES public.funcoes(id) ON DELETE RESTRICT,
  agente_id uuid NOT NULL REFERENCES public.riscos(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('ruido','vibracao_vci','vibracao_vmb','calor','poeira_silica','quimico_quantitativo','fumos_metalicos','vapores_organicos')),
  nen numeric,
  lavg numeric,
  aren numeric,
  vdvr numeric,
  concentracao numeric,
  taxa_metabolica text,
  componentes text,
  amostrador text,
  exposicao numeric,
  limite_tolerancia numeric NOT NULL,
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  last_modified_by uuid DEFAULT auth.uid()
);
```

#### `public.funcoes`

Source: `20260414124902_ec242838-f150-4953-bfcf-57f4dbc38037.sql`

```sql
CREATE TABLE public.funcoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
  nome_funcao TEXT NOT NULL,
  cbo_codigo TEXT,
  cbo_descricao TEXT,
  descricao_atividades TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `public.ia_conhecimento_arquivos`

Source: `20260911002319_a5e92a58-5d0f-40b2-a764-4ab2673cb8cb.sql`

```sql
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
```

#### `public.ia_conhecimento_pastas`

Source: `20260911002319_a5e92a58-5d0f-40b2-a764-4ab2673cb8cb.sql`

```sql
CREATE TABLE public.ia_conhecimento_pastas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('AET','AEP')),
  nome text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### `public.ltcat_av_calor`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE TABLE IF NOT EXISTS public.ltcat_av_calor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  colaborador TEXT,
  funcao_id UUID,
  data_avaliacao DATE,
  ibutg_medido NUMERIC,
  ibutg_limite NUMERIC,
  m_kcal_h NUMERIC,
  tipo_atividade TEXT,
  taxa_metabolica TEXT,
  descricao_atividade TEXT,
  situacao TEXT,
  cod_gfip TEXT,
  parecer_tecnico TEXT,
  aposentadoria_especial TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.ltcat_av_componentes`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE TABLE IF NOT EXISTS public.ltcat_av_componentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  componente TEXT,
  cas TEXT,
  resultado NUMERIC,
  unidade_resultado_id UUID,
  limite_tolerancia NUMERIC,
  unidade_limite_id UUID,
  tempo_coleta TEXT,
  unidade_tempo_coleta TEXT,
  dose_percentual NUMERIC,
  situacao TEXT,
  cod_gfip TEXT,
  colaborador TEXT,
  funcao_id UUID,
  data_avaliacao DATE,
  descricao_avaliacao TEXT,
  parecer_tecnico TEXT,
  aposentadoria_especial TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.ltcat_av_epi_epc`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE TABLE IF NOT EXISTS public.ltcat_av_epi_epc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL UNIQUE REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  epi_id UUID,
  epi_ca TEXT,
  epi_atenuacao TEXT,
  epi_eficaz TEXT,
  epc_id UUID,
  epc_eficaz TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.ltcat_av_equipamentos`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE TABLE IF NOT EXISTS public.ltcat_av_equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  nome_equipamento TEXT,
  modelo_equipamento TEXT,
  serie_equipamento TEXT,
  data_calibracao DATE,
  data_avaliacao DATE,
  agente_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.ltcat_av_resultados`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE TABLE IF NOT EXISTS public.ltcat_av_resultados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  colaborador TEXT,
  funcao_id UUID,
  data_avaliacao DATE,
  resultado NUMERIC,
  unidade_resultado_id UUID,
  limite_tolerancia NUMERIC,
  unidade_limite_id UUID,
  tempo_coleta TEXT,
  unidade_tempo_coleta TEXT,
  dose_percentual NUMERIC,
  situacao TEXT,
  cod_gfip TEXT,
  descricao_avaliacao TEXT,
  parecer_tecnico TEXT,
  aposentadoria_especial TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.ltcat_av_vibracao`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE TABLE IF NOT EXISTS public.ltcat_av_vibracao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.ltcat_avaliacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  tipo TEXT, 
  colaborador TEXT,
  funcao_id UUID,
  data_avaliacao DATE,
  aren NUMERIC,
  vdvr NUMERIC,
  aren_limite NUMERIC,
  vdvr_limite NUMERIC,
  tempo_exposicao TEXT,
  situacao TEXT,
  cod_gfip TEXT,
  parecer_tecnico TEXT,
  aposentadoria_especial TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.ltcat_pareceres`

Source: `20260414230000_ltcat_pareceres.sql`

```sql
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
```

#### `public.notificacoes`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid NOT NULL,
  empresa_id uuid,
  contrato_id uuid,
  empresa_nome text,
  contrato_numero text,
  documento_tipo text,
  documento_nome text,
  tipo text NOT NULL CHECK (tipo IN ('30_dias','15_dias','vencimento')),
  data_vencimento date NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (documento_id, tipo)
);
```

#### `public.pareceres_tecnicos`

Source: `20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql`

```sql
CREATE TABLE IF NOT EXISTS public.pareceres_tecnicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento text NOT NULL,
  situacao text NOT NULL,
  parecer_tecnico text NOT NULL DEFAULT '',
  risco_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid()
);
```

#### `public.pcmso_documentos`

Source: `20260529162855_f03978d1-3a35-46e0-b51e-f7a52891270b.sql`

```sql
CREATE TABLE public.pcmso_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid,
  contrato_id uuid,
  documento_id uuid,
  responsavel_tecnico text,
  crea text,
  cargo text,
  vigencia_inicio date,
  vigencia_fim date,
  revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  setores_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_step integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'rascunho',
  file_path text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### `public.pcmso_observacoes_padrao`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE TABLE public.pcmso_observacoes_padrao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### `public.pcmso_setor_exames`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
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
```

#### `public.profiles`

Source: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.psico_avaliacoes`

Source: `20260830135307_b98b5290-ba6d-41f8-bbba-61522c55b286.sql`

```sql
CREATE TABLE public.psico_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  contrato_id uuid REFERENCES public.contratos(id) ON DELETE SET NULL,
  titulo text NOT NULL DEFAULT 'Avaliação Psicossocial',
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'rascunho',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### `public.psico_base_tecnica`

Source: `20260830182719_ad96df8f-1fec-428a-b3e0-6ce301a8be93.sql`

```sql
CREATE TABLE public.psico_base_tecnica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  caminho TEXT NOT NULL,
  tamanho BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.psico_indicadores`

Source: `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`

```sql
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
```

#### `public.psico_links`

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
CREATE TABLE public.psico_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(9), 'base64'),
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### `public.psico_relatorios`

Source: `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`

```sql
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
```

#### `public.psico_respostas`

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
CREATE TABLE public.psico_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.psico_links(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  contrato_id uuid REFERENCES public.contratos(id) ON DELETE SET NULL,
  contrato_nome text,
  funcao_id uuid REFERENCES public.funcoes(id) ON DELETE SET NULL,
  funcao_nome text NOT NULL,
  colaborador_nome text,
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  blocos jsonb NOT NULL DEFAULT '{}'::jsonb,
  alertas jsonb NOT NULL DEFAULT '{}'::jsonb,
  resultado_psicossocial text,
  riscos_psicossociais text,
  total_positivas int DEFAULT 0,
  total_negativas int DEFAULT 0,
  copsoq_resultado_resumido text,
  copsoq_riscos_identificados text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### `public.responsaveis`

Source: `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`

```sql
CREATE TABLE public.responsaveis (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  funcao text,
  registro_profissional text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### `public.riscos`

Source: `20260414140230_290124e7-a280-45df-80bb-1dcdf4ce4fd0.sql`

```sql
CREATE TABLE public.riscos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  codigo_esocial TEXT,
  descricao_esocial TEXT,
  propagacao TEXT[],
  tipo_exposicao TEXT,
  fonte_geradora TEXT,
  danos_saude TEXT,
  medidas_controle TEXT,
  tipo_epi TEXT,
  epi_eficaz TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `public.setores`

Source: `20260414124902_ec242838-f150-4953-bfcf-57f4dbc38037.sql`

```sql
CREATE TABLE public.setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ghe_ges TEXT,
  nome_setor TEXT NOT NULL,
  descricao_ambiente TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `public.templates`

Source: `20260414113025_6e46e2b2-7c60-4e96-b93f-aacbfc561312.sql`

```sql
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `public.treinamentos_cadastro`

Source: `20260603184253_fbfcd9fd-33c8-40e9-a62f-c0a12ccb6faa.sql`

```sql
CREATE TABLE public.treinamentos_cadastro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text,
  descricao text,
  carga_horaria text,
  periodicidade text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### `public.user_roles`

Source: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
```

### ALTER TABLE only — never CREATE TABLE in migrations (4)

These tables are referenced via ALTER (and possibly policies/functions) but have no `CREATE TABLE` in this migrations folder.

#### `equipamentos_ho`

- ALTER statements: 3
- Columns added via ADD COLUMN: `tipo`

Evolution:

<details><summary>20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql</summary>

```sql
ALTER TABLE public.equipamentos_ho ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260427225943_81a39ae9-a181-44a2-bcb8-11a5f5ba84f9.sql</summary>

```sql
ALTER TABLE public.equipamentos_ho REPLICA IDENTITY FULL;
```

</details>

<details><summary>20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql</summary>

```sql
ALTER TABLE public.equipamentos_ho
  ADD COLUMN IF NOT EXISTS tipo text;
```

</details>

#### `ltcat_avaliacoes`

- ALTER statements: 11
- Columns added via ADD COLUMN: `data_avaliacao`, `funcoes_ges`, `tempo_coleta`, `unidade_tempo_coleta`, `dose_percentual`, `situacao`, `cod_gfip`, `documento_id`, `tipo_documento`, `contrato_id`, `ficha_tecnica_resultado_id`

Evolution:

<details><summary>20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260416001838_5f958ab2-3122-4fed-9189-8fe16b4428b4.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes
ADD COLUMN IF NOT EXISTS data_avaliacao date,
ADD COLUMN IF NOT EXISTS funcoes_ges text;
```

</details>

<details><summary>20260416010449_ee957499-89ca-4fdd-9b8b-89c4eb360f9b.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes
ADD COLUMN IF NOT EXISTS tempo_coleta text,
ADD COLUMN IF NOT EXISTS unidade_tempo_coleta text,
ADD COLUMN IF NOT EXISTS dose_percentual numeric,
ADD COLUMN IF NOT EXISTS situacao text,
ADD COLUMN IF NOT EXISTS cod_gfip text;
```

</details>

<details><summary>20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes
  ADD COLUMN IF NOT EXISTS documento_id UUID REFERENCES public.documentos(id) ON DELETE CASCADE;
```

</details>

<details><summary>20260419195402_4e62dc9f-75f4-42f9-8e77-f87023df0e0f.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'ltcat';
```

</details>

<details><summary>20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES public.contratos(id) ON DELETE SET NULL;
```

</details>

<details><summary>20260730135017_f5e6527b-bf09-44ce-9f28-2e008e7cd656.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes DROP CONSTRAINT ltcat_avaliacoes_setor_id_fkey;
```

</details>

<details><summary>20260730135017_f5e6527b-bf09-44ce-9f28-2e008e7cd656.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes ADD CONSTRAINT ltcat_avaliacoes_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id) ON DELETE CASCADE;
```

</details>

<details><summary>20260730135017_f5e6527b-bf09-44ce-9f28-2e008e7cd656.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes DROP CONSTRAINT ltcat_avaliacoes_funcao_id_fkey;
```

</details>

<details><summary>20260730135017_f5e6527b-bf09-44ce-9f28-2e008e7cd656.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes ADD CONSTRAINT ltcat_avaliacoes_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id) ON DELETE SET NULL;
```

</details>

<details><summary>20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes
ADD COLUMN ficha_tecnica_resultado_id uuid REFERENCES public.ficha_tecnica_resultados(id) ON DELETE SET NULL;
```

</details>

#### `tecnicas_amostragem`

- ALTER statements: 2

Evolution:

<details><summary>20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql</summary>

```sql
ALTER TABLE public.tecnicas_amostragem ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260427225943_81a39ae9-a181-44a2-bcb8-11a5f5ba84f9.sql</summary>

```sql
ALTER TABLE public.tecnicas_amostragem REPLICA IDENTITY FULL;
```

</details>

#### `unidades`

- ALTER statements: 2

Evolution:

<details><summary>20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql</summary>

```sql
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260427225943_81a39ae9-a181-44a2-bcb8-11a5f5ba84f9.sql</summary>

```sql
ALTER TABLE public.unidades REPLICA IDENTITY FULL;
```

</details>

### Highlighted table column evolution (requested)

#### `equipamentos_ho`

- **No CREATE TABLE** in migrations
- ALTER count: 3; ADD COLUMN: `tipo`
<details><summary>20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql</summary>

```sql
ALTER TABLE public.equipamentos_ho ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260427225943_81a39ae9-a181-44a2-bcb8-11a5f5ba84f9.sql</summary>

```sql
ALTER TABLE public.equipamentos_ho REPLICA IDENTITY FULL;
```

</details>

<details><summary>20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql</summary>

```sql
ALTER TABLE public.equipamentos_ho
  ADD COLUMN IF NOT EXISTS tipo text;
```

</details>

#### `tecnicas_amostragem`

- **No CREATE TABLE** in migrations
- ALTER count: 2; ADD COLUMN: (none parsed)
<details><summary>20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql</summary>

```sql
ALTER TABLE public.tecnicas_amostragem ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260427225943_81a39ae9-a181-44a2-bcb8-11a5f5ba84f9.sql</summary>

```sql
ALTER TABLE public.tecnicas_amostragem REPLICA IDENTITY FULL;
```

</details>

#### `unidades`

- **No CREATE TABLE** in migrations
- ALTER count: 2; ADD COLUMN: (none parsed)
<details><summary>20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql</summary>

```sql
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260427225943_81a39ae9-a181-44a2-bcb8-11a5f5ba84f9.sql</summary>

```sql
ALTER TABLE public.unidades REPLICA IDENTITY FULL;
```

</details>

#### `ltcat_avaliacoes`

- **No CREATE TABLE** in migrations
- ALTER count: 11; ADD COLUMN: `data_avaliacao`, `funcoes_ges`, `tempo_coleta`, `unidade_tempo_coleta`, `dose_percentual`, `situacao`, `cod_gfip`, `documento_id`, `tipo_documento`, `contrato_id`, `ficha_tecnica_resultado_id`
<details><summary>20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260416001838_5f958ab2-3122-4fed-9189-8fe16b4428b4.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes
ADD COLUMN IF NOT EXISTS data_avaliacao date,
ADD COLUMN IF NOT EXISTS funcoes_ges text;
```

</details>

<details><summary>20260416010449_ee957499-89ca-4fdd-9b8b-89c4eb360f9b.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes
ADD COLUMN IF NOT EXISTS tempo_coleta text,
ADD COLUMN IF NOT EXISTS unidade_tempo_coleta text,
ADD COLUMN IF NOT EXISTS dose_percentual numeric,
ADD COLUMN IF NOT EXISTS situacao text,
ADD COLUMN IF NOT EXISTS cod_gfip text;
```

</details>

<details><summary>20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes
  ADD COLUMN IF NOT EXISTS documento_id UUID REFERENCES public.documentos(id) ON DELETE CASCADE;
```

</details>

<details><summary>20260419195402_4e62dc9f-75f4-42f9-8e77-f87023df0e0f.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'ltcat';
```

</details>

<details><summary>20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES public.contratos(id) ON DELETE SET NULL;
```

</details>

<details><summary>20260730135017_f5e6527b-bf09-44ce-9f28-2e008e7cd656.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes DROP CONSTRAINT ltcat_avaliacoes_setor_id_fkey;
```

</details>

<details><summary>20260730135017_f5e6527b-bf09-44ce-9f28-2e008e7cd656.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes ADD CONSTRAINT ltcat_avaliacoes_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id) ON DELETE CASCADE;
```

</details>

<details><summary>20260730135017_f5e6527b-bf09-44ce-9f28-2e008e7cd656.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes DROP CONSTRAINT ltcat_avaliacoes_funcao_id_fkey;
```

</details>

<details><summary>20260730135017_f5e6527b-bf09-44ce-9f28-2e008e7cd656.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes ADD CONSTRAINT ltcat_avaliacoes_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id) ON DELETE SET NULL;
```

</details>

<details><summary>20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql</summary>

```sql
ALTER TABLE public.ltcat_avaliacoes
ADD COLUMN ficha_tecnica_resultado_id uuid REFERENCES public.ficha_tecnica_resultados(id) ON DELETE SET NULL;
```

</details>

#### `riscos`

- CREATE TABLE in: `20260414140230_290124e7-a280-45df-80bb-1dcdf4ce4fd0.sql`
- ALTER count: 4; ADD COLUMN: `is_padrao`, `row_version`, `last_modified_by`
<details><summary>20260414140230_290124e7-a280-45df-80bb-1dcdf4ce4fd0.sql</summary>

```sql
ALTER TABLE public.riscos ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260427225943_81a39ae9-a181-44a2-bcb8-11a5f5ba84f9.sql</summary>

```sql
ALTER TABLE public.riscos REPLICA IDENTITY FULL;
```

</details>

<details><summary>20260512172207_5564ac80-c9e9-44a4-8b2a-a34274053cdf.sql</summary>

```sql
ALTER TABLE public.riscos ADD COLUMN IF NOT EXISTS is_padrao boolean NOT NULL DEFAULT false;
```

</details>

<details><summary>20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql</summary>

```sql
ALTER TABLE public.riscos ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
```

</details>

#### `empresas`

- CREATE TABLE in: `20260414123527_daa5e69e-3f30-482c-a7af-81a0884ca209.sql`
- ALTER count: 2; ADD COLUMN: `row_version`, `last_modified_by`
<details><summary>20260414123527_daa5e69e-3f30-482c-a7af-81a0884ca209.sql</summary>

```sql
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql</summary>

```sql
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
```

</details>

#### `documentos`

- CREATE TABLE in: `20260416020509_eb5c08ed-e8a7-460d-ad56-951c63ee1a73.sql`
- ALTER count: 5; ADD COLUMN: `contrato_id`, `responsavel_tecnico`, `crea`, `cargo`, `data_elaboracao`, `alteracoes_documento`, `revisoes`, `current_step`, `draft_snapshot`, `data_validade`, `upload_file_path`, `nome_documento`, `row_version`, `last_modified_by`
<details><summary>20260416020509_eb5c08ed-e8a7-460d-ad56-951c63ee1a73.sql</summary>

```sql
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql</summary>

```sql
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES public.contratos(id) ON DELETE SET NULL;
```

</details>

<details><summary>20260503023127_63042a4e-9695-4caf-9bdb-ad922a3af54f.sql</summary>

```sql
ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS responsavel_tecnico text,
  ADD COLUMN IF NOT EXISTS crea text,
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS data_elaboracao date,
  ADD COLUMN IF NOT EXISTS alteracoes_documento text,
  ADD COLUMN IF NOT EXISTS revisoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS draft_snapshot jsonb;
```

</details>

<details><summary>20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql</summary>

```sql
ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS data_validade date,
  ADD COLUMN IF NOT EXISTS upload_file_path text,
  ADD COLUMN IF NOT EXISTS nome_documento text;
```

</details>

<details><summary>20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql</summary>

```sql
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
```

</details>

#### `contratos`

- CREATE TABLE in: `20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql`
- ALTER count: 2; ADD COLUMN: `row_version`, `last_modified_by`
<details><summary>20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql</summary>

```sql
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql</summary>

```sql
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
```

</details>

#### `setores`

- CREATE TABLE in: `20260414124902_ec242838-f150-4953-bfcf-57f4dbc38037.sql`
- ALTER count: 3; ADD COLUMN: `contrato_id`, `row_version`, `last_modified_by`
<details><summary>20260414124902_ec242838-f150-4953-bfcf-57f4dbc38037.sql</summary>

```sql
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260622112235_99405486-e476-4fbd-9e10-1e1eed95ac2e.sql</summary>

```sql
ALTER TABLE public.setores ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES public.contratos(id) ON DELETE CASCADE;
```

</details>

<details><summary>20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql</summary>

```sql
ALTER TABLE public.setores ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
```

</details>

#### `funcoes`

- CREATE TABLE in: `20260414124902_ec242838-f150-4953-bfcf-57f4dbc38037.sql`
- ALTER count: 3; ADD COLUMN: `expostos`, `row_version`, `last_modified_by`
<details><summary>20260414124902_ec242838-f150-4953-bfcf-57f4dbc38037.sql</summary>

```sql
ALTER TABLE public.funcoes ENABLE ROW LEVEL SECURITY;
```

</details>

<details><summary>20260512143405_2e94ae5c-485e-4677-b173-90addea2ac24.sql</summary>

```sql
ALTER TABLE public.funcoes ADD COLUMN IF NOT EXISTS expostos text;
```

</details>

<details><summary>20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql</summary>

```sql
ALTER TABLE public.funcoes ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS last_modified_by uuid;
```

</details>

#### `profiles`

- CREATE TABLE in: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`
- ALTER count: 1; ADD COLUMN: (none parsed)
<details><summary>20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql</summary>

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

</details>

#### `user_roles`

- CREATE TABLE in: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`
- ALTER count: 1; ADD COLUMN: (none parsed)
<details><summary>20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql</summary>

```sql
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

</details>


## 3. CREATE FUNCTION (latest per signature)

### Priority RPCs (latest full body)

#### `public.has_role(uuid, app_role)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`
- Prior versions: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.has_role(_user_id, _role) $$;
```

#### `private.has_role(uuid, app_role)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
```

#### `public.psico_get_public_link(text)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`
- Prior versions: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
CREATE OR REPLACE FUNCTION public.psico_get_public_link(_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.psico_get_public_link(_token) $$;
```

#### `private.psico_get_public_link(text)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
CREATE OR REPLACE FUNCTION private.psico_get_public_link(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_link record; v_result jsonb;
BEGIN
  SELECT l.id, l.empresa_id, l.ativo, e.razao_social INTO v_link
  FROM public.psico_links l JOIN public.empresas e ON e.id = l.empresa_id
  WHERE l.token = _token;
  IF NOT FOUND OR NOT v_link.ativo THEN RETURN jsonb_build_object('error', 'Link inválido ou desativado'); END IF;
  SELECT jsonb_build_object(
    'link_id', v_link.id, 'empresa_id', v_link.empresa_id, 'empresa_nome', v_link.razao_social,
    'contratos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'nome', COALESCE(c.numero_contrato, c.escopo_contrato, 'Contrato'),
        'funcoes', COALESCE((SELECT jsonb_agg(DISTINCT jsonb_build_object('id', f.id, 'nome', f.nome_funcao)) FROM public.setores s JOIN public.funcoes f ON f.setor_id=s.id WHERE s.contrato_id=c.id), '[]'::jsonb)
      ) ORDER BY c.numero_contrato) FROM public.contratos c WHERE c.empresa_id=v_link.empresa_id
    ), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
```

#### `public.psico_submit_resposta(text, jsonb)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`
- Prior versions: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`, `20260830135307_b98b5290-ba6d-41f8-bbba-61522c55b286.sql`

```sql
CREATE OR REPLACE FUNCTION public.psico_submit_resposta(_token text, _payload jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.psico_submit_resposta(_token, _payload) $$;
```

#### `private.psico_submit_resposta(text, jsonb)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
CREATE OR REPLACE FUNCTION private.psico_submit_resposta(_token text, _payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_link record; v_id uuid; v_funcao_id uuid; v_contrato_id uuid;
BEGIN
  SELECT id, empresa_id, ativo, avaliacao_id, contrato_id INTO v_link FROM public.psico_links WHERE token=_token;
  IF NOT FOUND OR NOT v_link.ativo THEN RETURN jsonb_build_object('error', 'Link inválido'); END IF;
  v_contrato_id := COALESCE(NULLIF(_payload->>'contrato_id','')::uuid, v_link.contrato_id);
  IF v_contrato_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id=v_contrato_id AND c.empresa_id=v_link.empresa_id) THEN
      RETURN jsonb_build_object('error', 'Contrato inválido');
    END IF;
    SELECT f.id INTO v_funcao_id FROM public.funcoes f JOIN public.setores s ON s.id=f.setor_id
    WHERE s.contrato_id=v_contrato_id AND lower(trim(f.nome_funcao))=lower(trim(_payload->>'funcao_nome')) LIMIT 1;
  END IF;
  INSERT INTO public.psico_respostas (link_id, empresa_id, contrato_id, contrato_nome, funcao_id, funcao_nome, colaborador_nome, data_avaliacao, respostas, blocos, alertas, resultado_psicossocial, riscos_psicossociais, total_positivas, total_negativas, copsoq_resultado_resumido, copsoq_riscos_identificados, avaliacao_id)
  VALUES (v_link.id, v_link.empresa_id, v_contrato_id, _payload->>'contrato_nome', v_funcao_id, _payload->>'funcao_nome', _payload->>'colaborador_nome', COALESCE((_payload->>'data_avaliacao')::date,CURRENT_DATE), COALESCE(_payload->'respostas','{}'::jsonb), COALESCE(_payload->'blocos','{}'::jsonb), COALESCE(_payload->'alertas','{}'::jsonb), _payload->>'resultado_psicossocial', _payload->>'riscos_psicossociais', COALESCE((_payload->>'total_positivas')::int,0), COALESCE((_payload->>'total_negativas')::int,0), _payload->>'copsoq_resultado_resumido', _payload->>'copsoq_riscos_identificados', v_link.avaliacao_id)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id',v_id,'ok',true);
END;
$$;
```

#### `public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb)`

- Latest: `20260910225228_0ee73e35-6255-4e7c-a4aa-31eb70387a76.sql`

```sql
CREATE OR REPLACE FUNCTION public.sync_ltcat_avaliacoes(
  _documento_id uuid,
  _empresa_id uuid,
  _tipo_documento text,
  _avaliacoes jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_av jsonb;
  v_id uuid;
  v_keep_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  IF _documento_id IS NULL OR _empresa_id IS NULL THEN
    RAISE EXCEPTION 'Documento e empresa são obrigatórios';
  END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN
    RAISE EXCEPTION 'Tipo de documento inválido';
  END IF;
  IF jsonb_typeof(COALESCE(_avaliacoes, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Avaliações devem ser uma lista';
  END IF;

  FOR v_av IN SELECT value FROM jsonb_array_elements(COALESCE(_avaliacoes, '[]'::jsonb))
  LOOP
    v_id := (v_av->>'id')::uuid;
    v_keep_ids := array_append(v_keep_ids, v_id);

    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador,
      tipo_avaliacao, tipo_agente, agente_id, tecnica_id, equipamento_id,
      resultado, unidade_resultado_id, limite_tolerancia, unidade_limite_id,
      codigo_esocial, descricao_esocial, propagacao, tipo_exposicao,
      fonte_geradora, danos_saude, medidas_controle, parecer_tecnico,
      aposentadoria_especial, data_avaliacao, funcoes_ges, tempo_coleta,
      unidade_tempo_coleta, tipo_documento
    ) VALUES (
      v_id, _documento_id, _empresa_id,
      NULLIF(v_av->>'contrato_id','')::uuid,
      NULLIF(v_av->>'setor_id','')::uuid,
      NULLIF(v_av->>'funcao_id','')::uuid,
      NULLIF(v_av->>'colaborador',''),
      NULLIF(v_av->>'tipo_avaliacao',''), NULLIF(v_av->>'tipo_agente',''),
      NULLIF(v_av->>'agente_id','')::uuid,
      NULLIF(v_av->>'tecnica_id','')::uuid,
      NULLIF(v_av->>'equipamento_id','')::uuid,
      NULLIF(v_av->>'resultado','')::numeric,
      NULLIF(v_av->>'unidade_resultado_id','')::uuid,
      NULLIF(v_av->>'limite_tolerancia','')::numeric,
      NULLIF(v_av->>'unidade_limite_id','')::uuid,
      NULLIF(v_av->>'codigo_esocial',''), NULLIF(v_av->>'descricao_esocial',''),
      CASE WHEN jsonb_typeof(v_av->'propagacao') = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(v_av->'propagacao')) ELSE NULLIF(v_av->>'propagacao','')::text[] END,
      NULLIF(v_av->>'tipo_exposicao',''), NULLIF(v_av->>'fonte_geradora',''),
      NULLIF(v_av->>'danos_saude',''), NULLIF(v_av->>'medidas_controle',''),
      NULLIF(v_av->>'parecer_tecnico',''), NULLIF(v_av->>'aposentadoria_especial',''),
      NULLIF(v_av->>'data_avaliacao','')::date, NULLIF(v_av->>'funcoes_ges',''),
      NULLIF(v_av->>'tempo_coleta',''), NULLIF(v_av->>'unidade_tempo_coleta',''),
      _tipo_documento
    )
    ON CONFLICT (id) DO UPDATE SET
      documento_id = EXCLUDED.documento_id, empresa_id = EXCLUDED.empresa_id,
      contrato_id = EXCLUDED.contrato_id, setor_id = EXCLUDED.setor_id,
      funcao_id = EXCLUDED.funcao_id, colaborador = EXCLUDED.colaborador,
      tipo_avaliacao = EXCLUDED.tipo_avaliacao, tipo_agente = EXCLUDED.tipo_agente,
      agente_id = EXCLUDED.agente_id, tecnica_id = EXCLUDED.tecnica_id,
      equipamento_id = EXCLUDED.equipamento_id, resultado = EXCLUDED.resultado,
      unidade_resultado_id = EXCLUDED.unidade_resultado_id,
      limite_tolerancia = EXCLUDED.limite_tolerancia,
      unidade_limite_id = EXCLUDED.unidade_limite_id,
      codigo_esocial = EXCLUDED.codigo_esocial, descricao_esocial = EXCLUDED.descricao_esocial,
      propagacao = EXCLUDED.propagacao, tipo_exposicao = EXCLUDED.tipo_exposicao,
      fonte_geradora = EXCLUDED.fonte_geradora, danos_saude = EXCLUDED.danos_saude,
      medidas_controle = EXCLUDED.medidas_controle, parecer_tecnico = EXCLUDED.parecer_tecnico,
      aposentadoria_especial = EXCLUDED.aposentadoria_especial,
      data_avaliacao = EXCLUDED.data_avaliacao, funcoes_ges = EXCLUDED.funcoes_ges,
      tempo_coleta = EXCLUDED.tempo_coleta,
      unidade_tempo_coleta = EXCLUDED.unidade_tempo_coleta,
      tipo_documento = EXCLUDED.tipo_documento;

    DELETE FROM public.ltcat_av_componentes WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_componentes (
      id, avaliacao_id, ordem, componente, cas, resultado, unidade_resultado_id,
      limite_tolerancia, unidade_limite_id, tempo_coleta, unidade_tempo_coleta,
      dose_percentual, situacao, cod_gfip, colaborador, funcao_id, data_avaliacao,
      descricao_avaliacao, parecer_tecnico, aposentadoria_especial,
      numero_serie_bomba, amostrador, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'componente',''), NULLIF(x->>'cas',''), NULLIF(x->>'resultado','')::numeric,
      NULLIF(x->>'unidade_resultado_id','')::uuid, NULLIF(x->>'limite_tolerancia','')::numeric,
      NULLIF(x->>'unidade_limite_id','')::uuid, NULLIF(x->>'tempo_coleta',''),
      NULLIF(x->>'unidade_tempo_coleta',''), NULLIF(x->>'dose_percentual','')::numeric,
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''), NULLIF(x->>'colaborador',''),
      NULLIF(x->>'funcao_id','')::uuid, NULLIF(x->>'data_avaliacao','')::date,
      NULLIF(x->>'descricao_avaliacao',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'numero_serie_bomba',''),
      NULLIF(x->>'amostrador',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'componentes','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_calor WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_calor (
      id, avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao,
      ibutg_medido, ibutg_limite, m_kcal_h, tipo_atividade, taxa_metabolica,
      descricao_atividade, situacao, cod_gfip, parecer_tecnico,
      aposentadoria_especial, local_atividade, equipamento_id, tempo_exposicao,
      ibutg_tipo, tbn_valores, tg_valores, tbs_valores, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'ibutg_medido','')::numeric,
      NULLIF(x->>'ibutg_limite','')::numeric, NULLIF(x->>'m_kcal_h','')::numeric,
      NULLIF(x->>'tipo_atividade',''), NULLIF(x->>'taxa_metabolica',''),
      NULLIF(x->>'descricao_atividade',''), NULLIF(x->>'situacao',''),
      NULLIF(x->>'cod_gfip',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'local_atividade',''),
      NULLIF(x->>'equipamento_id','')::uuid, NULLIF(x->>'tempo_exposicao',''),
      NULLIF(x->>'ibutg_tipo',''), NULLIF(x->>'tbn_valores',''),
      NULLIF(x->>'tg_valores',''), NULLIF(x->>'tbs_valores',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'calor','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_vibracao WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_vibracao (
      id, avaliacao_id, ordem, tipo, colaborador, funcao_id, data_avaliacao,
      aren, vdvr, aren_limite, vdvr_limite, tempo_exposicao, situacao,
      cod_gfip, parecer_tecnico, aposentadoria_especial, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'tipo',''), NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'aren','')::numeric,
      NULLIF(x->>'vdvr','')::numeric, NULLIF(x->>'aren_limite','')::numeric,
      NULLIF(x->>'vdvr_limite','')::numeric, NULLIF(x->>'tempo_exposicao',''),
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''),
      NULLIF(x->>'parecer_tecnico',''), NULLIF(x->>'aposentadoria_especial',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'vibracao','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_resultados WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_resultados (
      id, avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao, resultado,
      unidade_resultado_id, limite_tolerancia, unidade_limite_id, tempo_coleta,
      unidade_tempo_coleta, dose_percentual, situacao, cod_gfip,
      descricao_avaliacao, parecer_tecnico, aposentadoria_especial,
      equipamento_registro_id, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'resultado','')::numeric,
      NULLIF(x->>'unidade_resultado_id','')::uuid, NULLIF(x->>'limite_tolerancia','')::numeric,
      NULLIF(x->>'unidade_limite_id','')::uuid, NULLIF(x->>'tempo_coleta',''),
      NULLIF(x->>'unidade_tempo_coleta',''), NULLIF(x->>'dose_percentual','')::numeric,
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''),
      NULLIF(x->>'descricao_avaliacao',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'equipamento_registro_id','')::uuid,
      _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'resultados','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_equipamentos WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_equipamentos (
      id, avaliacao_id, ordem, nome_equipamento, modelo_equipamento,
      serie_equipamento, data_calibracao, data_avaliacao, agente_nome,
      tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'nome_equipamento',''), NULLIF(x->>'modelo_equipamento',''),
      NULLIF(x->>'serie_equipamento',''), NULLIF(x->>'data_calibracao','')::date,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'agente_nome',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'equipamentos','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_epi_epc WHERE avaliacao_id = v_id;
    IF COALESCE(v_av->'epi_epc', '{}'::jsonb) <> '{}'::jsonb THEN
      INSERT INTO public.ltcat_av_epi_epc (
        id, avaliacao_id, epi_id, epi_ca, epi_atenuacao, epi_eficaz,
        epc_id, epc_eficaz, tipo_documento
      ) VALUES (
        COALESCE(NULLIF(v_av->'epi_epc'->>'id','')::uuid, gen_random_uuid()), v_id,
        NULLIF(v_av->'epi_epc'->>'epi_id','')::uuid,
        NULLIF(v_av->'epi_epc'->>'epi_ca',''), NULLIF(v_av->'epi_epc'->>'epi_atenuacao',''),
        NULLIF(v_av->'epi_epc'->>'epi_eficaz',''),
        NULLIF(v_av->'epi_epc'->>'epc_id','')::uuid,
        NULLIF(v_av->'epi_epc'->>'epc_eficaz',''), _tipo_documento
      );
    END IF;
  END LOOP;

  DELETE FROM public.ltcat_avaliacoes
  WHERE documento_id = _documento_id
    AND NOT (id = ANY(v_keep_ids));

  RETURN jsonb_build_object('ok', true, 'count', cardinality(v_keep_ids));
END;
$$;
```

#### `public.update_shared_record(text, uuid, bigint, jsonb)`

- Latest: `20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql`

```sql
CREATE OR REPLACE FUNCTION public.update_shared_record(
  _table_name text,
  _record_id uuid,
  _expected_version bigint,
  _patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF _table_name NOT IN ('empresas','contratos','setores','funcoes','riscos','documentos','aet_documentos','aep_documentos','pcmso_documentos') THEN
    RAISE EXCEPTION 'Tabela não permitida';
  END IF;
  IF _patch ?| ARRAY['id','row_version','last_modified_by','created_at','updated_at'] THEN
    RAISE EXCEPTION 'Campos de controle não podem ser alterados';
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET %s WHERE id = $1 AND row_version = $2 RETURNING to_jsonb(%I.*)',
    _table_name,
    (SELECT string_agg(format('%I = ($3->>%L)::%s', c.column_name, c.column_name, c.udt_name), ', ')
       FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = _table_name
        AND c.column_name IN (SELECT jsonb_object_keys(_patch))
        AND c.column_name NOT IN ('id','row_version','last_modified_by','created_at','updated_at')),
    _table_name
  ) INTO v_result USING _record_id, _expected_version, _patch;

  IF v_result IS NULL THEN
    EXECUTE format('SELECT to_jsonb(t.*) FROM public.%I t WHERE id = $1', _table_name)
      INTO v_result USING _record_id;
    RETURN jsonb_build_object('ok', false, 'conflict', true, 'current', v_result);
  END IF;

  RETURN jsonb_build_object('ok', true, 'conflict', false, 'record', v_result);
END;
$$;
```

#### `public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb)`

- Latest: `20260919140817_9532b266-5c7d-41e1-943f-61ab71876a15.sql`
- Prior versions: `20260919132348_43027d3e-0829-4e46-bbfc-cab1e302928a.sql`

```sql
CREATE OR REPLACE FUNCTION public.save_ltcat_documento_v2(
  _documento_id uuid,
  _empresa_id uuid,
  _tipo_documento text,
  _expected_row_version bigint,
  _document_patch jsonb,
  _avaliacoes jsonb,
  _delete_avaliacao_ids uuid[],
  _delete_child_ids jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_av jsonb;
  v_child jsonb;
  v_id uuid;
  v_current_version bigint;
  v_new_version bigint;
  v_count integer := 0;
  v_deleted integer := 0;
  v_deleted_children integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501'; END IF;
  IF _documento_id IS NULL OR _empresa_id IS NULL THEN RAISE EXCEPTION 'Documento e empresa são obrigatórios'; END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN RAISE EXCEPTION 'Tipo de documento inválido'; END IF;
  IF jsonb_typeof(COALESCE(_avaliacoes, '[]'::jsonb)) <> 'array' THEN RAISE EXCEPTION 'Avaliações devem ser uma lista'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_documento_id::text, 0));
  SELECT d.row_version INTO v_current_version FROM public.documentos d
   WHERE d.id = _documento_id AND d.empresa_id = _empresa_id AND lower(d.tipo) = _tipo_documento FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Documento não encontrado ou incompatível' USING ERRCODE = '42501'; END IF;
  IF _expected_row_version IS NULL OR v_current_version <> _expected_row_version THEN
    RETURN jsonb_build_object('ok', false, 'conflict', true, 'current_row_version', v_current_version);
  END IF;

  FOR v_av IN SELECT value FROM jsonb_array_elements(COALESCE(_avaliacoes, '[]'::jsonb)) LOOP
    v_id := NULLIF(v_av->>'id', '')::uuid;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Toda avaliação deve possuir identificador'; END IF;
    IF EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id = v_id AND a.documento_id <> _documento_id) THEN
      RAISE EXCEPTION 'Identificador de avaliação pertence a outro documento';
    END IF;
    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador, tipo_avaliacao, tipo_agente,
      agente_id, tecnica_id, equipamento_id, resultado, unidade_resultado_id, limite_tolerancia, unidade_limite_id,
      codigo_esocial, descricao_esocial, propagacao, tipo_exposicao, fonte_geradora, danos_saude, medidas_controle,
      parecer_tecnico, aposentadoria_especial, data_avaliacao, funcoes_ges, tempo_coleta, unidade_tempo_coleta,
      tipo_documento, ficha_tecnica_resultado_id, created_by
    ) VALUES (
      v_id, _documento_id, _empresa_id, NULLIF(v_av->>'contrato_id','')::uuid, NULLIF(v_av->>'setor_id','')::uuid,
      NULLIF(v_av->>'funcao_id','')::uuid, NULLIF(v_av->>'colaborador',''), NULLIF(v_av->>'tipo_avaliacao',''),
      NULLIF(v_av->>'tipo_agente',''), NULLIF(v_av->>'agente_id','')::uuid, NULLIF(v_av->>'tecnica_id','')::uuid,
      NULLIF(v_av->>'equipamento_id','')::uuid, NULLIF(v_av->>'resultado','')::numeric,
      NULLIF(v_av->>'unidade_resultado_id','')::uuid, NULLIF(v_av->>'limite_tolerancia','')::numeric,
      NULLIF(v_av->>'unidade_limite_id','')::uuid, NULLIF(v_av->>'codigo_esocial',''), NULLIF(v_av->>'descricao_esocial',''),
      CASE WHEN jsonb_typeof(v_av->'propagacao')='array' THEN ARRAY(SELECT jsonb_array_elements_text(v_av->'propagacao')) ELSE NULLIF(v_av->>'propagacao','')::text[] END,
      NULLIF(v_av->>'tipo_exposicao',''), NULLIF(v_av->>'fonte_geradora',''), NULLIF(v_av->>'danos_saude',''),
      NULLIF(v_av->>'medidas_controle',''), NULLIF(v_av->>'parecer_tecnico',''), NULLIF(v_av->>'aposentadoria_especial',''),
      NULLIF(v_av->>'data_avaliacao','')::date, NULLIF(v_av->>'funcoes_ges',''), NULLIF(v_av->>'tempo_coleta',''),
      NULLIF(v_av->>'unidade_tempo_coleta',''), _tipo_documento, NULLIF(v_av->>'ficha_tecnica_resultado_id','')::uuid, auth.uid()
    ) ON CONFLICT (id) DO UPDATE SET
      contrato_id=EXCLUDED.contrato_id, setor_id=EXCLUDED.setor_id, funcao_id=EXCLUDED.funcao_id,
      colaborador=EXCLUDED.colaborador, tipo_avaliacao=EXCLUDED.tipo_avaliacao, tipo_agente=EXCLUDED.tipo_agente,
      agente_id=EXCLUDED.agente_id, tecnica_id=EXCLUDED.tecnica_id, equipamento_id=EXCLUDED.equipamento_id,
      resultado=EXCLUDED.resultado, unidade_resultado_id=EXCLUDED.unidade_resultado_id,
      limite_tolerancia=EXCLUDED.limite_tolerancia, unidade_limite_id=EXCLUDED.unidade_limite_id,
      codigo_esocial=EXCLUDED.codigo_esocial, descricao_esocial=EXCLUDED.descricao_esocial, propagacao=EXCLUDED.propagacao,
      tipo_exposicao=EXCLUDED.tipo_exposicao, fonte_geradora=EXCLUDED.fonte_geradora, danos_saude=EXCLUDED.danos_saude,
      medidas_controle=EXCLUDED.medidas_controle, parecer_tecnico=EXCLUDED.parecer_tecnico,
      aposentadoria_especial=EXCLUDED.aposentadoria_especial, data_avaliacao=EXCLUDED.data_avaliacao,
      funcoes_ges=EXCLUDED.funcoes_ges, tempo_coleta=EXCLUDED.tempo_coleta,
      unidade_tempo_coleta=EXCLUDED.unidade_tempo_coleta, tipo_documento=EXCLUDED.tipo_documento,
      ficha_tecnica_resultado_id=EXCLUDED.ficha_tecnica_resultado_id
    WHERE public.ltcat_avaliacoes.documento_id = _documento_id;

    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'componentes','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_componentes (id,avaliacao_id,ordem,componente,cas,resultado,unidade_resultado_id,limite_tolerancia,unidade_limite_id,tempo_coleta,unidade_tempo_coleta,dose_percentual,situacao,cod_gfip,colaborador,funcao_id,data_avaliacao,descricao_avaliacao,parecer_tecnico,aposentadoria_especial,numero_serie_bomba,amostrador,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'componente',''),NULLIF(v_child->>'cas',''),NULLIF(v_child->>'resultado','')::numeric,NULLIF(v_child->>'unidade_resultado_id','')::uuid,NULLIF(v_child->>'limite_tolerancia','')::numeric,NULLIF(v_child->>'unidade_limite_id','')::uuid,NULLIF(v_child->>'tempo_coleta',''),NULLIF(v_child->>'unidade_tempo_coleta',''),NULLIF(v_child->>'dose_percentual','')::numeric,NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'descricao_avaliacao',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),NULLIF(v_child->>'numero_serie_bomba',''),NULLIF(v_child->>'amostrador',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,componente=EXCLUDED.componente,cas=EXCLUDED.cas,resultado=EXCLUDED.resultado,unidade_resultado_id=EXCLUDED.unidade_resultado_id,limite_tolerancia=EXCLUDED.limite_tolerancia,unidade_limite_id=EXCLUDED.unidade_limite_id,tempo_coleta=EXCLUDED.tempo_coleta,unidade_tempo_coleta=EXCLUDED.unidade_tempo_coleta,dose_percentual=EXCLUDED.dose_percentual,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,descricao_avaliacao=EXCLUDED.descricao_avaliacao,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,numero_serie_bomba=EXCLUDED.numero_serie_bomba,amostrador=EXCLUDED.amostrador,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_componentes.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'calor','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_calor (id,avaliacao_id,ordem,colaborador,funcao_id,data_avaliacao,ibutg_medido,ibutg_limite,m_kcal_h,tipo_atividade,taxa_metabolica,descricao_atividade,situacao,cod_gfip,parecer_tecnico,aposentadoria_especial,local_atividade,equipamento_id,tempo_exposicao,ibutg_tipo,tbn_valores,tg_valores,tbs_valores,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'ibutg_medido','')::numeric,NULLIF(v_child->>'ibutg_limite','')::numeric,NULLIF(v_child->>'m_kcal_h','')::numeric,NULLIF(v_child->>'tipo_atividade',''),NULLIF(v_child->>'taxa_metabolica',''),NULLIF(v_child->>'descricao_atividade',''),NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),NULLIF(v_child->>'local_atividade',''),NULLIF(v_child->>'equipamento_id','')::uuid,NULLIF(v_child->>'tempo_exposicao',''),NULLIF(v_child->>'ibutg_tipo',''),NULLIF(v_child->>'tbn_valores',''),NULLIF(v_child->>'tg_valores',''),NULLIF(v_child->>'tbs_valores',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,ibutg_medido=EXCLUDED.ibutg_medido,ibutg_limite=EXCLUDED.ibutg_limite,m_kcal_h=EXCLUDED.m_kcal_h,tipo_atividade=EXCLUDED.tipo_atividade,taxa_metabolica=EXCLUDED.taxa_metabolica,descricao_atividade=EXCLUDED.descricao_atividade,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,local_atividade=EXCLUDED.local_atividade,equipamento_id=EXCLUDED.equipamento_id,tempo_exposicao=EXCLUDED.tempo_exposicao,ibutg_tipo=EXCLUDED.ibutg_tipo,tbn_valores=EXCLUDED.tbn_valores,tg_valores=EXCLUDED.tg_valores,tbs_valores=EXCLUDED.tbs_valores,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_calor.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'vibracao','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_vibracao (id,avaliacao_id,ordem,tipo,colaborador,funcao_id,data_avaliacao,aren,vdvr,aren_limite,vdvr_limite,tempo_exposicao,situacao,cod_gfip,parecer_tecnico,aposentadoria_especial,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'tipo',''),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'aren','')::numeric,NULLIF(v_child->>'vdvr','')::numeric,NULLIF(v_child->>'aren_limite','')::numeric,NULLIF(v_child->>'vdvr_limite','')::numeric,NULLIF(v_child->>'tempo_exposicao',''),NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,tipo=EXCLUDED.tipo,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,aren=EXCLUDED.aren,vdvr=EXCLUDED.vdvr,aren_limite=EXCLUDED.aren_limite,vdvr_limite=EXCLUDED.vdvr_limite,tempo_exposicao=EXCLUDED.tempo_exposicao,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_vibracao.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'resultados','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_resultados (id,avaliacao_id,ordem,colaborador,funcao_id,data_avaliacao,resultado,unidade_resultado_id,limite_tolerancia,unidade_limite_id,tempo_coleta,unidade_tempo_coleta,dose_percentual,situacao,cod_gfip,descricao_avaliacao,parecer_tecnico,aposentadoria_especial,equipamento_registro_id,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'resultado','')::numeric,NULLIF(v_child->>'unidade_resultado_id','')::uuid,NULLIF(v_child->>'limite_tolerancia','')::numeric,NULLIF(v_child->>'unidade_limite_id','')::uuid,NULLIF(v_child->>'tempo_coleta',''),NULLIF(v_child->>'unidade_tempo_coleta',''),NULLIF(v_child->>'dose_percentual','')::numeric,NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'descricao_avaliacao',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),NULLIF(v_child->>'equipamento_registro_id','')::uuid,_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,resultado=EXCLUDED.resultado,unidade_resultado_id=EXCLUDED.unidade_resultado_id,limite_tolerancia=EXCLUDED.limite_tolerancia,unidade_limite_id=EXCLUDED.unidade_limite_id,tempo_coleta=EXCLUDED.tempo_coleta,unidade_tempo_coleta=EXCLUDED.unidade_tempo_coleta,dose_percentual=EXCLUDED.dose_percentual,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,descricao_avaliacao=EXCLUDED.descricao_avaliacao,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,equipamento_registro_id=EXCLUDED.equipamento_registro_id,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_resultados.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'equipamentos','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_equipamentos (id,avaliacao_id,ordem,nome_equipamento,modelo_equipamento,serie_equipamento,data_calibracao,data_avaliacao,agente_nome,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'nome_equipamento',''),NULLIF(v_child->>'modelo_equipamento',''),NULLIF(v_child->>'serie_equipamento',''),NULLIF(v_child->>'data_calibracao','')::date,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'agente_nome',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,nome_equipamento=EXCLUDED.nome_equipamento,modelo_equipamento=EXCLUDED.modelo_equipamento,serie_equipamento=EXCLUDED.serie_equipamento,data_calibracao=EXCLUDED.data_calibracao,data_avaliacao=EXCLUDED.data_avaliacao,agente_nome=EXCLUDED.agente_nome,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_equipamentos.avaliacao_id=v_id;
    END LOOP;
    IF COALESCE(v_av->'epi_epc','{}'::jsonb) <> '{}'::jsonb THEN
      INSERT INTO public.ltcat_av_epi_epc (id,avaliacao_id,epi_id,epi_ca,epi_atenuacao,epi_eficaz,epc_id,epc_eficaz,tipo_documento)
      VALUES (COALESCE(NULLIF(v_av->'epi_epc'->>'id','')::uuid,gen_random_uuid()),v_id,NULLIF(v_av->'epi_epc'->>'epi_id','')::uuid,NULLIF(v_av->'epi_epc'->>'epi_ca',''),NULLIF(v_av->'epi_epc'->>'epi_atenuacao',''),NULLIF(v_av->'epi_epc'->>'epi_eficaz',''),NULLIF(v_av->'epi_epc'->>'epc_id','')::uuid,NULLIF(v_av->'epi_epc'->>'epc_eficaz',''),_tipo_documento)
      ON CONFLICT (avaliacao_id) DO UPDATE SET epi_id=EXCLUDED.epi_id,epi_ca=EXCLUDED.epi_ca,epi_atenuacao=EXCLUDED.epi_atenuacao,epi_eficaz=EXCLUDED.epi_eficaz,epc_id=EXCLUDED.epc_id,epc_eficaz=EXCLUDED.epc_eficaz,tipo_documento=EXCLUDED.tipo_documento;
    END IF;
    v_count := v_count + 1;
  END LOOP;

  DELETE FROM public.ltcat_av_componentes c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'componentes','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id); GET DIAGNOSTICS v_deleted_children = ROW_COUNT;
  DELETE FROM public.ltcat_av_calor c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'calor','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_vibracao c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'vibracao','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_resultados c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'resultados','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_equipamentos c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'equipamentos','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_epi_epc c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'epi_epc','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_avaliacoes a WHERE a.documento_id=_documento_id AND a.id=ANY(COALESCE(_delete_avaliacao_ids,ARRAY[]::uuid[])); GET DIAGNOSTICS v_deleted = ROW_COUNT;

  UPDATE public.documentos d SET
    empresa_id = CASE WHEN _document_patch ? 'empresa_id' THEN NULLIF(_document_patch->>'empresa_id','')::uuid ELSE d.empresa_id END,
    empresa_nome = CASE WHEN _document_patch ? 'empresa_nome' THEN COALESCE(NULLIF(_document_patch->>'empresa_nome',''),d.empresa_nome) ELSE d.empresa_nome END,
    contrato_id = CASE WHEN _document_patch ? 'contrato_id' THEN NULLIF(_document_patch->>'contrato_id','')::uuid ELSE d.contrato_id END,
    template_id = CASE WHEN _document_patch ? 'template_id' THEN NULLIF(_document_patch->>'template_id','')::uuid ELSE d.template_id END,
    responsavel_tecnico = CASE WHEN _document_patch ? 'responsavel_tecnico' THEN NULLIF(_document_patch->>'responsavel_tecnico','') ELSE d.responsavel_tecnico END,
    crea = CASE WHEN _document_patch ? 'crea' THEN NULLIF(_document_patch->>'crea','') ELSE d.crea END,
    cargo = CASE WHEN _document_patch ? 'cargo' THEN NULLIF(_document_patch->>'cargo','') ELSE d.cargo END,
    data_elaboracao = CASE WHEN _document_patch ? 'data_elaboracao' THEN NULLIF(_document_patch->>'data_elaboracao','')::date ELSE d.data_elaboracao END,
    alteracoes_documento = CASE WHEN _document_patch ? 'alteracoes_documento' THEN NULLIF(_document_patch->>'alteracoes_documento','') ELSE d.alteracoes_documento END,
    revisoes = CASE WHEN _document_patch ? 'revisoes' THEN COALESCE(_document_patch->'revisoes','[]'::jsonb) ELSE d.revisoes END,
    current_step = CASE WHEN _document_patch ? 'current_step' THEN COALESCE((_document_patch->>'current_step')::integer,0) ELSE d.current_step END,
    draft_snapshot = CASE WHEN _document_patch ? 'draft_snapshot' THEN _document_patch->'draft_snapshot' ELSE d.draft_snapshot END,
    file_path = CASE WHEN _document_patch ? 'file_path' THEN NULLIF(_document_patch->>'file_path','') ELSE d.file_path END,
    status = CASE WHEN _document_patch ? 'status' THEN COALESCE(NULLIF(_document_patch->>'status',''),'rascunho') ELSE d.status END,
    updated_at = now()
  WHERE d.id=_documento_id AND d.row_version=_expected_row_version RETURNING d.row_version INTO v_new_version;
  IF v_new_version IS NULL THEN RAISE EXCEPTION 'Conflito de versão durante o salvamento' USING ERRCODE='40001'; END IF;
  RETURN jsonb_build_object('ok',true,'conflict',false,'count',v_count,'deleted',v_deleted,'deleted_children',v_deleted_children,'row_version',v_new_version);
END;
$$;
```

#### `public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text)`

- Latest: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql`
- Prior versions: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE OR REPLACE FUNCTION public.import_ficha_tecnica_resultados(
  _documento_id uuid,
  _empresa_id uuid,
  _contrato_id uuid,
  _tipo_documento text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_resultado public.ficha_tecnica_resultados%ROWTYPE;
  v_avaliacao_id uuid;
  v_importados integer := 0;
  v_existentes integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN
    RAISE EXCEPTION 'Tipo de documento inválido' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_documento_id::text, 0));

  IF NOT EXISTS (
    SELECT 1 FROM public.documentos d
    WHERE d.id = _documento_id AND d.empresa_id = _empresa_id
      AND d.contrato_id = _contrato_id
      AND lower(d.tipo) = CASE WHEN _tipo_documento = 'ltcat' THEN 'ltcat' ELSE 'insalubridade' END
  ) THEN
    RAISE EXCEPTION 'Documento, empresa e contrato não correspondem' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = _contrato_id AND c.empresa_id = _empresa_id) THEN
    RAISE EXCEPTION 'Contrato não pertence à empresa' USING ERRCODE = '42501';
  END IF;

  FOR v_resultado IN
    SELECT * FROM public.ficha_tecnica_resultados f
    WHERE f.empresa_id = _empresa_id AND f.contrato_id = _contrato_id
    ORDER BY f.created_at, f.id
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.ltcat_avaliacoes a
      WHERE a.documento_id = _documento_id AND a.ficha_tecnica_resultado_id = v_resultado.id
    ) THEN
      v_existentes := v_existentes + 1;
      CONTINUE;
    END IF;

    v_avaliacao_id := gen_random_uuid();
    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador,
      tipo_avaliacao, tipo_agente, agente_id, resultado, limite_tolerancia,
      dose_percentual, codigo_esocial, descricao_esocial, propagacao, tipo_exposicao,
      fonte_geradora, danos_saude, medidas_controle, parecer_tecnico,
      aposentadoria_especial, data_avaliacao, tipo_documento, created_by,
      ficha_tecnica_resultado_id
    )
    SELECT
      v_avaliacao_id, _documento_id, _empresa_id, _contrato_id,
      v_resultado.setor_id, v_resultado.funcao_id, '', 'quantitativa', r.tipo,
      v_resultado.agente_id,
      CASE
        WHEN v_resultado.tipo = 'ruido' AND _tipo_documento = 'insalubridade' THEN v_resultado.lavg
        WHEN v_resultado.tipo = 'ruido' THEN v_resultado.nen
        WHEN v_resultado.tipo = 'calor' THEN v_resultado.concentracao
        WHEN v_resultado.tipo IN ('poeira_silica','quimico_quantitativo','fumos_metalicos','vapores_organicos') THEN v_resultado.exposicao
        ELSE v_resultado.aren
      END,
      v_resultado.limite_tolerancia,
      CASE
        WHEN v_resultado.tipo = 'ruido' AND _tipo_documento = 'insalubridade' THEN v_resultado.dose_q5
        WHEN v_resultado.tipo = 'ruido' THEN v_resultado.dose_q3
        ELSE NULL
      END,
      r.codigo_esocial, r.descricao_esocial, r.propagacao, r.tipo_exposicao,
      r.fonte_geradora, r.danos_saude, r.medidas_controle, '', '',
      v_resultado.data_avaliacao, _tipo_documento, auth.uid(), v_resultado.id
    FROM public.riscos r WHERE r.id = v_resultado.agente_id;

    IF v_resultado.tipo = 'ruido' THEN
      INSERT INTO public.ltcat_av_resultados (
        avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao, resultado,
        limite_tolerancia, dose_percentual, descricao_avaliacao, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        CASE WHEN _tipo_documento = 'insalubridade' THEN v_resultado.lavg ELSE v_resultado.nen END,
        85,
        CASE WHEN _tipo_documento = 'insalubridade' THEN v_resultado.dose_q5 ELSE v_resultado.dose_q3 END,
        CASE WHEN _tipo_documento = 'insalubridade' THEN 'Critério Q5 — LAVG e Dose Q5' ELSE 'Critério Q3 — NEN e Dose Q3' END,
        '', '', _tipo_documento
      );
    ELSIF v_resultado.tipo IN ('vibracao_vci','vibracao_vmb') THEN
      INSERT INTO public.ltcat_av_vibracao (
        avaliacao_id, ordem, tipo, colaborador, funcao_id, data_avaliacao,
        aren, vdvr, aren_limite, vdvr_limite, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0,
        CASE WHEN v_resultado.tipo = 'vibracao_vci' THEN 'VCI' ELSE 'VMB' END,
        '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        v_resultado.aren, v_resultado.vdvr, v_resultado.limite_tolerancia,
        CASE WHEN v_resultado.tipo = 'vibracao_vci' THEN 21.0 ELSE NULL END,
        '', '', _tipo_documento
      );
    ELSIF v_resultado.tipo = 'calor' THEN
      INSERT INTO public.ltcat_av_calor (
        avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao,
        ibutg_medido, ibutg_limite, taxa_metabolica, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        v_resultado.concentracao, v_resultado.limite_tolerancia,
        v_resultado.taxa_metabolica, '', '', _tipo_documento
      );
    ELSE
      INSERT INTO public.ltcat_av_componentes (
        avaliacao_id, ordem, componente, resultado, limite_tolerancia,
        colaborador, funcao_id, data_avaliacao, descricao_avaliacao,
        parecer_tecnico, aposentadoria_especial, numero_serie_bomba,
        amostrador, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, v_resultado.componentes, v_resultado.exposicao,
        v_resultado.limite_tolerancia, '', v_resultado.funcao_id,
        v_resultado.data_avaliacao, '', '', '', v_resultado.amostrador_serie,
        v_resultado.amostrador, _tipo_documento
      );
    END IF;

    v_importados := v_importados + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'imported', v_importados,
    'existing', v_existentes,
    'total', v_importados + v_existentes
  );
END;
$$;
```

#### `public.update_updated_at_column()`

- Latest: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`
- Prior versions: `20260414123527_daa5e69e-3f30-482c-a7af-81a0884ca209.sql`

```sql
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
```

#### `public.handle_new_user()`

- Latest: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`
- Prior versions: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
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
```

#### `public.track_shared_change()`

- Latest: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE OR REPLACE FUNCTION public.track_shared_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_id := OLD.id;
    INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data)
    VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.row_version := OLD.row_version + 1;
    NEW.last_modified_by := auth.uid();
    v_id := NEW.id;
    INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;

  NEW.last_modified_by := auth.uid();
  v_id := NEW.id;
  INSERT INTO public.audit_log(table_name, record_id, action, changed_by, new_data)
  VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(NEW));
  RETURN NEW;
END;
$$;
```

#### `public.validate_ficha_tecnica_resultado()`

- Latest: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql`
- Prior versions: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE OR REPLACE FUNCTION public.validate_ficha_tecnica_resultado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = NEW.contrato_id AND c.empresa_id = NEW.empresa_id) THEN
    RAISE EXCEPTION 'Contrato não pertence à empresa informada' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.setores s WHERE s.id = NEW.setor_id AND s.empresa_id = NEW.empresa_id AND s.contrato_id = NEW.contrato_id) THEN
    RAISE EXCEPTION 'Setor não pertence à empresa e ao contrato informados' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.funcoes f WHERE f.id = NEW.funcao_id AND f.setor_id = NEW.setor_id) THEN
    RAISE EXCEPTION 'Função não pertence ao setor informado' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.riscos r WHERE r.id = NEW.agente_id) THEN
    RAISE EXCEPTION 'Agente inválido' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'ruido' AND (NEW.nen IS NULL OR NEW.dose_q3 IS NULL OR NEW.lavg IS NULL OR NEW.dose_q5 IS NULL OR NEW.limite_tolerancia <> 85) THEN
    RAISE EXCEPTION 'Ruído exige NEN, Dose Q3, LAVG, Dose Q5 e limite de 85 dB' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'vibracao_vmb' AND (NEW.aren IS NULL OR NEW.limite_tolerancia <> 5.0) THEN
    RAISE EXCEPTION 'Vibração de mãos e braços exige AREN e limite de 5,0 m/s²' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'vibracao_vci' AND (NEW.aren IS NULL OR NEW.vdvr IS NULL OR NEW.limite_tolerancia <> 1.1) THEN
    RAISE EXCEPTION 'Vibração de corpo inteiro exige AREN, VDVR e limite AREN de 1,1 m/s²' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'calor' AND (NEW.concentracao IS NULL OR NULLIF(trim(NEW.taxa_metabolica), '') IS NULL) THEN
    RAISE EXCEPTION 'Calor exige concentração e taxa metabólica' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo IN ('poeira_silica','quimico_quantitativo','fumos_metalicos','vapores_organicos')
     AND (NULLIF(trim(NEW.componentes), '') IS NULL OR NULLIF(trim(NEW.amostrador), '') IS NULL OR NULLIF(trim(NEW.amostrador_serie), '') IS NULL OR NEW.exposicao IS NULL) THEN
    RAISE EXCEPTION 'Resultado químico exige componentes, amostrador, número/série e exposição' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
```

#### `public.preserve_ficha_tecnica_origin()`

- Latest: `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql`

```sql
CREATE OR REPLACE FUNCTION public.preserve_ficha_tecnica_origin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.ficha_tecnica_resultado_id IS NOT NULL
     AND NEW.ficha_tecnica_resultado_id IS NULL THEN
    NEW.ficha_tecnica_resultado_id := OLD.ficha_tecnica_resultado_id;
  END IF;
  RETURN NEW;
END;
$$;
```

#### `public.set_documento_validade()`

- Latest: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE OR REPLACE FUNCTION public.set_documento_validade()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.data_elaboracao IS NOT NULL THEN
    NEW.data_validade := (NEW.data_elaboracao + INTERVAL '12 months')::date;
  END IF;
  RETURN NEW;
END;
$$;
```

#### `public.link_ergonomia_to_aet()`

- Latest: `20260724163602_ccc65eb4-79c6-408c-9457-e071c3fc48e0.sql`

```sql
CREATE OR REPLACE FUNCTION public.link_ergonomia_to_aet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ergonomia_avaliacoes ea
  SET aet_documento_id = NEW.id
  WHERE ea.aet_documento_id IS NULL
    AND ea.user_id = NEW.created_by
    AND (
      (NEW.empresa_id IS NOT NULL AND ea.empresa_nome = (
        SELECT razao_social FROM public.empresas WHERE id = NEW.empresa_id
      ))
      OR NEW.empresa_id IS NULL
    );
  RETURN NEW;
END;
$$;
```

### All functions — latest version per signature (17)

#### `private.has_role(uuid, app_role)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
```

#### `private.psico_get_public_link(text)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
CREATE OR REPLACE FUNCTION private.psico_get_public_link(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_link record; v_result jsonb;
BEGIN
  SELECT l.id, l.empresa_id, l.ativo, e.razao_social INTO v_link
  FROM public.psico_links l JOIN public.empresas e ON e.id = l.empresa_id
  WHERE l.token = _token;
  IF NOT FOUND OR NOT v_link.ativo THEN RETURN jsonb_build_object('error', 'Link inválido ou desativado'); END IF;
  SELECT jsonb_build_object(
    'link_id', v_link.id, 'empresa_id', v_link.empresa_id, 'empresa_nome', v_link.razao_social,
    'contratos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'nome', COALESCE(c.numero_contrato, c.escopo_contrato, 'Contrato'),
        'funcoes', COALESCE((SELECT jsonb_agg(DISTINCT jsonb_build_object('id', f.id, 'nome', f.nome_funcao)) FROM public.setores s JOIN public.funcoes f ON f.setor_id=s.id WHERE s.contrato_id=c.id), '[]'::jsonb)
      ) ORDER BY c.numero_contrato) FROM public.contratos c WHERE c.empresa_id=v_link.empresa_id
    ), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
```

#### `private.psico_submit_resposta(text, jsonb)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
CREATE OR REPLACE FUNCTION private.psico_submit_resposta(_token text, _payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_link record; v_id uuid; v_funcao_id uuid; v_contrato_id uuid;
BEGIN
  SELECT id, empresa_id, ativo, avaliacao_id, contrato_id INTO v_link FROM public.psico_links WHERE token=_token;
  IF NOT FOUND OR NOT v_link.ativo THEN RETURN jsonb_build_object('error', 'Link inválido'); END IF;
  v_contrato_id := COALESCE(NULLIF(_payload->>'contrato_id','')::uuid, v_link.contrato_id);
  IF v_contrato_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id=v_contrato_id AND c.empresa_id=v_link.empresa_id) THEN
      RETURN jsonb_build_object('error', 'Contrato inválido');
    END IF;
    SELECT f.id INTO v_funcao_id FROM public.funcoes f JOIN public.setores s ON s.id=f.setor_id
    WHERE s.contrato_id=v_contrato_id AND lower(trim(f.nome_funcao))=lower(trim(_payload->>'funcao_nome')) LIMIT 1;
  END IF;
  INSERT INTO public.psico_respostas (link_id, empresa_id, contrato_id, contrato_nome, funcao_id, funcao_nome, colaborador_nome, data_avaliacao, respostas, blocos, alertas, resultado_psicossocial, riscos_psicossociais, total_positivas, total_negativas, copsoq_resultado_resumido, copsoq_riscos_identificados, avaliacao_id)
  VALUES (v_link.id, v_link.empresa_id, v_contrato_id, _payload->>'contrato_nome', v_funcao_id, _payload->>'funcao_nome', _payload->>'colaborador_nome', COALESCE((_payload->>'data_avaliacao')::date,CURRENT_DATE), COALESCE(_payload->'respostas','{}'::jsonb), COALESCE(_payload->'blocos','{}'::jsonb), COALESCE(_payload->'alertas','{}'::jsonb), _payload->>'resultado_psicossocial', _payload->>'riscos_psicossociais', COALESCE((_payload->>'total_positivas')::int,0), COALESCE((_payload->>'total_negativas')::int,0), _payload->>'copsoq_resultado_resumido', _payload->>'copsoq_riscos_identificados', v_link.avaliacao_id)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id',v_id,'ok',true);
END;
$$;
```

#### `public.handle_new_user()`

- Latest: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`
- Prior: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
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
```

#### `public.has_role(uuid, app_role)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`
- Prior: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.has_role(_user_id, _role) $$;
```

#### `public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text)`

- Latest: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql`
- Prior: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE OR REPLACE FUNCTION public.import_ficha_tecnica_resultados(
  _documento_id uuid,
  _empresa_id uuid,
  _contrato_id uuid,
  _tipo_documento text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_resultado public.ficha_tecnica_resultados%ROWTYPE;
  v_avaliacao_id uuid;
  v_importados integer := 0;
  v_existentes integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN
    RAISE EXCEPTION 'Tipo de documento inválido' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_documento_id::text, 0));

  IF NOT EXISTS (
    SELECT 1 FROM public.documentos d
    WHERE d.id = _documento_id AND d.empresa_id = _empresa_id
      AND d.contrato_id = _contrato_id
      AND lower(d.tipo) = CASE WHEN _tipo_documento = 'ltcat' THEN 'ltcat' ELSE 'insalubridade' END
  ) THEN
    RAISE EXCEPTION 'Documento, empresa e contrato não correspondem' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = _contrato_id AND c.empresa_id = _empresa_id) THEN
    RAISE EXCEPTION 'Contrato não pertence à empresa' USING ERRCODE = '42501';
  END IF;

  FOR v_resultado IN
    SELECT * FROM public.ficha_tecnica_resultados f
    WHERE f.empresa_id = _empresa_id AND f.contrato_id = _contrato_id
    ORDER BY f.created_at, f.id
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.ltcat_avaliacoes a
      WHERE a.documento_id = _documento_id AND a.ficha_tecnica_resultado_id = v_resultado.id
    ) THEN
      v_existentes := v_existentes + 1;
      CONTINUE;
    END IF;

    v_avaliacao_id := gen_random_uuid();
    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador,
      tipo_avaliacao, tipo_agente, agente_id, resultado, limite_tolerancia,
      dose_percentual, codigo_esocial, descricao_esocial, propagacao, tipo_exposicao,
      fonte_geradora, danos_saude, medidas_controle, parecer_tecnico,
      aposentadoria_especial, data_avaliacao, tipo_documento, created_by,
      ficha_tecnica_resultado_id
    )
    SELECT
      v_avaliacao_id, _documento_id, _empresa_id, _contrato_id,
      v_resultado.setor_id, v_resultado.funcao_id, '', 'quantitativa', r.tipo,
      v_resultado.agente_id,
      CASE
        WHEN v_resultado.tipo = 'ruido' AND _tipo_documento = 'insalubridade' THEN v_resultado.lavg
        WHEN v_resultado.tipo = 'ruido' THEN v_resultado.nen
        WHEN v_resultado.tipo = 'calor' THEN v_resultado.concentracao
        WHEN v_resultado.tipo IN ('poeira_silica','quimico_quantitativo','fumos_metalicos','vapores_organicos') THEN v_resultado.exposicao
        ELSE v_resultado.aren
      END,
      v_resultado.limite_tolerancia,
      CASE
        WHEN v_resultado.tipo = 'ruido' AND _tipo_documento = 'insalubridade' THEN v_resultado.dose_q5
        WHEN v_resultado.tipo = 'ruido' THEN v_resultado.dose_q3
        ELSE NULL
      END,
      r.codigo_esocial, r.descricao_esocial, r.propagacao, r.tipo_exposicao,
      r.fonte_geradora, r.danos_saude, r.medidas_controle, '', '',
      v_resultado.data_avaliacao, _tipo_documento, auth.uid(), v_resultado.id
    FROM public.riscos r WHERE r.id = v_resultado.agente_id;

    IF v_resultado.tipo = 'ruido' THEN
      INSERT INTO public.ltcat_av_resultados (
        avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao, resultado,
        limite_tolerancia, dose_percentual, descricao_avaliacao, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        CASE WHEN _tipo_documento = 'insalubridade' THEN v_resultado.lavg ELSE v_resultado.nen END,
        85,
        CASE WHEN _tipo_documento = 'insalubridade' THEN v_resultado.dose_q5 ELSE v_resultado.dose_q3 END,
        CASE WHEN _tipo_documento = 'insalubridade' THEN 'Critério Q5 — LAVG e Dose Q5' ELSE 'Critério Q3 — NEN e Dose Q3' END,
        '', '', _tipo_documento
      );
    ELSIF v_resultado.tipo IN ('vibracao_vci','vibracao_vmb') THEN
      INSERT INTO public.ltcat_av_vibracao (
        avaliacao_id, ordem, tipo, colaborador, funcao_id, data_avaliacao,
        aren, vdvr, aren_limite, vdvr_limite, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0,
        CASE WHEN v_resultado.tipo = 'vibracao_vci' THEN 'VCI' ELSE 'VMB' END,
        '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        v_resultado.aren, v_resultado.vdvr, v_resultado.limite_tolerancia,
        CASE WHEN v_resultado.tipo = 'vibracao_vci' THEN 21.0 ELSE NULL END,
        '', '', _tipo_documento
      );
    ELSIF v_resultado.tipo = 'calor' THEN
      INSERT INTO public.ltcat_av_calor (
        avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao,
        ibutg_medido, ibutg_limite, taxa_metabolica, parecer_tecnico,
        aposentadoria_especial, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, '', v_resultado.funcao_id, v_resultado.data_avaliacao,
        v_resultado.concentracao, v_resultado.limite_tolerancia,
        v_resultado.taxa_metabolica, '', '', _tipo_documento
      );
    ELSE
      INSERT INTO public.ltcat_av_componentes (
        avaliacao_id, ordem, componente, resultado, limite_tolerancia,
        colaborador, funcao_id, data_avaliacao, descricao_avaliacao,
        parecer_tecnico, aposentadoria_especial, numero_serie_bomba,
        amostrador, tipo_documento
      ) VALUES (
        v_avaliacao_id, 0, v_resultado.componentes, v_resultado.exposicao,
        v_resultado.limite_tolerancia, '', v_resultado.funcao_id,
        v_resultado.data_avaliacao, '', '', '', v_resultado.amostrador_serie,
        v_resultado.amostrador, _tipo_documento
      );
    END IF;

    v_importados := v_importados + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'imported', v_importados,
    'existing', v_existentes,
    'total', v_importados + v_existentes
  );
END;
$$;
```

#### `public.link_ergonomia_to_aet()`

- Latest: `20260724163602_ccc65eb4-79c6-408c-9457-e071c3fc48e0.sql`

```sql
CREATE OR REPLACE FUNCTION public.link_ergonomia_to_aet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ergonomia_avaliacoes ea
  SET aet_documento_id = NEW.id
  WHERE ea.aet_documento_id IS NULL
    AND ea.user_id = NEW.created_by
    AND (
      (NEW.empresa_id IS NOT NULL AND ea.empresa_nome = (
        SELECT razao_social FROM public.empresas WHERE id = NEW.empresa_id
      ))
      OR NEW.empresa_id IS NULL
    );
  RETURN NEW;
END;
$$;
```

#### `public.preserve_ficha_tecnica_origin()`

- Latest: `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql`

```sql
CREATE OR REPLACE FUNCTION public.preserve_ficha_tecnica_origin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.ficha_tecnica_resultado_id IS NOT NULL
     AND NEW.ficha_tecnica_resultado_id IS NULL THEN
    NEW.ficha_tecnica_resultado_id := OLD.ficha_tecnica_resultado_id;
  END IF;
  RETURN NEW;
END;
$$;
```

#### `public.psico_get_public_link(text)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`
- Prior: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
CREATE OR REPLACE FUNCTION public.psico_get_public_link(_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.psico_get_public_link(_token) $$;
```

#### `public.psico_submit_resposta(text, jsonb)`

- Latest: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`
- Prior: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`, `20260830135307_b98b5290-ba6d-41f8-bbba-61522c55b286.sql`

```sql
CREATE OR REPLACE FUNCTION public.psico_submit_resposta(_token text, _payload jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.psico_submit_resposta(_token, _payload) $$;
```

#### `public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb)`

- Latest: `20260919140817_9532b266-5c7d-41e1-943f-61ab71876a15.sql`
- Prior: `20260919132348_43027d3e-0829-4e46-bbfc-cab1e302928a.sql`

```sql
CREATE OR REPLACE FUNCTION public.save_ltcat_documento_v2(
  _documento_id uuid,
  _empresa_id uuid,
  _tipo_documento text,
  _expected_row_version bigint,
  _document_patch jsonb,
  _avaliacoes jsonb,
  _delete_avaliacao_ids uuid[],
  _delete_child_ids jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_av jsonb;
  v_child jsonb;
  v_id uuid;
  v_current_version bigint;
  v_new_version bigint;
  v_count integer := 0;
  v_deleted integer := 0;
  v_deleted_children integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501'; END IF;
  IF _documento_id IS NULL OR _empresa_id IS NULL THEN RAISE EXCEPTION 'Documento e empresa são obrigatórios'; END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN RAISE EXCEPTION 'Tipo de documento inválido'; END IF;
  IF jsonb_typeof(COALESCE(_avaliacoes, '[]'::jsonb)) <> 'array' THEN RAISE EXCEPTION 'Avaliações devem ser uma lista'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_documento_id::text, 0));
  SELECT d.row_version INTO v_current_version FROM public.documentos d
   WHERE d.id = _documento_id AND d.empresa_id = _empresa_id AND lower(d.tipo) = _tipo_documento FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Documento não encontrado ou incompatível' USING ERRCODE = '42501'; END IF;
  IF _expected_row_version IS NULL OR v_current_version <> _expected_row_version THEN
    RETURN jsonb_build_object('ok', false, 'conflict', true, 'current_row_version', v_current_version);
  END IF;

  FOR v_av IN SELECT value FROM jsonb_array_elements(COALESCE(_avaliacoes, '[]'::jsonb)) LOOP
    v_id := NULLIF(v_av->>'id', '')::uuid;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Toda avaliação deve possuir identificador'; END IF;
    IF EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id = v_id AND a.documento_id <> _documento_id) THEN
      RAISE EXCEPTION 'Identificador de avaliação pertence a outro documento';
    END IF;
    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador, tipo_avaliacao, tipo_agente,
      agente_id, tecnica_id, equipamento_id, resultado, unidade_resultado_id, limite_tolerancia, unidade_limite_id,
      codigo_esocial, descricao_esocial, propagacao, tipo_exposicao, fonte_geradora, danos_saude, medidas_controle,
      parecer_tecnico, aposentadoria_especial, data_avaliacao, funcoes_ges, tempo_coleta, unidade_tempo_coleta,
      tipo_documento, ficha_tecnica_resultado_id, created_by
    ) VALUES (
      v_id, _documento_id, _empresa_id, NULLIF(v_av->>'contrato_id','')::uuid, NULLIF(v_av->>'setor_id','')::uuid,
      NULLIF(v_av->>'funcao_id','')::uuid, NULLIF(v_av->>'colaborador',''), NULLIF(v_av->>'tipo_avaliacao',''),
      NULLIF(v_av->>'tipo_agente',''), NULLIF(v_av->>'agente_id','')::uuid, NULLIF(v_av->>'tecnica_id','')::uuid,
      NULLIF(v_av->>'equipamento_id','')::uuid, NULLIF(v_av->>'resultado','')::numeric,
      NULLIF(v_av->>'unidade_resultado_id','')::uuid, NULLIF(v_av->>'limite_tolerancia','')::numeric,
      NULLIF(v_av->>'unidade_limite_id','')::uuid, NULLIF(v_av->>'codigo_esocial',''), NULLIF(v_av->>'descricao_esocial',''),
      CASE WHEN jsonb_typeof(v_av->'propagacao')='array' THEN ARRAY(SELECT jsonb_array_elements_text(v_av->'propagacao')) ELSE NULLIF(v_av->>'propagacao','')::text[] END,
      NULLIF(v_av->>'tipo_exposicao',''), NULLIF(v_av->>'fonte_geradora',''), NULLIF(v_av->>'danos_saude',''),
      NULLIF(v_av->>'medidas_controle',''), NULLIF(v_av->>'parecer_tecnico',''), NULLIF(v_av->>'aposentadoria_especial',''),
      NULLIF(v_av->>'data_avaliacao','')::date, NULLIF(v_av->>'funcoes_ges',''), NULLIF(v_av->>'tempo_coleta',''),
      NULLIF(v_av->>'unidade_tempo_coleta',''), _tipo_documento, NULLIF(v_av->>'ficha_tecnica_resultado_id','')::uuid, auth.uid()
    ) ON CONFLICT (id) DO UPDATE SET
      contrato_id=EXCLUDED.contrato_id, setor_id=EXCLUDED.setor_id, funcao_id=EXCLUDED.funcao_id,
      colaborador=EXCLUDED.colaborador, tipo_avaliacao=EXCLUDED.tipo_avaliacao, tipo_agente=EXCLUDED.tipo_agente,
      agente_id=EXCLUDED.agente_id, tecnica_id=EXCLUDED.tecnica_id, equipamento_id=EXCLUDED.equipamento_id,
      resultado=EXCLUDED.resultado, unidade_resultado_id=EXCLUDED.unidade_resultado_id,
      limite_tolerancia=EXCLUDED.limite_tolerancia, unidade_limite_id=EXCLUDED.unidade_limite_id,
      codigo_esocial=EXCLUDED.codigo_esocial, descricao_esocial=EXCLUDED.descricao_esocial, propagacao=EXCLUDED.propagacao,
      tipo_exposicao=EXCLUDED.tipo_exposicao, fonte_geradora=EXCLUDED.fonte_geradora, danos_saude=EXCLUDED.danos_saude,
      medidas_controle=EXCLUDED.medidas_controle, parecer_tecnico=EXCLUDED.parecer_tecnico,
      aposentadoria_especial=EXCLUDED.aposentadoria_especial, data_avaliacao=EXCLUDED.data_avaliacao,
      funcoes_ges=EXCLUDED.funcoes_ges, tempo_coleta=EXCLUDED.tempo_coleta,
      unidade_tempo_coleta=EXCLUDED.unidade_tempo_coleta, tipo_documento=EXCLUDED.tipo_documento,
      ficha_tecnica_resultado_id=EXCLUDED.ficha_tecnica_resultado_id
    WHERE public.ltcat_avaliacoes.documento_id = _documento_id;

    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'componentes','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_componentes (id,avaliacao_id,ordem,componente,cas,resultado,unidade_resultado_id,limite_tolerancia,unidade_limite_id,tempo_coleta,unidade_tempo_coleta,dose_percentual,situacao,cod_gfip,colaborador,funcao_id,data_avaliacao,descricao_avaliacao,parecer_tecnico,aposentadoria_especial,numero_serie_bomba,amostrador,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'componente',''),NULLIF(v_child->>'cas',''),NULLIF(v_child->>'resultado','')::numeric,NULLIF(v_child->>'unidade_resultado_id','')::uuid,NULLIF(v_child->>'limite_tolerancia','')::numeric,NULLIF(v_child->>'unidade_limite_id','')::uuid,NULLIF(v_child->>'tempo_coleta',''),NULLIF(v_child->>'unidade_tempo_coleta',''),NULLIF(v_child->>'dose_percentual','')::numeric,NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'descricao_avaliacao',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),NULLIF(v_child->>'numero_serie_bomba',''),NULLIF(v_child->>'amostrador',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,componente=EXCLUDED.componente,cas=EXCLUDED.cas,resultado=EXCLUDED.resultado,unidade_resultado_id=EXCLUDED.unidade_resultado_id,limite_tolerancia=EXCLUDED.limite_tolerancia,unidade_limite_id=EXCLUDED.unidade_limite_id,tempo_coleta=EXCLUDED.tempo_coleta,unidade_tempo_coleta=EXCLUDED.unidade_tempo_coleta,dose_percentual=EXCLUDED.dose_percentual,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,descricao_avaliacao=EXCLUDED.descricao_avaliacao,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,numero_serie_bomba=EXCLUDED.numero_serie_bomba,amostrador=EXCLUDED.amostrador,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_componentes.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'calor','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_calor (id,avaliacao_id,ordem,colaborador,funcao_id,data_avaliacao,ibutg_medido,ibutg_limite,m_kcal_h,tipo_atividade,taxa_metabolica,descricao_atividade,situacao,cod_gfip,parecer_tecnico,aposentadoria_especial,local_atividade,equipamento_id,tempo_exposicao,ibutg_tipo,tbn_valores,tg_valores,tbs_valores,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'ibutg_medido','')::numeric,NULLIF(v_child->>'ibutg_limite','')::numeric,NULLIF(v_child->>'m_kcal_h','')::numeric,NULLIF(v_child->>'tipo_atividade',''),NULLIF(v_child->>'taxa_metabolica',''),NULLIF(v_child->>'descricao_atividade',''),NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),NULLIF(v_child->>'local_atividade',''),NULLIF(v_child->>'equipamento_id','')::uuid,NULLIF(v_child->>'tempo_exposicao',''),NULLIF(v_child->>'ibutg_tipo',''),NULLIF(v_child->>'tbn_valores',''),NULLIF(v_child->>'tg_valores',''),NULLIF(v_child->>'tbs_valores',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,ibutg_medido=EXCLUDED.ibutg_medido,ibutg_limite=EXCLUDED.ibutg_limite,m_kcal_h=EXCLUDED.m_kcal_h,tipo_atividade=EXCLUDED.tipo_atividade,taxa_metabolica=EXCLUDED.taxa_metabolica,descricao_atividade=EXCLUDED.descricao_atividade,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,local_atividade=EXCLUDED.local_atividade,equipamento_id=EXCLUDED.equipamento_id,tempo_exposicao=EXCLUDED.tempo_exposicao,ibutg_tipo=EXCLUDED.ibutg_tipo,tbn_valores=EXCLUDED.tbn_valores,tg_valores=EXCLUDED.tg_valores,tbs_valores=EXCLUDED.tbs_valores,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_calor.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'vibracao','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_vibracao (id,avaliacao_id,ordem,tipo,colaborador,funcao_id,data_avaliacao,aren,vdvr,aren_limite,vdvr_limite,tempo_exposicao,situacao,cod_gfip,parecer_tecnico,aposentadoria_especial,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'tipo',''),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'aren','')::numeric,NULLIF(v_child->>'vdvr','')::numeric,NULLIF(v_child->>'aren_limite','')::numeric,NULLIF(v_child->>'vdvr_limite','')::numeric,NULLIF(v_child->>'tempo_exposicao',''),NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,tipo=EXCLUDED.tipo,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,aren=EXCLUDED.aren,vdvr=EXCLUDED.vdvr,aren_limite=EXCLUDED.aren_limite,vdvr_limite=EXCLUDED.vdvr_limite,tempo_exposicao=EXCLUDED.tempo_exposicao,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_vibracao.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'resultados','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_resultados (id,avaliacao_id,ordem,colaborador,funcao_id,data_avaliacao,resultado,unidade_resultado_id,limite_tolerancia,unidade_limite_id,tempo_coleta,unidade_tempo_coleta,dose_percentual,situacao,cod_gfip,descricao_avaliacao,parecer_tecnico,aposentadoria_especial,equipamento_registro_id,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'colaborador',''),NULLIF(v_child->>'funcao_id','')::uuid,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'resultado','')::numeric,NULLIF(v_child->>'unidade_resultado_id','')::uuid,NULLIF(v_child->>'limite_tolerancia','')::numeric,NULLIF(v_child->>'unidade_limite_id','')::uuid,NULLIF(v_child->>'tempo_coleta',''),NULLIF(v_child->>'unidade_tempo_coleta',''),NULLIF(v_child->>'dose_percentual','')::numeric,NULLIF(v_child->>'situacao',''),NULLIF(v_child->>'cod_gfip',''),NULLIF(v_child->>'descricao_avaliacao',''),NULLIF(v_child->>'parecer_tecnico',''),NULLIF(v_child->>'aposentadoria_especial',''),NULLIF(v_child->>'equipamento_registro_id','')::uuid,_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,colaborador=EXCLUDED.colaborador,funcao_id=EXCLUDED.funcao_id,data_avaliacao=EXCLUDED.data_avaliacao,resultado=EXCLUDED.resultado,unidade_resultado_id=EXCLUDED.unidade_resultado_id,limite_tolerancia=EXCLUDED.limite_tolerancia,unidade_limite_id=EXCLUDED.unidade_limite_id,tempo_coleta=EXCLUDED.tempo_coleta,unidade_tempo_coleta=EXCLUDED.unidade_tempo_coleta,dose_percentual=EXCLUDED.dose_percentual,situacao=EXCLUDED.situacao,cod_gfip=EXCLUDED.cod_gfip,descricao_avaliacao=EXCLUDED.descricao_avaliacao,parecer_tecnico=EXCLUDED.parecer_tecnico,aposentadoria_especial=EXCLUDED.aposentadoria_especial,equipamento_registro_id=EXCLUDED.equipamento_registro_id,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_resultados.avaliacao_id=v_id;
    END LOOP;
    FOR v_child IN SELECT value FROM jsonb_array_elements(COALESCE(v_av->'equipamentos','[]'::jsonb)) LOOP
      INSERT INTO public.ltcat_av_equipamentos (id,avaliacao_id,ordem,nome_equipamento,modelo_equipamento,serie_equipamento,data_calibracao,data_avaliacao,agente_nome,tipo_documento)
      VALUES (NULLIF(v_child->>'id','')::uuid,v_id,COALESCE((v_child->>'ordem')::integer,0),NULLIF(v_child->>'nome_equipamento',''),NULLIF(v_child->>'modelo_equipamento',''),NULLIF(v_child->>'serie_equipamento',''),NULLIF(v_child->>'data_calibracao','')::date,NULLIF(v_child->>'data_avaliacao','')::date,NULLIF(v_child->>'agente_nome',''),_tipo_documento)
      ON CONFLICT (id) DO UPDATE SET ordem=EXCLUDED.ordem,nome_equipamento=EXCLUDED.nome_equipamento,modelo_equipamento=EXCLUDED.modelo_equipamento,serie_equipamento=EXCLUDED.serie_equipamento,data_calibracao=EXCLUDED.data_calibracao,data_avaliacao=EXCLUDED.data_avaliacao,agente_nome=EXCLUDED.agente_nome,tipo_documento=EXCLUDED.tipo_documento WHERE public.ltcat_av_equipamentos.avaliacao_id=v_id;
    END LOOP;
    IF COALESCE(v_av->'epi_epc','{}'::jsonb) <> '{}'::jsonb THEN
      INSERT INTO public.ltcat_av_epi_epc (id,avaliacao_id,epi_id,epi_ca,epi_atenuacao,epi_eficaz,epc_id,epc_eficaz,tipo_documento)
      VALUES (COALESCE(NULLIF(v_av->'epi_epc'->>'id','')::uuid,gen_random_uuid()),v_id,NULLIF(v_av->'epi_epc'->>'epi_id','')::uuid,NULLIF(v_av->'epi_epc'->>'epi_ca',''),NULLIF(v_av->'epi_epc'->>'epi_atenuacao',''),NULLIF(v_av->'epi_epc'->>'epi_eficaz',''),NULLIF(v_av->'epi_epc'->>'epc_id','')::uuid,NULLIF(v_av->'epi_epc'->>'epc_eficaz',''),_tipo_documento)
      ON CONFLICT (avaliacao_id) DO UPDATE SET epi_id=EXCLUDED.epi_id,epi_ca=EXCLUDED.epi_ca,epi_atenuacao=EXCLUDED.epi_atenuacao,epi_eficaz=EXCLUDED.epi_eficaz,epc_id=EXCLUDED.epc_id,epc_eficaz=EXCLUDED.epc_eficaz,tipo_documento=EXCLUDED.tipo_documento;
    END IF;
    v_count := v_count + 1;
  END LOOP;

  DELETE FROM public.ltcat_av_componentes c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'componentes','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id); GET DIAGNOSTICS v_deleted_children = ROW_COUNT;
  DELETE FROM public.ltcat_av_calor c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'calor','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_vibracao c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'vibracao','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_resultados c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'resultados','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_equipamentos c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'equipamentos','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_av_epi_epc c WHERE c.id IN (SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(_delete_child_ids->'epi_epc','[]'::jsonb))) AND EXISTS (SELECT 1 FROM public.ltcat_avaliacoes a WHERE a.id=c.avaliacao_id AND a.documento_id=_documento_id);
  DELETE FROM public.ltcat_avaliacoes a WHERE a.documento_id=_documento_id AND a.id=ANY(COALESCE(_delete_avaliacao_ids,ARRAY[]::uuid[])); GET DIAGNOSTICS v_deleted = ROW_COUNT;

  UPDATE public.documentos d SET
    empresa_id = CASE WHEN _document_patch ? 'empresa_id' THEN NULLIF(_document_patch->>'empresa_id','')::uuid ELSE d.empresa_id END,
    empresa_nome = CASE WHEN _document_patch ? 'empresa_nome' THEN COALESCE(NULLIF(_document_patch->>'empresa_nome',''),d.empresa_nome) ELSE d.empresa_nome END,
    contrato_id = CASE WHEN _document_patch ? 'contrato_id' THEN NULLIF(_document_patch->>'contrato_id','')::uuid ELSE d.contrato_id END,
    template_id = CASE WHEN _document_patch ? 'template_id' THEN NULLIF(_document_patch->>'template_id','')::uuid ELSE d.template_id END,
    responsavel_tecnico = CASE WHEN _document_patch ? 'responsavel_tecnico' THEN NULLIF(_document_patch->>'responsavel_tecnico','') ELSE d.responsavel_tecnico END,
    crea = CASE WHEN _document_patch ? 'crea' THEN NULLIF(_document_patch->>'crea','') ELSE d.crea END,
    cargo = CASE WHEN _document_patch ? 'cargo' THEN NULLIF(_document_patch->>'cargo','') ELSE d.cargo END,
    data_elaboracao = CASE WHEN _document_patch ? 'data_elaboracao' THEN NULLIF(_document_patch->>'data_elaboracao','')::date ELSE d.data_elaboracao END,
    alteracoes_documento = CASE WHEN _document_patch ? 'alteracoes_documento' THEN NULLIF(_document_patch->>'alteracoes_documento','') ELSE d.alteracoes_documento END,
    revisoes = CASE WHEN _document_patch ? 'revisoes' THEN COALESCE(_document_patch->'revisoes','[]'::jsonb) ELSE d.revisoes END,
    current_step = CASE WHEN _document_patch ? 'current_step' THEN COALESCE((_document_patch->>'current_step')::integer,0) ELSE d.current_step END,
    draft_snapshot = CASE WHEN _document_patch ? 'draft_snapshot' THEN _document_patch->'draft_snapshot' ELSE d.draft_snapshot END,
    file_path = CASE WHEN _document_patch ? 'file_path' THEN NULLIF(_document_patch->>'file_path','') ELSE d.file_path END,
    status = CASE WHEN _document_patch ? 'status' THEN COALESCE(NULLIF(_document_patch->>'status',''),'rascunho') ELSE d.status END,
    updated_at = now()
  WHERE d.id=_documento_id AND d.row_version=_expected_row_version RETURNING d.row_version INTO v_new_version;
  IF v_new_version IS NULL THEN RAISE EXCEPTION 'Conflito de versão durante o salvamento' USING ERRCODE='40001'; END IF;
  RETURN jsonb_build_object('ok',true,'conflict',false,'count',v_count,'deleted',v_deleted,'deleted_children',v_deleted_children,'row_version',v_new_version);
END;
$$;
```

#### `public.set_documento_validade()`

- Latest: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE OR REPLACE FUNCTION public.set_documento_validade()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.data_elaboracao IS NOT NULL THEN
    NEW.data_validade := (NEW.data_elaboracao + INTERVAL '12 months')::date;
  END IF;
  RETURN NEW;
END;
$$;
```

#### `public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb)`

- Latest: `20260910225228_0ee73e35-6255-4e7c-a4aa-31eb70387a76.sql`

```sql
CREATE OR REPLACE FUNCTION public.sync_ltcat_avaliacoes(
  _documento_id uuid,
  _empresa_id uuid,
  _tipo_documento text,
  _avaliacoes jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_av jsonb;
  v_id uuid;
  v_keep_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  IF _documento_id IS NULL OR _empresa_id IS NULL THEN
    RAISE EXCEPTION 'Documento e empresa são obrigatórios';
  END IF;
  IF _tipo_documento NOT IN ('ltcat', 'insalubridade') THEN
    RAISE EXCEPTION 'Tipo de documento inválido';
  END IF;
  IF jsonb_typeof(COALESCE(_avaliacoes, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Avaliações devem ser uma lista';
  END IF;

  FOR v_av IN SELECT value FROM jsonb_array_elements(COALESCE(_avaliacoes, '[]'::jsonb))
  LOOP
    v_id := (v_av->>'id')::uuid;
    v_keep_ids := array_append(v_keep_ids, v_id);

    INSERT INTO public.ltcat_avaliacoes (
      id, documento_id, empresa_id, contrato_id, setor_id, funcao_id, colaborador,
      tipo_avaliacao, tipo_agente, agente_id, tecnica_id, equipamento_id,
      resultado, unidade_resultado_id, limite_tolerancia, unidade_limite_id,
      codigo_esocial, descricao_esocial, propagacao, tipo_exposicao,
      fonte_geradora, danos_saude, medidas_controle, parecer_tecnico,
      aposentadoria_especial, data_avaliacao, funcoes_ges, tempo_coleta,
      unidade_tempo_coleta, tipo_documento
    ) VALUES (
      v_id, _documento_id, _empresa_id,
      NULLIF(v_av->>'contrato_id','')::uuid,
      NULLIF(v_av->>'setor_id','')::uuid,
      NULLIF(v_av->>'funcao_id','')::uuid,
      NULLIF(v_av->>'colaborador',''),
      NULLIF(v_av->>'tipo_avaliacao',''), NULLIF(v_av->>'tipo_agente',''),
      NULLIF(v_av->>'agente_id','')::uuid,
      NULLIF(v_av->>'tecnica_id','')::uuid,
      NULLIF(v_av->>'equipamento_id','')::uuid,
      NULLIF(v_av->>'resultado','')::numeric,
      NULLIF(v_av->>'unidade_resultado_id','')::uuid,
      NULLIF(v_av->>'limite_tolerancia','')::numeric,
      NULLIF(v_av->>'unidade_limite_id','')::uuid,
      NULLIF(v_av->>'codigo_esocial',''), NULLIF(v_av->>'descricao_esocial',''),
      CASE WHEN jsonb_typeof(v_av->'propagacao') = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(v_av->'propagacao')) ELSE NULLIF(v_av->>'propagacao','')::text[] END,
      NULLIF(v_av->>'tipo_exposicao',''), NULLIF(v_av->>'fonte_geradora',''),
      NULLIF(v_av->>'danos_saude',''), NULLIF(v_av->>'medidas_controle',''),
      NULLIF(v_av->>'parecer_tecnico',''), NULLIF(v_av->>'aposentadoria_especial',''),
      NULLIF(v_av->>'data_avaliacao','')::date, NULLIF(v_av->>'funcoes_ges',''),
      NULLIF(v_av->>'tempo_coleta',''), NULLIF(v_av->>'unidade_tempo_coleta',''),
      _tipo_documento
    )
    ON CONFLICT (id) DO UPDATE SET
      documento_id = EXCLUDED.documento_id, empresa_id = EXCLUDED.empresa_id,
      contrato_id = EXCLUDED.contrato_id, setor_id = EXCLUDED.setor_id,
      funcao_id = EXCLUDED.funcao_id, colaborador = EXCLUDED.colaborador,
      tipo_avaliacao = EXCLUDED.tipo_avaliacao, tipo_agente = EXCLUDED.tipo_agente,
      agente_id = EXCLUDED.agente_id, tecnica_id = EXCLUDED.tecnica_id,
      equipamento_id = EXCLUDED.equipamento_id, resultado = EXCLUDED.resultado,
      unidade_resultado_id = EXCLUDED.unidade_resultado_id,
      limite_tolerancia = EXCLUDED.limite_tolerancia,
      unidade_limite_id = EXCLUDED.unidade_limite_id,
      codigo_esocial = EXCLUDED.codigo_esocial, descricao_esocial = EXCLUDED.descricao_esocial,
      propagacao = EXCLUDED.propagacao, tipo_exposicao = EXCLUDED.tipo_exposicao,
      fonte_geradora = EXCLUDED.fonte_geradora, danos_saude = EXCLUDED.danos_saude,
      medidas_controle = EXCLUDED.medidas_controle, parecer_tecnico = EXCLUDED.parecer_tecnico,
      aposentadoria_especial = EXCLUDED.aposentadoria_especial,
      data_avaliacao = EXCLUDED.data_avaliacao, funcoes_ges = EXCLUDED.funcoes_ges,
      tempo_coleta = EXCLUDED.tempo_coleta,
      unidade_tempo_coleta = EXCLUDED.unidade_tempo_coleta,
      tipo_documento = EXCLUDED.tipo_documento;

    DELETE FROM public.ltcat_av_componentes WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_componentes (
      id, avaliacao_id, ordem, componente, cas, resultado, unidade_resultado_id,
      limite_tolerancia, unidade_limite_id, tempo_coleta, unidade_tempo_coleta,
      dose_percentual, situacao, cod_gfip, colaborador, funcao_id, data_avaliacao,
      descricao_avaliacao, parecer_tecnico, aposentadoria_especial,
      numero_serie_bomba, amostrador, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'componente',''), NULLIF(x->>'cas',''), NULLIF(x->>'resultado','')::numeric,
      NULLIF(x->>'unidade_resultado_id','')::uuid, NULLIF(x->>'limite_tolerancia','')::numeric,
      NULLIF(x->>'unidade_limite_id','')::uuid, NULLIF(x->>'tempo_coleta',''),
      NULLIF(x->>'unidade_tempo_coleta',''), NULLIF(x->>'dose_percentual','')::numeric,
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''), NULLIF(x->>'colaborador',''),
      NULLIF(x->>'funcao_id','')::uuid, NULLIF(x->>'data_avaliacao','')::date,
      NULLIF(x->>'descricao_avaliacao',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'numero_serie_bomba',''),
      NULLIF(x->>'amostrador',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'componentes','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_calor WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_calor (
      id, avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao,
      ibutg_medido, ibutg_limite, m_kcal_h, tipo_atividade, taxa_metabolica,
      descricao_atividade, situacao, cod_gfip, parecer_tecnico,
      aposentadoria_especial, local_atividade, equipamento_id, tempo_exposicao,
      ibutg_tipo, tbn_valores, tg_valores, tbs_valores, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'ibutg_medido','')::numeric,
      NULLIF(x->>'ibutg_limite','')::numeric, NULLIF(x->>'m_kcal_h','')::numeric,
      NULLIF(x->>'tipo_atividade',''), NULLIF(x->>'taxa_metabolica',''),
      NULLIF(x->>'descricao_atividade',''), NULLIF(x->>'situacao',''),
      NULLIF(x->>'cod_gfip',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'local_atividade',''),
      NULLIF(x->>'equipamento_id','')::uuid, NULLIF(x->>'tempo_exposicao',''),
      NULLIF(x->>'ibutg_tipo',''), NULLIF(x->>'tbn_valores',''),
      NULLIF(x->>'tg_valores',''), NULLIF(x->>'tbs_valores',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'calor','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_vibracao WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_vibracao (
      id, avaliacao_id, ordem, tipo, colaborador, funcao_id, data_avaliacao,
      aren, vdvr, aren_limite, vdvr_limite, tempo_exposicao, situacao,
      cod_gfip, parecer_tecnico, aposentadoria_especial, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'tipo',''), NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'aren','')::numeric,
      NULLIF(x->>'vdvr','')::numeric, NULLIF(x->>'aren_limite','')::numeric,
      NULLIF(x->>'vdvr_limite','')::numeric, NULLIF(x->>'tempo_exposicao',''),
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''),
      NULLIF(x->>'parecer_tecnico',''), NULLIF(x->>'aposentadoria_especial',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'vibracao','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_resultados WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_resultados (
      id, avaliacao_id, ordem, colaborador, funcao_id, data_avaliacao, resultado,
      unidade_resultado_id, limite_tolerancia, unidade_limite_id, tempo_coleta,
      unidade_tempo_coleta, dose_percentual, situacao, cod_gfip,
      descricao_avaliacao, parecer_tecnico, aposentadoria_especial,
      equipamento_registro_id, tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'colaborador',''), NULLIF(x->>'funcao_id','')::uuid,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'resultado','')::numeric,
      NULLIF(x->>'unidade_resultado_id','')::uuid, NULLIF(x->>'limite_tolerancia','')::numeric,
      NULLIF(x->>'unidade_limite_id','')::uuid, NULLIF(x->>'tempo_coleta',''),
      NULLIF(x->>'unidade_tempo_coleta',''), NULLIF(x->>'dose_percentual','')::numeric,
      NULLIF(x->>'situacao',''), NULLIF(x->>'cod_gfip',''),
      NULLIF(x->>'descricao_avaliacao',''), NULLIF(x->>'parecer_tecnico',''),
      NULLIF(x->>'aposentadoria_especial',''), NULLIF(x->>'equipamento_registro_id','')::uuid,
      _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'resultados','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_equipamentos WHERE avaliacao_id = v_id;
    INSERT INTO public.ltcat_av_equipamentos (
      id, avaliacao_id, ordem, nome_equipamento, modelo_equipamento,
      serie_equipamento, data_calibracao, data_avaliacao, agente_nome,
      tipo_documento
    )
    SELECT
      COALESCE(NULLIF(x->>'id','')::uuid, gen_random_uuid()), v_id, ordinality - 1,
      NULLIF(x->>'nome_equipamento',''), NULLIF(x->>'modelo_equipamento',''),
      NULLIF(x->>'serie_equipamento',''), NULLIF(x->>'data_calibracao','')::date,
      NULLIF(x->>'data_avaliacao','')::date, NULLIF(x->>'agente_nome',''), _tipo_documento
    FROM jsonb_array_elements(COALESCE(v_av->'equipamentos','[]'::jsonb)) WITH ORDINALITY AS t(x, ordinality);

    DELETE FROM public.ltcat_av_epi_epc WHERE avaliacao_id = v_id;
    IF COALESCE(v_av->'epi_epc', '{}'::jsonb) <> '{}'::jsonb THEN
      INSERT INTO public.ltcat_av_epi_epc (
        id, avaliacao_id, epi_id, epi_ca, epi_atenuacao, epi_eficaz,
        epc_id, epc_eficaz, tipo_documento
      ) VALUES (
        COALESCE(NULLIF(v_av->'epi_epc'->>'id','')::uuid, gen_random_uuid()), v_id,
        NULLIF(v_av->'epi_epc'->>'epi_id','')::uuid,
        NULLIF(v_av->'epi_epc'->>'epi_ca',''), NULLIF(v_av->'epi_epc'->>'epi_atenuacao',''),
        NULLIF(v_av->'epi_epc'->>'epi_eficaz',''),
        NULLIF(v_av->'epi_epc'->>'epc_id','')::uuid,
        NULLIF(v_av->'epi_epc'->>'epc_eficaz',''), _tipo_documento
      );
    END IF;
  END LOOP;

  DELETE FROM public.ltcat_avaliacoes
  WHERE documento_id = _documento_id
    AND NOT (id = ANY(v_keep_ids));

  RETURN jsonb_build_object('ok', true, 'count', cardinality(v_keep_ids));
END;
$$;
```

#### `public.track_shared_change()`

- Latest: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE OR REPLACE FUNCTION public.track_shared_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_id := OLD.id;
    INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data)
    VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.row_version := OLD.row_version + 1;
    NEW.last_modified_by := auth.uid();
    v_id := NEW.id;
    INSERT INTO public.audit_log(table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;

  NEW.last_modified_by := auth.uid();
  v_id := NEW.id;
  INSERT INTO public.audit_log(table_name, record_id, action, changed_by, new_data)
  VALUES (TG_TABLE_NAME, v_id, TG_OP, auth.uid(), to_jsonb(NEW));
  RETURN NEW;
END;
$$;
```

#### `public.update_shared_record(text, uuid, bigint, jsonb)`

- Latest: `20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql`

```sql
CREATE OR REPLACE FUNCTION public.update_shared_record(
  _table_name text,
  _record_id uuid,
  _expected_version bigint,
  _patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF _table_name NOT IN ('empresas','contratos','setores','funcoes','riscos','documentos','aet_documentos','aep_documentos','pcmso_documentos') THEN
    RAISE EXCEPTION 'Tabela não permitida';
  END IF;
  IF _patch ?| ARRAY['id','row_version','last_modified_by','created_at','updated_at'] THEN
    RAISE EXCEPTION 'Campos de controle não podem ser alterados';
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET %s WHERE id = $1 AND row_version = $2 RETURNING to_jsonb(%I.*)',
    _table_name,
    (SELECT string_agg(format('%I = ($3->>%L)::%s', c.column_name, c.column_name, c.udt_name), ', ')
       FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = _table_name
        AND c.column_name IN (SELECT jsonb_object_keys(_patch))
        AND c.column_name NOT IN ('id','row_version','last_modified_by','created_at','updated_at')),
    _table_name
  ) INTO v_result USING _record_id, _expected_version, _patch;

  IF v_result IS NULL THEN
    EXECUTE format('SELECT to_jsonb(t.*) FROM public.%I t WHERE id = $1', _table_name)
      INTO v_result USING _record_id;
    RETURN jsonb_build_object('ok', false, 'conflict', true, 'current', v_result);
  END IF;

  RETURN jsonb_build_object('ok', true, 'conflict', false, 'record', v_result);
END;
$$;
```

#### `public.update_updated_at_column()`

- Latest: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`
- Prior: `20260414123527_daa5e69e-3f30-482c-a7af-81a0884ca209.sql`

```sql
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
```

#### `public.validate_ficha_tecnica_resultado()`

- Latest: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql`
- Prior: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE OR REPLACE FUNCTION public.validate_ficha_tecnica_resultado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = NEW.contrato_id AND c.empresa_id = NEW.empresa_id) THEN
    RAISE EXCEPTION 'Contrato não pertence à empresa informada' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.setores s WHERE s.id = NEW.setor_id AND s.empresa_id = NEW.empresa_id AND s.contrato_id = NEW.contrato_id) THEN
    RAISE EXCEPTION 'Setor não pertence à empresa e ao contrato informados' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.funcoes f WHERE f.id = NEW.funcao_id AND f.setor_id = NEW.setor_id) THEN
    RAISE EXCEPTION 'Função não pertence ao setor informado' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.riscos r WHERE r.id = NEW.agente_id) THEN
    RAISE EXCEPTION 'Agente inválido' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'ruido' AND (NEW.nen IS NULL OR NEW.dose_q3 IS NULL OR NEW.lavg IS NULL OR NEW.dose_q5 IS NULL OR NEW.limite_tolerancia <> 85) THEN
    RAISE EXCEPTION 'Ruído exige NEN, Dose Q3, LAVG, Dose Q5 e limite de 85 dB' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'vibracao_vmb' AND (NEW.aren IS NULL OR NEW.limite_tolerancia <> 5.0) THEN
    RAISE EXCEPTION 'Vibração de mãos e braços exige AREN e limite de 5,0 m/s²' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'vibracao_vci' AND (NEW.aren IS NULL OR NEW.vdvr IS NULL OR NEW.limite_tolerancia <> 1.1) THEN
    RAISE EXCEPTION 'Vibração de corpo inteiro exige AREN, VDVR e limite AREN de 1,1 m/s²' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'calor' AND (NEW.concentracao IS NULL OR NULLIF(trim(NEW.taxa_metabolica), '') IS NULL) THEN
    RAISE EXCEPTION 'Calor exige concentração e taxa metabólica' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo IN ('poeira_silica','quimico_quantitativo','fumos_metalicos','vapores_organicos')
     AND (NULLIF(trim(NEW.componentes), '') IS NULL OR NULLIF(trim(NEW.amostrador), '') IS NULL OR NULLIF(trim(NEW.amostrador_serie), '') IS NULL OR NEW.exposicao IS NULL) THEN
    RAISE EXCEPTION 'Resultado químico exige componentes, amostrador, número/série e exposição' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
```


## 4. CREATE POLICY (final set)

Final policy set after applying CREATE/DROP in chronological order (191).

Note: migration `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql` hardened many authenticated policies.

### Table `public.aep_documentos` (4 policies)

#### Policy `Authenticated can delete aep`

Source: `20260902233443_cb9cb308-c832-4e5e-9796-9769f8a0bd04.sql`

```sql
CREATE POLICY "Authenticated can delete aep" ON public.aep_documentos FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert aep`

Source: `20260902233443_cb9cb308-c832-4e5e-9796-9769f8a0bd04.sql`

```sql
CREATE POLICY "Authenticated can insert aep" ON public.aep_documentos FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update aep`

Source: `20260902233443_cb9cb308-c832-4e5e-9796-9769f8a0bd04.sql`

```sql
CREATE POLICY "Authenticated can update aep" ON public.aep_documentos FOR UPDATE TO authenticated USING (true);
```

#### Policy `Authenticated can view aep`

Source: `20260902233443_cb9cb308-c832-4e5e-9796-9769f8a0bd04.sql`

```sql
CREATE POLICY "Authenticated can view aep" ON public.aep_documentos FOR SELECT TO authenticated USING (true);
```

### Table `public.aet_documentos` (4 policies)

#### Policy `Authenticated can delete aet_documentos`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE POLICY "Authenticated can delete aet_documentos"
  ON public.aet_documentos FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert aet_documentos`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE POLICY "Authenticated can insert aet_documentos"
  ON public.aet_documentos FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update aet_documentos`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE POLICY "Authenticated can update aet_documentos"
  ON public.aet_documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view aet_documentos`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE POLICY "Authenticated can view aet_documentos"
  ON public.aet_documentos FOR SELECT TO authenticated USING (true);
```

### Table `public.aet_instrucoes_usuario` (1 policies)

#### Policy `user manage own aet instrucoes`

Source: `20260722141704_e8e1a4fc-9d16-4028-8311-1ef18c47cef7.sql`

```sql
CREATE POLICY "user manage own aet instrucoes" ON public.aet_instrucoes_usuario
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Table `public.audit_log` (1 policies)

#### Policy `Admins can view audit log`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
```

### Table `public.contratos` (4 policies)

#### Policy `Authenticated can delete contratos`

Source: `20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql`

```sql
CREATE POLICY "Authenticated can delete contratos" ON public.contratos FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert contratos`

Source: `20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql`

```sql
CREATE POLICY "Authenticated can insert contratos" ON public.contratos FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update contratos`

Source: `20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql`

```sql
CREATE POLICY "Authenticated can update contratos" ON public.contratos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view contratos`

Source: `20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql`

```sql
CREATE POLICY "Authenticated can view contratos" ON public.contratos FOR SELECT TO authenticated USING (true);
```

### Table `public.documentos` (4 policies)

#### Policy `Authenticated can delete documentos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete documentos" ON public.documentos FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert documentos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert documentos" ON public.documentos FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update documentos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update documentos" ON public.documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view documentos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view documentos" ON public.documentos FOR SELECT TO authenticated USING (true);
```

### Table `public.empresa_contatos` (4 policies)

#### Policy `Authenticated can delete empresa_contatos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete empresa_contatos" ON public.empresa_contatos FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert empresa_contatos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert empresa_contatos" ON public.empresa_contatos FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update empresa_contatos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update empresa_contatos" ON public.empresa_contatos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view empresa_contatos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view empresa_contatos" ON public.empresa_contatos FOR SELECT TO authenticated USING (true);
```

### Table `public.empresas` (4 policies)

#### Policy `Admins can delete empresas`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Admins can delete empresas" ON public.empresas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
```

#### Policy `Authenticated can insert empresas`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert empresas" ON public.empresas FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update empresas`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update empresas" ON public.empresas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view empresas`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view empresas" ON public.empresas FOR SELECT TO authenticated USING (true);
```

### Table `public.epi_epc` (4 policies)

#### Policy `Authenticated can delete epi_epc`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete epi_epc" ON public.epi_epc FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert epi_epc`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert epi_epc" ON public.epi_epc FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update epi_epc`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update epi_epc" ON public.epi_epc FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view epi_epc`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view epi_epc" ON public.epi_epc FOR SELECT TO authenticated USING (true);
```

### Table `public.epi_epc_riscos` (3 policies)

#### Policy `Authenticated can delete epi_epc_riscos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete epi_epc_riscos" ON public.epi_epc_riscos FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert epi_epc_riscos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert epi_epc_riscos" ON public.epi_epc_riscos FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can view epi_epc_riscos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view epi_epc_riscos" ON public.epi_epc_riscos FOR SELECT TO authenticated USING (true);
```

### Table `public.equipamentos_avaliacao` (4 policies)

#### Policy `Authenticated can delete equipamentos_avaliacao`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert equipamentos_avaliacao`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update equipamentos_avaliacao`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view equipamentos_avaliacao`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view equipamentos_avaliacao" ON public.equipamentos_avaliacao FOR SELECT TO authenticated USING (true);
```

### Table `public.equipamentos_ho` (4 policies)

#### Policy `Authenticated can delete equipamentos_ho`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete equipamentos_ho" ON public.equipamentos_ho FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert equipamentos_ho`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert equipamentos_ho" ON public.equipamentos_ho FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update equipamentos_ho`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update equipamentos_ho" ON public.equipamentos_ho FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view equipamentos_ho`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view equipamentos_ho" ON public.equipamentos_ho FOR SELECT TO authenticated USING (true);
```

### Table `public.equipamentos_ho_registros` (4 policies)

#### Policy `Authenticated can delete equipamentos_ho_registros`

Source: `20260503004952_72412598-de9a-4daf-81de-4c3fc7d90584.sql`

```sql
CREATE POLICY "Authenticated can delete equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert equipamentos_ho_registros`

Source: `20260503004952_72412598-de9a-4daf-81de-4c3fc7d90584.sql`

```sql
CREATE POLICY "Authenticated can insert equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update equipamentos_ho_registros`

Source: `20260503004952_72412598-de9a-4daf-81de-4c3fc7d90584.sql`

```sql
CREATE POLICY "Authenticated can update equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view equipamentos_ho_registros`

Source: `20260503004952_72412598-de9a-4daf-81de-4c3fc7d90584.sql`

```sql
CREATE POLICY "Authenticated can view equipamentos_ho_registros"
  ON public.equipamentos_ho_registros FOR SELECT TO authenticated USING (true);
```

### Table `public.ergonomia_avaliacoes` (4 policies)

#### Policy `auth_delete_ergonomia`

Source: `20260831180422_e10bc552-fcee-45b8-ac21-0f9bda3e884b.sql`

```sql
CREATE POLICY "auth_delete_ergonomia" ON public.ergonomia_avaliacoes
  FOR DELETE TO authenticated USING (true);
```

#### Policy `auth_select_ergonomia`

Source: `20260831180422_e10bc552-fcee-45b8-ac21-0f9bda3e884b.sql`

```sql
CREATE POLICY "auth_select_ergonomia" ON public.ergonomia_avaliacoes
  FOR SELECT TO authenticated USING (true);
```

#### Policy `auth_update_ergonomia`

Source: `20260831180422_e10bc552-fcee-45b8-ac21-0f9bda3e884b.sql`

```sql
CREATE POLICY "auth_update_ergonomia" ON public.ergonomia_avaliacoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `own_insert`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE POLICY "own_insert" ON public.ergonomia_avaliacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

### Table `public.esocial_exames` (4 policies)

#### Policy `Auth can delete esocial_exames`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can delete esocial_exames" ON public.esocial_exames FOR DELETE TO authenticated USING (true);
```

#### Policy `Auth can insert esocial_exames`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can insert esocial_exames" ON public.esocial_exames FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Auth can update esocial_exames`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can update esocial_exames" ON public.esocial_exames FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Auth can view esocial_exames`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can view esocial_exames" ON public.esocial_exames FOR SELECT TO authenticated USING (true);
```

### Table `public.exames_cadastro` (4 policies)

#### Policy `Authenticated can delete exames_cadastro`

Source: `20260604190948_70d23a89-530b-418a-aa5c-e05b5f63f30a.sql`

```sql
CREATE POLICY "Authenticated can delete exames_cadastro" ON public.exames_cadastro FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert exames_cadastro`

Source: `20260604190948_70d23a89-530b-418a-aa5c-e05b5f63f30a.sql`

```sql
CREATE POLICY "Authenticated can insert exames_cadastro" ON public.exames_cadastro FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update exames_cadastro`

Source: `20260604190948_70d23a89-530b-418a-aa5c-e05b5f63f30a.sql`

```sql
CREATE POLICY "Authenticated can update exames_cadastro" ON public.exames_cadastro FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view exames_cadastro`

Source: `20260604190948_70d23a89-530b-418a-aa5c-e05b5f63f30a.sql`

```sql
CREATE POLICY "Authenticated can view exames_cadastro" ON public.exames_cadastro FOR SELECT TO authenticated USING (true);
```

### Table `public.exames_catalogo` (4 policies)

#### Policy `Auth can delete exames_catalogo`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can delete exames_catalogo" ON public.exames_catalogo FOR DELETE TO authenticated USING (true);
```

#### Policy `Auth can insert exames_catalogo`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can insert exames_catalogo" ON public.exames_catalogo FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Auth can update exames_catalogo`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can update exames_catalogo" ON public.exames_catalogo FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Auth can view exames_catalogo`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can view exames_catalogo" ON public.exames_catalogo FOR SELECT TO authenticated USING (true);
```

### Table `public.ficha_tecnica_resultados` (4 policies)

#### Policy `Authenticated can delete ficha tecnica resultados`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE POLICY "Authenticated can delete ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert ficha tecnica resultados`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE POLICY "Authenticated can insert ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
```

#### Policy `Authenticated can update ficha tecnica resultados`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE POLICY "Authenticated can update ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view ficha tecnica resultados`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE POLICY "Authenticated can view ficha tecnica resultados"
ON public.ficha_tecnica_resultados FOR SELECT TO authenticated USING (true);
```

### Table `public.funcoes` (4 policies)

#### Policy `Authenticated can delete funcoes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete funcoes" ON public.funcoes FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert funcoes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert funcoes" ON public.funcoes FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update funcoes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update funcoes" ON public.funcoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view funcoes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view funcoes" ON public.funcoes FOR SELECT TO authenticated USING (true);
```

### Table `public.ia_conhecimento_arquivos` (1 policies)

#### Policy `auth manage arquivos`

Source: `20260911002319_a5e92a58-5d0f-40b2-a764-4ab2673cb8cb.sql`

```sql
CREATE POLICY "auth manage arquivos" ON public.ia_conhecimento_arquivos FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Table `public.ia_conhecimento_pastas` (1 policies)

#### Policy `auth manage pastas`

Source: `20260911002319_a5e92a58-5d0f-40b2-a764-4ab2673cb8cb.sql`

```sql
CREATE POLICY "auth manage pastas" ON public.ia_conhecimento_pastas FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Table `public.ltcat_av_calor` (4 policies)

#### Policy `Authenticated can delete ltcat_av_calor`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete ltcat_av_calor" ON public.ltcat_av_calor FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert ltcat_av_calor`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert ltcat_av_calor" ON public.ltcat_av_calor FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update ltcat_av_calor`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update ltcat_av_calor" ON public.ltcat_av_calor FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view ltcat_av_calor`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view ltcat_av_calor" ON public.ltcat_av_calor FOR SELECT TO authenticated USING (true);
```

### Table `public.ltcat_av_componentes` (4 policies)

#### Policy `Authenticated can delete ltcat_av_componentes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete ltcat_av_componentes" ON public.ltcat_av_componentes FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert ltcat_av_componentes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert ltcat_av_componentes" ON public.ltcat_av_componentes FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update ltcat_av_componentes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update ltcat_av_componentes" ON public.ltcat_av_componentes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view ltcat_av_componentes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view ltcat_av_componentes" ON public.ltcat_av_componentes FOR SELECT TO authenticated USING (true);
```

### Table `public.ltcat_av_epi_epc` (4 policies)

#### Policy `Authenticated can delete ltcat_av_epi_epc`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert ltcat_av_epi_epc`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update ltcat_av_epi_epc`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view ltcat_av_epi_epc`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view ltcat_av_epi_epc" ON public.ltcat_av_epi_epc FOR SELECT TO authenticated USING (true);
```

### Table `public.ltcat_av_equipamentos` (4 policies)

#### Policy `Authenticated can delete ltcat_av_equipamentos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert ltcat_av_equipamentos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update ltcat_av_equipamentos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view ltcat_av_equipamentos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view ltcat_av_equipamentos" ON public.ltcat_av_equipamentos FOR SELECT TO authenticated USING (true);
```

### Table `public.ltcat_av_resultados` (4 policies)

#### Policy `Authenticated can delete ltcat_av_resultados`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete ltcat_av_resultados" ON public.ltcat_av_resultados FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert ltcat_av_resultados`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert ltcat_av_resultados" ON public.ltcat_av_resultados FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update ltcat_av_resultados`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update ltcat_av_resultados" ON public.ltcat_av_resultados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view ltcat_av_resultados`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view ltcat_av_resultados" ON public.ltcat_av_resultados FOR SELECT TO authenticated USING (true);
```

### Table `public.ltcat_av_vibracao` (4 policies)

#### Policy `Authenticated can delete ltcat_av_vibracao`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert ltcat_av_vibracao`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update ltcat_av_vibracao`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view ltcat_av_vibracao`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view ltcat_av_vibracao" ON public.ltcat_av_vibracao FOR SELECT TO authenticated USING (true);
```

### Table `public.ltcat_avaliacoes` (4 policies)

#### Policy `Authenticated can delete ltcat_avaliacoes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert ltcat_avaliacoes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update ltcat_avaliacoes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view ltcat_avaliacoes`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view ltcat_avaliacoes" ON public.ltcat_avaliacoes FOR SELECT TO authenticated USING (true);
```

### Table `public.ltcat_pareceres` (4 policies)

#### Policy `Permitir atualização de ltcat_pareceres para usuários autenticados`

Source: `20260414230000_ltcat_pareceres.sql`

```sql
CREATE POLICY "Permitir atualização de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR UPDATE TO authenticated USING (true);
```

#### Policy `Permitir exclusão de ltcat_pareceres para usuários autenticados`

Source: `20260414230000_ltcat_pareceres.sql`

```sql
CREATE POLICY "Permitir exclusão de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR DELETE TO authenticated USING (true);
```

#### Policy `Permitir inserção de ltcat_pareceres para usuários autenticados`

Source: `20260414230000_ltcat_pareceres.sql`

```sql
CREATE POLICY "Permitir inserção de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Permitir leitura de ltcat_pareceres para usuários autenticados`

Source: `20260414230000_ltcat_pareceres.sql`

```sql
CREATE POLICY "Permitir leitura de ltcat_pareceres para usuários autenticados" ON public.ltcat_pareceres FOR SELECT TO authenticated USING (true);
```

### Table `public.notificacoes` (4 policies)

#### Policy `Authenticated can delete notificacoes`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Authenticated can delete notificacoes" ON public.notificacoes FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert notificacoes`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Authenticated can insert notificacoes" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update notificacoes`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Authenticated can update notificacoes" ON public.notificacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view notificacoes`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Authenticated can view notificacoes" ON public.notificacoes FOR SELECT TO authenticated USING (true);
```

### Table `public.pareceres_tecnicos` (4 policies)

#### Policy `Authenticated can delete pareceres_tecnicos`

Source: `20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql`

```sql
CREATE POLICY "Authenticated can delete pareceres_tecnicos" ON public.pareceres_tecnicos FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert pareceres_tecnicos`

Source: `20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql`

```sql
CREATE POLICY "Authenticated can insert pareceres_tecnicos" ON public.pareceres_tecnicos FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update pareceres_tecnicos`

Source: `20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql`

```sql
CREATE POLICY "Authenticated can update pareceres_tecnicos" ON public.pareceres_tecnicos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view pareceres_tecnicos`

Source: `20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql`

```sql
CREATE POLICY "Authenticated can view pareceres_tecnicos" ON public.pareceres_tecnicos FOR SELECT TO authenticated USING (true);
```

### Table `public.pcmso_documentos` (8 policies)

#### Policy `Auth can delete pcmso_documentos`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can delete pcmso_documentos" ON public.pcmso_documentos FOR DELETE TO authenticated USING (true);
```

#### Policy `Auth can insert pcmso_documentos`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can insert pcmso_documentos" ON public.pcmso_documentos FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Auth can update pcmso_documentos`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can update pcmso_documentos" ON public.pcmso_documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Auth can view pcmso_documentos`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can view pcmso_documentos" ON public.pcmso_documentos FOR SELECT TO authenticated USING (true);
```

#### Policy `Authenticated can delete pcmso_documentos`

Source: `20260529162855_f03978d1-3a35-46e0-b51e-f7a52891270b.sql`

```sql
CREATE POLICY "Authenticated can delete pcmso_documentos" ON public.pcmso_documentos FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert pcmso_documentos`

Source: `20260529162855_f03978d1-3a35-46e0-b51e-f7a52891270b.sql`

```sql
CREATE POLICY "Authenticated can insert pcmso_documentos" ON public.pcmso_documentos FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update pcmso_documentos`

Source: `20260529162855_f03978d1-3a35-46e0-b51e-f7a52891270b.sql`

```sql
CREATE POLICY "Authenticated can update pcmso_documentos" ON public.pcmso_documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view pcmso_documentos`

Source: `20260529162855_f03978d1-3a35-46e0-b51e-f7a52891270b.sql`

```sql
CREATE POLICY "Authenticated can view pcmso_documentos" ON public.pcmso_documentos FOR SELECT TO authenticated USING (true);
```

### Table `public.pcmso_observacoes_padrao` (4 policies)

#### Policy `Auth can delete pcmso_obs`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can delete pcmso_obs" ON public.pcmso_observacoes_padrao FOR DELETE TO authenticated USING (true);
```

#### Policy `Auth can insert pcmso_obs`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can insert pcmso_obs" ON public.pcmso_observacoes_padrao FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Auth can update pcmso_obs`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can update pcmso_obs" ON public.pcmso_observacoes_padrao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Auth can view pcmso_obs`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can view pcmso_obs" ON public.pcmso_observacoes_padrao FOR SELECT TO authenticated USING (true);
```

### Table `public.pcmso_setor_exames` (4 policies)

#### Policy `Auth can delete pcmso_setor_exames`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can delete pcmso_setor_exames" ON public.pcmso_setor_exames FOR DELETE TO authenticated USING (true);
```

#### Policy `Auth can insert pcmso_setor_exames`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can insert pcmso_setor_exames" ON public.pcmso_setor_exames FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Auth can update pcmso_setor_exames`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can update pcmso_setor_exames" ON public.pcmso_setor_exames FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Auth can view pcmso_setor_exames`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE POLICY "Auth can view pcmso_setor_exames" ON public.pcmso_setor_exames FOR SELECT TO authenticated USING (true);
```

### Table `public.profiles` (5 policies)

#### Policy `Admins can delete profiles`

Source: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

#### Policy `Admins can update any profile`

Source: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

#### Policy `Admins can view all profiles`

Source: `20260420121327_93ba12e6-488d-4d55-bd31-86fe8399e6aa.sql`

```sql
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
```

#### Policy `Users can update own profile`

Source: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated USING (auth.uid() = user_id);
```

#### Policy `Users can view own profile`

Source: `20260420121327_93ba12e6-488d-4d55-bd31-86fe8399e6aa.sql`

```sql
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### Table `public.psico_avaliacoes` (1 policies)

#### Policy `auth manage psico avaliacoes`

Source: `20260830135307_b98b5290-ba6d-41f8-bbba-61522c55b286.sql`

```sql
CREATE POLICY "auth manage psico avaliacoes"
ON public.psico_avaliacoes FOR ALL TO authenticated
USING (true) WITH CHECK (true);
```

### Table `public.psico_base_tecnica` (1 policies)

#### Policy `Usuarios autenticados gerenciam a base tecnica`

Source: `20260830182719_ad96df8f-1fec-428a-b3e0-6ce301a8be93.sql`

```sql
CREATE POLICY "Usuarios autenticados gerenciam a base tecnica"
  ON public.psico_base_tecnica FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

### Table `public.psico_indicadores` (1 policies)

#### Policy `auth manage psico indicadores`

Source: `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`

```sql
CREATE POLICY "auth manage psico indicadores" ON public.psico_indicadores FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Table `public.psico_links` (1 policies)

#### Policy `auth manage links`

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
CREATE POLICY "auth manage links" ON public.psico_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Table `public.psico_relatorios` (1 policies)

#### Policy `auth manage psico relatorios`

Source: `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`

```sql
CREATE POLICY "auth manage psico relatorios" ON public.psico_relatorios FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Table `public.psico_respostas` (1 policies)

#### Policy `auth manage respostas`

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
CREATE POLICY "auth manage respostas" ON public.psico_respostas FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Table `public.responsaveis` (1 policies)

#### Policy `auth manage responsaveis`

Source: `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`

```sql
CREATE POLICY "auth manage responsaveis" ON public.responsaveis FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Table `public.riscos` (4 policies)

#### Policy `Authenticated can delete riscos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete riscos" ON public.riscos FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert riscos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert riscos" ON public.riscos FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update riscos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update riscos" ON public.riscos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view riscos`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view riscos" ON public.riscos FOR SELECT TO authenticated USING (true);
```

### Table `public.setores` (4 policies)

#### Policy `Authenticated can delete setores`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can delete setores" ON public.setores FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert setores`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert setores" ON public.setores FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update setores`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update setores" ON public.setores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view setores`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view setores" ON public.setores FOR SELECT TO authenticated USING (true);
```

### Table `public.tecnicas_amostragem` (2 policies)

#### Policy `Admins can insert tecnicas_amostragem`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Admins can insert tecnicas_amostragem" ON public.tecnicas_amostragem FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
```

#### Policy `Authenticated can view tecnicas_amostragem`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view tecnicas_amostragem" ON public.tecnicas_amostragem FOR SELECT TO authenticated USING (true);
```

### Table `public.templates` (4 policies)

#### Policy `Authenticated can delete non-system templates`

Source: `20260605191032_254a71b3-456b-48a4-80b9-c76d45579827.sql`

```sql
CREATE POLICY "Authenticated can delete non-system templates"
ON public.templates
FOR DELETE
TO authenticated
USING (is_system = false);
```

#### Policy `Authenticated can insert templates`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can insert templates" ON public.templates FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update non-system templates`

Source: `20260505010440_34a82822-f1a1-455c-bfed-20aa1eabff4d.sql`

```sql
CREATE POLICY "Authenticated can update non-system templates"
ON public.templates
FOR UPDATE
TO authenticated
USING (is_system = false)
WITH CHECK (is_system = false);
```

#### Policy `Authenticated can view templates`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view templates" ON public.templates FOR SELECT TO authenticated USING (true);
```

### Table `public.treinamentos_cadastro` (4 policies)

#### Policy `Authenticated can delete treinamentos_cadastro`

Source: `20260603184253_fbfcd9fd-33c8-40e9-a62f-c0a12ccb6faa.sql`

```sql
CREATE POLICY "Authenticated can delete treinamentos_cadastro" ON public.treinamentos_cadastro FOR DELETE TO authenticated USING (true);
```

#### Policy `Authenticated can insert treinamentos_cadastro`

Source: `20260603184253_fbfcd9fd-33c8-40e9-a62f-c0a12ccb6faa.sql`

```sql
CREATE POLICY "Authenticated can insert treinamentos_cadastro" ON public.treinamentos_cadastro FOR INSERT TO authenticated WITH CHECK (true);
```

#### Policy `Authenticated can update treinamentos_cadastro`

Source: `20260603184253_fbfcd9fd-33c8-40e9-a62f-c0a12ccb6faa.sql`

```sql
CREATE POLICY "Authenticated can update treinamentos_cadastro" ON public.treinamentos_cadastro FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

#### Policy `Authenticated can view treinamentos_cadastro`

Source: `20260603184253_fbfcd9fd-33c8-40e9-a62f-c0a12ccb6faa.sql`

```sql
CREATE POLICY "Authenticated can view treinamentos_cadastro" ON public.treinamentos_cadastro FOR SELECT TO authenticated USING (true);
```

### Table `public.unidades` (2 policies)

#### Policy `Admins can insert unidades`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Admins can insert unidades" ON public.unidades FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
```

#### Policy `Authenticated can view unidades`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can view unidades" ON public.unidades FOR SELECT TO authenticated USING (true);
```

### Table `public.user_roles` (5 policies)

#### Policy `Admins can view all roles`

Source: `20260420121327_93ba12e6-488d-4d55-bd31-86fe8399e6aa.sql`

```sql
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
```

#### Policy `Admins manage roles - delete`

Source: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE POLICY "Admins manage roles - delete"
ON public.user_roles FOR DELETE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

#### Policy `Admins manage roles - insert`

Source: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE POLICY "Admins manage roles - insert"
ON public.user_roles FOR INSERT
TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

#### Policy `Admins manage roles - update`

Source: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE POLICY "Admins manage roles - update"
ON public.user_roles FOR UPDATE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

#### Policy `Users can view own roles`

Source: `20260420121327_93ba12e6-488d-4d55-bd31-86fe8399e6aa.sql`

```sql
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### Table `storage.objects` (27 policies)

#### Policy `Admins can delete templates`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Admins can delete templates"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'templates' AND public.has_role(auth.uid(), 'admin'::app_role));
```

#### Policy `Auth can delete documentos-upload`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Auth can delete documentos-upload"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-upload');
```

#### Policy `Auth can insert documentos-upload`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Auth can insert documentos-upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-upload');
```

#### Policy `Auth can update documentos-upload`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Auth can update documentos-upload"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos-upload');
```

#### Policy `Auth can view documentos-upload`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Auth can view documentos-upload"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-upload');
```

#### Policy `Authenticated can delete aet-imagens`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE POLICY "Authenticated can delete aet-imagens"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'aet-imagens');
```

#### Policy `Authenticated can update aet-imagens`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE POLICY "Authenticated can update aet-imagens"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'aet-imagens');
```

#### Policy `Authenticated can update templates`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update templates"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'templates');
```

#### Policy `Authenticated can upload aet-imagens`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE POLICY "Authenticated can upload aet-imagens"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aet-imagens');
```

#### Policy `Authenticated can upload templates`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can upload templates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'templates');
```

#### Policy `Authenticated can view aet-imagens`

Source: `20260722205401_3380d9e7-c798-4843-897a-ba01867fdcc4.sql`

```sql
CREATE POLICY "Authenticated can view aet-imagens" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'aet-imagens');
```

#### Policy `Authenticated can view templates`

Source: `20260722205401_3380d9e7-c798-4843-897a-ba01867fdcc4.sql`

```sql
CREATE POLICY "Authenticated can view templates" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'templates');
```

#### Policy `Base tecnica exclusao autenticada`

Source: `20260830182719_ad96df8f-1fec-428a-b3e0-6ce301a8be93.sql`

```sql
CREATE POLICY "Base tecnica exclusao autenticada"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'psico-base-tecnica');
```

#### Policy `Base tecnica leitura autenticada`

Source: `20260830182719_ad96df8f-1fec-428a-b3e0-6ce301a8be93.sql`

```sql
CREATE POLICY "Base tecnica leitura autenticada"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'psico-base-tecnica');
```

#### Policy `Base tecnica upload autenticado`

Source: `20260830182719_ad96df8f-1fec-428a-b3e0-6ce301a8be93.sql`

```sql
CREATE POLICY "Base tecnica upload autenticado"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'psico-base-tecnica');
```

#### Policy `cert_calib_delete`

Source: `20260904180922_f99c4ba4-6180-49f4-9df3-4a377888f1ed.sql`

```sql
CREATE POLICY "cert_calib_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'certificados-calibracao');
```

#### Policy `cert_calib_insert`

Source: `20260904180922_f99c4ba4-6180-49f4-9df3-4a377888f1ed.sql`

```sql
CREATE POLICY "cert_calib_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificados-calibracao');
```

#### Policy `cert_calib_select`

Source: `20260904180922_f99c4ba4-6180-49f4-9df3-4a377888f1ed.sql`

```sql
CREATE POLICY "cert_calib_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'certificados-calibracao');
```

#### Policy `cert_calib_update`

Source: `20260904180922_f99c4ba4-6180-49f4-9df3-4a377888f1ed.sql`

```sql
CREATE POLICY "cert_calib_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'certificados-calibracao') WITH CHECK (bucket_id = 'certificados-calibracao');
```

#### Policy `ergonomia_delete_own`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE POLICY "ergonomia_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);
```

#### Policy `ergonomia_insert_own`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE POLICY "ergonomia_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);
```

#### Policy `ergonomia_read_own`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE POLICY "ergonomia_read_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);
```

#### Policy `ergonomia_update_own`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE POLICY "ergonomia_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);
```

#### Policy `ia conhecimento delete`

Source: `20260911002344_d6f6f784-5111-40a8-ab58-c76d71d9a9b7.sql`

```sql
CREATE POLICY "ia conhecimento delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ia-conhecimento');
```

#### Policy `ia conhecimento insert`

Source: `20260911002344_d6f6f784-5111-40a8-ab58-c76d71d9a9b7.sql`

```sql
CREATE POLICY "ia conhecimento insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ia-conhecimento');
```

#### Policy `ia conhecimento read`

Source: `20260911002344_d6f6f784-5111-40a8-ab58-c76d71d9a9b7.sql`

```sql
CREATE POLICY "ia conhecimento read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ia-conhecimento');
```

#### Policy `ia conhecimento update`

Source: `20260911002344_d6f6f784-5111-40a8-ab58-c76d71d9a9b7.sql`

```sql
CREATE POLICY "ia conhecimento update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ia-conhecimento');
```


## 5. Storage buckets

### All bucket names found (7)

From `INSERT INTO storage.buckets` (3):

- `aet-imagens`
- `documentos-upload`
- `templates`

Also referenced via `bucket_id` in storage policies (may lack INSERT in migrations):

- `aet-imagens`
- `certificados-calibracao` — **no INSERT in migrations**
- `documentos-upload`
- `ergonomia-relatorios` — **no INSERT in migrations**
- `ia-conhecimento` — **no INSERT in migrations**
- `psico-base-tecnica` — **no INSERT in migrations**
- `templates`

Buckets with policies but no migration INSERT: `certificados-calibracao`, `ergonomia-relatorios`, `ia-conhecimento`, `psico-base-tecnica`

### INSERT INTO storage.buckets (full)

Source: `20260414113025_6e46e2b2-7c60-4e96-b93f-aacbfc561312.sql`

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', true);
```

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('aet-imagens', 'aet-imagens', true)
ON CONFLICT (id) DO NOTHING;
```

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-upload', 'documentos-upload', false)
ON CONFLICT (id) DO NOTHING;
```


## 6. Storage policies on storage.objects (final)

### `Admins can delete templates`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Admins can delete templates"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'templates' AND public.has_role(auth.uid(), 'admin'::app_role));
```

### `Auth can delete documentos-upload`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Auth can delete documentos-upload"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-upload');
```

### `Auth can insert documentos-upload`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Auth can insert documentos-upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-upload');
```

### `Auth can update documentos-upload`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Auth can update documentos-upload"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos-upload');
```

### `Auth can view documentos-upload`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE POLICY "Auth can view documentos-upload"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-upload');
```

### `Authenticated can delete aet-imagens`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE POLICY "Authenticated can delete aet-imagens"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'aet-imagens');
```

### `Authenticated can update aet-imagens`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE POLICY "Authenticated can update aet-imagens"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'aet-imagens');
```

### `Authenticated can update templates`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can update templates"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'templates');
```

### `Authenticated can upload aet-imagens`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE POLICY "Authenticated can upload aet-imagens"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aet-imagens');
```

### `Authenticated can upload templates`

Source: `20260418023326_d1f65130-330d-44d7-9544-bf53db9c4e0c.sql`

```sql
CREATE POLICY "Authenticated can upload templates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'templates');
```

### `Authenticated can view aet-imagens`

Source: `20260722205401_3380d9e7-c798-4843-897a-ba01867fdcc4.sql`

```sql
CREATE POLICY "Authenticated can view aet-imagens" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'aet-imagens');
```

### `Authenticated can view templates`

Source: `20260722205401_3380d9e7-c798-4843-897a-ba01867fdcc4.sql`

```sql
CREATE POLICY "Authenticated can view templates" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'templates');
```

### `Base tecnica exclusao autenticada`

Source: `20260830182719_ad96df8f-1fec-428a-b3e0-6ce301a8be93.sql`

```sql
CREATE POLICY "Base tecnica exclusao autenticada"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'psico-base-tecnica');
```

### `Base tecnica leitura autenticada`

Source: `20260830182719_ad96df8f-1fec-428a-b3e0-6ce301a8be93.sql`

```sql
CREATE POLICY "Base tecnica leitura autenticada"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'psico-base-tecnica');
```

### `Base tecnica upload autenticado`

Source: `20260830182719_ad96df8f-1fec-428a-b3e0-6ce301a8be93.sql`

```sql
CREATE POLICY "Base tecnica upload autenticado"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'psico-base-tecnica');
```

### `cert_calib_delete`

Source: `20260904180922_f99c4ba4-6180-49f4-9df3-4a377888f1ed.sql`

```sql
CREATE POLICY "cert_calib_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'certificados-calibracao');
```

### `cert_calib_insert`

Source: `20260904180922_f99c4ba4-6180-49f4-9df3-4a377888f1ed.sql`

```sql
CREATE POLICY "cert_calib_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificados-calibracao');
```

### `cert_calib_select`

Source: `20260904180922_f99c4ba4-6180-49f4-9df3-4a377888f1ed.sql`

```sql
CREATE POLICY "cert_calib_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'certificados-calibracao');
```

### `cert_calib_update`

Source: `20260904180922_f99c4ba4-6180-49f4-9df3-4a377888f1ed.sql`

```sql
CREATE POLICY "cert_calib_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'certificados-calibracao') WITH CHECK (bucket_id = 'certificados-calibracao');
```

### `ergonomia_delete_own`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE POLICY "ergonomia_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### `ergonomia_insert_own`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE POLICY "ergonomia_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### `ergonomia_read_own`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE POLICY "ergonomia_read_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### `ergonomia_update_own`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE POLICY "ergonomia_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ergonomia-relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### `ia conhecimento delete`

Source: `20260911002344_d6f6f784-5111-40a8-ab58-c76d71d9a9b7.sql`

```sql
CREATE POLICY "ia conhecimento delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ia-conhecimento');
```

### `ia conhecimento insert`

Source: `20260911002344_d6f6f784-5111-40a8-ab58-c76d71d9a9b7.sql`

```sql
CREATE POLICY "ia conhecimento insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ia-conhecimento');
```

### `ia conhecimento read`

Source: `20260911002344_d6f6f784-5111-40a8-ab58-c76d71d9a9b7.sql`

```sql
CREATE POLICY "ia conhecimento read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ia-conhecimento');
```

### `ia conhecimento update`

Source: `20260911002344_d6f6f784-5111-40a8-ab58-c76d71d9a9b7.sql`

```sql
CREATE POLICY "ia conhecimento update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ia-conhecimento');
```


## 7. CREATE INDEX

### `ia_conhecimento_arquivos_pasta_idx`

Source: `20260911002319_a5e92a58-5d0f-40b2-a764-4ab2673cb8cb.sql`

```sql
CREATE INDEX ia_conhecimento_arquivos_pasta_idx ON public.ia_conhecimento_arquivos(pasta_id);
```

### `idx_aep_documentos_documento`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_aep_documentos_documento ON public.aep_documentos (documento_id);
```

### `idx_aet_contrato`

Source: `20260622112235_99405486-e476-4fbd-9e10-1e1eed95ac2e.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_aet_contrato ON public.aet_documentos(contrato_id);
```

### `idx_aet_documentos_documento`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_aet_documentos_documento ON public.aet_documentos (documento_id);
```

### `idx_aet_documentos_empresa`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE INDEX idx_aet_documentos_empresa ON public.aet_documentos(empresa_id);
```

### `idx_audit_log_record_time`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_audit_log_record_time ON public.audit_log (table_name, record_id, changed_at DESC);
```

### `idx_contratos_empresa`

Source: `20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_contratos_empresa ON public.contratos(empresa_id);
```

### `idx_contratos_empresa_created`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_contratos_empresa_created ON public.contratos (empresa_id, created_at DESC);
```

### `idx_documentos_contrato`

Source: `20260622112235_99405486-e476-4fbd-9e10-1e1eed95ac2e.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_documentos_contrato ON public.documentos(contrato_id);
```

### `idx_documentos_empresa`

Source: `20260503023127_63042a4e-9695-4caf-9bdb-ad922a3af54f.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_documentos_empresa ON public.documentos(empresa_id);
```

### `idx_documentos_empresa_contrato_tipo`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_documentos_empresa_contrato_tipo ON public.documentos (empresa_id, contrato_id, tipo);
```

### `idx_documentos_updated_desc`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_documentos_updated_desc ON public.documentos (updated_at DESC);
```

### `idx_empresa_contatos_empresa_id`

Source: `20260416124113_0851160b-2f17-4a0e-9222-53d89d9c2269.sql`

```sql
CREATE INDEX idx_empresa_contatos_empresa_id ON public.empresa_contatos(empresa_id);
```

### `idx_eq_ho_reg_equipamento_id`

Source: `20260503004952_72412598-de9a-4daf-81de-4c3fc7d90584.sql`

```sql
CREATE INDEX idx_eq_ho_reg_equipamento_id ON public.equipamentos_ho_registros(equipamento_id);
```

### `idx_ergonomia_aet`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE INDEX idx_ergonomia_aet ON public.ergonomia_avaliacoes(aet_documento_id);
```

### `idx_ergonomia_user_setor`

Source: `20260724163602_ccc65eb4-79c6-408c-9457-e071c3fc48e0.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ergonomia_user_setor
  ON public.ergonomia_avaliacoes (user_id, setor_nome, funcao);
```

### `idx_ficha_tecnica_agente`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE INDEX idx_ficha_tecnica_agente ON public.ficha_tecnica_resultados(agente_id);
```

### `idx_ficha_tecnica_empresa_contrato`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE INDEX idx_ficha_tecnica_empresa_contrato ON public.ficha_tecnica_resultados(empresa_id, contrato_id, created_at DESC);
```

### `idx_ficha_tecnica_setor_funcao`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE INDEX idx_ficha_tecnica_setor_funcao ON public.ficha_tecnica_resultados(setor_id, funcao_id);
```

### `idx_funcoes_setor_nome`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_funcoes_setor_nome ON public.funcoes (setor_id, nome_funcao);
```

### `idx_ltcat_av_calor_av`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ltcat_av_calor_av ON public.ltcat_av_calor(avaliacao_id);
```

### `idx_ltcat_av_comp_av`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ltcat_av_comp_av ON public.ltcat_av_componentes(avaliacao_id);
```

### `idx_ltcat_av_eq_av`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ltcat_av_eq_av ON public.ltcat_av_equipamentos(avaliacao_id);
```

### `idx_ltcat_av_res_av`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ltcat_av_res_av ON public.ltcat_av_resultados(avaliacao_id);
```

### `idx_ltcat_av_vib_av`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ltcat_av_vib_av ON public.ltcat_av_vibracao(avaliacao_id);
```

### `idx_ltcat_avaliacoes_documento`

Source: `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_documento ON public.ltcat_avaliacoes(documento_id);
```

### `idx_ltcat_avaliacoes_documento_agente`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_documento_agente ON public.ltcat_avaliacoes (documento_id, agente_id);
```

### `idx_ltcat_avaliacoes_setor_funcao`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_setor_funcao ON public.ltcat_avaliacoes (setor_id, funcao_id);
```

### `idx_ltcat_avaliacoes_tipo_doc`

Source: `20260419195402_4e62dc9f-75f4-42f9-8e77-f87023df0e0f.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ltcat_avaliacoes_tipo_doc ON public.ltcat_avaliacoes(tipo_documento, empresa_id);
```

### `idx_ltcat_contrato`

Source: `20260622112235_99405486-e476-4fbd-9e10-1e1eed95ac2e.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ltcat_contrato ON public.ltcat_avaliacoes(contrato_id);
```

### `idx_ltcat_pareceres_tipo_doc`

Source: `20260419195402_4e62dc9f-75f4-42f9-8e77-f87023df0e0f.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_ltcat_pareceres_tipo_doc ON public.ltcat_pareceres(tipo_documento, empresa_id);
```

### `idx_pareceres_doc_sit`

Source: `20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_pareceres_doc_sit ON public.pareceres_tecnicos (documento, situacao);
```

### `idx_pareceres_risco`

Source: `20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_pareceres_risco ON public.pareceres_tecnicos (risco_id);
```

### `idx_pcmso_contrato`

Source: `20260622112235_99405486-e476-4fbd-9e10-1e1eed95ac2e.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_pcmso_contrato ON public.pcmso_documentos(contrato_id);
```

### `idx_pcmso_documentos_empresa_contrato`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_pcmso_documentos_empresa_contrato ON public.pcmso_documentos (empresa_id, contrato_id);
```

### `idx_psico_avaliacoes_empresa_contrato`

Source: `20260830135307_b98b5290-ba6d-41f8-bbba-61522c55b286.sql`

```sql
CREATE INDEX idx_psico_avaliacoes_empresa_contrato ON public.psico_avaliacoes(empresa_id, contrato_id);
```

### `idx_psico_respostas_avaliacao`

Source: `20260830135307_b98b5290-ba6d-41f8-bbba-61522c55b286.sql`

```sql
CREATE INDEX idx_psico_respostas_avaliacao ON public.psico_respostas(avaliacao_id);
```

### `idx_psico_respostas_empresa`

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
CREATE INDEX idx_psico_respostas_empresa ON public.psico_respostas(empresa_id);
```

### `idx_psico_respostas_empresa_contrato`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_psico_respostas_empresa_contrato ON public.psico_respostas (empresa_id, contrato_id);
```

### `idx_psico_respostas_funcao`

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
CREATE INDEX idx_psico_respostas_funcao ON public.psico_respostas(funcao_id);
```

### `idx_psico_respostas_link`

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
CREATE INDEX idx_psico_respostas_link ON public.psico_respostas(link_id);
```

### `idx_setores_contrato`

Source: `20260622112235_99405486-e476-4fbd-9e10-1e1eed95ac2e.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_setores_contrato ON public.setores(contrato_id);
```

### `idx_setores_contrato_nome`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_setores_contrato_nome ON public.setores (contrato_id, nome_setor);
```

### `idx_setores_empresa_contrato`

Source: `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_setores_empresa_contrato ON public.setores (empresa_id, contrato_id);
```

### `uq_ltcat_avaliacao_ficha_documento`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE UNIQUE INDEX uq_ltcat_avaliacao_ficha_documento
ON public.ltcat_avaliacoes(documento_id, ficha_tecnica_resultado_id)
WHERE ficha_tecnica_resultado_id IS NOT NULL;
```


## 8. CREATE TRIGGER

### `ergonomia_avaliacoes_updated`

Source: `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`

```sql
CREATE TRIGGER ergonomia_avaliacoes_updated
BEFORE UPDATE ON public.ergonomia_avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `on_auth_user_created`

Source: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### `preserve_ficha_tecnica_origin_on_update`

Source: `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql`

```sql
CREATE TRIGGER preserve_ficha_tecnica_origin_on_update
BEFORE UPDATE ON public.ltcat_avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.preserve_ficha_tecnica_origin();
```

### `psico_indicadores_updated_at`

Source: `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`

```sql
CREATE TRIGGER psico_indicadores_updated_at BEFORE UPDATE ON public.psico_indicadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `psico_relatorios_updated_at`

Source: `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`

```sql
CREATE TRIGGER psico_relatorios_updated_at BEFORE UPDATE ON public.psico_relatorios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `responsaveis_updated_at`

Source: `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`

```sql
CREATE TRIGGER responsaveis_updated_at BEFORE UPDATE ON public.responsaveis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `set_treinamentos_cadastro_updated_at`

Source: `20260603184253_fbfcd9fd-33c8-40e9-a62f-c0a12ccb6faa.sql`

```sql
CREATE TRIGGER set_treinamentos_cadastro_updated_at
BEFORE UPDATE ON public.treinamentos_cadastro
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `trg_aet_instrucoes_updated`

Source: `20260722141704_e8e1a4fc-9d16-4028-8311-1ef18c47cef7.sql`

```sql
CREATE TRIGGER trg_aet_instrucoes_updated
  BEFORE UPDATE ON public.aet_instrucoes_usuario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `trg_documento_validade`

Source: `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`

```sql
CREATE TRIGGER trg_documento_validade
  BEFORE INSERT OR UPDATE OF data_elaboracao ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.set_documento_validade();
```

### `trg_esocial_exames_updated`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE TRIGGER trg_esocial_exames_updated BEFORE UPDATE ON public.esocial_exames FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `trg_exames_catalogo_updated`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE TRIGGER trg_exames_catalogo_updated BEFORE UPDATE ON public.exames_catalogo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `trg_link_ergonomia_to_aet`

Source: `20260724163602_ccc65eb4-79c6-408c-9457-e071c3fc48e0.sql`

```sql
CREATE TRIGGER trg_link_ergonomia_to_aet
AFTER INSERT ON public.aet_documentos
FOR EACH ROW
EXECUTE FUNCTION public.link_ergonomia_to_aet();
```

### `trg_pcmso_documentos_updated`

Source: `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`

```sql
CREATE TRIGGER trg_pcmso_documentos_updated BEFORE UPDATE ON public.pcmso_documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `trg_psico_avaliacoes_updated`

Source: `20260830135307_b98b5290-ba6d-41f8-bbba-61522c55b286.sql`

```sql
CREATE TRIGGER trg_psico_avaliacoes_updated
BEFORE UPDATE ON public.psico_avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `trg_psico_links_updated`

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
CREATE TRIGGER trg_psico_links_updated BEFORE UPDATE ON public.psico_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `trg_track_ficha_tecnica_change`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE TRIGGER trg_track_ficha_tecnica_change
BEFORE INSERT OR UPDATE OR DELETE ON public.ficha_tecnica_resultados
FOR EACH ROW EXECUTE FUNCTION public.track_shared_change();
```

### `update_aep_documentos_updated_at`

Source: `20260902233443_cb9cb308-c832-4e5e-9796-9769f8a0bd04.sql`

```sql
CREATE TRIGGER update_aep_documentos_updated_at
BEFORE UPDATE ON public.aep_documentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_aet_documentos_updated_at`

Source: `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`

```sql
CREATE TRIGGER update_aet_documentos_updated_at
  BEFORE UPDATE ON public.aet_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_contratos_updated_at`

Source: `20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql`

```sql
CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_documentos_updated_at`

Source: `20260416020509_eb5c08ed-e8a7-460d-ad56-951c63ee1a73.sql`

```sql
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_empresas_updated_at`

Source: `20260414123527_daa5e69e-3f30-482c-a7af-81a0884ca209.sql`

```sql
CREATE TRIGGER update_empresas_updated_at
BEFORE UPDATE ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_epi_epc_updated_at`

Source: `20260414220000_epi_epc.sql`

```sql
CREATE TRIGGER update_epi_epc_updated_at
  BEFORE UPDATE ON public.epi_epc
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_exames_cadastro_updated_at`

Source: `20260604190948_70d23a89-530b-418a-aa5c-e05b5f63f30a.sql`

```sql
CREATE TRIGGER update_exames_cadastro_updated_at BEFORE UPDATE ON public.exames_cadastro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_ficha_tecnica_resultados_updated_at`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE TRIGGER update_ficha_tecnica_resultados_updated_at
BEFORE UPDATE ON public.ficha_tecnica_resultados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_funcoes_updated_at`

Source: `20260414124902_ec242838-f150-4953-bfcf-57f4dbc38037.sql`

```sql
CREATE TRIGGER update_funcoes_updated_at
  BEFORE UPDATE ON public.funcoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_pareceres_tecnicos_updated_at`

Source: `20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql`

```sql
CREATE TRIGGER update_pareceres_tecnicos_updated_at
BEFORE UPDATE ON public.pareceres_tecnicos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_pcmso_documentos_updated_at`

Source: `20260529162855_f03978d1-3a35-46e0-b51e-f7a52891270b.sql`

```sql
CREATE TRIGGER update_pcmso_documentos_updated_at
BEFORE UPDATE ON public.pcmso_documentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_profiles_updated_at`

Source: `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`

```sql
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_riscos_updated_at`

Source: `20260414140230_290124e7-a280-45df-80bb-1dcdf4ce4fd0.sql`

```sql
CREATE TRIGGER update_riscos_updated_at
  BEFORE UPDATE ON public.riscos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### `update_setores_updated_at`

Source: `20260414124902_ec242838-f150-4953-bfcf-57f4dbc38037.sql`

```sql
CREATE TRIGGER update_setores_updated_at
  BEFORE UPDATE ON public.setores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### `validate_ficha_tecnica_resultado`

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
CREATE TRIGGER validate_ficha_tecnica_resultado
BEFORE INSERT OR UPDATE ON public.ficha_tecnica_resultados
FOR EACH ROW EXECUTE FUNCTION public.validate_ficha_tecnica_resultado();
```


## 9. CREATE SCHEMA

### `private`

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
CREATE SCHEMA IF NOT EXISTS private;
```


## 10. GRANT / REVOKE

### On functions (49)

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, authenticated;
```

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`

```sql
GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, authenticated;
```

Source: `20260910225228_0ee73e35-6255-4e7c-a4aa-31eb70387a76.sql`

```sql
REVOKE ALL ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) FROM PUBLIC;
```

Source: `20260910225228_0ee73e35-6255-4e7c-a4aa-31eb70387a76.sql`

```sql
GRANT EXECUTE ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) TO authenticated;
```

Source: `20260910225228_0ee73e35-6255-4e7c-a4aa-31eb70387a76.sql`

```sql
GRANT EXECUTE ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) TO service_role;
```

Source: `20260913012234_dc525c6d-cd02-48f0-b32a-de5a7472eadb.sql`

```sql
REVOKE ALL ON FUNCTION public.track_shared_change() FROM PUBLIC;
```

Source: `20260913012234_dc525c6d-cd02-48f0-b32a-de5a7472eadb.sql`

```sql
REVOKE ALL ON FUNCTION public.track_shared_change() FROM anon;
```

Source: `20260913012234_dc525c6d-cd02-48f0-b32a-de5a7472eadb.sql`

```sql
REVOKE ALL ON FUNCTION public.track_shared_change() FROM authenticated;
```

Source: `20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql`

```sql
REVOKE ALL ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) FROM PUBLIC;
```

Source: `20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql`

```sql
REVOKE ALL ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) FROM anon;
```

Source: `20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql`

```sql
GRANT EXECUTE ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) TO authenticated;
```

Source: `20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql`

```sql
GRANT EXECUTE ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) TO service_role;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql`

```sql
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql`

```sql
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql`

```sql
REVOKE EXECUTE ON FUNCTION public.link_ergonomia_to_aet() FROM PUBLIC, anon, authenticated;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql`

```sql
GRANT EXECUTE ON FUNCTION public.link_ergonomia_to_aet() TO service_role;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql`

```sql
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql`

```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql`

```sql
REVOKE EXECUTE ON FUNCTION public.psico_get_public_link(text) FROM PUBLIC, authenticated;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql`

```sql
GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, service_role;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql`

```sql
REVOKE EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) FROM PUBLIC, authenticated;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql`

```sql
GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, service_role;
```

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM PUBLIC;
```

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM anon;
```

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO authenticated;
```

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

```sql
GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
REVOKE ALL ON FUNCTION private.psico_get_public_link(text) FROM PUBLIC;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
GRANT EXECUTE ON FUNCTION private.psico_get_public_link(text) TO anon, authenticated, service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
REVOKE ALL ON FUNCTION private.psico_submit_resposta(text, jsonb) FROM PUBLIC;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
GRANT EXECUTE ON FUNCTION private.psico_submit_resposta(text, jsonb) TO anon, authenticated, service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, authenticated, service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql`

```sql
GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, authenticated, service_role;
```

Source: `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql`

```sql
REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM PUBLIC;
```

Source: `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql`

```sql
REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM anon;
```

Source: `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql`

```sql
REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM authenticated;
```

Source: `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql`

```sql
GRANT EXECUTE ON FUNCTION public.preserve_ficha_tecnica_origin() TO service_role;
```

Source: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql`

```sql
REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM PUBLIC;
```

Source: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql`

```sql
REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM anon;
```

Source: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql`

```sql
GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO authenticated;
```

Source: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql`

```sql
GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO service_role;
```

Source: `20260919132348_43027d3e-0829-4e46-bbfc-cab1e302928a.sql`

```sql
REVOKE ALL ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) FROM PUBLIC;
```

Source: `20260919132348_43027d3e-0829-4e46-bbfc-cab1e302928a.sql`

```sql
GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) TO authenticated;
```

Source: `20260919132348_43027d3e-0829-4e46-bbfc-cab1e302928a.sql`

```sql
GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) TO service_role;
```

Source: `20260919140817_9532b266-5c7d-41e1-943f-61ab71876a15.sql`

```sql
REVOKE ALL ON FUNCTION public.save_ltcat_documento_v2(uuid,uuid,text,bigint,jsonb,jsonb,uuid[],jsonb) FROM PUBLIC;
```

Source: `20260919140817_9532b266-5c7d-41e1-943f-61ab71876a15.sql`

```sql
GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid,uuid,text,bigint,jsonb,jsonb,uuid[],jsonb) TO authenticated;
```

Source: `20260919140817_9532b266-5c7d-41e1-943f-61ab71876a15.sql`

```sql
GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid,uuid,text,bigint,jsonb,jsonb,uuid[],jsonb) TO service_role;
```

### All GRANT/REVOKE (51)

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, authenticated;
```

Source: `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, authenticated;
```

Source: `20260910225228_0ee73e35-6255-4e7c-a4aa-31eb70387a76.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) FROM PUBLIC;
```

Source: `20260910225228_0ee73e35-6255-4e7c-a4aa-31eb70387a76.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) TO authenticated;
```

Source: `20260910225228_0ee73e35-6255-4e7c-a4aa-31eb70387a76.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.sync_ltcat_avaliacoes(uuid, uuid, text, jsonb) TO service_role;
```

Source: `20260913012234_dc525c6d-cd02-48f0-b32a-de5a7472eadb.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.track_shared_change() FROM PUBLIC;
```

Source: `20260913012234_dc525c6d-cd02-48f0-b32a-de5a7472eadb.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.track_shared_change() FROM anon;
```

Source: `20260913012234_dc525c6d-cd02-48f0-b32a-de5a7472eadb.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.track_shared_change() FROM authenticated;
```

Source: `20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) FROM PUBLIC;
```

Source: `20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) FROM anon;
```

Source: `20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) TO authenticated;
```

Source: `20260913012324_13263955-7480-4c07-8fd3-7644a807e196.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.update_shared_record(text, uuid, bigint, jsonb) TO service_role;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql` (REVOKE)

```sql
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql` (REVOKE)

```sql
REVOKE EXECUTE ON FUNCTION public.link_ergonomia_to_aet() FROM PUBLIC, anon, authenticated;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.link_ergonomia_to_aet() TO service_role;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql` (REVOKE)

```sql
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql` (REVOKE)

```sql
REVOKE EXECUTE ON FUNCTION public.psico_get_public_link(text) FROM PUBLIC, authenticated;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, service_role;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql` (REVOKE)

```sql
REVOKE EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) FROM PUBLIC, authenticated;
```

Source: `20260913021326_9614e46b-5f71-4415-9a0d-c768cfc5523d.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, service_role;
```

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM PUBLIC;
```

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM anon;
```

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO authenticated;
```

Source: `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql` (REVOKE)

```sql
REVOKE ALL ON SCHEMA private FROM PUBLIC;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql` (GRANT)

```sql
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION private.psico_get_public_link(text) FROM PUBLIC;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION private.psico_get_public_link(text) TO anon, authenticated, service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION private.psico_submit_resposta(text, jsonb) FROM PUBLIC;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION private.psico_submit_resposta(text, jsonb) TO anon, authenticated, service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.psico_get_public_link(text) TO anon, authenticated, service_role;
```

Source: `20260913130953_8fce4c69-e450-442a-a0d7-cc8339148493.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.psico_submit_resposta(text, jsonb) TO anon, authenticated, service_role;
```

Source: `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM PUBLIC;
```

Source: `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM anon;
```

Source: `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.preserve_ficha_tecnica_origin() FROM authenticated;
```

Source: `20260913131707_1a584728-4c25-4f83-aabe-cba8e56107b8.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.preserve_ficha_tecnica_origin() TO service_role;
```

Source: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM PUBLIC;
```

Source: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) FROM anon;
```

Source: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO authenticated;
```

Source: `20260913140741_c740efe5-3880-473e-8254-b6b486e57f99.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.import_ficha_tecnica_resultados(uuid, uuid, uuid, text) TO service_role;
```

Source: `20260919132348_43027d3e-0829-4e46-bbfc-cab1e302928a.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) FROM PUBLIC;
```

Source: `20260919132348_43027d3e-0829-4e46-bbfc-cab1e302928a.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) TO authenticated;
```

Source: `20260919132348_43027d3e-0829-4e46-bbfc-cab1e302928a.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid, uuid, text, bigint, jsonb, jsonb, uuid[], jsonb) TO service_role;
```

Source: `20260919140817_9532b266-5c7d-41e1-943f-61ab71876a15.sql` (REVOKE)

```sql
REVOKE ALL ON FUNCTION public.save_ltcat_documento_v2(uuid,uuid,text,bigint,jsonb,jsonb,uuid[],jsonb) FROM PUBLIC;
```

Source: `20260919140817_9532b266-5c7d-41e1-943f-61ab71876a15.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid,uuid,text,bigint,jsonb,jsonb,uuid[],jsonb) TO authenticated;
```

Source: `20260919140817_9532b266-5c7d-41e1-943f-61ab71876a15.sql` (GRANT)

```sql
GRANT EXECUTE ON FUNCTION public.save_ltcat_documento_v2(uuid,uuid,text,bigint,jsonb,jsonb,uuid[],jsonb) TO service_role;
```


## Appendix A. ENABLE ROW LEVEL SECURITY

- `public.templates` — `20260414113025_6e46e2b2-7c60-4e96-b93f-aacbfc561312.sql`
- `public.empresas` — `20260414123527_daa5e69e-3f30-482c-a7af-81a0884ca209.sql`
- `public.setores` — `20260414124902_ec242838-f150-4953-bfcf-57f4dbc38037.sql`
- `public.funcoes` — `20260414124902_ec242838-f150-4953-bfcf-57f4dbc38037.sql`
- `public.riscos` — `20260414140230_290124e7-a280-45df-80bb-1dcdf4ce4fd0.sql`
- `public.epi_epc` — `20260414220000_epi_epc.sql`
- `public.epi_epc_riscos` — `20260414220000_epi_epc.sql`
- `public.ltcat_pareceres` — `20260414230000_ltcat_pareceres.sql`
- `public.equipamentos_ho` — `20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql`
- `public.tecnicas_amostragem` — `20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql`
- `public.unidades` — `20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql`
- `public.ltcat_avaliacoes` — `20260415182926_afc689ef-f664-4e4b-87c7-b6a7d84ecff2.sql`
- `public.equipamentos_avaliacao` — `20260416001838_5f958ab2-3122-4fed-9189-8fe16b4428b4.sql`
- `public.documentos` — `20260416020509_eb5c08ed-e8a7-460d-ad56-951c63ee1a73.sql`
- `public.empresa_contatos` — `20260416124113_0851160b-2f17-4a0e-9222-53d89d9c2269.sql`
- `public.ltcat_av_componentes` — `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`
- `public.ltcat_av_calor` — `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`
- `public.ltcat_av_vibracao` — `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`
- `public.ltcat_av_resultados` — `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`
- `public.ltcat_av_equipamentos` — `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`
- `public.ltcat_av_epi_epc` — `20260417205149_0a16aa4d-139f-4725-9b9b-beaeda5f935c.sql`
- `public.profiles` — `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`
- `public.user_roles` — `20260418021217_6f7ee8c0-9b82-42b4-b150-1fa09d78f0dd.sql`
- `public.aet_documentos` — `20260422001309_796447c2-cc15-42f7-b742-0a9d00b7b25b.sql`
- `public.equipamentos_ho_registros` — `20260503004952_72412598-de9a-4daf-81de-4c3fc7d90584.sql`
- `public.contratos` — `20260503023011_6b008655-fe0a-4959-bbaa-37d029c84a8d.sql`
- `public.pareceres_tecnicos` — `20260503160019_f0ba1009-b4fa-4ef8-8137-d77ced277461.sql`
- `public.notificacoes` — `20260524182005_60efb92a-ba6d-42e3-b58d-2d5b9479601d.sql`
- `public.exames_catalogo` — `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`
- `public.esocial_exames` — `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`
- `public.pcmso_observacoes_padrao` — `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`
- `public.pcmso_documentos` — `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`
- `public.pcmso_setor_exames` — `20260529000421_05c4b15a-b64a-4273-8bae-b7947a308112.sql`
- `public.pcmso_documentos` — `20260529162855_f03978d1-3a35-46e0-b51e-f7a52891270b.sql`
- `public.treinamentos_cadastro` — `20260603184253_fbfcd9fd-33c8-40e9-a62f-c0a12ccb6faa.sql`
- `public.exames_cadastro` — `20260604190948_70d23a89-530b-418a-aa5c-e05b5f63f30a.sql`
- `public.psico_links` — `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`
- `public.psico_respostas` — `20260625192756_679bb9df-6d6e-4a94-bf6d-c762c2d47661.sql`
- `public.aet_instrucoes_usuario` — `20260722141704_e8e1a4fc-9d16-4028-8311-1ef18c47cef7.sql`
- `public.ergonomia_avaliacoes` — `20260722183408_b1ba9b1f-2a63-4638-ad59-bbd929ca4f75.sql`
- `public.psico_avaliacoes` — `20260830135307_b98b5290-ba6d-41f8-bbba-61522c55b286.sql`
- `public.responsaveis` — `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`
- `public.psico_indicadores` — `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`
- `public.psico_relatorios` — `20260830151752_e9baea47-f864-4281-a87c-75411e3ddbaf.sql`
- `public.psico_base_tecnica` — `20260830182719_ad96df8f-1fec-428a-b3e0-6ce301a8be93.sql`
- `public.aep_documentos` — `20260902233443_cb9cb308-c832-4e5e-9796-9769f8a0bd04.sql`
- `public.ia_conhecimento_pastas` — `20260911002319_a5e92a58-5d0f-40b2-a764-4ab2673cb8cb.sql`
- `public.ia_conhecimento_arquivos` — `20260911002319_a5e92a58-5d0f-40b2-a764-4ab2673cb8cb.sql`
- `public.audit_log` — `20260913012214_9e81c66f-4752-41f5-adfa-94dd864f9a52.sql`
- `public.ficha_tecnica_resultados` — `20260913130856_b5e08e80-ec89-4370-95d2-5c7ed0f2fb1b.sql`

