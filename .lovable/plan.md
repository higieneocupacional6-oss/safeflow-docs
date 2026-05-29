# PCMSO — Fluxo Completo + Variáveis de Template

Escopo grande (≈ 6–8 arquivos novos, 4 migrações, 1 wizard novo). Abaixo o plano por etapas.

## 1. Banco de dados (migrações)

Novas tabelas:

- `exames_catalogo` — `id, nome, categoria, descricao, ativo`
- `esocial_exames` — `id, codigo, descricao, ativo`
- `pcmso_observacoes_padrao` — `id, texto`
- `pcmso_documentos` — espelho do PGR: `empresa_id, contrato_id, current_step, status, data_elaboracao, responsavel_tecnico, crea, cargo, revisoes, draft_snapshot`
- `pcmso_setor_exames` — `pcmso_id, setor_id, exame_id, esocial_id, admissional, periodico, retorno, mudanca_risco, demissional, periodo, observacoes`
- `pcmso_epis` / `pcmso_treinamentos` / `pcmso_cronograma` (mesma estrutura usada no PGR)

RLS: `authenticated` full access (padrão do projeto). GRANTs explícitos.

Seeds: lista inicial de exames (Audiometria, Acuidade Visual, ECG, EEG, Espirometria, Hemograma) e códigos eSocial comuns (0295, 0281, 0290, …).

## 2. Módulos de Cadastro

Adicionar em `src/pages/Cadastros.tsx` (ou nova rota):

- **Cadastro > Exames** — CRUD `exames_catalogo`
- **Cadastro > eSocial Exames** — CRUD `esocial_exames`
- **Cadastro > Observações PCMSO** — CRUD `pcmso_observacoes_padrao`

## 3. Wizard PCMSO — `src/pages/PcmsoWizard.tsx`

Rota: `/documentos/pcmso/novo` e `/documentos/pcmso/editar/:id`.

**Etapas:**

1. **Identificação** — reaproveita componente do PGR. Modal inicial: "Copiar de PGR existente?" → lista empresas com PGR → copia campos (editáveis).
2. **Mapeamento de Exames** — seletor de setor (filtra por empresa), mostra funções (read-only), botão "+ Adicionar Exame" → modal:
   - Select exame (catálogo)
   - Select código eSocial
   - Checkboxes: Admissional / Periódico / Retorno / Mudança Riscos / Demissional
   - Se Periódico → campo Período (texto livre)
   - Textarea Observações + botão "Cadastrar Texto" abrindo modal de observações padrão
3. **EPI** — modal "Copiar do PGR?" → se sim, copia; se não, mesma UI do PGR
4. **Treinamentos** — idem etapa EPI
5. **Cronograma** — reaproveita `PgrCronogramaStep` mas salva em `pcmso_cronograma`
6. **Listagem/Geração** — gera DOCX via template com payload PCMSO

## 4. Helper de variáveis — `src/components/PcmsoTemplateHelper.tsx`

Modal estilo `PgrTemplateHelper` com categorias: Identificação, Empresa, Responsáveis, Setores, Funções, Exames, eSocial, EPI, Treinamentos, Cronograma, Assinaturas. Cada variável com botão "Copiar" e "Ver Exemplo".

Suporta loops Mustache: `{{#setores}}{{#exames}}…{{/exames}}{{/setores}}`.

## 5. Integração / Navegação

- Adicionar item PCMSO em `src/pages/Documentos.tsx` (novo documento)
- Adicionar rota no `src/App.tsx`
- Sidebar: link para novos cadastros

## Detalhes técnicos

- Reaproveitar componentes do PGR (`EmpresaModal`, `SetorFuncaoModal`, cronograma) — extrair lógica comum se necessário
- Persistência por etapa via `draft_snapshot` jsonb (mesmo padrão LTCAT/PGR) para evitar perda de dados
- Geração DOCX: payload com `empresa`, `responsaveis`, `setores[].funcoes[]`, `setores[].exames[]`, `epis[]`, `treinamentos[]`, `cronograma[]`
- Modal "copiar PGR" usa `draft_snapshot` do PGR mais recente da empresa

## Riscos / pontos de atenção

- Volume grande de UI nova → entregar em sub-etapas se preferir
- "Copiar do PGR" depende da estrutura atual do `draft_snapshot` do PGR — vou inspecionar antes de implementar
- Templates DOCX existentes não terão variáveis PCMSO; usuário precisará criar template novo

## Pergunta antes de iniciar

Confirma que devo:
1. Criar as 3 migrações (catálogos + PCMSO completo) numa só leva?
2. Construir tudo de uma vez ou entregar por etapas (ex.: 1ª PR = cadastros + identificação + mapeamento de exames; 2ª PR = EPI/Treinamentos/Cronograma; 3ª PR = variáveis de template)?