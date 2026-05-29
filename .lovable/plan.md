## Visão geral

Criar módulo PCMSO completo, isolado do PGR (cópia opcional como inicialização), com:
- Card "PCMSO" em `Documentos → Novo Documento`
- Modal de entrada: "Deseja copiar informações do PGR? SIM / NÃO"
- Wizard com 2 etapas: Identificação e Dimensionamento de Exames
- Sistema de textos padrão de observações
- Helper de variáveis para template DOCX

## Backend (Lovable Cloud)

**Tabelas novas:**
- `pcmso_documentos` — id, empresa_id, contrato_id, responsavel_tecnico, crea, cargo, vigencia_inicio, vigencia_fim, revisoes (jsonb), setores_snapshot (jsonb), status, file_path, created_at/by, updated_at
- `pcmso_observacoes_padrao` (já existe — reaproveitar) — titulo, texto, created_by

Tudo via RLS `authenticated` + GRANTs padrão.

O documento aparecerá em `documentos` (tabela mestre) via inserção paralela com tipo `PCMSO` para listagem unificada, mas o estado real fica em `pcmso_documentos`.

## Frontend

**Arquivos novos:**
- `src/components/PcmsoStartModal.tsx` — modal SIM/NÃO + seletor de empresa (quando SIM) e seletor de PGR existente
- `src/lib/copyPgrToPcmso.ts` — função que lê `documentos` tipo PGR + `draft_snapshot`, monta payload inicial PCMSO e cria registro
- `src/pages/PcmsoWizard.tsx` — wizard com Step 1 (Identificação + Revisões dinâmicas) e Step 2 (lista de setores → detalhe do setor com funções, 6 grupos de agentes, exames dinâmicos, observações)
- `src/components/PcmsoSetorDetail.tsx` — tela do setor (funções, agentes editáveis em 6 categorias, exames CRUD)
- `src/components/PcmsoExameForm.tsx` — formulário dinâmico de exame com switches Admissional/Periódico (+ período condicional)/Retorno/Mudança/Demissional, observação + integração com textos padrão
- `src/components/PcmsoObservacoesPadraoModal.tsx` — selecionar múltiplos textos padrão, criar novo, marcar observação atual como padrão
- `src/components/PcmsoTemplateHelper.tsx` — popover/modal listando todas variáveis e exemplo de loop Mustache

**Edições:**
- `src/pages/Documentos.tsx` — adicionar `{ id: "pcmso", label: "PCMSO", desc: "..." }` abaixo de PGR; abrir `PcmsoStartModal`; suportar download/edit/delete
- `src/App.tsx` — rotas `/documentos/pcmso/novo` e `/documentos/pcmso/editar/:documentoId`

## Estrutura de dados (snapshot do setor)

```json
{
  "identificacao": {
    "empresa": "", "responsavel_tecnico": "", "crea": "", "cargo": "",
    "vigencia_inicio": "", "vigencia_fim": "",
    "revisoes": [{ "revisao": "", "data": "", "motivo": "", "responsavel": "" }]
  },
  "setores": [{
    "nome_setor": "", "funcoes": "",
    "agentes_fisicos": [], "agentes_quimicos": [], "agentes_biologicos": [],
    "agentes_ergonomicos": [], "agentes_acidentes": [], "agentes_psicossociais": [],
    "exames": [{
      "tipo_exame": "", "cod_esocial": "", "descricao_esocial": "",
      "admissional": false, "periodico": false, "periodo": "",
      "retorno_trabalho": false, "mudanca_funcao": false,
      "demissional": false, "observacao": ""
    }]
  }]
}
```

## Cópia do PGR (quando usuário escolhe SIM)

1. Buscar último `documentos` tipo `PGR` da empresa selecionada
2. Ler `draft_snapshot.setores[setorId].riscos[]`
3. Agrupar riscos por `tipo` → preencher `agentes_fisicos`, `agentes_quimicos`, etc. (apenas nome/descrição, mantendo editável)
4. Carregar setores+funções do cadastro para preencher `funcoes` automaticamente
5. PCMSO continua independente — depois da cópia, nenhuma leitura do PGR ocorre

## Template / Variáveis

`PcmsoTemplateHelper` lista:
- Identificação: `{{empresa}}`, `{{responsavel_tecnico}}`, `{{crea}}`, `{{cargo}}`, `{{vigencia_inicio}}`, `{{vigencia_fim}}`
- Loop revisões: `{{#revisoes}}{{revisao}} {{data}} {{motivo}} {{responsavel}}{{/revisoes}}`
- Loop setores: `{{#setores}} {{nome_setor}} {{funcoes}} {{agentes_fisicos}} ... {{#exames}} {{tipo_exame}} {{cod_esocial}} ... {{/exames}} {{/setores}}`

Geração DOCX em si fica para fase futura (estrutura JSON já preparada para docxtemplater).

## Etapas de entrega

1. Migration: criar `pcmso_documentos` com GRANTs e RLS
2. Aprovação do usuário na migration
3. Modal + lib de cópia + rota + card em Documentos
4. Wizard Step 1 (Identificação + Revisões)
5. Wizard Step 2 (Setores → Detalhe → Exames + Observações)
6. Template helper + integração textos padrão

Confirma para eu prosseguir?