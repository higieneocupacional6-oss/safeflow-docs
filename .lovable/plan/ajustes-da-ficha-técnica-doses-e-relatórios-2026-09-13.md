# Ajustes da Ficha Técnica: doses e relatórios

## Objetivo
Aprimorar a Ficha Técnica sem alterar os fluxos atuais de cadastro, edição, exclusão e importação.

## Implementação
- Adicionar **Dose Q3 (%)** e **Dose Q5 (%)** ao resultado de ruído, com persistência no banco e validação obrigatória junto de NEN e LAVG.
- Manter o limite de ruído fixo em 85 dB.
- Corrigir a importação para usar somente **NEN + Dose Q3** no LTCAT e somente **LAVG + Dose Q5** no Laudo de Insalubridade.
- Preservar a origem e a idempotência da importação para impedir duplicações.
- Adicionar **Nº de série/identificação** aos quatro formulários de resultados químicos que já usam amostrador.
- Criar um relatório PDF profissional do contrato com empresa, contrato, data, setor, função, agente, resultados, limites e amostrador/série quando aplicável.
- Adicionar **Amostradores usados** na página inicial da Ficha Técnica, com pesquisa por nome ou série e listagem por empresa, contrato, data e agente.
- Criar um relatório PDF do histórico filtrado de amostradores.

## Segurança e integridade
- Consultar somente registros permitidos pelas políticas existentes; relatórios serão montados a partir das consultas autenticadas ao banco.
- Não criar tabelas paralelas de empresas ou amostradores.
- Aplicar a alteração estrutural por migração, mantendo compatibilidade com registros anteriores.
- Não modificar dados ao gerar relatórios.

## Validação
- Verificar criação e edição de ruído com Q3/Q5, inclusive após recarregar a página.
- Testar importação para LTCAT e Insalubridade e confirmar que os critérios não se misturam.
- Confirmar ausência de duplicação em uma segunda importação.
- Verificar pesquisa e ambos os downloads em PDF com dados reais.
- Executar testes existentes, checagem de tipos e validação visual em desktop.
