// Mapeamento simplificado CNAE → Grau de Risco (NR-04)
// Baseado na classificação CNAE principal (2 primeiros dígitos)
const cnaeGrauRiscoMap: Record<string, string> = {
  "01": "3", // Agricultura
  "02": "3", // Silvicultura
  "03": "3", // Pesca
  "05": "4", // Extração de carvão
  "06": "4", // Extração de petróleo
  "07": "4", // Extração de minerais metálicos
  "08": "4", // Extração de minerais não-metálicos
  "09": "3", // Atividades de apoio à extração
  "10": "3", // Fabricação de produtos alimentícios
  "11": "3", // Fabricação de bebidas
  "12": "3", // Fabricação de produtos do fumo
  "13": "3", // Fabricação de produtos têxteis
  "14": "2", // Confecção de artigos do vestuário
  "15": "3", // Preparação de couros
  "16": "3", // Fabricação de produtos de madeira
  "17": "3", // Fabricação de celulose e papel
  "18": "2", // Impressão
  "19": "3", // Fabricação de coque e derivados
  "20": "3", // Fabricação de produtos químicos
  "21": "2", // Fabricação de produtos farmoquímicos
  "22": "3", // Fabricação de produtos de borracha
  "23": "3", // Fabricação de produtos minerais não-metálicos
  "24": "3", // Metalurgia
  "25": "3", // Fabricação de produtos de metal
  "26": "2", // Fabricação de equipamentos de informática
  "27": "2", // Fabricação de máquinas e equipamentos elétricos
  "28": "3", // Fabricação de máquinas e equipamentos
  "29": "3", // Fabricação de veículos automotores
  "30": "3", // Fabricação de outros equipamentos de transporte
  "31": "3", // Fabricação de móveis
  "32": "2", // Fabricação de produtos diversos
  "33": "2", // Manutenção e reparação de máquinas
  "35": "3", // Eletricidade, gás e outras utilidades
  "36": "2", // Captação e distribuição de água
  "37": "3", // Esgoto
  "38": "3", // Coleta e tratamento de resíduos
  "39": "2", // Descontaminação
  "41": "3", // Construção de edifícios
  "42": "4", // Obras de infraestrutura
  "43": "3", // Serviços especializados para construção
  "45": "2", // Comércio e reparação de veículos
  "46": "2", // Comércio por atacado
  "47": "2", // Comércio varejista
  "49": "3", // Transporte terrestre
  "50": "3", // Transporte aquaviário
  "51": "3", // Transporte aéreo
  "52": "3", // Armazenamento
  "53": "2", // Correio e serviços de entrega
  "55": "2", // Alojamento
  "56": "2", // Alimentação
  "58": "1", // Edição e edição integrada à impressão
  "59": "1", // Atividades cinematográficas
  "60": "1", // Atividades de televisão
  "61": "2", // Telecomunicações
  "62": "1", // Tecnologia da informação
  "63": "1", // Prestação de serviços de informação
  "64": "1", // Atividades financeiras
  "65": "1", // Seguros
  "66": "1", // Atividades auxiliares financeiras
  "68": "1", // Atividades imobiliárias
  "69": "1", // Atividades jurídicas e contabilidade
  "70": "1", // Atividades de sedes de empresas
  "71": "1", // Atividades de arquitetura e engenharia
  "72": "1", // Pesquisa e desenvolvimento
  "73": "1", // Publicidade
  "74": "1", // Outras atividades profissionais
  "75": "2", // Atividades veterinárias
  "77": "1", // Aluguéis
  "78": "2", // Seleção e agenciamento de mão-de-obra
  "79": "1", // Agências de viagens
  "80": "2", // Atividades de vigilância
  "81": "2", // Serviços para edifícios
  "82": "1", // Serviços de escritório
  "84": "1", // Administração pública
  "85": "1", // Educação
  "86": "3", // Atividades de atenção à saúde humana
  "87": "3", // Atividades de atenção à saúde residenciais
  "88": "2", // Serviços de assistência social
  "90": "1", // Atividades artísticas
  "91": "1", // Atividades ligadas ao patrimônio cultural
  "92": "1", // Atividades de exploração de jogos
  "93": "2", // Atividades esportivas
  "94": "1", // Atividades de organizações associativas
  "95": "2", // Reparação de equipamentos
  "96": "2", // Outras atividades de serviços pessoais
  "97": "2", // Serviços domésticos
  "99": "1", // Organismos internacionais
};

export function getGrauRiscoByCnae(cnae: string): string {
  // Extract first 2 digits from CNAE
  const digits = cnae.replace(/\D/g, "").slice(0, 2);
  return cnaeGrauRiscoMap[digits] || "";
}
