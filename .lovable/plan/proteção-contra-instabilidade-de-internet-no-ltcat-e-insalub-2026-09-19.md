# Proteção contra instabilidade de internet no LTCAT e Insalubridade

## Objetivo
Garantir que alterações ainda não confirmadas permaneçam recuperáveis após queda de conexão, atualização ou fechamento inesperado, sem alterar a persistência incremental e o controle de versão já implantados.

## Implementação

1. **Fila durável e estruturada**
   - Criar uma fila em IndexedDB, isolada por usuário, tipo e documento.
   - Registrar cada salvamento pendente antes da tentativa de envio.
   - Manter somente a operação consolidada mais recente por documento, preservando IDs, exclusões explícitas, versão esperada e conteúdo necessário para recuperar a tela.
   - Remover uma operação somente após confirmação integral da função transacional do banco.

2. **Envio incremental e idempotente**
   - Reutilizar a função transacional e os UUIDs atuais para upserts e exclusões explícitas.
   - Consolidar alterações próximas antes do envio e impedir requisições simultâneas do mesmo documento.
   - Não interpretar ausência como exclusão e não repetir conteúdo já confirmado.

3. **Reconexão e retry**
   - Detectar os eventos online/offline e retomar automaticamente a fila.
   - Aplicar backoff progressivo limitado para falhas transitórias, com uma única tentativa agendada por documento.
   - Interromper retries automáticos em conflito de versão ou erro permanente.

4. **Recuperação e conflitos**
   - Ao abrir o documento, consultar primeiro a fila local e reaplicar o estado pendente sem permitir que o carregamento do banco o sobrescreva.
   - Em conflito, manter banco e fila intactos, manter a edição local na tela e informar que existe uma versão mais recente.
   - Manter compatibilidade de leitura com documentos antigos e com documentos sem fila local.

5. **Status visual**
   - Exibir um único status confiável: Salvo, Salvando, Alterações pendentes, Sem conexão — alterações protegidas, Sincronizando ou Sincronizado.
   - Nunca mostrar Salvo/Sincronizado antes da confirmação real do banco.

6. **Testes**
   - Cobrir salvamento normal, queda antes e durante o envio, reconexão, várias alterações offline, recuperação após recarga, erro temporário, cliques repetidos, conflito e documento grande.
   - Medir a consolidação de alterações rápidas e confirmar que operações confirmadas não são reenviadas.
   - Validar testes automatizados, build e fluxo no navegador sem modificar documentos reais.

## Detalhes técnicos
- IndexedDB será usada em vez de armazenamento indiscriminado; a fila terá schema versionado e registros substituíveis por chave de documento.
- A operação durável conterá metadados, versão esperada, alterações incrementais, exclusões explícitas e um checkpoint local único para reconstrução da tela.
- O backoff será progressivo, limitado e cancelável por reconexão, nova alteração consolidada ou desmontagem da tela.
- A função `save_ltcat_documento_v2` e suas garantias transacionais permanecem como confirmação definitiva.
