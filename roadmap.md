# Ficha Técnica
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
