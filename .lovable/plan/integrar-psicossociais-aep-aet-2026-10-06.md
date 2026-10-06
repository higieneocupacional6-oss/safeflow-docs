# Integrar Psicossociais → AEP → AET

## Objetivo
Usar somente relatórios Psicossociais salvos da mesma empresa e contrato para complementar a AEP e, na AET, combinar esse contexto com uma AEP salva correspondente. Nenhuma edição manual será gravada ou sobrescrita automaticamente.

## Implementação
1. **Contexto Psicossocial salvo**
   - Trocar a origem atual de respostas avulsas pelo conteúdo persistido em `psico_relatorios`.
   - Exigir correspondência exata de empresa e contrato.
   - Correlacionar cada grupo por setor, GHE/GES e função, priorizando IDs disponíveis e usando nomes normalizados apenas como apoio.
   - Levar atividades, organização do trabalho, fatores, frequência, riscos, medidas e recomendações como contexto técnico de leitura.

2. **Contexto da AEP para a AET**
   - Criar um carregador somente leitura para a AEP salva da mesma empresa e contrato.
   - Selecionar o setor/GHE/GES e as funções correspondentes, sem misturar documentos ou grupos diferentes.
   - Enviar riscos, pareceres, condutas e plano de ação da AEP como contexto anterior para a elaboração da AET.

3. **Geração complementar e preservação manual**
   - Manter Psicossociais → AEP como contexto, sem cópia literal.
   - Aplicar na AET a precedência Psicossociais → AEP → AET, aprofundando a análise conforme a finalidade da NR-17.
   - Não preencher campos diretamente ao carregar contexto; somente a ação explícita “Gerar com IA” poderá usar os dados.
   - Preservar os modos atuais de complementar/manter e impedir que o novo contexto sobrescreva conteúdo manual por conta própria.

4. **Visibilidade e validação**
   - Mostrar quais dados Psicossociais e de AEP foram considerados, com indicação de correspondência por setor/GHE/GES.
   - Cobrir com testes: empresa/contrato exatos, correspondência de grupo e função, ausência de contexto, isolamento entre contratos e preservação de conteúdo manual.
   - Implantar a geração atualizada da AET e validar testes, tipos e compilação.

## Sem alterações
- Metodologia e cálculos do módulo Psicossocial.
- Estrutura dos documentos já salvos.
- Fluxos existentes de edição manual, exportação e persistência.
