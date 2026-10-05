# Ordenação numérica e relatório Word em Psicossociais

## Objetivo
Manter uma única ordem numérica de Setores e GHE/GES em toda a edição e emissão do relatório Psicossocial e permitir baixar o mesmo relatório completo em Word editável, sem alterar cálculos, metodologia ou registros no banco.

## Implementação
1. **Ordenação única na fonte do relatório**
   - Criar um comparador numérico estável para os grupos do relatório, lendo os números contidos nos nomes de Setor e GHE/GES.
   - Comparar primeiro o Setor e depois o GHE/GES; números com quantidades diferentes de dígitos serão tratados numericamente (`1`, `2`, `10`).
   - Preservar nomes, IDs, vínculos e a ordem original quando não houver diferença numérica.
   - Aplicar essa ordenação ao construir e reabrir os grupos, sem atualizar os registros do banco apenas para ordenar.

2. **Consistência entre tela e arquivos**
   - Usar a lista já ordenada como fonte das seções, tabelas, agrupamentos, plano de ação e comparativos da tela.
   - Reforçar a ordenação na entrada dos geradores para que PDF e Word permaneçam corretos mesmo se forem chamados isoladamente.
   - Usar o mesmo retrato dos dados atuais da tela para os dois downloads.

3. **Relatório Word editável**
   - Criar um gerador dedicado que receba o mesmo conteúdo do PDF e produza Open XML nativo com a biblioteca Word já instalada no projeto.
   - Incluir capa, identificação, setores/GHE-GES, metodologia, fatores, resultados, matriz, rastreabilidade para PGR, medidas, indicadores, comparativo, histórico, conclusão, plano de ação, responsáveis e assinaturas.
   - Incluir tabelas editáveis, cabeçalho nas páginas internas, rodapé com identificação e numeração, estilos profissionais e nome de arquivo seguro.
   - Não criar um segundo cadastro ou fluxo de relatório; o Word será apenas outro formato de emissão do relatório atual.

4. **Ações de download**
   - Adicionar “Baixar Word” ao lado de “Baixar PDF” no topo e no final do relatório.
   - Exibir estado de geração e mensagem de erro específica sem afetar o salvamento ou o PDF.

## Detalhes técnicos
- Evoluir o utilitário de ordenação existente para suportar comparação numérica estável de textos e grupos Psicossociais.
- Criar `src/lib/psicoRelatorioDocx.ts` usando `@turbodocx/html-to-docx` e `file-saver`, ambos já presentes.
- Manter o tipo de payload compartilhado entre PDF e Word para impedir divergência de conteúdo.
- O Word será gerado localmente no navegador; nenhuma integração externa com conta Microsoft será necessária.

## Validação
- Testes unitários da ordem: `GERE 01, GERE 02, GERE 10`; `GHE 1, GHE 2, GHE 10`; `GES 01, GES 02, GES 10`.
- Teste de estabilidade, preservação de nomes/IDs e precedência Setor → GHE/GES.
- Teste do conteúdo e da ordem no payload do PDF.
- Geração de DOCX, abertura do pacote e inspeção do XML para confirmar seções, tabelas, cabeçalho, rodapé, numeração e ordem.
- Typecheck, testes de regressão e compilação final.