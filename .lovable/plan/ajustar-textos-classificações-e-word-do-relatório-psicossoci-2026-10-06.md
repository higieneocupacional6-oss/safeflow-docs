# Ajustar textos, classificações e Word do relatório psicossocial

## Objetivo
Uniformizar o relatório psicossocial na tela, persistência e exportações, sem alterar a metodologia de cálculo nem outras funcionalidades do módulo.

## Implementação
- Centralizar a normalização dos dados apresentados: resultados não sustentados passam a ser exibidos como **Baixo**, a expressão de conformidade substitui a redação antiga e a frequência fica restrita a **Eventual**, **Intermitente** ou **Habitual**.
- Corrigir os textos técnicos padrão e reforçar as instruções e o formato de resposta da IA para português brasileiro completo, profissional e coerente, sem respostas telegráficas.
- Remover totalmente “Evolução histórica” da tela, estado editável, persistência nova, carregamento, PDF, Word e contexto relacionado.
- Fazer tela, PDF e Word consumirem o mesmo conteúdo normalizado e numericamente ordenado, preservando edições atuais e registros já salvos.
- Corrigir a geração e o download do Word existente, garantindo pacote DOCX válido, editável e com tipo de arquivo compatível no navegador.

## Validação
- Testar as substituições e frequências permitidas, inclusive ao reabrir dados antigos.
- Confirmar que “Evolução histórica” e expressões antigas não aparecem na tela, PDF ou Word.
- Validar o conteúdo interno do DOCX, cabeçalho, rodapé, tabelas, ordenação numérica e ausência das nomenclaturas removidas.
- Executar testes completos, verificação de tipos e compilação.

## Detalhes técnicos
- A metodologia COPSOQ, os limiares, a matriz Probabilidade × Severidade e a regra do Plano de Ação permanecem inalterados.
- Dados legados serão normalizados na leitura/apresentação; nenhum registro histórico será reclassificado diretamente no banco apenas para corrigir nomenclatura.
