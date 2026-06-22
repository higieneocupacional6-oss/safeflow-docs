# Refatoração: Hierarquia Empresa → Contrato → Setores/Funções/Documentos

## Visão geral

Hoje setores, funções e documentos ficam ligados apenas à empresa. Vamos introduzir o contrato como contexto obrigatório entre a empresa e tudo o que está abaixo dela, de forma que cada cliente possa ter vários contratos com cadastros e documentos completamente isolados entre si.

```text
Empresa
 └── Contrato
      ├── Setores
      │    └── Funções
      └── Documentos (PGR, PCMSO, LTCAT, Insalubridade, Periculosidade, AET)
```

## Estado atual dos dados

- 13 empresas, 7 contratos, 48 setores, 112 funções, 28 documentos.
- `setores.empresa_id` existe; `setores.contrato_id` **não** existe.
- `funcoes` só tem `setor_id` (herda contrato via setor).
- `documentos`, `pcmso_documentos`, `ltcat_avaliacoes`, `aet_documentos` já têm `contrato_id` (nullable) — apenas 5 dos 28 documentos têm contrato preenchido.

## Estratégia de migração de dados

Para cada empresa sem contrato ou com dados legados sem contrato, criar automaticamente um contrato chamado **"Contrato Padrão"** e vincular a ele todos os setores, funções (via setor) e documentos órfãos. Nada é perdido e o sistema passa a exigir contrato dali em diante.

## Etapas de implementação

### 1. Migração de banco
- Garantir um "Contrato Padrão" por empresa que tenha qualquer setor/documento sem contrato.
- Adicionar `setores.contrato_id` (FK → contratos, ON DELETE CASCADE) e popular com o contrato padrão correspondente.
- Backfill em `documentos`, `pcmso_documentos`, `ltcat_avaliacoes`, `aet_documentos` para preencher `contrato_id` quando estiver nulo.
- Marcar `contrato_id` como NOT NULL nessas tabelas após o backfill.
- Adicionar índice em `setores(contrato_id)` e nos `*.contrato_id` dos documentos.
- Funções continuam sem coluna própria — pertencem ao contrato via `setor.contrato_id`. Isso evita duplicar a hierarquia e mantém a consistência.

### 2. Módulo "Setores e Funções" (`src/pages/SetoresFuncoes.tsx`)
- Adicionar segundo seletor obrigatório "Selecionar Contrato" abaixo de "Selecionar Empresa".
- Lista de contratos filtrada pela empresa selecionada.
- Setores e funções só aparecem após escolher contrato; botões de "Novo Setor" / "Nova Função" desabilitados antes disso.
- `SetorFuncaoModal` e `FuncaoModal` recebem `contratoId` e gravam `contrato_id` no setor criado.
- `copyPgrToPcmso.ts` (`buildSetoresFromEmpresa`) passa a filtrar por contrato.

### 3. Wizards de documentos
Aplicar o mesmo fluxo em PGR, PCMSO, LTCAT, Insalubridade, Periculosidade e AET (`PgrWizard`, `PcmsoWizard`, `LtcatWizard` se existir, `AetWizard`, mais os modais de start: `PcmsoStartModal`, `InsalubridadeStartModal`, `PericulosidadeStartModal`):

- Etapa Identificação ganha campo "Selecionar Contrato" logo após empresa.
- Listar apenas contratos que tenham ao menos uma função cadastrada (via setor → função).
- Todos os carregamentos de setores/funções/GHEs/riscos/EPIs/medidas passam a filtrar por `contrato_id`.
- Persistir `contrato_id` em `documentos` e na tabela específica do tipo.
- Cópia PGR → PCMSO: buscar PGR mais recente do **mesmo contrato**; se não houver, oferecer iniciar em branco.

### 4. Listagens e filtros
- `src/pages/Documentos.tsx`: agrupar/filtrar por empresa **e** contrato, mostrar coluna/badge do contrato em cada documento.
- `src/pages/ControleDocumentos.tsx`: mesmo filtro empresa+contrato.
- Qualquer dropdown que mostre setores/funções/GHEs/EPIs passa a respeitar o contrato ativo do contexto.

### 5. UX / validações
- Se a empresa não tiver contratos, mostrar mensagem com atalho para `/empresas-contratos`.
- Mensagem clara quando o contrato escolhido não tem setores/funções ainda.
- Toasters de erro amigáveis nos casos em que o contrato é exigido.

## Detalhes técnicos

- **Migração SQL** (em um único arquivo): cria contratos padrão faltantes em transação, faz UPDATEs de backfill, adiciona coluna `setores.contrato_id`, FKs, índices, NOT NULLs.
- **Tipos**: após a migração, `src/integrations/supabase/types.ts` é regenerado automaticamente — só então atualizo os componentes que dependem do novo campo.
- **Queries**: substituir `.eq('empresa_id', X)` por `.eq('contrato_id', Y)` nos pontos de leitura de setores/funções; quando precisar de empresa, navegar via join.
- **Realtime**: `useRealtimeSync` nas telas afetadas continua igual, só mudam os `queryKey` para incluir `contratoId`.
- **Sem mexer em**: schemas `auth`/`storage`, cliente Supabase auto-gerado, configs de projeto.

## Risco e validação

- Mudança ampla → fazer commit único da migração e em seguida ajustar todos os pontos do front. Após deploy, validar manualmente cada wizard criando documento em contratos diferentes da mesma empresa para confirmar isolamento.
- Documentos legados ficarão visíveis dentro do "Contrato Padrão" da empresa correspondente, sem perda de histórico.

## Fora de escopo
- Não criamos novas tabelas para riscos/EPIs por contrato — eles já vivem dentro do snapshot do documento ou em tabelas que referenciam o documento, que por sua vez já será do contrato correto.
- Não alteramos templates nem variáveis de template (já entregues anteriormente).
