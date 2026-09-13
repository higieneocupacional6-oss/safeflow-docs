# Plataforma multiusuário segura e concorrente

## Objetivo
Preparar o sistema para cinco usuários simultâneos, com atualização automática, contas seguras, prevenção de sobrescritas silenciosas e melhor desempenho em grandes volumes.

## Implementação

1. **Corrigir e provisionar os cinco acessos**
   - Manter os usuários existentes e redefinir suas senhas iniciais.
   - Criar Ana Cristina, Antonio Vilamar e Estagiário com a senha inicial informada, armazenada somente pelo serviço de autenticação em formato seguro.
   - Garantir Larissa como única administradora e os demais como usuários comuns.
   - Corrigir a tela de usuários para que criar, desativar, redefinir senha e alterar permissões sejam operações administrativas seguras, sem trocar a sessão do administrador nem expor senhas.
   - Exigir alteração da senha inicial no primeiro acesso.

2. **Adicionar concorrência otimista e auditoria**
   - Incluir versão, autor e data da última alteração nos registros compartilhados principais.
   - Criar operações atômicas no banco que só salvam quando a versão aberta pelo usuário ainda é atual.
   - Quando outra pessoa tiver alterado o mesmo registro, impedir a sobrescrita e oferecer atualização/revisão antes de novo salvamento.
   - Registrar histórico de criação, edição e exclusão para rastreabilidade.

3. **Fortalecer sincronização em tempo real**
   - Consolidar uma única assinatura global eficiente para as tabelas compartilhadas.
   - Atualizar apenas consultas afetadas, com reconexão automática e sincronização ao recuperar foco ou internet.
   - Evitar assinaturas duplicadas e rajadas de recarregamentos.
   - Exibir estado de conexão e avisos quando um registro aberto sofrer alteração externa.

4. **Eliminar operações vulneráveis a perda de dados**
   - Substituir fluxos de apagar-e-recriar por operações transacionais nos dados compostos prioritários.
   - Aplicar verificação de versão nos cadastros de empresas, contratos, setores, funções e riscos.
   - Aplicar proteção de versão aos documentos e autosaves de LTCAT/Insalubridade, PGR, PCMSO, AET e AEP, preservando os fluxos atuais.
   - Manter IDs permanentes e impedir duplo envio.

5. **Otimizar banco e consultas**
   - Criar índices direcionados às relações e filtros mais utilizados: empresa, contrato, documento, setor, função, tipo e datas.
   - Reduzir consultas amplas e refetches globais desnecessários.
   - Preservar paginação/ordenação e preparar listas para crescimento sem carregar dados irrelevantes.

6. **Validação**
   - Validar permissões, autenticação e primeiro acesso das cinco contas.
   - Simular cinco sessões independentes trabalhando na mesma empresa.
   - Testar criação simultânea, atualizações em registros distintos, conflito no mesmo registro, exclusão e reconexão.
   - Confirmar que nenhum conflito sobrescreve silenciosamente outra alteração.
   - Executar testes automatizados, verificar erros de execução e confirmar integridade das contagens antes/depois.

## Decisões confirmadas
- Larissa Monteiro será a única administradora.
- Os quatro demais acessos serão usuários comuns.
- Larissa e Klicia também terão a senha inicial redefinida.
- Conflitos serão bloqueados e exigirão confirmação/revisão, nunca “última gravação vence”.
- Não será criada uma nova estrutura de perfil; o cadastro já existente será mantido apenas para compatibilidade operacional.

## Limites de segurança
- A senha inicial não será gravada em tabelas da aplicação, código, logs ou interface.
- O teste de login não divulgará credenciais ou tokens.
- Alterações concorrentes em estruturas extensas serão rejeitadas com aviso, em vez de mescladas automaticamente sem garantia.
