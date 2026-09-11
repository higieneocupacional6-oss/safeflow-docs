# Corrigir Cronoanálise nos templates AET

## Objetivo
Garantir que `{{tarefas}}`, `{{tempo}}` e `{{riscos_observados}}` sejam preenchidas com todas as linhas da Cronoanálise salva na AET, sem alterar o layout atual.

## Implementação
- Centralizar a conversão da lista de Cronoanálise para dados de template.
- Dentro de cada setor, preencher as três variáveis com valores alinhados por quebra de linha, preservando todas as tarefas.
- Disponibilizar também as três variáveis no nível geral da AET, para templates existentes que não usam o loop de setores.
- Manter o loop `{{#cronoanalise}}` compatível e adicionar o alias `riscos_observados` em cada linha, sem remover `risco`.
- Atualizar a lista de variáveis da AET para mostrar corretamente as três opções e o uso com múltiplas tarefas.

## Verificação
- Testar três tarefas no mesmo setor e tarefas em setores diferentes.
- Confirmar alinhamento de tarefa, tempo e risco, preservação após serialização/reabertura e compatibilidade com campos vazios.
- Validar a geração por DOCX e HTML e conferir o estado final do aplicativo.

## Detalhes técnicos
A Cronoanálise já é persistida no campo JSON `aet_documentos.setores`, vinculada pelo `documento_id`. A falha está na montagem dos dados do template: `tarefas` e `riscos_observados` usam campos legados vazios, `tempo` não existe nesse contexto e o array usa `risco` no singular. A correção fará essas variáveis derivarem diretamente de `setor.cronoanalise`.
