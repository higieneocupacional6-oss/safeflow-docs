# Corrigir condições químicas no DOCX

## Implementação
- Ajustar o mecanismo atual de flags para que fumos metálicos e poeiras metálicas sejam verdadeiros somente com avaliação quantitativa e resultado preenchido.
- Fortalecer o processamento existente dos marcadores DOCX, preservando a leitura de texto dividido em runs e removendo blocos completos dentro de parágrafos, tabelas e células.
- Garantir a limpeza final de todos os marcadores condicionais, sem alterar as demais variáveis existentes.

## Verificação
- Criar testes DOCX para fumos metálicos, poeiras metálicas, ambos e nenhum.
- Cobrir marcadores divididos em runs e conteúdo dentro de tabela/célula.
- Executar os testes e confirmar a compilação final.

## Detalhes técnicos
A correção continuará usando `computePresentBlocks`, `stripConditionalBlocksDocx`, `buildAgentFlags` e o parser Docxtemplater já integrados ao gerador. Não será criado um segundo fluxo de geração.
