SAFEFLOW
Product Requirements Document (PRD) — versão de análise técnica
Escopo: funcionalidades, regras de negócio, fluxos, dados, integrações, segurança, persistência, exportação e validações identificadas no repositório safeflow-docs.
Data da análise: 25 de outubro de 2026 | Branch analisada: main
Repositório: https://github.com/higieneocupacional6-oss/safeflow-docs
Nota de leitura e confiabilidade
Este PRD foi elaborado a partir da estrutura do código, das rotas, dos componentes, das bibliotecas de domínio, das funções Supabase, das migrações e do roadmap/AGENTS.md versionados no repositório. “Implementado no código” significa que há implementação identificável; “validação registrada” significa que o roadmap descreve testes ou verificações; “pendente de confirmação” indica que a documentação não permite afirmar conclusão funcional em produção. O documento não substitui uma auditoria de execução em ambiente de produção.
Segredos e valores privados de configuração não são reproduzidos neste documento. O arquivo .env existente no repositório não foi lido nem seus valores copiados. Recomenda-se removê-lo do controle de versão se contiver credenciais, rotacionar quaisquer segredos expostos e manter apenas um .env.example sem valores reais.
1. Resumo executivo
SafeFlow é uma aplicação web para apoiar a gestão técnica de Saúde e Segurança do Trabalho (SST), higiene ocupacional e ergonomia. Centraliza cadastros de empresas, contratos, setores, GHE/GES e funções; cria e mantém documentos técnicos; organiza avaliações e resultados de higiene ocupacional; oferece geração assistida por IA; e exporta documentos editáveis e relatórios em PDF.
O sistema é uma aplicação React + TypeScript com roteamento no navegador, componentes de interface baseados em Radix/shadcn, TanStack Query para consultas e cache, Supabase para autenticação, banco PostgreSQL, sincronização em tempo real, armazenamento de arquivos e Edge Functions. Há ainda utilitários próprios para templates DOCX/HTML, PDF, cálculos de matrizes, datas civis, filas offline e integração contextual entre avaliações.
2. Objetivo do produto
•	Reduzir retrabalho e dispersão de dados na elaboração de documentos de SST.
•	Manter cadastros organizados por empresa, contrato, setor, GHE/GES e função.
•	Permitir que resultados de higiene ocupacional sejam registrados uma vez e reaproveitados com critérios explícitos nos documentos aplicáveis.
•	Gerar documentos técnicos em formatos editáveis e PDF, com modelos configuráveis.
•	Usar IA como apoio à redação e análise técnica, mantendo escopo, prévia e confirmação quando implementados.
•	Preservar os dados do usuário diante de recarga de página, instabilidade de internet, operações repetidas e concorrência.
•	Manter consistência entre tela, persistência e exportações, evitando divergências de ordenação, nomenclatura ou classificação.
3. Usuários e permissões
Perfil / ator	Capacidades identificadas	Observações
Administrador (admin)	Acesso à área de usuários; gestão de usuários e papéis por interface própria.	A rota /usuarios é protegida por permissão administrativa.
Usuário autenticado (usuario)	Acesso às áreas operacionais protegidas, conforme as regras de autorização do backend.	O código assume usuário padrão quando não há papel explícito; autorização efetiva também depende das políticas do banco/Edge Functions.
Respondente externo psicossocial	Preenchimento de avaliação por rota pública com token.	A rota /avaliacao-psicossocial/:token não usa o mesmo invólucro de página protegida; token deve delimitar a avaliação permitida.
Responsável técnico / elaborador	Cadastro e edição de avaliações e documentos técnicos, aplicação de métodos e emissão de arquivos.	O sistema oferece campos de responsável e registro profissional em fluxos de documentos, quando aplicável.
4. Navegação e mapa funcional
Área	Rotas principais	Finalidade
Autenticação	/login; /alterar-senha	Entrada, recuperação da sessão e troca obrigatória de senha quando sinalizada.
Cadastros	/empresas; /empresas-contratos; /setores-funcoes; /cadastros	Empresas, contratos, setores/funções e cadastros técnicos de apoio.
Documentos	/documentos; /documentos/controle	Listagem hierárquica por tipo/empresa/contrato e controle de documentos/anexos.
Documentos técnicos	/documentos/ltcat/*; /documentos/pgr/*; /documentos/pcmso/*; /documentos/aet/*; /documentos/aep/*	Criação, edição e emissão dos principais documentos de SST.
AET VALE	/documentos/aet-vale; /documentos/aet-vale/registro/:id; /documentos/aet-vale/plano/:empresaId/:contratoId	Fluxo específico de ergonomia com fotos, etapas, plano e cronograma contratual.
APR-ERGO	/documentos/apr-ergo/*	Registros APR-ERGO por setor/função, geração assistida e exportação.
Avaliações	/psicossocial/*; /ficha-tecnica/*; /formulario-aep/*	Avaliação psicossocial, resultados de higiene ocupacional e formulário AEP.
Modelos	/templates; /templates/avaliacoes-psicossociais	Gestão de templates DOCX/HTML e modelos psicossociais.
Administração	/usuarios	Gestão de contas e papéis administrativos.
A rota inicial “/” redireciona para “/empresas”. A aplicação usa BrowserRouter, AuthProvider, ProtectedRoute, AppLayout e sincronização global. A navegação lateral agrupa as funções em Cadastros, Documentos, Avaliações e Gestão.
5. Cadastros mestres e relacionamento dos dados
5.1 Empresas
•	Cadastro, listagem, busca por razão social/CNPJ, edição e exclusão.
•	Dados empresariais são usados como contexto por documentos, contratos, avaliações e relatórios.
•	Consultas de listagem são atualizadas por sincronização realtime.
5.2 Contratos
•	Contrato associado a uma empresa, com identificadores e dados como número, contratante, escopo/objeto e local de trabalho conforme o formulário.
•	Os módulos operacionais devem selecionar a empresa e o contrato antes de consultar setores, funções e documentos vinculados.
•	A empresa/contrato exatos são parte da chave de escopo de IA e relatórios; não misturar dados de contratos diferentes.
5.3 Setores, GHE/GES e funções
•	Cadastro de setores por empresa/contrato, identificação GHE/GES e descrição do ambiente.
•	Cadastro de funções relacionadas ao setor, incluindo nome, CBO e descrição das atividades.
•	Edição, movimentação de função entre setores e exclusão com tratamento de erro.
•	Ordenação numérica de GHE/GES para evitar que “10” apareça antes de “2”.
•	Os documentos e módulos de avaliação devem usar IDs dos cadastros atuais como referência primária, recorrendo a nomes legados apenas quando a correspondência for única e inequívoca.
5.4 Cadastros técnicos gerais
•	Agentes/riscos, técnicas, unidades, equipamentos, EPI/EPC, pareceres, treinamentos, exames e responsáveis.
•	Cadastro e controle de equipamentos de medição, incluindo marca/modelo, número de série, data de calibração e situação de calibração.
•	Aviso visual para calibração, com cálculo centralizado de status.
•	Sugestões de EPI/EPC associadas a riscos e autocompletes de CBO/eSocial.
•	Calculadoras e utilitários para NEN/ruído e agentes químicos.
6. Gestão documental
6.1 Lista e organização
A área Documentos lista e organiza documentos por tipo, empresa e contrato. Os tipos canônicos identificados incluem LTCAT, Insalubridade, Periculosidade, PGR, PCMSO, AET, AET-VALE, AEP e APR-ERGO. Há busca, expansão/recolhimento de grupos, criação, edição, download e exclusão com confirmação, conforme o fluxo.
6.2 Controle de documentos
•	Controle com agrupamento por empresa/contrato e filtros por empresa, tipo e status.
•	Upload e download de arquivos anexos vinculados ao documento.
•	Status de validade: vencido, próximo vencimento, no prazo ou sem status calculável.
•	Datas apresentadas usando utilitário de data civil para reduzir deslocamentos por fuso horário.
•	A interface utiliza badges para tornar o estado documental legível.
6.3 Templates e variáveis
•	Cadastro e gerenciamento de templates DOCX e HTML.
•	Validação de templates antes de uso, com apresentação de problemas encontrados.
•	Helpers específicos de template para LTCAT, AET, COPSOQ, PGR e PCMSO.
•	Suporte a variáveis e blocos condicionais; sanitização/validação de DOCX antes da emissão.
•	Exportação por renderização HTML para DOCX ou preenchimento de modelos DOCX, conforme o módulo.
•	Templates psicossociais e base de conhecimento de IA são áreas próprias.
7. Documentos técnicos: requisitos funcionais
7.1 LTCAT
•	Assistente de criação/edição com empresa, contrato, responsável técnico, registro profissional, cargo, data de elaboração, revisões e template.
•	Cadastro de avaliações por risco/agente e associação de informações quantitativas ou qualitativas conforme o tipo de avaliação.
•	Persistência de avaliações principais e entidades filhas, incluindo componentes, calor, vibração, resultados, equipamentos e EPI/EPC.
•	Campos de avaliação devem permanecer vinculados ao risco exato e ao tipo/técnica/exposição; agrupamentos não podem vazar valores de um risco para outro.
•	Geração do documento final em DOCX a partir de template.
•	Fila offline durável, recuperação após recarga, reconexão e retry progressivo; conflitos precisam ser preservados e informados.
•	Persistência incremental: gravar apenas avaliações/filhos alterados e exclusões explícitas, evitando regravações completas e duplicadas.
•	Datas civis armazenadas como datas ISO no banco, separadas dos timestamps de auditoria.
7.2 Insalubridade
•	Fluxo próprio, com integração controlada com LTCAT e critérios específicos de importação.
•	Compartilha infraestrutura de edição, persistência, contexto de riscos e templates, sem assumir que as conclusões legais de LTCAT e Insalubridade sejam equivalentes.
•	Descrições da avaliação devem persistir na avaliação-pai e nos procedimentos de salvamento usados pelo documento.
•	Blocos condicionais de fumos e poeiras metálicas só devem aparecer quando houver resultado quantitativo pertinente; nenhum marcador de template pode permanecer no DOCX final.
•	Persistência offline, reconciliação e prevenção de perda de dados devem funcionar também neste tipo documental.
7.3 Periculosidade
•	Possui rota de criação/edição e modal de início próprio.
•	É um tipo documental distinto, apresentado na árvore de documentos e vinculado à empresa/contrato.
•	Os detalhes específicos de todos os campos e critérios técnicos devem ser confirmados diretamente no fluxo completo e no template correspondente antes de tratá-los como especificação fechada.
7.4 PGR
•	Assistente por etapas para construção do Programa de Gerenciamento de Riscos.
•	Organização por setor/GHE/GES, funções e riscos ocupacionais.
•	Campos identificados no código incluem tipo de agente, tipo de avaliação, agente e código/descrição eSocial, propagação, tipo de exposição, fonte geradora, danos à saúde, medidas de controle, probabilidade e severidade.
•	Matriz de risco 3×3: probabilidade × severidade (valores 1–9); resultado 1–2 Baixo/Trivial, 3–4 Médio/Moderado e 6–9 Alto/Substancial.
•	Cadastro de blocos de EPI, treinamentos e vínculos com funções.
•	Cronograma de ações e vínculo com outros documentos quando aplicável.
•	Geração DOCX via template e ordenação numérica de grupos GHE/GES.
7.5 PCMSO
•	Assistente de elaboração/edição do PCMSO.
•	Organização por setores e grupos, exames ocupacionais, revisões, EPIs e treinamentos.
•	Funções para copiar/transportar dados do PGR para o PCMSO com confirmação explícita, sem pressupor que todo o conteúdo seja idêntico.
•	Observações padrão editáveis e helpers para templates.
•	Campos de agentes contemplam físicos, químicos, biológicos, ergonômicos, acidentes e psicossociais.
•	Geração de DOCX e persistência do documento.
7.6 AET — Análise Ergonômica do Trabalho
•	Assistente de AET com setores, funções, atividades, riscos e análise técnica.
•	Integração de contexto psicossocial e AEP, limitada à mesma empresa/contrato e ao setor/GHE/função correspondente.
•	Ferramentas ergonômicas implementadas em utilitários próprios incluem RULA, REBA, NIOSH e OWAS, com interpretação e justificativa.
•	Geração determinística de parte do conteúdo, com IA usada para refinamento/apoio em fluxos específicos.
•	Templates DOCX/HTML, validação de variáveis, sanitização e exportação.
•	Redação técnica em português brasileiro, impessoal, sem inventar medições ou transformar indisponibilidade de informação em pendências automáticas.
7.7 AEP — Avaliação Ergonômica Preliminar
•	Assistente de criação e edição da AEP.
•	Reconhecimento das condições de trabalho e identificação dos fatores ergonômicos por agente/atividade.
•	Contexto derivado de empresa, contrato, setor/GHE/GES e função.
•	Integração com relatórios psicossociais salvos, sem sobrescrever campos editados manualmente.
•	Geração por IA com regras para não inventar fatores nem omitir riscos suportados pelo contexto.
•	Exportação PDF e persistência das avaliações.
•	Formulário AEP independente com fluxo de criação, preenchimento, base técnica de até quatro arquivos PDF/DOCX/XLSX por empresa e geração de IA com prévia/confirmacão.
7.8 APR-ERGO
•	Lista dedicada e criação de registros por empresa, contrato, setor e função.
•	Usa a tabela de documentos com tipo APR-ERGO e dados de seleção no snapshot do rascunho; um registro por função selecionada conforme as regras do projeto.
•	Estado inicial rascunho; após o primeiro salvamento, status salvo. Criar um rascunho não equivale a emitir ou aprovar documento.
•	Base técnica privada vinculada ao escopo empresa/contrato/documento, com suporte a até seis arquivos na interface descrita no roadmap.
•	IA gera proposta com prévia e confirmação, preservando alterações manuais e fotografias existentes.
•	Opções e fórmulas da matriz vêm de módulo compartilhado baseado na planilha Anexo 03; a IA só pode selecionar opções permitidas e classificações/perfil são recalculados pelo sistema.
•	Resumo do setor e das atividades com prévia e mesclagem por campo.
•	Condutas fixas por nível de risco; para níveis Alto/Muito Alto, a conduta pode ser exclusiva conforme a matriz.
•	PDF completo com tabela, fotos, texto longo e paginação controlada; exclusão com confirmação e limpeza limitada ao registro e à pasta privada correspondentes.
7.9 AET (VALE)
•	Fluxo específico que permite selecionar empresa, contrato, setor e funções e criar registros por função.
•	Etapas do formulário e plano de ação 5W2H persistem juntos, preservando ações legadas.
•	Dados da AEP consomem apenas linhas APR salvas do escopo exato classificadas Alto/Muito Alto; tela e PDF usam a mesma regra.
•	IA autenticada usa contexto derivado no servidor e transmissão em fluxo; não deve alterar registros-fonte nem sobrescrever edição manual.
•	Análise de fotos com prévia; imagem original é preservada, anotações ficam vinculadas ao documento/função e à imagem de origem. As marcações são overlays determinísticos, não geração de uma nova fotografia.
•	Exportação PDF com tabelas vetoriais, continuação de textos e fotos proporcionais; DOCX/HTML por templates.
•	Cronograma mensal por empresa/contrato com intervalo de anos, meses, status/cores e ações. O cronograma é independente dos planos 5W2H individuais.
8. Avaliação psicossocial e COPSOQ
•	Cadastro de avaliação por empresa/contrato, com rota pública por token para responder a questionários.
•	Metodologia COPSOQ reutilizada para consolidar dimensões e interpretar indicadores psicossociais.
•	Relatório técnico com grupos derivados do cadastro atual de setores/funções, inclusive funções sem respondentes; grupos não avaliados não recebem fatores de risco inventados.
•	Identificação de grupos com IDs de função/setor preferenciais; nomes legados só podem ser usados quando a correspondência é única.
•	Classificação interna Baixo, Médio, Alto e Crítico a partir de probabilidade × severidade; o relatório normaliza terminologia e frequência antes de salvar/exibir/exportar.
•	Frequências padronizadas: Eventual, Intermitente e Habitual.
•	Plano de ação gera medidas para classificações Média e Alta segundo as regras registradas; cada ação pode ser excluída individualmente, com confirmação, e a exclusão persiste.
•	Ordenação numérica de setores/GHE/GES é compartilhada pela tela, PDF e Word.
•	Exportação PDF e DOCX/Word completo com cabeçalho e rodapé.
•	IA auxilia na redação, com contexto e regras técnicas compartilhadas. Resultado não sustentado não deve ser apresentado como risco confirmado; os textos e a classificação precisam permanecer coerentes em todos os formatos.
9. Ficha Técnica de Higiene Ocupacional
A Ficha Técnica organiza resultados por empresa e contrato. O código identifica os seguintes tipos de avaliação:
Tipo	Dados/indicadores evidenciados
Ruído contínuo/intermitente	NEN, Dose Q3, LAVG e Dose Q5.
Vibração de corpo inteiro (VCI)	AREN e VDVR.
Vibração de mãos e braços (VMB)	AREN.
Calor	Concentração/indicador e taxa metabólica.
Poeira respirável/sílica livre	Componentes e exposição/resultados.
Químico quantitativo	Componentes e exposição/resultados.
Fumos metálicos	Componentes e exposição/resultados.
Vapores orgânicos	Componentes e exposição/resultados.
•	Cadastro persistente de oito tipos de resultado, com edição e exclusão.
•	Integração com LTCAT e Insalubridade, mas com critérios de importação separados por tipo de documento.
•	Registro de identificação/série de amostradores químicos e pesquisa/relatório de amostradores utilizados.
•	Relatório preliminar por contrato.
•	Alertas relacionados à calibração de equipamentos e vínculo dos resultados com o contexto técnico.
•	Persistência, importação e exportações foram incluídas em verificações registradas no roadmap.
10. Inteligência artificial: arquitetura e regras
10.1 Funções e endpoints identificados
Endpoint / utilitário	Responsabilidade identificada
aep-generate	Geração assistida de conteúdo para AEP.
aet-generate	Geração assistida de conteúdo para AET.
aet-vale-generate	Geração de etapas/itens de AET VALE.
aet-vale-foto-analyze	Análise de fotografias de ergonomia.
aet-vale-plano-generate	Geração assistida do plano/crono AET VALE.
apr-ergo-generate	Geração assistida para APR-ERGO.
formulario-aep-generate	Geração para Formulário AEP.
psico-generate	Geração assistida no módulo psicossocial.
manage-users	Operações administrativas de usuários.
10.2 Requisitos comuns de IA
•	As chamadas longas usam NDJSON com pings periódicos e resultado/erro final, para reduzir falhas por timeout de conexões longas.
•	Cliente consome o fluxo por utilitário próprio; mensagens de erro devem ser tratadas sem deixar carregamento infinito.
•	Limites de tamanho para textos e anexos são aplicados no serviço compartilhado; os valores técnicos atuais incluem limite de texto e orçamento agregado de anexos.
•	Contexto deve ser obtido no servidor e restringido a IDs exatos de empresa/contrato/setor/função/documento; rejeitar escopo ambíguo.
•	IA deve propor conteúdo, não salvar automaticamente sem confirmação quando o fluxo exige prévia.
•	Campos manuais e histórico existente devem ser preservados por mesclagem não destrutiva.
•	Não inventar medições, duração, escores ou fatos ausentes; não expor ao usuário texto interno sobre origem dos dados, banco, IA ou lacunas artificiais.
•	APR-ERGO: IA não define livremente opções nem grava classificação final; matriz e fórmulas são autoridade do sistema.
•	Fotos: analisar imagem original e gerar anotações separadas; não alterar a fotografia original por geração de imagem.
11. Persistência, sincronização e resiliência
•	Supabase/PostgreSQL é a camada de persistência principal; React Query mantém cache e consultas do frontend.
•	Realtime é utilizado em listas e áreas dependentes de cadastros/documentos para atualizar consultas quando há mudanças.
•	Estado local persistido é utilizado em formulários/modais específicos para reduzir perda de preenchimento.
•	LTCAT/Insalubridade usam snapshots, fingerprints estáveis e diffs para identificar alterações, exclusões de avaliações e exclusões de linhas filhas.
•	Fila offline consolidada por usuário/documento salva localmente antes do envio e tenta sincronizar após reconexão, com retry progressivo.
•	Conflitos de concorrência devem ser detectados e apresentados, nunca silenciosamente descartados.
•	Leituras de sessão devem ter timeout, validar identidade no servidor e ignorar respostas obsoletas de solicitações anteriores.
•	Falhas temporárias de armazenamento/rede não devem apagar a sessão de outros dispositivos nem liberar rotas protegidas.
•	Datas civis usam strings ISO e colunas date; timestamps de auditoria permanecem instantes independentes para evitar mudança de dia por fuso/DST.
•	Documentos, bases técnicas e anexos privados devem ser isolados por escopo e acesso autorizado.
12. Segurança e privacidade
•	Autenticação baseada em Supabase Auth, com validação de usuário no servidor e controle de papéis admin/usuario.
•	Rotas protegidas no frontend; essa proteção deve ser complementada por políticas de banco (RLS) e validação das Edge Functions.
•	Operações administrativas são separadas e restritas a administrador.
•	Bases de referência da IA são armazenadas em bucket privado e organizadas por empresa/contrato/documento.
•	Exclusões de documentos devem filtrar por ID, tipo, empresa e contrato e limpar somente o prefixo privado do registro excluído.
•	Tokens públicos de avaliação psicossocial precisam ser de uso e escopo limitados, não permitindo acesso a outros contratos ou respostas.
•	Dados ocupacionais e documentos técnicos podem conter informações pessoais; limitar coleta, acesso, exposição em logs e retenção ao necessário.
•	Segredos nunca devem ser versionados. O repositório contém um arquivo .env rastreado: verificar conteúdo fora deste PRD; caso contenha credenciais, revogar/rotacionar e remover do histórico conforme procedimento seguro.
•	Executar auditoria de políticas RLS, permissões de buckets, Edge Functions e dados retornados antes de afirmar conformidade plena com LGPD.
13. Exportação e integridade documental
•	DOCX: docxtemplater/PizZip e renderizadores HTML para DOCX, com sanitização de ZIP/XML e validação de variáveis.
•	PDF: jsPDF/autotable e renderizadores específicos para psicossocial, Ficha Técnica, Formulário AEP, APR-ERGO e AET VALE.
•	Exportações devem consumir o estado atual salvo ou a versão explicitamente selecionada, com conteúdo completo e paginação legível.
•	Tela, PDF e Word devem compartilhar a mesma fonte de dados e ordenação para evitar divergências.
•	Blocos condicionais devem ser removidos corretamente; não deixar marcadores técnicos visíveis no documento emitido.
•	Arquivos gerados devem manter acentuação, tabelas, fotos proporcionais, cabeçalhos/rodapés e textos longos sem corte.
•	Templates inválidos devem gerar mensagem acionável antes de uma emissão final.
14. Configuração e stack técnica
Camada	Tecnologias / elementos observados
Frontend	React 18, TypeScript, Vite, React Router.
Interface	Tailwind CSS, Radix UI/shadcn, lucide-react, componentes de formulário e diálogos.
Estado/consulta	TanStack Query, hooks próprios de autenticação, persistência local e sincronização realtime.
Backend gerenciado	Supabase Auth, PostgreSQL, Storage e Edge Functions.
IA	Serviço compartilhado de geração por Edge Functions; respostas em streaming NDJSON; regras e schemas centralizados.
Documentos	docxtemplater, PizZip, Mustache, html-to-docx, FileSaver, jsPDF e jsPDF-AutoTable.
Dados tabulares/OCR	xlsx, pdfjs-dist, Tesseract.js; uso específico depende do fluxo.
Testes/qualidade	Vitest, Testing Library, jsdom, ESLint e TypeScript.
Gerenciadores de pacote	package.json e package-lock.json; também há bun.lock e bun.lockb.
Migrações	Migrações SQL em supabase/migrations e drizzle/migrations; Drizzle Kit configurado.
Configuração Supabase versionada identifica o project_id “niabblwxqmiulkqjnmui”. Chaves públicas/privadas, tokens, senhas ou valores de ambiente não devem ser incluídos no PRD.
15. Modelo de domínio lógico
A estrutura lógica observada inclui, entre outras, as seguintes entidades e relacionamentos. O nome de cada tabela pode variar em módulos legados; confirmar o esquema SQL completo antes de implementar migrações ou integrações externas.
Entidade	Papel no domínio
empresas	Raiz organizacional e identificação do cliente/empresa.
contratos	Escopo operacional da empresa, local e contratante.
setores	Unidade operacional por empresa/contrato, com GHE/GES e ambiente.
funcoes	Funções ligadas aos setores, com CBO e descrição das atividades.
documentos	Registro central de documentos, tipo, status, snapshots e metadados.
aep_documentos / aet_documentos	Persistência específica/legada de avaliações ergonômicas e integração com listagens.
formularios_aep	Respostas e dados dos formulários AEP.
ficha_tecnica_resultados	Resultados de higiene ocupacional por tipo e escopo.
psico_avaliacoes / psico_respostas	Avaliações psicossociais e respostas.
profiles / user_roles	Perfil do usuário e papel de autorização.
templates	Modelos de documentos e metadados de emissão.
Storage privado	Bases técnicas, modelos e anexos com prefixos por escopo.
16. Requisitos não funcionais
ID	Requisito	Critério de aceitação
RNF-01	Persistência confiável	Salvar, recarregar e reabrir documento mantém todos os campos e relações.
RNF-02	Offline resiliente	Edição offline permanece em fila durável e sincroniza após reconexão sem duplicar registros.
RNF-03	Concorrência	Alterações conflitantes são detectadas e preservadas para decisão do usuário.
RNF-04	Isolamento de escopo	IA/relatório não retorna dados de empresa, contrato, setor ou função diferentes do documento atual.
RNF-05	Consistência de exportação	Tela, PDF e DOCX exibem a mesma ordem, classificações e conteúdo salvo.
RNF-06	Segurança	Rotas, dados e arquivos privados exigem autenticação/autorização adequada no servidor.
RNF-07	Acessibilidade/usabilidade	Formulários e tabelas devem ter rótulos, feedback de carregamento/erro e navegação clara.
RNF-08	Desempenho	Consultas/payloads evitam dados desnecessários; salvar apenas alterações efetivas.
RNF-09	Datas	Datas civis permanecem no mesmo dia ao salvar, reabrir e exportar em fusos distintos.
RNF-10	Rastreabilidade	Alterações e versões relevantes devem manter timestamps e IDs coerentes.
17. Testes e evidências registrados no repositório
O roadmap descreve testes unitários e validações manuais/autenticadas em diversas áreas. Entre os conjuntos de testes versionados estão persistência offline e diff do LTCAT, identidade/sessão, datas civis, matrizes AEP, integração AEP/AET, APR-ERGO, PDFs AET VALE, geração por streaming, relatórios psicossociais e exportações. O roadmap relata, em diferentes itens, conjuntos de 14, 18, 19, 22, 24, 25, 28 e 76 testes ou verificações específicas. Esses números pertencem a tarefas distintas e não devem ser somados como uma contagem global de testes.
Há itens marcados como pendentes no roadmap: fidelidade exata da AET VALE ao Anexo 04 original (aguardando documento de referência) e validação final de geração real/Word em um fluxo psicossocial específico. Portanto, esses pontos não devem ser declarados integralmente homologados.
18. Regras de negócio críticas a preservar
1.	Empresa e contrato são obrigatórios para delimitar o contexto dos documentos e avaliações que dependem desse vínculo.
2.	Setores, GHE/GES e funções devem ser relacionados por IDs; nomes isolados não são chave segura quando houver duplicidade.
3.	IA deve usar apenas o escopo exato validado pelo servidor e não deve misturar dados de empresas/contratos.
4.	Prévia e confirmação precedem substituições geradas por IA nos fluxos que implementam essa proteção.
5.	Conteúdo editado manualmente deve prevalecer sobre sugestões de IA, exceto quando o usuário confirmar substituição explícita.
6.	Classificações e fórmulas normativas da matriz são calculadas pelo sistema, não aceitas como texto livre retornado pela IA.
7.	Na APR-ERGO, criação de rascunho não significa emissão ou aprovação.
8.	Na AET VALE, dados de AEP usados na seção própria são restritos a registros salvos Alto/Muito Alto do escopo exato.
9.	Relatório psicossocial não deve inventar fatores para grupos sem respostas.
10.	Datas civis não podem sofrer ajuste de dia por conversão de timezone.
11.	LTCAT/Insalubridade devem manter descrições e dados de cada avaliação vinculados ao risco correto.
12.	Fila offline e retry não podem criar duplicatas nem apagar alterações em conflito.
13.	Exclusão de documentos deve ser limitada ao registro correto e à sua própria área de armazenamento.
19. Pendências e riscos para auditoria
Prioridade	Ponto	Ação recomendada
Crítica	Arquivo .env aparece versionado no repositório.	Verificar localmente se contém segredos; revogar/rotacionar credenciais expostas, retirar do versionamento e adotar secrets de ambiente.
Alta	Conformidade de RLS e buckets não pode ser inferida apenas da UI.	Auditar políticas para todas as tabelas, funções, buckets e tokens públicos.
Alta	Documentação README ainda é um placeholder.	Substituir por documentação de instalação, configuração segura, deploy, migrações e suporte.
Alta	Verificação de produção é diferente de testes locais.	Executar smoke tests autenticados em ambiente de homologação/produção com dados controlados.
Média	Detalhes finais de alguns campos de Periculosidade e fluxos de documentos dependem de inspeção completa de telas/templates.	Completar inventário campo a campo antes de usar este PRD como contrato de desenvolvimento.
Média	Há dois ecossistemas de migrações e múltiplos lockfiles.	Documentar qual pipeline é autoritativo e impedir divergência entre migrações e ambiente implantado.
Média	AET VALE: fidelidade ao Anexo 04 original consta pendente.	Obter o anexo oficial, comparar campo a campo e homologar exportação.
Média	Validação de geração real e download Word de um fluxo psicossocial consta pendente.	Reexecutar cenário autenticado e registrar evidência de download.
Média	O PRD deriva do código e da documentação versionada, não de entrevista de todos os usuários.	Validar nomes, regras legais, critérios de aceitação e perfis com responsáveis do produto.
20. Critérios gerais de aceite do produto
•	Todos os cadastros vinculados podem ser criados, editados e reabertos sem perda de dados.
•	Documentos listam e filtram corretamente por tipo, empresa e contrato.
•	Salvar, atualizar página e abrir novamente preserva conteúdo principal e linhas filhas.
•	Falhas de rede são informadas e alterações não confirmadas permanecem recuperáveis.
•	Geração por IA mostra progresso, termina com resultado/erro legível e não substitui edição manual silenciosamente.
•	PDF/DOCX são baixáveis, completos, sem marcadores de template e consistentes com a tela.
•	Escopos de IA e relatórios são verificados por IDs no servidor.
•	Exclusão requer confirmação e não afeta documentos irmãos ou outros contratos.
•	Datas civis mantêm o dia correto.
•	Testes automatizados e smoke tests são executados após mudanças nos fluxos críticos.
21. Glossário
Termo	Significado no sistema
AEP	Avaliação Ergonômica Preliminar.
AET	Análise Ergonômica do Trabalho.
APR-ERGO	Análise preliminar de riscos com foco ergonômico, conforme o fluxo/modelo adotado pelo sistema.
GHE/GES	Grupo homogêneo/similar de exposição ou grupo equivalente usado para organizar o contexto ocupacional.
LTCAT	Laudo Técnico das Condições Ambientais do Trabalho.
PGR	Programa de Gerenciamento de Riscos.
PCMSO	Programa de Controle Médico de Saúde Ocupacional.
COPSOQ	Questionário/metodologia de avaliação de fatores psicossociais usada pelo módulo.
RLS	Row Level Security: políticas de acesso a linhas no banco.
Edge Function	Função backend executada na infraestrutura Supabase.
NDJSON	Formato de resposta em que cada linha contém um objeto JSON, utilizado para streaming de IA.
5W2H	Estrutura de plano de ação: o quê, por quê, onde, quando, quem, como e quanto custa.
22. Fontes de implementação consultadas
•	AGENTS.md — regras arquiteturais e invariantes de negócio.
•	roadmap.md — funcionalidades registradas, validações e itens pendentes.
•	src/App.tsx e src/components/AppSidebar.tsx — rotas e navegação.
•	src/pages/* — telas dos módulos e fluxos de usuário.
•	src/lib/* — cálculos, regras de domínio, persistência, exportação e integração.
•	src/components/* — formulários, modais, helpers de template e componentes de domínio.
•	supabase/functions/* — geração por IA e operações backend.
•	supabase/migrations/* e drizzle/migrations/* — histórico de evolução do esquema.
•	package.json, vite.config.ts, vitest.config.ts e supabase/config.toml — stack e configuração de execução.
Conclusão
O SafeFlow já contém uma base funcional ampla para elaboração e gestão de documentos de SST, avaliações de higiene ocupacional, ergonomia e riscos psicossociais. Seus diferenciais técnicos no código são a integração contextual entre módulos, geração de conteúdo assistida por IA com escopo controlado, exportação DOCX/PDF, persistência incremental/offline em documentos críticos e regras explícitas para consistência dos relatórios. Para usar este PRD como documento oficial de produto, recomenda-se uma última rodada de homologação com o sistema em execução, revisão das políticas de segurança e confirmação dos itens assinalados como pendentes.