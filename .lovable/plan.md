# Refatoração do Módulo Avaliação Psicossocial (COPSOQ)

Escopo grande dividido em 5 frentes independentes. Todas as mudanças ficam em frontend/apresentação (nada de banco).

## 1. PDF Profissional (`src/lib/copsoqRelatorio.ts`)

Substituir o motor atual (jsPDF puro com `doc.text` linha-a-linha, que causa o efeito de "letras esticadas" quando o texto é justificado sem métricas corretas) por renderização baseada em `jspdf.html` **não** — usar `jsPDF` com utilitários próprios:

- Fonte: `helvetica` (built-in), tamanhos padronizados (Título 16pt bold, H1 13pt bold, H2 11pt bold, corpo 10pt normal, legenda 8pt).
- Margens fixas: 20 mm todas.
- Parágrafos via helper `paragrafo(texto, {justify, indent, lineHeight: 1.4})`:
  - `splitTextToSize` para quebra automática.
  - Justificação **manual correta**: última linha e linhas curtas ficam à esquerda; demais linhas distribuem apenas espaço extra entre palavras (usar `doc.getTextWidth` e desenhar palavra a palavra com espaçamento calculado). **Nunca** aplicar `charSpace` — era a causa das letras esticadas.
- Títulos com faixa cinza clara; subtítulos com sublinhado fino.
- Rodapé com nº de página / total, cabeçalho com nome da empresa.
- Recuo de primeira linha (5 mm) em parágrafos de corpo.
- Tabelas via `autotable` (já em uso) mantidas, com tema `grid` uniformizado.

## 2. Seção "Funções Avaliadas" no relatório consolidado

Em `gerarRelatorioCopsoqPDF` (ou wrapper consolidado):
- Agregar `avaliacoes.map(a => a.funcao)` com dedupe case-insensitive.
- Ordenar alfabeticamente.
- Renderizar seção "Funções Avaliadas" logo após os dados da empresa, com lista com marcadores.
- Mostrar contagem (N respondentes por função entre parênteses).

## 3. Parser inteligente (`src/components/PsicossocialTextInputModal.tsx`)

Reescrever completo:
- **Normalização**: lowercase, remoção de acentos, colapso de espaços/tabs, remoção de numeração (`1.`, `1)`, `-`, `•`, `*`) e pontuação final.
- **Reconstrução de perguntas quebradas**: unir linhas consecutivas até encontrar `?`, `:` ou uma linha que case como resposta.
- **Detecção de resposta**: regex tolerante (`^\s*(nunca|raramente|as\s*vezes|frequentemente|sempre)\s*$` já normalizado) + números 0–4 / 0–100.
- **Fuzzy matching**: manter Jaccard atual + fallback por trigramas (Dice) e limiar mais baixo (0.18) quando não houver ambiguidade; escolher melhor score global por linha.
- **Associação pergunta→resposta**: após identificar pergunta, avançar linhas ignorando vazias/tabulações até encontrar próxima resposta válida **ou** próxima pergunta reconhecida (nesse caso, marca como sem resposta e reprocessa a nova pergunta).
- Sem limite de tamanho — remover qualquer slice/limite atual.
- Suporte a marcador de função robusto: `Função`, `Cargo`, `Colaborador`, `Posto`, com `:` `-` `–` `=` opcionais.

## 4. Página dedicada COPSOQ

Criar rota `/avaliacao-psicossocial/:aetId` renderizada por nova página `src/pages/AvaliacaoPsicossocial.tsx`:
- Layout com `AppLayout` + `PageHeader`.
- Seções em cards: Dados da Empresa/Contrato, Ações (importar PDF/Excel/CSV, Escrever Questionário, Novo Manual, COPSOQ template para impressão), Lista de Avaliações Salvas (com editar/excluir por função — reutilizando ícones já criados), Indicadores rápidos (nº avaliações, funções, % completas), Botão "Gerar Relatório Consolidado" fixo no topo direito.
- Reaproveitar toda a lógica existente de `PsicossocialModal` extraindo o miolo em componentes:
  - `PsicoAvaliacaoForm` (edição de uma avaliação)
  - `PsicoAvaliacoesList`
  - `PsicoAcoesToolbar`
- Registrar rota em `src/App.tsx`.
- Em `AetWizard.tsx`, substituir a abertura do modal por navegação para a nova página (`navigate('/avaliacao-psicossocial/${aetId}')`). Manter o modal antigo apenas se necessário para retrocompatibilidade — remover botão do modal.

## 5. Ajustes finos

- Ícones editar/excluir por função permanecem (já implementados).
- Auto-abertura de avaliação incompleta continua funcionando na nova página.
- Bloqueio do botão de relatório enquanto houver pendências mantido.

## Detalhes Técnicos

**Arquivos criados**
- `src/pages/AvaliacaoPsicossocial.tsx`
- `src/components/psico/PsicoAvaliacaoForm.tsx`
- `src/components/psico/PsicoAvaliacoesList.tsx`
- `src/components/psico/PsicoAcoesToolbar.tsx`
- `src/lib/pdf/textRender.ts` (helpers `paragrafo`, `titulo`, `subtitulo`, `secao`)

**Arquivos alterados**
- `src/lib/copsoqRelatorio.ts` — reescrita da geração
- `src/components/PsicossocialTextInputModal.tsx` — parser novo
- `src/components/PsicossocialModal.tsx` — vira wrapper compat OU deprecado
- `src/pages/AetWizard.tsx` — botão navega para nova página
- `src/App.tsx` — nova rota

**Sem alterações de banco.** Toda a lógica de leitura/gravação (`aet_documentos`, `psico_respostas`) permanece.

## Ordem de execução
1. Helpers de PDF + reescrita do relatório (impacto imediato visível).
2. Seção "Funções Avaliadas" no relatório.
3. Parser inteligente (independente).
4. Extração de componentes + página dedicada + rota.
5. Ajuste do AetWizard.
