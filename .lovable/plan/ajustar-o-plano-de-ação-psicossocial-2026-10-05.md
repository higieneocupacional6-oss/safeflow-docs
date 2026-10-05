# Ajustar o Plano de Ação Psicossocial

## Objetivo
Exibir e salvar ações somente para fatores classificados como **Médio** ou **Alto**, sem alterar os cálculos e as classificações existentes.

## Implementação
- Filtrar a criação automática de ações pela classificação já calculada, excluindo Baixo, aceitável, manutenção, monitoramento e qualquer nível fora de Médio/Alto.
- Aplicar a mesma regra aos textos gerados por IA e ao PDF, sem modificar a metodologia do relatório.
- Preservar ações já editadas quando continuam elegíveis e impedir duplicações por Setor/GHE e fator.
- Adicionar exclusão individual com confirmação: “Tem certeza que deseja excluir esta ação?”.
- Salvar a exclusão imediatamente no relatório, registrando a chave removida para que ela não reapareça ao atualizar ou reabrir.
- Adicionar uma ação explícita para recriar o Plano de Ação; somente essa escolha poderá restaurar ações anteriormente excluídas.

## Validação
- Testar geração com níveis Baixo, Médio, Alto e Crítico, confirmando ações apenas para Médio e Alto.
- Testar cancelamento e confirmação da exclusão, persistência após recarga e recriação voluntária.
- Confirmar ausência de duplicações, PDF coerente e funcionamento das demais partes do relatório.

## Detalhes técnicos
As exclusões serão persistidas no campo JSON já usado pelo relatório, sem nova tabela. A lista de chaves excluídas será considerada na reabertura, enquanto a recriação explícita limpará essa lista e reconstruirá somente as ações elegíveis atuais.
