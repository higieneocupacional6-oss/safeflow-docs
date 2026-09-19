# Persistência segura do LTCAT e Insalubridade

## Objetivo
Impedir que salvamentos incompletos, antigos ou concorrentes removam ou sobrescrevam avaliações existentes, mantendo compatibilidade integral com documentos atuais.

## Implementação

1. **Sincronização incremental no banco**
   - Substituir a sincronização destrutiva por uma operação transacional incremental.
   - Processar avaliações e sub-registros individualmente por UUID: novos serão incluídos e existentes serão atualizados.
   - Remover somente IDs enviados explicitamente como excluídos pelo usuário.
   - Nunca interpretar ausência no pacote como exclusão.
   - Serializar operações do mesmo documento com bloqueio transacional.

2. **Controle de versão**
   - Enviar a versão carregada do documento em cada salvamento.
   - Conferir essa versão no banco dentro da mesma transação que persiste o documento e suas avaliações.
   - Em conflito, não alterar nenhum dado no banco, manter o conteúdo local e informar que existem alterações mais recentes.
   - Atualizar a versão local somente após confirmação integral do banco.

3. **Fila e consolidação no navegador**
   - Manter uma única fila por documento, aguardando a gravação atual antes da próxima.
   - Consolidar chamadas rápidas e evitar persistência quando o conteúdo não mudou.
   - Registrar exclusões explícitas e só removê-las da fila após confirmação do banco.

4. **Proteção da tela e retorno correto**
   - Identificar cada carregamento e ignorar respostas antigas quando houver edição ou carregamento mais recente.
   - Não reidratar por foco/tempo real enquanto existirem alterações locais.
   - Corrigir o fluxo de “Finalizar risco” para fechar o formulário e mostrar sucesso apenas quando toda a transação for confirmada.
   - Em falha ou conflito, conservar formulário, avaliações e estado de não salvo.

5. **Compatibilidade e testes**
   - Não modificar, migrar, apagar ou reconstruir dados existentes.
   - Manter UUIDs e formatos antigos aceitos pela leitura atual.
   - Adicionar testes para inclusão, alteração, exclusão explícita, chamadas rápidas, documento grande, conflito de versão, falha de conexão e recarga após confirmação.
   - Validar o fluxo no navegador, os testes automatizados e a integridade do banco sem alterar documentos reais durante os testes.

## Detalhes técnicos
- A nova função transacional receberá cabeçalho, versão esperada, alterações incrementais e IDs explicitamente excluídos.
- O bloqueio será por documento e valerá durante toda a transação.
- Filhos de uma avaliação serão atualizados por UUID; exclusões de filhos também serão explícitas, sem limpeza integral automática.
- Documentos novos continuarão sendo criados pelo fluxo atual e passarão a usar a versão retornada pelo banco nos salvamentos seguintes.
