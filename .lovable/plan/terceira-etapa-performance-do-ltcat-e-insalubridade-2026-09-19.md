# Terceira etapa — performance do LTCAT e Insalubridade

## Objetivo
Reduzir consultas, processamento e tamanho dos envios em documentos grandes, garantindo uma única persistência consolidada por sequência real de edição e preservando integralmente IndexedDB, UUIDs, retry, reconexão, recuperação e conflitos da etapa 2.

## Implementação

1. **Medição antes e depois**
   - Instrumentar o fluxo de persistência em testes para contar checkpoints locais, chamadas reais ao banco e bytes serializados.
   - Fixar cenários reproduzíveis: alteração de um campo, várias teclas em sequência, vários campos rápidos, clique repetido, documento pequeno e documento com muitas avaliações.
   - Usar como referência histórica as 750+ gravações observadas no diagnóstico e como baseline técnico o comportamento atual da etapa 2.

2. **Payload incremental de verdade**
   - Separar o checkpoint completo de recuperação, mantido no IndexedDB, do pacote enviado ao banco.
   - Remover do envio rotineiro o snapshot completo com todas as avaliações; o banco receberá somente metadados realmente alterados, avaliações alteradas e exclusões explícitas.
   - Manter a reconstrução das avaliações confirmadas pelas tabelas normalizadas e preservar localmente formulários ainda em edição.
   - Não reenviar avaliações inalteradas e não interpretar ausência como exclusão.

3. **Consolidação das gravações**
   - Manter o checkpoint local rápido e o envio consolidado após 5 segundos.
   - Impedir que alteração de etapa, abertura/fechamento de modal, hidratação, renderização, foco, visibilidade ou eco do tempo real criem uma gravação sem mudança persistível.
   - Fazer botões e ações obrigatórias reutilizarem a operação pendente mais recente, sem criar uma segunda chamada idêntica.
   - Manter gravação imediata somente para ações que exigem confirmação antes de continuar, como finalizar/excluir avaliação, importar, validar e gerar documento.

4. **Carregamento sob demanda**
   - Trocar `select("*")` por colunas efetivamente usadas nas consultas do documento e dos catálogos.
   - Carregar catálogos de riscos, técnicas, EPI/EPC e detalhes completos de equipamentos apenas quando a etapa ou modal correspondente precisar deles.
   - Manter templates e arquivos binários sob demanda; o arquivo do template continuará sendo baixado somente ao validar/gerar.
   - Evitar a consulta paralela de dados da empresa inteira quando o documento já carrega suas avaliações pelo `documento_id`.
   - Deduplicar consultas de funções/setores/agentes já disponíveis em cache e impedir recargas completas repetidas por foco, mudança de etapa ou múltiplos eventos de tempo real próximos.

5. **Processamento de documentos grandes**
   - Calcular a normalização e as impressões digitais somente quando o conteúdo persistível mudar, reutilizando mapas por ID para catálogos consultados repetidamente.
   - Consolidar eventos de tempo real em uma única recarga e manter a proteção contra resposta antiga.
   - Não carregar anexos, imagens ou arquivos de documento na abertura; apenas seus metadados mínimos quando necessários.

6. **Compatibilidade e segurança**
   - Não alterar dados existentes, regras de negócio, layout, UUIDs ou a função transacional incremental.
   - Preservar versionamento otimista: conflito mantém banco e edição local intactos e interrompe retry automático.
   - Preservar criação, edição, exclusão explícita, importação da Ficha Técnica e geração de documento.

7. **Testes e validação**
   - Testar contagem de chamadas para edição única, digitação rápida, vários campos e cliques repetidos.
   - Testar diferença de payload entre documento completo e alteração incremental em documentos pequeno e grande.
   - Testar reload com checkpoint, queda antes/durante envio, retorno online e erro temporário.
   - Testar conflito entre dois usuários sem sobrescrita e sem duplicação.
   - Executar todos os testes automatizados, validação de tipos, build e uma verificação no navegador.

## Resultado mensurável esperado
- Uma sequência contínua de edição gera **um checkpoint local consolidado e no máximo uma chamada ao banco** após 5 segundos.
- Mudanças apenas visuais ou de navegação geram **zero chamadas ao banco**.
- O pacote de uma alteração passa a crescer conforme o bloco alterado, não conforme o tamanho total do documento.
- O relatório final apresentará contagens e bytes medidos antes/depois; não serão estimados números sem evidência.

## Arquivos previstos
- `src/pages/LtcatWizard.tsx`
- `src/lib/ltcatOfflineQueue.ts`
- `src/lib/ltcatPersistence.ts`
- testes de persistência, fila offline e performance do LTCAT
- `roadmap.md`
