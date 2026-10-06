# Ajustar os Riscos Ergonômicos da AEP

## Objetivo
Fazer a AEP identificar riscos baixos, médios e altos conforme a realidade de cada função, cruzando os dados disponíveis sem inventar fatores para cumprir quantidade.

## Implementação
1. **Análise por função e contexto**
   - Reforçar na geração o cruzamento de função, atividades executadas e da empresa, setor/GHE/GES, dados já cadastrados na AEP e relatório Psicossocial correspondente.
   - Considerar todos os fatores sustentados pelo contexto, sem limitar a análise aos riscos mais graves.

2. **Cobertura por agente**
   - Para agentes aplicáveis, orientar a busca de pelo menos 4 fatores físicos, 3 organizacionais, 3 cognitivos e 4 psicossociais.
   - Permitir mais fatores quando pertinentes e menos quando os dados não sustentarem o mínimo, deixando explícita a insuficiência de evidência em vez de criar riscos genéricos.
   - Manter os quatro tipos de agentes representados, registrando tecnicamente a não aplicabilidade quando não houver fator comprovável.

3. **Classificação e apresentação**
   - Preservar a matriz interna existente e agrupar somente a apresentação: Trivial como Baixo, Moderado como Médio e Alto/Crítico como Alto.
   - Exibir justificativa coerente por meio do fator, fonte geradora, probabilidade, severidade e medidas recomendadas já editáveis.
   - Aplicar a mesma classificação agrupada ao documento gerado para evitar divergência entre tela e exportação.

4. **Segurança das edições e validação**
   - Preservar o modo complementar, sem substituir riscos preenchidos manualmente.
   - Criar testes para agrupamento dos níveis, inclusão de riscos baixos e médios e regra de fatores por agente sem preenchimento artificial.
   - Atualizar e implantar a geração da AEP, validando testes, tipos e compilação.

## Sem alterações
- Cálculo interno da matriz de risco.
- Dados já salvos e edição manual.
- Outros módulos e fluxos da AEP.
