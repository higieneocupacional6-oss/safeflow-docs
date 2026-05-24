# Plano: Controle de Documentos + Notificações

## 1. Banco de dados (migração)

**Nova coluna em `documentos`:**
- `data_validade` (date) — calculada automaticamente
- `upload_file_path` (text) — arquivo enviado pelo usuário (separado do `file_path` original gerado pelo sistema)
- `nome_documento` (text) — nome customizável

**Nova tabela `notificacoes`:**
- `documento_id` (uuid), `empresa_id` (uuid), `contrato_id` (uuid)
- `tipo` (text: '30_dias' | '15_dias' | 'vencimento')
- `data_vencimento` (date)
- `lida` (boolean, default false)
- `created_at`
- Unique constraint em (documento_id, tipo) para evitar duplicidade
- RLS: authenticated full access

**Bucket `documentos-upload`** (privado) + policies para upload/download autenticados.

**Trigger**: ao inserir/atualizar `documentos.data_elaboracao`, recalcular `data_validade = data_elaboracao + 12 meses`.

## 2. Página `/documentos/controle` — Controle de Documentos

Hierarquia em árvore (accordion expansível):
```
📁 Empresa A
   └ 📁 Contrato 001
        └ 📁 Documentos
             └ [Tabela: Tipo | Nome | Empresa | Contrato | Data elaboração | Validade | Status | Upload | Download]
   └ 📁 Contrato 002
📁 Empresa B
```

**Status calculado** no frontend:
- "No prazo" (verde) — `data_validade > hoje`
- "Próximo do vencimento" (amarelo) — ≤30 dias
- "Vencido" (vermelho) — `data_validade < hoje`

**Filtros no topo**: busca por nome, select empresa, select contrato, select tipo, select status.

**Ícone upload**: abre input file → salva no bucket → atualiza `upload_file_path`.

**Ícone download**: abre modal com 2 opções:
- "Baixar documento original emitido pelo sistema" → usa `file_path`
- "Baixar arquivo enviado via upload" → usa `upload_file_path`

## 3. Página `/notificacoes` — Notificações

- Lista cards/tabela com: empresa, contrato, documento, data vencimento, status (30/15/vencido), badge.
- Geração automática: ao carregar a página, varre `documentos` e cria registros em `notificacoes` quando aplicável (idempotente via unique).
- Ícone "marcar como lida".
- Badge no sidebar com contador de não lidas.

## 4. Sidebar (`AppSidebar.tsx`)

Adicionar dois novos itens de menu:
- "Controle de Documentos" → `/documentos/controle`
- "Notificações" → `/notificacoes` (com badge de count)

## 5. Rotas (`App.tsx`)

Adicionar `<Route path="/documentos/controle" />` e `<Route path="/notificacoes" />`.

## Detalhes técnicos

- Geração de notificações: função client-side executada ao montar a página de Notificações (e também na página Controle), com `upsert` ignorando conflitos.
- Cálculo de validade também feito no frontend como fallback caso `data_elaboracao` exista mas trigger não tenha rodado em registros antigos.
- Reutilizar `useRealtimeSync` para sincronizar mudanças.

Confirma para eu implementar?
