# Supabase public schema inventory

Generated from `src/integrations/supabase/types.ts` (Database.public).

> Type mapping notes: TS `string` for uuid-like/`*_id`/`*_by` → `uuid`; `*_at` → `timestamptz`; date-named without `_at` → likely `date` (ambiguous); `number` → integer/numeric by name hints; `Json` → `jsonb`; `string[]` → `text[]`; Database Enums → enum type.
> Insert optional (`?`) typically means DB default or nullable-with-default; `[required in Insert: no]` = optional in Insert type.

## Summary

- **Tables:** 47
- **Functions (RPC):** 7
- **Enums:** 1

### Table names

- aep_documentos
- aet_documentos
- aet_instrucoes_usuario
- audit_log
- contratos
- documentos
- empresa_contatos
- empresas
- epi_epc
- epi_epc_riscos
- equipamentos_avaliacao
- equipamentos_ho
- equipamentos_ho_registros
- ergonomia_avaliacoes
- exames_cadastro
- ficha_tecnica_resultados
- formularios_aep
- funcoes
- ia_conhecimento_arquivos
- ia_conhecimento_pastas
- ltcat_av_calor
- ltcat_av_componentes
- ltcat_av_epi_epc
- ltcat_av_equipamentos
- ltcat_av_resultados
- ltcat_av_vibracao
- ltcat_avaliacoes
- ltcat_pareceres
- notificacoes
- pareceres_tecnicos
- pcmso_documentos
- pcmso_observacoes_padrao
- profiles
- psico_avaliacoes
- psico_base_tecnica
- psico_indicadores
- psico_links
- psico_relatorios
- psico_respostas
- responsaveis
- riscos
- setores
- tecnicas_amostragem
- templates
- treinamentos_cadastro
- unidades
- user_roles

---

# Tables

## aep_documentos
- alteracoes_documento: text | null [required in Insert: no]
  - TS: `string | null`
- cargo: text | null [required in Insert: no]
  - TS: `string | null`
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- crea: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- current_step: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- data_elaboracao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- documento_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- empresa_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- last_modified_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- responsavel_tecnico: text | null [required in Insert: no]
  - TS: `string | null`
- revisoes: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- row_version: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- setores: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- status: text NOT NULL [required in Insert: no]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs:
- contrato_id -> contratos.id (`aep_documentos_contrato_id_fkey`)
- documento_id -> documentos.id (`aep_documentos_documento_id_fkey`)
- empresa_id -> empresas.id (`aep_documentos_empresa_id_fkey`)

## aet_documentos
- alteracoes_documento: text | null [required in Insert: no]
  - TS: `string | null`
- cargo: text | null [required in Insert: no]
  - TS: `string | null`
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- crea: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- current_step: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- data_elaboracao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- documento_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- empresa_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- last_modified_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- responsavel_tecnico: text | null [required in Insert: no]
  - TS: `string | null`
- revisoes: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- row_version: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- setores: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- status: text NOT NULL [required in Insert: no]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs:
- contrato_id -> contratos.id (`aet_documentos_contrato_id_fkey`)
- documento_id -> documentos.id (`aet_documentos_documento_id_fkey`)
- empresa_id -> empresas.id (`aet_documentos_empresa_id_fkey`)

## aet_instrucoes_usuario
- ia_ativada: boolean NOT NULL [required in Insert: no]
  - TS: `boolean`
- instrucoes: text NOT NULL [required in Insert: no]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- user_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
FKs: (none)

## audit_log
- action: text NOT NULL [required in Insert: yes]
  - TS: `string`
- changed_at: timestamptz NOT NULL [required in Insert: no]
  - TS: `string`
- changed_by: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- new_data: jsonb | null [required in Insert: no]
  - TS: `Json | null`
- old_data: jsonb | null [required in Insert: no]
  - TS: `Json | null`
- record_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- table_name: text NOT NULL [required in Insert: yes]
  - TS: `string`
FKs: (none)

## contratos
- cnpj_contratante: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- empresa_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- escopo_contrato: text | null [required in Insert: no]
  - TS: `string | null`
- fiscal_email: text | null [required in Insert: no]
  - TS: `string | null`
- fiscal_nome: text | null [required in Insert: no]
  - TS: `string | null`
- fiscal_telefone: text | null [required in Insert: no]
  - TS: `string | null`
- gestor_email: text | null [required in Insert: no]
  - TS: `string | null`
- gestor_nome: text | null [required in Insert: no]
  - TS: `string | null`
- gestor_telefone: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- jornada_trabalho: text | null [required in Insert: no]
  - TS: `string | null`
- last_modified_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- local_trabalho: text | null [required in Insert: no]
  - TS: `string | null`
- nome_contratante: text | null [required in Insert: no]
  - TS: `string | null`
- numero_contrato: text | null [required in Insert: no]
  - TS: `string | null`
- numero_funcionarios_fem: integer (likely) | null [required in Insert: no]
  - TS: `number | null`
- numero_funcionarios_masc: integer (likely) | null [required in Insert: no]
  - TS: `number | null`
- preposto_email: text | null [required in Insert: no]
  - TS: `string | null`
- preposto_nome: text | null [required in Insert: no]
  - TS: `string | null`
- preposto_telefone: text | null [required in Insert: no]
  - TS: `string | null`
- row_version: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- total_funcionarios: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- vigencia_fim: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- vigencia_inicio: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
FKs:
- empresa_id -> empresas.id (`contratos_empresa_id_fkey`)

## documentos
- alteracoes_documento: text | null [required in Insert: no]
  - TS: `string | null`
- cargo: text | null [required in Insert: no]
  - TS: `string | null`
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- crea: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- current_step: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- data_elaboracao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- data_validade: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- draft_snapshot: jsonb | null [required in Insert: no]
  - TS: `Json | null`
- empresa_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- empresa_nome: text NOT NULL [required in Insert: no]
  - TS: `string`
- file_path: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- last_modified_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- nome_documento: text | null [required in Insert: no]
  - TS: `string | null`
- responsavel_tecnico: text | null [required in Insert: no]
  - TS: `string | null`
- revisoes: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- row_version: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- status: text NOT NULL [required in Insert: no]
  - TS: `string`
- template_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- tipo: text NOT NULL [required in Insert: yes]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- upload_file_path: text | null [required in Insert: no]
  - TS: `string | null`
FKs:
- contrato_id -> contratos.id (`documentos_contrato_id_fkey`)
- empresa_id -> empresas.id (`documentos_empresa_id_fkey`)
- template_id -> templates.id (`documentos_template_id_fkey`)

## empresa_contatos
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- email: text | null [required in Insert: no]
  - TS: `string | null`
- empresa_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- nome: text NOT NULL [required in Insert: no]
  - TS: `string`
- telefone: text | null [required in Insert: no]
  - TS: `string | null`
- tipo: text NOT NULL [required in Insert: yes]
  - TS: `string`
FKs:
- empresa_id -> empresas.id (`empresa_contatos_empresa_id_fkey`)

## empresas
- cnae_principal: text | null [required in Insert: no]
  - TS: `string | null`
- cnpj: text NOT NULL [required in Insert: yes]
  - TS: `string`
- cnpj_contratante: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- endereco: text | null [required in Insert: no]
  - TS: `string | null`
- escopo_contrato: text | null [required in Insert: no]
  - TS: `string | null`
- fiscal_email: text | null [required in Insert: no]
  - TS: `string | null`
- fiscal_nome: text | null [required in Insert: no]
  - TS: `string | null`
- fiscal_telefone: text | null [required in Insert: no]
  - TS: `string | null`
- gestor_email: text | null [required in Insert: no]
  - TS: `string | null`
- gestor_nome: text | null [required in Insert: no]
  - TS: `string | null`
- gestor_telefone: text | null [required in Insert: no]
  - TS: `string | null`
- grau_risco: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- jornada_trabalho: text | null [required in Insert: no]
  - TS: `string | null`
- last_modified_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- local_trabalho: text | null [required in Insert: no]
  - TS: `string | null`
- nome_contratante: text | null [required in Insert: no]
  - TS: `string | null`
- nome_fantasia: text | null [required in Insert: no]
  - TS: `string | null`
- numero_contrato: text | null [required in Insert: no]
  - TS: `string | null`
- numero_funcionarios_fem: integer (likely) | null [required in Insert: no]
  - TS: `number | null`
- numero_funcionarios_masc: integer (likely) | null [required in Insert: no]
  - TS: `number | null`
- preposto_email: text | null [required in Insert: no]
  - TS: `string | null`
- preposto_nome: text | null [required in Insert: no]
  - TS: `string | null`
- preposto_telefone: text | null [required in Insert: no]
  - TS: `string | null`
- razao_social: text NOT NULL [required in Insert: yes]
  - TS: `string`
- row_version: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- total_funcionarios: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- vigencia_fim: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- vigencia_inicio: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
FKs: (none)

## epi_epc
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- nome: text NOT NULL [required in Insert: yes]
  - TS: `string`
- tipo: text NOT NULL [required in Insert: yes]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs: (none)

## epi_epc_riscos
- epi_epc_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- risco_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
FKs:
- epi_epc_id -> epi_epc.id (`epi_epc_riscos_epi_epc_id_fkey`)
- risco_id -> riscos.id (`epi_epc_riscos_risco_id_fkey`)

## equipamentos_avaliacao
- agente_nome: text | null [required in Insert: no]
  - TS: `string | null`
- avaliacao_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- data_avaliacao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- data_calibracao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- empresa_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- modelo_equipamento: text | null [required in Insert: no]
  - TS: `string | null`
- nome_equipamento: text | null [required in Insert: no]
  - TS: `string | null`
- serie_equipamento: text | null [required in Insert: no]
  - TS: `string | null`
- setor_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- tipo_documento: text NOT NULL [required in Insert: no]
  - TS: `string`
FKs:
- avaliacao_id -> ltcat_avaliacoes.id (`equipamentos_avaliacao_avaliacao_id_fkey`)

## equipamentos_ho
- certificado: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz | null (likely default now()) [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- marca: text | null [required in Insert: no]
  - TS: `string | null`
- nome: text NOT NULL [required in Insert: yes]
  - TS: `string`
- tipo: text | null [required in Insert: no]
  - TS: `string | null`
FKs: (none)

## equipamentos_ho_registros
- certificado_nome: text | null [required in Insert: no]
  - TS: `string | null`
- certificado_path: text | null [required in Insert: no]
  - TS: `string | null`
- certificado_updated_at: timestamptz | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- data_calibracao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- equipamento_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- marca_modelo: text | null [required in Insert: no]
  - TS: `string | null`
- numero_serie: text NOT NULL [required in Insert: yes]
  - TS: `string`
- situacao_operacional: text NOT NULL [required in Insert: no]
  - TS: `string`
FKs:
- equipamento_id -> equipamentos_ho.id (`equipamentos_ho_registros_equipamento_id_fkey`)

## ergonomia_avaliacoes
- aet_documento_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- atividade: text | null [required in Insert: no]
  - TS: `string | null`
- classificacao: text | null [required in Insert: no]
  - TS: `string | null`
- colaborador_nome: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- data_avaliacao: date (likely — ambiguity: could be text/timestamptz) NOT NULL [date-only name without _at] [required in Insert: no]
  - TS: `string`
- empresa_nome: text | null [required in Insert: no]
  - TS: `string | null`
- escore_final: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- ferramenta: text NOT NULL [required in Insert: yes]
  - TS: `string`
- funcao: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- nivel_acao: text | null [required in Insert: no]
  - TS: `string | null`
- pdf_path: text | null [required in Insert: no]
  - TS: `string | null`
- recomendacoes: text | null [required in Insert: no]
  - TS: `string | null`
- respostas: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- setor_nome: text | null [required in Insert: no]
  - TS: `string | null`
- setor_ref: text | null [required in Insert: no]
  - TS: `string | null`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- user_id: uuid NOT NULL [required in Insert: no]
  - TS: `string`
FKs:
- aet_documento_id -> aet_documentos.id (`ergonomia_avaliacoes_aet_documento_id_fkey`)

## exames_cadastro
- codigo_esocial: text NOT NULL [required in Insert: yes]
  - TS: `string`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- descricao_esocial: text NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- nome: text NOT NULL [required in Insert: yes]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs: (none)

## ficha_tecnica_resultados
- agente_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- amostrador: text | null [required in Insert: no]
  - TS: `string | null`
- amostrador_serie: text | null [required in Insert: no]
  - TS: `string | null`
- aren: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- componentes: text | null [required in Insert: no]
  - TS: `string | null`
- concentracao: numeric (likely) | null [required in Insert: no]
  - TS: `number | null`
- contrato_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- created_by: uuid NOT NULL [required in Insert: no]
  - TS: `string`
- data_avaliacao: date (likely — ambiguity: could be text/timestamptz) NOT NULL [date-only name without _at] [required in Insert: no]
  - TS: `string`
- dose_q3: numeric (likely) | null [required in Insert: no]
  - TS: `number | null`
- dose_q5: numeric (likely) | null [required in Insert: no]
  - TS: `number | null`
- empresa_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- exposicao: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- funcao_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- last_modified_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- lavg: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- limite_tolerancia: integer (likely) NOT NULL [required in Insert: yes]
  - TS: `number`
- nen: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- row_version: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- setor_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- taxa_metabolica: text | null [required in Insert: no]
  - TS: `string | null`
- tipo: text NOT NULL [required in Insert: yes]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- vdvr: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
FKs:
- agente_id -> riscos.id (`ficha_tecnica_resultados_agente_id_fkey`)
- contrato_id -> contratos.id (`ficha_tecnica_resultados_contrato_id_fkey`)
- empresa_id -> empresas.id (`ficha_tecnica_resultados_empresa_id_fkey`)
- funcao_id -> funcoes.id (`ficha_tecnica_resultados_funcao_id_fkey`)
- setor_id -> setores.id (`ficha_tecnica_resultados_setor_id_fkey`)

## formularios_aep
- contrato_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- dados: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- empresa_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- pdf_path: text | null [required in Insert: no]
  - TS: `string | null`
- setor_ids: text[] NOT NULL [required in Insert: no]
  - TS: `string[]`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs:
- contrato_id -> contratos.id (`formularios_aep_contrato_id_fkey`)
- empresa_id -> empresas.id (`formularios_aep_empresa_id_fkey`)

## funcoes
- cbo_codigo: text | null [required in Insert: no]
  - TS: `string | null`
- cbo_descricao: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- descricao_atividades: text | null [required in Insert: no]
  - TS: `string | null`
- expostos: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- last_modified_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- nome_funcao: text NOT NULL [required in Insert: yes]
  - TS: `string`
- row_version: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- setor_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs:
- setor_id -> setores.id (`funcoes_setor_id_fkey`)

## ia_conhecimento_arquivos
- caminho: text NOT NULL [required in Insert: yes]
  - TS: `string`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- mime: text | null [required in Insert: no]
  - TS: `string | null`
- nome: text NOT NULL [required in Insert: yes]
  - TS: `string`
- pasta_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- tamanho: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
FKs:
- pasta_id -> ia_conhecimento_pastas.id (`ia_conhecimento_arquivos_pasta_id_fkey`)

## ia_conhecimento_pastas
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- nome: text NOT NULL [required in Insert: yes]
  - TS: `string`
- tipo: text NOT NULL [required in Insert: yes]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs: (none)

## ltcat_av_calor
- aposentadoria_especial: text | null [required in Insert: no]
  - TS: `string | null`
- avaliacao_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- cod_gfip: text | null [required in Insert: no]
  - TS: `string | null`
- colaborador: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- data_avaliacao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- descricao_atividade: text | null [required in Insert: no]
  - TS: `string | null`
- equipamento_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- funcao_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- ibutg_limite: numeric (likely) | null [required in Insert: no]
  - TS: `number | null`
- ibutg_medido: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- ibutg_tipo: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- local_atividade: text | null [required in Insert: no]
  - TS: `string | null`
- m_kcal_h: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- ordem: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- parecer_tecnico: text | null [required in Insert: no]
  - TS: `string | null`
- situacao: text | null [required in Insert: no]
  - TS: `string | null`
- taxa_metabolica: text | null [required in Insert: no]
  - TS: `string | null`
- tbn_valores: text | null [required in Insert: no]
  - TS: `string | null`
- tbs_valores: text | null [required in Insert: no]
  - TS: `string | null`
- tempo_exposicao: text | null [required in Insert: no]
  - TS: `string | null`
- tg_valores: text | null [required in Insert: no]
  - TS: `string | null`
- tipo_atividade: text | null [required in Insert: no]
  - TS: `string | null`
- tipo_documento: text NOT NULL [required in Insert: no]
  - TS: `string`
FKs:
- avaliacao_id -> ltcat_avaliacoes.id (`ltcat_av_calor_avaliacao_id_fkey`)

## ltcat_av_componentes
- amostrador: text | null [required in Insert: no]
  - TS: `string | null`
- aposentadoria_especial: text | null [required in Insert: no]
  - TS: `string | null`
- avaliacao_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- cas: text | null [required in Insert: no]
  - TS: `string | null`
- cod_gfip: text | null [required in Insert: no]
  - TS: `string | null`
- colaborador: text | null [required in Insert: no]
  - TS: `string | null`
- componente: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- data_avaliacao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- descricao_avaliacao: text | null [required in Insert: no]
  - TS: `string | null`
- dose_percentual: numeric (likely) | null [required in Insert: no]
  - TS: `number | null`
- funcao_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- limite_tolerancia: integer (likely) | null [required in Insert: no]
  - TS: `number | null`
- numero_serie_bomba: text | null [required in Insert: no]
  - TS: `string | null`
- ordem: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- parecer_tecnico: text | null [required in Insert: no]
  - TS: `string | null`
- resultado: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- situacao: text | null [required in Insert: no]
  - TS: `string | null`
- tempo_coleta: text | null [required in Insert: no]
  - TS: `string | null`
- tipo_documento: text NOT NULL [required in Insert: no]
  - TS: `string`
- unidade_limite_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- unidade_resultado_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- unidade_tempo_coleta: text | null [required in Insert: no]
  - TS: `string | null`
FKs:
- avaliacao_id -> ltcat_avaliacoes.id (`ltcat_av_componentes_avaliacao_id_fkey`)

## ltcat_av_epi_epc
- avaliacao_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- epc_eficaz: text | null [required in Insert: no]
  - TS: `string | null`
- epc_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- epi_atenuacao: text | null [required in Insert: no]
  - TS: `string | null`
- epi_ca: text | null [required in Insert: no]
  - TS: `string | null`
- epi_eficaz: text | null [required in Insert: no]
  - TS: `string | null`
- epi_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- tipo_documento: text NOT NULL [required in Insert: no]
  - TS: `string`
FKs:
- avaliacao_id -> ltcat_avaliacoes.id (`ltcat_av_epi_epc_avaliacao_id_fkey`, one-to-one)

## ltcat_av_equipamentos
- agente_nome: text | null [required in Insert: no]
  - TS: `string | null`
- avaliacao_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- data_avaliacao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- data_calibracao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- modelo_equipamento: text | null [required in Insert: no]
  - TS: `string | null`
- nome_equipamento: text | null [required in Insert: no]
  - TS: `string | null`
- ordem: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- serie_equipamento: text | null [required in Insert: no]
  - TS: `string | null`
- tipo_documento: text NOT NULL [required in Insert: no]
  - TS: `string`
FKs:
- avaliacao_id -> ltcat_avaliacoes.id (`ltcat_av_equipamentos_avaliacao_id_fkey`)

## ltcat_av_resultados
- aposentadoria_especial: text | null [required in Insert: no]
  - TS: `string | null`
- avaliacao_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- cod_gfip: text | null [required in Insert: no]
  - TS: `string | null`
- colaborador: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- data_avaliacao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- descricao_avaliacao: text | null [required in Insert: no]
  - TS: `string | null`
- dose_percentual: numeric (likely) | null [required in Insert: no]
  - TS: `number | null`
- equipamento_registro_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- funcao_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- limite_tolerancia: integer (likely) | null [required in Insert: no]
  - TS: `number | null`
- ordem: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- parecer_tecnico: text | null [required in Insert: no]
  - TS: `string | null`
- resultado: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- situacao: text | null [required in Insert: no]
  - TS: `string | null`
- tempo_coleta: text | null [required in Insert: no]
  - TS: `string | null`
- tipo_documento: text NOT NULL [required in Insert: no]
  - TS: `string`
- unidade_limite_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- unidade_resultado_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- unidade_tempo_coleta: text | null [required in Insert: no]
  - TS: `string | null`
FKs:
- avaliacao_id -> ltcat_avaliacoes.id (`ltcat_av_resultados_avaliacao_id_fkey`)

## ltcat_av_vibracao
- aposentadoria_especial: text | null [required in Insert: no]
  - TS: `string | null`
- aren: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- aren_limite: numeric (likely) | null [required in Insert: no]
  - TS: `number | null`
- avaliacao_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- cod_gfip: text | null [required in Insert: no]
  - TS: `string | null`
- colaborador: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- data_avaliacao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- funcao_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- ordem: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- parecer_tecnico: text | null [required in Insert: no]
  - TS: `string | null`
- situacao: text | null [required in Insert: no]
  - TS: `string | null`
- tempo_exposicao: text | null [required in Insert: no]
  - TS: `string | null`
- tipo: text | null [required in Insert: no]
  - TS: `string | null`
- tipo_documento: text NOT NULL [required in Insert: no]
  - TS: `string`
- vdvr: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- vdvr_limite: numeric (likely) | null [required in Insert: no]
  - TS: `number | null`
FKs:
- avaliacao_id -> ltcat_avaliacoes.id (`ltcat_av_vibracao_avaliacao_id_fkey`)

## ltcat_avaliacoes
- agente_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- aposentadoria_especial: text | null [required in Insert: no]
  - TS: `string | null`
- cod_gfip: text | null [required in Insert: no]
  - TS: `string | null`
- codigo_esocial: text | null [required in Insert: no]
  - TS: `string | null`
- colaborador: text | null [required in Insert: no]
  - TS: `string | null`
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz | null (likely default now()) [required in Insert: no]
  - TS: `string | null`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- danos_saude: text | null [required in Insert: no]
  - TS: `string | null`
- data_avaliacao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- descricao_avaliacao: text | null [required in Insert: no]
  - TS: `string | null`
- descricao_esocial: text | null [required in Insert: no]
  - TS: `string | null`
- documento_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- dose_percentual: numeric (likely) | null [required in Insert: no]
  - TS: `number | null`
- empresa_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- equipamento_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- ficha_tecnica_resultado_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- fonte_geradora: text | null [required in Insert: no]
  - TS: `string | null`
- funcao_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- funcoes_ges: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- limite_tolerancia: integer (likely) | null [required in Insert: no]
  - TS: `number | null`
- medidas_controle: text | null [required in Insert: no]
  - TS: `string | null`
- parecer_tecnico: text | null [required in Insert: no]
  - TS: `string | null`
- propagacao: text | null [required in Insert: no]
  - TS: `string | null`
- resultado: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- setor_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- situacao: text | null [required in Insert: no]
  - TS: `string | null`
- tecnica_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- tempo_coleta: text | null [required in Insert: no]
  - TS: `string | null`
- tipo_agente: text | null [required in Insert: no]
  - TS: `string | null`
- tipo_avaliacao: text | null [required in Insert: no]
  - TS: `string | null`
- tipo_documento: text NOT NULL [required in Insert: no]
  - TS: `string`
- tipo_exposicao: text | null [required in Insert: no]
  - TS: `string | null`
- unidade_limite_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- unidade_resultado_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- unidade_tempo_coleta: text | null [required in Insert: no]
  - TS: `string | null`
FKs:
- agente_id -> riscos.id (`ltcat_avaliacoes_agente_id_fkey`)
- contrato_id -> contratos.id (`ltcat_avaliacoes_contrato_id_fkey`)
- documento_id -> documentos.id (`ltcat_avaliacoes_documento_id_fkey`)
- empresa_id -> empresas.id (`ltcat_avaliacoes_empresa_id_fkey`)
- equipamento_id -> equipamentos_ho.id (`ltcat_avaliacoes_equipamento_id_fkey`)
- ficha_tecnica_resultado_id -> ficha_tecnica_resultados.id (`ltcat_avaliacoes_ficha_tecnica_resultado_id_fkey`)
- funcao_id -> funcoes.id (`ltcat_avaliacoes_funcao_id_fkey`)
- setor_id -> setores.id (`ltcat_avaliacoes_setor_id_fkey`)
- tecnica_id -> tecnicas_amostragem.id (`ltcat_avaliacoes_tecnica_id_fkey`)
- unidade_limite_id -> unidades.id (`ltcat_avaliacoes_unidade_limite_id_fkey`)
- unidade_resultado_id -> unidades.id (`ltcat_avaliacoes_unidade_resultado_id_fkey`)

## ltcat_pareceres
- agente_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- aposentadoria_especial: text | null [required in Insert: no]
  - TS: `string | null`
- colaborador_nome: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz | null (likely default now()) [required in Insert: no]
  - TS: `string | null`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- empresa_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- funcao_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- parecer_tecnico: text | null [required in Insert: no]
  - TS: `string | null`
- setor_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- tipo_documento: text NOT NULL [required in Insert: no]
  - TS: `string`
- updated_at: timestamptz | null (likely default now()) [required in Insert: no]
  - TS: `string | null`
FKs:
- empresa_id -> empresas.id (`ltcat_pareceres_empresa_id_fkey`)

## notificacoes
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- contrato_numero: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- data_vencimento: date (likely — ambiguity: could be text/timestamptz) NOT NULL [date-only name without _at] [required in Insert: yes]
  - TS: `string`
- documento_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- documento_nome: text | null [required in Insert: no]
  - TS: `string | null`
- documento_tipo: text | null [required in Insert: no]
  - TS: `string | null`
- empresa_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- empresa_nome: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- lida: boolean NOT NULL [required in Insert: no]
  - TS: `boolean`
- tipo: text NOT NULL [required in Insert: yes]
  - TS: `string`
FKs: (none)

## pareceres_tecnicos
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- documento: text NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- parecer_tecnico: text NOT NULL [required in Insert: no]
  - TS: `string`
- risco_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- situacao: text NOT NULL [required in Insert: yes]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs:
- risco_id -> riscos.id (`pareceres_tecnicos_risco_id_fkey`)

## pcmso_documentos
- cargo: text | null [required in Insert: no]
  - TS: `string | null`
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- crea: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- cronograma: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- current_step: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- data_elaboracao: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- documento_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- empresa_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- epi_blocos: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- file_path: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- last_modified_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- responsavel_tecnico: text | null [required in Insert: no]
  - TS: `string | null`
- revisoes: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- row_version: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- setores_snapshot: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- status: text NOT NULL [required in Insert: no]
  - TS: `string`
- template_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- treinamento_blocos: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- vigencia_fim: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
- vigencia_inicio: date (likely — ambiguity: could be text/timestamptz) | null [date-only name without _at] [required in Insert: no]
  - TS: `string | null`
FKs: (none)

## pcmso_observacoes_padrao
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- texto: text NOT NULL [required in Insert: no]
  - TS: `string`
- titulo: text NOT NULL [required in Insert: yes]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs: (none)

## profiles
- ativo: boolean NOT NULL [required in Insert: no]
  - TS: `boolean`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- email: text NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- nome: text NOT NULL [required in Insert: no]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- user_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
FKs: (none)

## psico_avaliacoes
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- data_avaliacao: date (likely — ambiguity: could be text/timestamptz) NOT NULL [date-only name without _at] [required in Insert: no]
  - TS: `string`
- empresa_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- status: text NOT NULL [required in Insert: no]
  - TS: `string`
- titulo: text NOT NULL [required in Insert: no]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs:
- contrato_id -> contratos.id (`psico_avaliacoes_contrato_id_fkey`)
- empresa_id -> empresas.id (`psico_avaliacoes_empresa_id_fkey`)

## psico_base_tecnica
- caminho: text NOT NULL [required in Insert: yes]
  - TS: `string`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- nome: text NOT NULL [required in Insert: yes]
  - TS: `string`
- tamanho: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- user_id: uuid NOT NULL [required in Insert: no]
  - TS: `string`
FKs: (none)

## psico_indicadores
- avaliacao_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- dados: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- empresa_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs:
- avaliacao_id -> psico_avaliacoes.id (`psico_indicadores_avaliacao_id_fkey`, one-to-one)

## psico_links
- ativo: boolean NOT NULL [required in Insert: no]
  - TS: `boolean`
- avaliacao_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- created_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- empresa_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- token: text NOT NULL [required in Insert: no]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs:
- avaliacao_id -> psico_avaliacoes.id (`psico_links_avaliacao_id_fkey`)
- contrato_id -> contratos.id (`psico_links_contrato_id_fkey`)
- empresa_id -> empresas.id (`psico_links_empresa_id_fkey`)

## psico_relatorios
- avaliacao_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- dados: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- empresa_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- versao: text NOT NULL [required in Insert: no]
  - TS: `string`
FKs:
- avaliacao_id -> psico_avaliacoes.id (`psico_relatorios_avaliacao_id_fkey`, one-to-one)

## psico_respostas
- alertas: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- avaliacao_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- blocos: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- colaborador_nome: text | null [required in Insert: no]
  - TS: `string | null`
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- contrato_nome: text | null [required in Insert: no]
  - TS: `string | null`
- copsoq_resultado_resumido: text | null [required in Insert: no]
  - TS: `string | null`
- copsoq_riscos_identificados: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- data_avaliacao: date (likely — ambiguity: could be text/timestamptz) NOT NULL [date-only name without _at] [required in Insert: no]
  - TS: `string`
- empresa_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- funcao_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- funcao_nome: text NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- link_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- respostas: jsonb NOT NULL [required in Insert: no]
  - TS: `Json`
- resultado_psicossocial: text | null [required in Insert: no]
  - TS: `string | null`
- riscos_psicossociais: text | null [required in Insert: no]
  - TS: `string | null`
- total_negativas: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
- total_positivas: numeric|integer (ambiguous) | null [required in Insert: no]
  - TS: `number | null`
FKs:
- avaliacao_id -> psico_avaliacoes.id (`psico_respostas_avaliacao_id_fkey`)
- contrato_id -> contratos.id (`psico_respostas_contrato_id_fkey`)
- empresa_id -> empresas.id (`psico_respostas_empresa_id_fkey`)
- funcao_id -> funcoes.id (`psico_respostas_funcao_id_fkey`)
- link_id -> psico_links.id (`psico_respostas_link_id_fkey`)

## responsaveis
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- funcao: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- nome: text NOT NULL [required in Insert: yes]
  - TS: `string`
- registro_profissional: text | null [required in Insert: no]
  - TS: `string | null`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs: (none)

## riscos
- codigo_esocial: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- danos_saude: text | null [required in Insert: no]
  - TS: `string | null`
- descricao_esocial: text | null [required in Insert: no]
  - TS: `string | null`
- epi_eficaz: text | null [required in Insert: no]
  - TS: `string | null`
- fonte_geradora: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- is_padrao: boolean NOT NULL [required in Insert: no]
  - TS: `boolean`
- last_modified_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- medidas_controle: text | null [required in Insert: no]
  - TS: `string | null`
- nome: text NOT NULL [required in Insert: yes]
  - TS: `string`
- propagacao: text[] | null [required in Insert: no]
  - TS: `string[] | null`
- row_version: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- tipo: text NOT NULL [required in Insert: yes]
  - TS: `string`
- tipo_epi: text | null [required in Insert: no]
  - TS: `string | null`
- tipo_exposicao: text | null [required in Insert: no]
  - TS: `string | null`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs: (none)

## setores
- contrato_id: uuid | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- descricao_ambiente: text | null [required in Insert: no]
  - TS: `string | null`
- empresa_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
- ghe_ges: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- last_modified_by: uuid | null [required in Insert: no]
  - TS: `string | null`
- nome_setor: text NOT NULL [required in Insert: yes]
  - TS: `string`
- row_version: integer (likely) NOT NULL [required in Insert: no]
  - TS: `number`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs:
- contrato_id -> contratos.id (`setores_contrato_id_fkey`)
- empresa_id -> empresas.id (`setores_empresa_id_fkey`)

## tecnicas_amostragem
- created_at: timestamptz | null (likely default now()) [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- nome: text NOT NULL [required in Insert: yes]
  - TS: `string`
- referencia: text | null [required in Insert: no]
  - TS: `string | null`
FKs: (none)

## templates
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- file_path: text NOT NULL [required in Insert: yes]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- is_system: boolean NOT NULL [required in Insert: no]
  - TS: `boolean`
- title: text NOT NULL [required in Insert: yes]
  - TS: `string`
FKs: (none)

## treinamentos_cadastro
- carga_horaria: text | null [required in Insert: no]
  - TS: `string | null`
- codigo: text | null [required in Insert: no]
  - TS: `string | null`
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- descricao: text | null [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- nome: text NOT NULL [required in Insert: yes]
  - TS: `string`
- observacoes: text | null [required in Insert: no]
  - TS: `string | null`
- periodicidade: text | null [required in Insert: no]
  - TS: `string | null`
- updated_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
FKs: (none)

## unidades
- created_at: timestamptz | null (likely default now()) [required in Insert: no]
  - TS: `string | null`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- nome: text | null [required in Insert: no]
  - TS: `string | null`
- simbolo: text NOT NULL [required in Insert: yes]
  - TS: `string`
FKs: (none)

## user_roles
- created_at: timestamptz NOT NULL (likely default now()) [required in Insert: no]
  - TS: `string`
- id: uuid NOT NULL PK default gen_random_uuid() [required in Insert: no]
  - TS: `string`
- role: app_role NOT NULL [required in Insert: yes]
  - TS: `Database["public"]["Enums"]["app_role"]`
- user_id: uuid NOT NULL [required in Insert: yes]
  - TS: `string`
FKs: (none)

---

# Functions (RPC)

## has_role
- **Args:**
  - _role: Database["public"]["Enums"]["app_role"]
  - _user_id: string
- **Returns:** boolean

## import_ficha_tecnica_resultados
- **Args:**
  - _contrato_id: string
  - _documento_id: string
  - _empresa_id: string
  - _tipo_documento: string
- **Returns:** Json

## psico_get_public_link
- **Args:**
  - _token: string
- **Returns:** Json

## psico_submit_resposta
- **Args:**
  - _payload: Json
  - _token: string
- **Returns:** Json

## save_ltcat_documento_v2
- **Args:**
  - _avaliacoes: Json
  - _delete_avaliacao_ids: string[]
  - _delete_child_ids: Json
  - _document_patch: Json
  - _documento_id: string
  - _empresa_id: string
  - _expected_row_version: number
  - _tipo_documento: string
- **Returns:** Json

## sync_ltcat_avaliacoes
- **Args:**
  - _avaliacoes: Json
  - _documento_id: string
  - _empresa_id: string
  - _tipo_documento: string
- **Returns:** Json

## update_shared_record
- **Args:**
  - _expected_version: number
  - _patch: Json
  - _record_id: string
  - _table_name: string
- **Returns:** Json

---

# Enums

## app_role
- Values: "admin" | "usuario"
