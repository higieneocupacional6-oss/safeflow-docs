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
- [ ] Ordenar numericamente setores e GHE/GES na fonte exibida
- [ ] Reutilizar a mesma ordem na tela, no PDF e no Word
- [ ] Gerar relatório Word completo, editável, com cabeçalho e rodapé
- [ ] Adicionar os botões Baixar Word nos dois pontos de emissão
- [ ] Validar GERE/GHE/GES com 1, 2 e 10, além de PDF e DOCX
