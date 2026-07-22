// Banco de conhecimento interno para geração determinística da AET.
// Contém descrições técnicas típicas por família ocupacional.
// Usado APENAS como complemento quando o cadastro do usuário for insuficiente.
// Nunca sobrescreve informações específicas fornecidas pelo usuário.

export type FuncaoConhecimento = {
  chave: string;
  aliases: string[]; // termos que ativam este perfil (case-insensitive, contains)
  posto: string;
  atividades: string[]; // sequência típica de tarefas
  organizacao: string;
  ritmo: string;
  jornada: string;
  biomecanica: string;
  riscos: string[]; // riscos ergonômicos típicos
  tarefas_crono: { tarefa: string; tempo: string; risco: string }[];
  recomendacoes: { o_que: string; como: string; responsavel: string; prazo: string }[];
};

export const CONHECIMENTO_FUNCOES: FuncaoConhecimento[] = [
  {
    chave: "eletricista",
    aliases: ["eletricista", "auxiliar de eletricista", "eletrotécnico", "eletrotecnico"],
    posto: "Posto de trabalho de natureza itinerante, executado em campo (subestações, painéis elétricos, redes aéreas, quadros de distribuição, ambientes industriais e prediais). Utiliza ferramentas manuais isoladas (alicates, chaves de fenda/philips isoladas, alicate amperímetro, multímetro), escadas, cintos de segurança tipo paraquedista, EPIs classe de tensão compatível e instrumentos de medição. O local de trabalho varia — pode incluir ambientes confinados, altura, posições invertidas (agachado, ajoelhado, com braços elevados) e proximidade de partes energizadas.",
    atividades: [
      "Interpretação de diagramas elétricos e ordens de serviço",
      "Bloqueio e etiquetagem (LOTO) de circuitos conforme NR-10",
      "Instalação, manutenção preventiva e corretiva de circuitos, quadros e equipamentos",
      "Passagem de eletrodutos, cabos e fiação",
      "Medições elétricas e testes funcionais",
      "Escrituração de checklists e liberação técnica",
    ],
    organizacao: "Trabalho geralmente em duplas (executor + observador de NR-10). Distribuição de OS por gestor imediato ou supervisor de manutenção. Autonomia técnica moderada dentro do procedimento; pausas condicionadas ao andamento das OS e a janelas de desligamento.",
    ritmo: "Ritmo variável, imposto por demandas emergenciais e janelas programadas de desligamento. Alta exigência de atenção sustentada e concentração pela proximidade do risco elétrico. Complexidade cognitiva média-alta: interpretação de diagramas, diagnóstico de falhas e tomada de decisão sob pressão.",
    jornada: "Jornada regular de 44h semanais com escalas de sobreaviso e possibilidade de emergências fora do expediente. Intervalos previstos em CLT. Pausas específicas para trabalhos em altura e em ambientes térmicos desfavoráveis recomendadas conforme NR-35 e NHO-06.",
    biomecanica: "Posturas críticas: braços elevados acima do ombro na conexão em quadros altos e redes aéreas (abdução/flexão >60° sustentada — ISO 11226 zona de risco), tronco flexionado e/ou torcido em painéis baixos, ajoelhamento prolongado em caixas de passagem, subida e permanência em escadas/andaimes. Manuseio de cargas moderadas (rolos de cabo, ferramentas, escadas — 5 a 20 kg) exige análise conforme ISO 11228-1/NIOSH. Repetitividade moderada em terminações e conexões (avaliar por OCRA Checklist quando aplicável).",
    riscos: [
      "Sobrecarga em ombros por trabalho acima do plano do coração",
      "Compressão de joelhos em posições ajoelhadas",
      "Sobrecarga lombar em levantamento e transporte de rolos de cabo/escadas",
      "Preensão sustentada de ferramentas",
      "Estresse mental pela convivência com risco elétrico",
    ],
    tarefas_crono: [
      { tarefa: "Análise de OS e planejamento da intervenção", tempo: "10 min", risco: "Baixo — carga cognitiva" },
      { tarefa: "Deslocamento e transporte de ferramentas/materiais", tempo: "15 min", risco: "Moderado — carga axial" },
      { tarefa: "Bloqueio, sinalização e testes de ausência de tensão", tempo: "10 min", risco: "Baixo" },
      { tarefa: "Execução da manutenção (conexões, ajustes, medições)", tempo: "60–120 min", risco: "Alto — postura sustentada e força" },
      { tarefa: "Restabelecimento, testes finais e registro", tempo: "20 min", risco: "Baixo" },
    ],
    recomendacoes: [
      { o_que: "Fornecer escadas com plataforma e cinto de ferramentas", como: "Adquirir escadas platafórmicas dielétricas e cintos porta-ferramentas para reduzir permanência com braços elevados e sustentação de peso na cintura", responsavel: "SESMT + Manutenção", prazo: "60 dias" },
      { o_que: "Implantar rodízio de tarefas de sustentação prolongada", como: "Alternar executor e observador (NR-10) a cada 30 min em atividades de trabalho em altura ou postura sustentada", responsavel: "Supervisor de Manutenção", prazo: "Imediato" },
      { o_que: "Treinamento de mecânica corporal para levantamento", como: "Capacitação NR-17 sobre técnicas de levantamento e transporte de rolos de cabo/escadas, com prática assistida", responsavel: "SESMT", prazo: "90 dias" },
    ],
  },
  {
    chave: "eletromecanico",
    aliases: ["eletromecânico", "eletromecanico", "mecânico eletricista"],
    posto: "Posto híbrido de manutenção elétrica e mecânica em ambientes industriais. Envolve bancada com morsa, ferramentas manuais, chaves de impacto, instrumentos de medição, além de intervenções em máquinas e painéis. Alterna trabalho em bancada e em campo.",
    atividades: [
      "Diagnóstico de falhas eletromecânicas",
      "Desmontagem e montagem de conjuntos mecânicos",
      "Substituição de rolamentos, correias, mancais e sensores",
      "Ajustes elétricos em motores e comandos",
      "Testes funcionais e liberação da máquina",
    ],
    organizacao: "Ordens de serviço distribuídas pela supervisão de manutenção. Autonomia técnica média. Frequência de emergências (parada de máquina) que exige resposta rápida.",
    ritmo: "Alternância entre ritmo livre em manutenções preventivas e ritmo imposto em corretivas emergenciais. Demanda cognitiva alta (diagnóstico) e demanda física moderada-alta (esforço, força).",
    jornada: "Jornada 44h com regime de sobreaviso. Pausas conforme CLT; pausas técnicas em atividades com esforço/temperatura.",
    biomecanica: "Posturas frequentes de tronco flexionado, agachado e ajoelhado ao lado da máquina; braços elevados; aplicação de força em chaves e alavancas (pico de força de aperto e torque); levantamento de peças (motores, redutores) frequentemente >20 kg, exigindo dispositivo auxiliar (talha). Repetitividade baixa a moderada.",
    riscos: [
      "Sobrecarga lombar por levantamento manual de peças pesadas",
      "Compressão articular em ombros por sustentação de ferramentas pesadas",
      "Preensão forte sustentada",
      "Postura estática em espaços confinados",
    ],
    tarefas_crono: [
      { tarefa: "Recebimento de OS e diagnóstico inicial", tempo: "15 min", risco: "Baixo" },
      { tarefa: "Bloqueio, alívio de energias e preparação", tempo: "15 min", risco: "Baixo" },
      { tarefa: "Desmontagem/montagem mecânica", tempo: "60–180 min", risco: "Alto — força e postura" },
      { tarefa: "Ajustes elétricos e testes", tempo: "30 min", risco: "Moderado" },
      { tarefa: "Liberação e registro", tempo: "10 min", risco: "Baixo" },
    ],
    recomendacoes: [
      { o_que: "Disponibilizar talha/dispositivo mecânico para peças >15 kg", como: "Instalar pontos de içamento próximos às máquinas críticas e treinar operação segura", responsavel: "Engenharia + SESMT", prazo: "90 dias" },
      { o_que: "Bancadas com regulagem de altura", como: "Substituir bancadas fixas por reguláveis (700–1050 mm) conforme NR-17.3.3", responsavel: "Engenharia", prazo: "120 dias" },
    ],
  },
  {
    chave: "soldador",
    aliases: ["soldador", "caldeireiro", "montador soldador"],
    posto: "Posto em cabines de solda, campo ou bancadas metálicas. Uso de máquinas de solda (eletrodo revestido, MIG/MAG, TIG), tochas, chapas, tubulações. Exposição a fumos metálicos, radiação não ionizante, ruído e temperatura.",
    atividades: [
      "Preparação da junta e do material (esmerilhamento, chanfro)",
      "Ajuste dos parâmetros da máquina de solda",
      "Execução do cordão de solda em diversas posições (plana, horizontal, vertical, sobrecabeça)",
      "Inspeção visual e limpeza da solda",
      "Movimentação e posicionamento de peças",
    ],
    organizacao: "Fluxo por lote produtivo ou OS. Metas de produção usualmente presentes. Supervisão direta do encarregado. Autonomia técnica de execução dentro da EPS.",
    ritmo: "Ritmo imposto pela linha/meta. Concentração visual intensa através da máscara. Complexidade média-alta na execução de posições difíceis.",
    jornada: "Jornada 44h com pausas específicas recomendadas para solda em posições desconfortáveis (sobrecabeça) e ambientes térmicos desfavoráveis (NHO-06).",
    biomecanica: "Posturas estáticas prolongadas com pescoço flexionado (soldagem plana) ou hiperestendido (sobrecabeça). Braços em abdução mantida com aplicação fina de força; preensão sustentada da tocha (0,5–2 kg) por longos períodos (risco de LER/DORT em ombro/pescoço/punho — REBA e RULA típicos ≥5). Agachamento e ajoelhamento em soldagem no chão.",
    riscos: [
      "Sobrecarga cervical em posições sobrecabeça",
      "Fadiga do manguito rotador",
      "Tenossinovite de punho por preensão fina sustentada",
      "Estresse térmico associado (calor radiante do arco)",
    ],
    tarefas_crono: [
      { tarefa: "Preparação da junta e limpeza", tempo: "10 min", risco: "Moderado — postura e vibração leve" },
      { tarefa: "Ajuste dos parâmetros da máquina", tempo: "5 min", risco: "Baixo" },
      { tarefa: "Execução do cordão de solda", tempo: "20–60 min", risco: "Alto — postura estática e visual" },
      { tarefa: "Resfriamento e inspeção", tempo: "10 min", risco: "Baixo" },
      { tarefa: "Movimentação de peças", tempo: "10 min", risco: "Moderado — carga" },
    ],
    recomendacoes: [
      { o_que: "Fornecer suportes/posicionadores de peça", como: "Instalar mesas rotativas ou posicionadores para reduzir tempo em posturas sobrecabeça", responsavel: "Engenharia + SESMT", prazo: "90 dias" },
      { o_que: "Implantar pausa ativa a cada 50 min", como: "Programa com alongamentos guiados e alternância entre soldadores em posições críticas", responsavel: "SESMT", prazo: "30 dias" },
      { o_que: "Máscaras de solda com escurecimento automático leves", como: "Substituir máscaras convencionais por auto escurecedoras leves (<500 g), reduzindo carga cervical", responsavel: "SESMT", prazo: "60 dias" },
    ],
  },
  {
    chave: "administrativo",
    aliases: ["administrativo", "auxiliar administrativo", "assistente administrativo", "escriturário", "escriturario", "recepcionista", "atendente"],
    posto: "Posto sedentário em ambiente de escritório, com estação de trabalho composta por cadeira, mesa, monitor, teclado, mouse e telefone. Iluminação artificial predominante, ar condicionado central, uso intensivo de sistemas informatizados.",
    atividades: [
      "Digitação e lançamento de dados em sistemas",
      "Atendimento telefônico e por e-mail",
      "Organização e arquivamento de documentos físicos e digitais",
      "Elaboração de planilhas e relatórios",
      "Reuniões presenciais e por videoconferência",
    ],
    organizacao: "Trabalho por demanda contínua com metas administrativas. Supervisão indireta. Autonomia média sobre organização das tarefas do dia.",
    ritmo: "Ritmo predominantemente livre porém com picos por prazo. Alta demanda cognitiva (atenção, memória operacional) e baixa demanda física. Risco de sobrecarga mental em períodos de fechamento.",
    jornada: "Jornada 8h/dia com intervalo intrajornada de 1h. NR-17.6.3 aplicável: pausa de 10 min a cada 50 min de atividade contínua de entrada de dados quando aplicável.",
    biomecanica: "Postura sentada prolongada (>6h/dia) — risco de sobrecarga lombar e cervical, especialmente com cadeira inadequada. Uso repetitivo de teclado e mouse — risco de LER/DORT em punho, cotovelo e ombro. Postura estática cervical em monitor mal posicionado.",
    riscos: [
      "Lombalgia postural",
      "Cervicalgia e cefaleia tensional",
      "Tendinopatias de punho/cotovelo",
      "Fadiga visual (astenopia)",
      "Sedentarismo",
    ],
    tarefas_crono: [
      { tarefa: "Entrada de dados/digitação", tempo: "50 min contínuos", risco: "Alto — repetitividade e postura" },
      { tarefa: "Pausa NR-17.6.3", tempo: "10 min", risco: "Baixo" },
      { tarefa: "Atendimento telefônico/e-mail", tempo: "30 min", risco: "Moderado" },
      { tarefa: "Organização de documentos", tempo: "20 min", risco: "Baixo" },
      { tarefa: "Reuniões", tempo: "30–60 min", risco: "Baixo" },
    ],
    recomendacoes: [
      { o_que: "Cadeiras ergonômicas com regulagem completa", como: "Substituir cadeiras sem regulagem por modelos com apoio lombar, braços reguláveis e altura ajustável (NR-17.3.4)", responsavel: "SESMT + Administração", prazo: "60 dias" },
      { o_que: "Suporte de monitor / notebook", como: "Fornecer suportes que posicionem a borda superior do monitor na linha dos olhos e teclado/mouse externos para uso de notebook", responsavel: "SESMT + TI", prazo: "30 dias" },
      { o_que: "Programa de pausas e ginástica laboral", como: "Implantar pausas de 10 min a cada 50 min conforme NR-17.6.3 e ginástica laboral 3x/semana", responsavel: "SESMT + RH", prazo: "30 dias" },
    ],
  },
  {
    chave: "mecanico",
    aliases: ["mecânico", "mecanico", "mecânico de manutenção", "mecânico industrial", "montador"],
    posto: "Posto de manutenção mecânica em bancada e/ou junto à máquina/equipamento. Utiliza ferramentas manuais, elétricas e pneumáticas, dispositivos de içamento, morsas, tornos e prensas. Ambiente pode envolver óleos, graxas, ruído e vibração.",
    atividades: [
      "Diagnóstico e desmontagem de conjuntos mecânicos",
      "Substituição de componentes (rolamentos, retentores, engrenagens, correias)",
      "Lubrificação e ajustes",
      "Testes de funcionamento",
      "Registro em check-list",
    ],
    organizacao: "OS por supervisor de manutenção. Trabalho individual ou em duplas. Emergências frequentes de linha parada.",
    ritmo: "Ritmo variável, com picos em corretivas emergenciais. Demanda cognitiva média (diagnóstico) e demanda física alta.",
    jornada: "Jornada 44h com sobreaviso. Pausas conforme CLT.",
    biomecanica: "Posturas frequentes de tronco flexionado, agachado, ajoelhado e deitado sob máquinas. Aplicação de força em ferramentas de aperto (torque), levantamento manual de peças (frequentemente >20 kg — indicar auxílio mecânico), preensão forte sustentada.",
    riscos: [
      "Sobrecarga lombar",
      "Compressão de joelhos e ombros",
      "Vibração de mãos e braços em ferramentas pneumáticas",
      "Preensão forte de ferramentas",
    ],
    tarefas_crono: [
      { tarefa: "Diagnóstico e planejamento", tempo: "15 min", risco: "Baixo" },
      { tarefa: "Bloqueio e preparação", tempo: "10 min", risco: "Baixo" },
      { tarefa: "Desmontagem", tempo: "45 min", risco: "Alto — força e postura" },
      { tarefa: "Substituição/reparo", tempo: "60 min", risco: "Alto" },
      { tarefa: "Montagem e testes", tempo: "45 min", risco: "Moderado" },
    ],
    recomendacoes: [
      { o_que: "Uso de dispositivos de içamento para peças pesadas", como: "Fornecer talhas e treinar equipe para não realizar levantamento manual >15 kg", responsavel: "Engenharia + SESMT", prazo: "90 dias" },
      { o_que: "Bancadas reguláveis", como: "Adotar bancadas com altura regulável para trabalhos de precisão em pé", responsavel: "Engenharia", prazo: "120 dias" },
    ],
  },
  {
    chave: "operador_maquina",
    aliases: ["operador de máquinas", "operador de maquinas", "operador", "operador de produção"],
    posto: "Posto junto a máquina/linha de produção, com painel de comando, alimentação de material, retirada de produto acabado. Pode envolver atividade em pé sustentada ou alternância com movimentação.",
    atividades: [
      "Setup e ajuste da máquina",
      "Alimentação contínua de matéria-prima",
      "Monitoramento de parâmetros de processo",
      "Retirada e inspeção do produto",
      "Limpeza e organização do posto",
    ],
    organizacao: "Ritmo imposto pela linha. Supervisão direta do encarregado de produção. Metas quantitativas frequentes.",
    ritmo: "Ritmo alto e imposto. Repetitividade de movimentos frequentemente elevada (avaliar por OCRA Checklist).",
    jornada: "Turnos de 6h ou 8h, muitas vezes em regime de revezamento. Pausas NR-17.6.3 aplicáveis.",
    biomecanica: "Postura em pé sustentada, alcances laterais frequentes, movimentos repetitivos de MMSS, aplicação de força pontual, torções de tronco em coletas laterais.",
    riscos: [
      "Fadiga por bipedestação prolongada",
      "LER/DORT em MMSS por repetitividade",
      "Sobrecarga lombar por torção",
      "Compressão plantar",
    ],
    tarefas_crono: [
      { tarefa: "Setup inicial", tempo: "15 min", risco: "Moderado" },
      { tarefa: "Ciclo produtivo (alimentação/retirada)", tempo: "50 min contínuos", risco: "Alto — repetitividade" },
      { tarefa: "Pausa NR-17.6.3", tempo: "10 min", risco: "Baixo" },
      { tarefa: "Inspeção e ajustes", tempo: "10 min", risco: "Moderado" },
      { tarefa: "Limpeza final", tempo: "15 min", risco: "Baixo" },
    ],
    recomendacoes: [
      { o_que: "Estrados/tapetes antifadiga", como: "Fornecer estrados antifadiga em postos com bipedestação >4h", responsavel: "SESMT", prazo: "60 dias" },
      { o_que: "Rodízio e pausas programadas", como: "Implantar rodízio entre postos de diferente exigência biomecânica e pausas de 10 min a cada 50 min", responsavel: "RH + Produção", prazo: "30 dias" },
    ],
  },
  {
    chave: "tecnico_seguranca",
    aliases: ["técnico de segurança", "tecnico de segurança", "técnico em segurança do trabalho", "tst"],
    posto: "Atividade itinerante entre áreas operacionais, escritório do SESMT e campo. Uso de EPIs, instrumentos de medição (dosímetro, luxímetro, termômetro de globo), câmera fotográfica, notebook.",
    atividades: [
      "Inspeções de segurança em campo",
      "Aplicação e análise de checklists",
      "Elaboração de relatórios, laudos e documentos legais",
      "Treinamentos e DDS",
      "Atendimento e investigação de acidentes",
    ],
    organizacao: "Alta autonomia técnica. Supervisão por coordenador/engenheiro de segurança. Metas de inspeções e projetos.",
    ritmo: "Alternância entre trabalho analítico sedentário e inspeções em campo. Demanda cognitiva alta.",
    jornada: "Jornada 44h com necessidades pontuais fora do expediente para atendimento a emergências.",
    biomecanica: "Alternância entre postura sentada prolongada (relatórios) e postura em pé/caminhada (inspeções). Uso intensivo de teclado/mouse. Subida em escadas e acesso a áreas confinadas eventualmente.",
    riscos: [
      "Cervicalgia e lombalgia postural",
      "LER/DORT em MMSS por digitação",
      "Sobrecarga mental por multitarefa",
    ],
    tarefas_crono: [
      { tarefa: "Elaboração de relatórios/laudos", tempo: "60 min contínuos", risco: "Alto — postura e visual" },
      { tarefa: "Pausa NR-17.6.3", tempo: "10 min", risco: "Baixo" },
      { tarefa: "Inspeção em campo", tempo: "45 min", risco: "Moderado" },
      { tarefa: "Reuniões/DDS", tempo: "30 min", risco: "Baixo" },
    ],
    recomendacoes: [
      { o_que: "Estação de trabalho ergonômica", como: "Cadeira regulável, suporte de monitor, teclado/mouse externos para notebook", responsavel: "SESMT + Administração", prazo: "60 dias" },
      { o_que: "Programa de pausas", como: "Aplicar NR-17.6.3 durante períodos de elaboração intensiva de documentos", responsavel: "SESMT", prazo: "30 dias" },
    ],
  },
  {
    chave: "supervisor_manutencao",
    aliases: ["supervisor de manutenção", "supervisor de manutencao", "encarregado de manutenção", "coordenador de manutenção"],
    posto: "Posto híbrido: sala do supervisor com computador para gestão de OS e KPIs + presença frequente em campo para acompanhamento das equipes de manutenção.",
    atividades: [
      "Planejamento e distribuição de OS",
      "Acompanhamento de execução em campo",
      "Análise de indicadores (MTBF, MTTR, backlog)",
      "Reuniões operacionais",
      "Gestão de pessoas",
    ],
    organizacao: "Autonomia gerencial alta. Metas de disponibilidade e confiabilidade. Cobrança por resultados.",
    ritmo: "Alta variabilidade, com picos por emergências. Elevada demanda cognitiva e psicossocial (gestão de pessoas e resultados).",
    jornada: "Jornada 44h com sobreaviso frequente. Alta prevalência de horas extras.",
    biomecanica: "Alternância sentado/em pé/caminhada. Digitação frequente. Deslocamentos moderados. Ocasionalmente subida em máquinas para acompanhamento.",
    riscos: [
      "Sobrecarga mental e estresse",
      "Cervicalgia e lombalgia postural",
      "Fadiga visual",
    ],
    tarefas_crono: [
      { tarefa: "Análise de OS e KPIs no computador", tempo: "60 min", risco: "Moderado" },
      { tarefa: "Acompanhamento em campo", tempo: "60 min", risco: "Moderado" },
      { tarefa: "Reuniões", tempo: "30 min", risco: "Baixo" },
      { tarefa: "Elaboração de relatórios", tempo: "45 min", risco: "Moderado" },
    ],
    recomendacoes: [
      { o_que: "Estação ergonômica na sala de gestão", como: "Cadeira e monitor adequados; considerar mesa sit-stand", responsavel: "Administração", prazo: "90 dias" },
      { o_que: "Programa de manejo de estresse", como: "Ações psicossociais estruturadas (COPSOQ) para líderes de manutenção", responsavel: "RH + SESMT", prazo: "120 dias" },
    ],
  },
];

export function acharConhecimento(nomes: string[]): FuncaoConhecimento | null {
  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const alvo = nomes.map(norm).join(" | ");
  for (const c of CONHECIMENTO_FUNCOES) {
    for (const a of c.aliases) {
      if (alvo.includes(norm(a))) return c;
    }
  }
  return null;
}

export const CONHECIMENTO_GENERICO: FuncaoConhecimento = {
  chave: "generico",
  aliases: [],
  posto: "Posto de trabalho conforme cadastro do setor. Recomenda-se descrever mobiliário, equipamentos, ferramentas e layout observados em campo para complemento desta análise.",
  atividades: [
    "Execução das tarefas típicas da função conforme descrição de cargo",
    "Uso dos equipamentos e ferramentas específicos do posto",
    "Cumprimento de procedimentos operacionais",
  ],
  organizacao: "Organização do trabalho conforme padrão da empresa: supervisão, distribuição de tarefas, metas e autonomia a serem detalhadas pelo gestor imediato.",
  ritmo: "Ritmo e complexidade conforme natureza da função. Recomenda-se detalhar cadência (imposta/livre), variabilidade e exigências cognitivas.",
  jornada: "Jornada conforme registrada no cadastro da empresa, respeitando intervalos legais e recomendações da NR-17.6 quando aplicáveis.",
  biomecanica: "Caracterização biomecânica deve considerar as posturas mais frequentes, amplitudes articulares, cargas manipuladas e repetitividade observadas — a interpretar em conjunto com as ferramentas ergonômicas aplicadas.",
  riscos: ["Fatores a serem identificados conforme observação em campo"],
  tarefas_crono: [
    { tarefa: "Preparação e organização do posto", tempo: "15 min", risco: "Baixo" },
    { tarefa: "Execução das tarefas principais", tempo: "60 min", risco: "Moderado — a confirmar em campo" },
    { tarefa: "Pausas e deslocamentos", tempo: "10 min", risco: "Baixo" },
    { tarefa: "Finalização e registros", tempo: "15 min", risco: "Baixo" },
  ],
  recomendacoes: [
    { o_que: "Análise ergonômica complementar em campo", como: "Aplicar ferramentas ergonômicas específicas (RULA/REBA/OCRA/NIOSH) durante ciclo real de trabalho", responsavel: "SESMT", prazo: "60 dias" },
    { o_que: "Adequação do posto conforme NR-17", como: "Verificar mobiliário, dimensionamentos e organização conforme itens 17.3 e 17.5 da NR-17", responsavel: "SESMT + Engenharia", prazo: "90 dias" },
  ],
};
