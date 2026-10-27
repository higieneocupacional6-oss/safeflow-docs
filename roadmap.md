# Formulário AEP — falha de configuração da IA
- [x] Corrigir dependência da chave ausente usando o serviço de IA já configurado, mantendo modelo, autenticação e dados; função implantada.
- [x] Validar geração real autenticada na página atual até a prévia, sem aplicar/salvar propostas; zero erros de execução, 22 testes aprovados e build OK.

# AEP / APR-ERGO — campos compartilhados
- [x] Remover marcações legadas IA validar de todos os textos do PDF APR sem alterar os originais; PDF baixado inspecionado.
- [x] Compartilhar duração, intensidade e IDs estáveis entre registros AEP/APR do escopo exato; preservar ambiguidades e edições manuais, proteger atualizações concorrentes. Aplicado o vínculo por função que faltava no banco.
- [x] Testados APR → AEP e AEP → APR com salvamento, recarga, reabertura e igualdade do ID da atividade; 32 testes aprovados, aplicação compilada, PDF conferido, registros temporários removidos sem alterar dados reais.

# Variáveis e datas dos documentos
- [x] Corrigir persistência e contexto por risco das quatro variáveis no LTCAT e Insalubridade; descrição na avaliação-pai e nos dois RPCs, grupos preservam tipo/técnica/exposição/descrição.
- [x] Unificar datas civis sem conversão de fuso em formulários, regras e documentos de todos os módulos; banco mantém colunas date e timestamps de auditoria independentes.
- [x] Validar geração autenticada dos dois documentos com físicos/químicos/biológicos e datas 01/01, 15/06, 29/10 e 31/12/2026; salvamento/reabertura/validação/download DOCX conferidos, registros e template temporários removidos, dados reais preservados.

# Ficha Técnica
- [x] AET VALE: fotos com critérios NR-17, cópia reduzida só para análise e reutilização de anotação; Formulário AEP/APR/Psicossocial filtrados sem escopos ambíguos; Dados da AEP somente APR salva Alto/Muito Alto, tela/PDF e atualização automática. 25 testes, tela autenticada/PDF e ambas as chamadas reais de IA validados sem salvar propostas ou alterar históricos; imagem branca não gerou problemas, geração retornou 14 checklists. Recomendações em fotos reais de postos aguardam fotos fornecidas.
- [x] AET (VALE): análise individual de fotos, prévia/confirmacão, originais preservados, versões anotadas vinculadas, visualização/download e PDF. Fluxo autenticado real com imagem do manual validou ausência de problemas inventados, salvamento/reabertura e downloads; caixas/setas verificadas com marcação de teste. Avaliação temporária removida; validar recomendações em fotos reais de postos quando inseridas.
- [x] AET (VALE): downloads/status por função e plano mensal por empresa/contrato com anos, meses, cores, ações, IA baseada em avaliações salvas, template e persistência; 22 testes aprovados, salvamento/reabertura, PDF por função, geração real com prévia e exportação Word pelo template AET verificados; registros temporários removidos, documentos existentes preservados.
- [x] Preview — investigada a interrupção registrada às 15:17 na criação de aetValePdf.ts (arquivo incompleto, já corrigido no estado atual); reiniciado o servidor supervisionado sem alterar dados/autenticação. Login, sessão autenticada, página atual da AET (VALE) e cadastros carregaram sem exceções; acesso externo redireciona à autenticação do editor e não permite confirmar a tela do usuário.
- [x] Preview — corrigidos rejeição de leitura de sessão, carregamento indefinido e resultados obsoletos; identidade validada no servidor; 24 testes aprovados, token rejeitado retorna ao login, sessão persiste e troca obrigatória de senha respeitada; IA real, salvamento/reabertura/foto/PDF validados em documento temporário removido. Mensagem original não reproduzida; acesso externo ao Preview exige login do editor, indisponível no teste automatizado.
- [x] AET (VALE): tabela 5W2H na última etapa, PDF completo, salvamento e navegação; 19 testes aprovados, geração real sem Invalid token, foto/checklist/plano salvos e reabertos em registro temporário removido; PDF de sete páginas inspecionado, título fotográfico separado corrigido. Fidelidade ao documento original permanece aguardando anexo.
- [x] AET (VALE): Gerar IA para ambas as etapas e 5W2H; geração real, preservação manual, riscos da APR, salvamento e reabertura validados; 14 testes aprovados.
- [ ] AET (VALE): conferir fidelidade ao Anexo 04 original — aguardando envio do documento original; implementadas as orientações fornecidas.
- [x] Exibir nome cadastrado do usuário
- [x] Adicionar navegação por empresa e contrato
- [x] Criar cadastro persistente dos oito tipos de resultado
- [x] Permitir editar e excluir resultados
- [x] Integrar importação com LTCAT e Insalubridade
- [x] Validar persistência, ausência de duplicação e segurança
- [x] Adicionar Dose Q3 e Dose Q5 ao ruído
- [x] Separar critérios de importação LTCAT e Insalubridade
- [x] Gerar relatório preliminar do contrato
- [x] Adicionar série/identificação aos amostradores químicos
- [x] Criar pesquisa e relatório de amostradores usados
- [x] Validar persistência, importação, PDFs e ausência de regressões

# Proteção offline LTCAT e Insalubridade
- [x] Criar fila durável e consolidada por usuário/documento
- [x] Integrar persistência local antes do envio e recuperação após recarga
- [x] Implementar reconexão, retry progressivo e conflito preservado
- [x] Exibir estados confiáveis de sincronização
- [x] Testar quedas, retries, cliques repetidos e documentos grandes

# Performance LTCAT e Insalubridade
- [x] Medir chamadas e payloads antes das otimizações
- [x] Reduzir consultas iniciais e colunas dos cadastros pesados
- [x] Remover persistências duplicadas e gatilhos involuntários
- [x] Enviar somente metadados e avaliações realmente alterados
- [x] Preservar fila offline, recuperação, retry e conflitos
- [x] Validar documentos pequenos e grandes, reload, offline e concorrência

# Condições químicas no DOCX
- [x] Condicionar fumos e poeiras metálicas a resultado quantitativo
- [x] Reconhecer marcadores divididos em runs e dentro de tabelas
- [x] Remover todos os marcadores do documento final
- [x] Validar fumos, poeiras, ambos e nenhum

# Plano de Ação Psicossocial
- [x] Gerar ações somente para classificações Média e Alta
- [x] Excluir ações individualmente com confirmação
- [x] Persistir exclusões e permitir recriação voluntária
- [x] Validar geração, exclusão, recarga, IA e PDF

# Relatórios Psicossociais — ordenação e Word
- [x] Ordenar numericamente setores e GHE/GES na fonte exibida
- [x] Reutilizar a mesma ordem na tela, no PDF e no Word
- [x] Gerar relatório Word completo, editável, com cabeçalho e rodapé
- [x] Adicionar os botões Baixar Word nos dois pontos de emissão
- [x] Validar GERE/GHE/GES com 1, 2 e 10, além de PDF e DOCX

# Relatórios Psicossociais — textos e classificações
- [x] Revisar textos padrão e instruções gramaticais da IA
- [x] Remover Evolução histórica da tela, persistência, PDF e Word
- [x] Tratar resultados não sustentados como Baixo em todas as apresentações
- [x] Restringir frequência a Eventual, Intermitente ou Habitual
- [x] Corrigir e validar o download DOCX no navegador

# Integração Psicossociais → AEP → AET
- [x] Consultar somente relatório Psicossocial salvo da mesma empresa e contrato
- [x] Correlacionar setor, GHE/GES e função sem misturar escopos
- [x] Usar contexto Psicossocial para complementar a AEP sem sobrescrever edições manuais
- [x] Usar contexto Psicossocial e AEP salva para complementar a AET
- [x] Validar isolamento, preservação manual e geração com e sem contexto

# AEP — Riscos Ergonômicos por atividade
- [x] Considerar riscos baixos, médios e altos sem filtrar somente os mais graves
- [x] Exigir fatores aplicáveis por agente sem inventar conteúdo para completar mínimos
- [x] Cruzar função, atividade, empresa, setor/GHE/GES, contexto salvo e Psicossociais
- [x] Agrupar a apresentação em Baixo, Médio e Alto preservando o cálculo interno
- [x] Validar geração, preservação manual, tipos, testes e função de IA

# Psicossocial — cadastro atual Florestas/S11D
- [x] Corrigir origem dos grupos e vínculos por IDs atuais da empresa/contrato
- [x] Atualizar contexto da IA e compartilhar dados atuais entre tela/PDF/Word
- [x] Validar Florestas/S11D na tela e PDF, conteúdo Word, exclusões, recarga e ausência de gravação automática
- [ ] Validar geração real com IA e download Word completo: contexto e conteúdo verificados; geração não executada e clique Word sem download no teste

# Integração inteligente AEP → AET
- [x] Reforçar correspondência por setor, GHE/GES e IDs de função
- [x] Estruturar decisão, motivos e pontos da AEP a aprofundar na AET
- [x] Vincular diagnóstico e soluções aos problemas da AEP, sem inventar medições
- [x] Validar testes de isolamento e geração real da AET: 76 testes aprovados; geração fictícia HTTP 200 com 12 campos, vínculo explícito e tempos não inventados; sem gravações em documentos reais

# Formulário AEP — layout e IA
- [x] Parte 2 sem rolagem horizontal
- [x] Botão Base (até 4 PDF/DOCX/XLSX por empresa)
- [x] Botão Gerar IA com prévia, origem informado/inferido e confirmação antes de substituir

# APR-ERGO — etapas iniciais
- [x] Adicionar opção após AEP e lista exclusiva de APR-ERGO
- [x] Selecionar empresa, contrato e setores com todas as funções atuais
- [x] Permitir vários registros por setor sem duplicar cadastros
- [x] Validar navegação, isolamento e persistência dos registros

# APR-ERGO — tabela e IA
- [x] Melhorar leitura e miniaturas sem mudar a estrutura
- [x] Integrar Base de até 6 arquivos e IA com prévia e proteção de edições
- [x] Reutilizar duração/intensidade AEP do mesmo escopo; severidade/perfil/risco vazios porque Anexo 01 não os persiste por fator
- [x] Validar geração real com referência e AEP temporárias, confirmação, salvamento, reabertura, preservação de foto/texto e limpeza dos testes

# APR-ERGO — resumo do setor e conduta da matriz
- [x] Ajustar células legíveis, Cargo com funções atuais e retirar descrição do cargo
- [x] Gerar resumos de atividades/ambiente com prévia e preservação manual
- [x] Aplicar condutas da Base após cálculo e cores automáticas por risco
- [x] Validar 14 testes, tela autenticada e geração real com PDF da Base; sem salvar alterações no documento existente

# APR-HO — condutas, cenários e PDF
- [x] Ajustar exclusão individual com confirmação, nomes por função e IA conjunta por atividades; 28 testes aprovados, criação/salvamento/reabertura/PDF com foto e exclusão temporária validados, duas APRs originais preservadas; IA real gerou três cenários comuns com quatro funções vinculadas, sem nomes na circunstância e sem salvar alterações no documento existente
- [x] Restringir Alto/Muito Alto à conduta da matriz
- [x] Remover limite de cenários e manter vínculos de função/setor sem duplicatas
- [x] Adicionar Baixar PDF completo da planilha atual com fotos e paginação
- [x] Validar 18 testes, geração real de 11 cenários e download autenticado; PDF com fotos/texto longo em seis páginas e análise em três páginas, sem cortes; quebra de texto em negrito ajustada; nenhum registro real alterado

# APR-ERGO — listagem consolidada e plano de ação 5W2H
- [ ] Listagem: todos os setores do contrato com suas avaliações em uma página, sem seleção prévia.
- [ ] Botão Plano de Ação abrindo planilha 5W2H consolidada (setor, função, risco, prioridade, resultado esperado, vínculo com a APR).
- [ ] Gerar IA a partir das APR-ERGO salvas do escopo exato, priorizando riscos críticos, sem inventar dados.
- [ ] Edição, salvamento persistente e falha de IA sem perda de dados; testes e validação.
