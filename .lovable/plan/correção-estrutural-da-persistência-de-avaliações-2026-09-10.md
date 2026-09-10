# Correção estrutural da persistência de avaliações

## Diagnóstico confirmado

- O salvamento atual executa `DELETE` de todas as avaliações do documento e depois faz vários `INSERT`s separados. Uma falha, fechamento da página ou nova chamada durante esse intervalo deixa o documento parcial.
- Ao final do salvamento, uma rotina considera duplicadas avaliações com o mesmo setor, função, agente, colaborador e tipo, e exclui todas menos uma. Isso viola diretamente a regra de avaliações independentes.
- No carregamento, avaliações do mesmo setor/agente/tipo são agrupadas e os colaboradores são desduplicados por nome + função. Assim, registros diferentes podem virar uma única linha na tela.
- Os IDs permanentes do banco não são preservados nos itens carregados; são substituídos por IDs temporários. A edição e exclusão deixam de apontar com segurança para uma avaliação específica.
- A edição exibida por colaborador abre a primeira avaliação do agente, não necessariamente a avaliação escolhida.
- O banco já possui chave primária UUID individual e não tem restrição que impeça várias avaliações do mesmo agente. A perda está no fluxo de sincronização da aplicação.

## Implementação

1. **Identidade permanente por avaliação**
   - Preservar o UUID da linha de `ltcat_avaliacoes` durante carregamento, edição e exclusão.
   - Gerar UUID permanente para cada nova avaliação antes do primeiro salvamento.
   - Representar cada avaliação como unidade independente, mesmo quando setor, agente, função e colaborador forem iguais.

2. **Persistência incremental e segura**
   - Remover o ciclo destrutivo “apagar tudo e recriar”.
   - Inserir somente avaliações novas, atualizar somente IDs existentes e excluir somente IDs removidos explicitamente.
   - Manter os subdados de cada avaliação vinculados exclusivamente ao seu UUID.
   - Verificar os erros de todas as gravações; nenhum salvamento será marcado como concluído se uma etapa falhar.
   - Serializar autosave, salvamento manual e troca de etapa usando sempre o snapshot mais recente.

3. **Carregamento sem consolidação destrutiva**
   - Carregar todas as avaliações do documento, sem agrupamento ou deduplicação por conteúdo.
   - Preservar ordem e IDs do banco para 100+ registros.
   - Eliminar o fallback por empresa que pode misturar avaliações de documentos diferentes; manter compatibilidade do espelhamento LTCAT/Insalubridade somente pela origem correta do documento.

4. **Edição e exclusão pontuais**
   - Fazer o botão de editar abrir exatamente o UUID selecionado.
   - Fazer a exclusão remover somente esse UUID e seus subdados relacionados.
   - Remover a limpeza automática que apaga avaliações “duplicadas” legítimas.

5. **Banco e integridade**
   - Criar uma operação transacional no backend para reconciliar uma avaliação e seus subdados, evitando estado parcial.
   - Manter as chaves estrangeiras e exclusão em cascata já existentes.
   - Não criar índice único por setor/agente/função/colaborador e não impor limite de quantidade.

## Validação obrigatória

- Criar 10 avaliações de Ruído no mesmo setor, incluindo registros com função/colaborador repetidos.
- Criar avaliações de agentes diferentes no mesmo documento.
- Confirmar a contagem e os UUIDs no banco.
- Atualizar a página e reabrir o documento em uma nova sessão.
- Editar uma avaliação intermediária e confirmar que somente seu UUID mudou.
- Excluir uma avaliação intermediária e confirmar que somente seu UUID e subdados foram removidos.
- Confirmar que todas as demais avaliações continuam intactas no LTCAT e no Laudo de Insalubridade.

## Escopo

Somente a persistência, carregamento, edição e exclusão de avaliações no LTCAT e no Laudo de Insalubridade. O layout e os demais módulos permanecem inalterados.
