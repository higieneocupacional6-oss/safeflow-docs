# Ficha Técnica e integração segura com LTCAT/Insalubridade

## Objetivo

Criar o módulo **Ficha Técnica** com resultados ocupacionais persistentes por empresa e contrato, mantendo cada medição independente e permitindo importação completa e sem duplicidade para LTCAT e Laudo de Insalubridade.

## Implementação

1. **Identificação do usuário**
   - Carregar o nome do perfil autenticado junto da sessão.
   - Exibir esse nome no topo ao lado do estado “Sincronizado”, mantendo o e-mail apenas como fallback caso o perfil ainda esteja carregando.

2. **Navegação da Ficha Técnica**
   - Adicionar “Ficha Técnica” abaixo de “Psicossocial” no grupo Avaliações.
   - Criar a tela inicial com empresas em cards.
   - Ao selecionar uma empresa, exibir somente seus contratos em formato de pastas.
   - Abrir uma página própria do contrato, validando sempre que o contrato pertence à empresa informada na URL.

3. **Cadastro e gestão de resultados**
   - Adicionar o menu “+ Resultados” com as oito categorias solicitadas.
   - Criar modal específico por categoria, com Setor e Função encadeados e restritos ao contrato selecionado.
   - Aplicar os limites fixos informados para ruído e vibração; manter os campos solicitados de calor e agentes químicos preenchíveis.
   - Salvar cada resultado com UUID próprio e mostrar todos em tabela, com ações de editar e excluir e confirmação antes da exclusão.
   - Manter múltiplos resultados equivalentes como registros independentes; não usar atualização por combinação de campos.

4. **Persistência, integridade e concorrência**
   - Criar uma tabela dedicada de resultados vinculada por chaves estrangeiras aos cadastros existentes de empresa, contrato, setor, função e risco/agente.
   - Validar no banco a cadeia Empresa → Contrato → Setor → Função e impedir combinações adulteradas.
   - Adicionar versão de linha, autoria, datas, índices de consulta e auditoria, preservando o padrão multiusuário atual.
   - Aplicar permissões somente a usuários autenticados, com regras de acesso equivalentes às entidades relacionadas e sem acesso anônimo.
   - Sincronizar a listagem em tempo real entre usuários.

5. **Importação para LTCAT e Insalubridade**
   - Ao selecionar empresa e contrato, consultar a existência de resultados correspondentes.
   - Não mostrar aviso quando não houver resultados ou quando o documento não for LTCAT/Insalubridade.
   - Quando houver, perguntar “Sim | Não” com o texto solicitado, sem interromper o fluxo atual ao escolher “Não”.
   - Ao escolher “Sim”, executar uma operação transacional que valide todos os vínculos e crie uma avaliação independente por resultado.
   - Mapear ruído, vibração, calor e químicos para as estruturas de avaliação já usadas pelo documento, deixando o parecer técnico em branco para preenchimento posterior.
   - Registrar a origem da Ficha Técnica na avaliação e garantir idempotência por documento + resultado de origem: repetir a importação não cria duplicatas, enquanto resultados distintos nunca se sobrescrevem.
   - Recarregar a listagem do documento somente após confirmação integral da operação.

## Validação

- Cadastrar, editar e excluir múltiplos resultados de todas as categorias, incluindo setor/função repetidos.
- Atualizar a página e reabrir a sessão, confirmando persistência e UUIDs independentes.
- Confirmar filtros corretos para múltiplas empresas, contratos, setores e funções.
- Importar todos os resultados para LTCAT e Insalubridade e validar campos, contagem, vínculos e parecer vazio.
- Repetir a importação e confirmar ausência de duplicação.
- Confirmar que IDs adulterados na URL ou no envio são rejeitados pelo banco.
- Validar sincronização multiusuário, políticas de acesso, testes automatizados e funcionamento em desktop/mobile.

## Escopo preservado

Os fluxos existentes de empresas, contratos, avaliações e geração de documentos permanecem inalterados quando não houver importação da Ficha Técnica ou quando o usuário escolher “Não”.
