// Shared field authority for AET VALE editing, generation and safe merging.
export const TEXTOS_ETAPA2 = {
  "posto": "Características do posto de trabalho",
  "mobiliario": "Mobiliário do posto de trabalho",
  "iluminacao": "Iluminação",
  "ventilacao": "Ventilação",
  "temperatura": "Temperatura (°C)",
  "ruido": "Ruído dB(A)",
  "corpo_outros": "Outras partes do corpo",
  "carga_comentarios": "Comentários sobre movimentação de cargas",
  "maquinas_outros": "Outras máquinas, equipamentos e ferramentas",
  "posturas_outros": "Outras posturas",
  "normas_producao": "Normas de produção",
  "conteudo_tempo": "Determinação do conteúdo de tempo",
  "psicossociais": "Aspectos psicossociais e cognitivos",
  "ritmo": "Ritmo de trabalho",
  "exigencias_tempo": "Exigências de tempo",
  "conteudo_tarefas": "Conteúdo das tarefas",
  "taxa_ocupacao": "Taxa de ocupação (% do ciclo)",
  "operacoes_turno": "Nº de peças/manutenções/operações por turno",
  "engenharia": "Controles de engenharia — quais?",
  "administrativos": "Controles administrativos — quais?",
  "descricao_fatores": "Descrição complementar dos fatores",
  "resultados": "Resultados das ferramentas",
  "biomecanicos": "Fatores biomecânicos",
  "conclusao": "Conclusão técnica"
} as const;
export const CHECKS_ETAPA2 = {
  "corpo": [
    "Partes do corpo envolvidas",
    [
      "Coluna lombar",
      "Coluna cervical",
      "Membro superior direito",
      "Membro superior esquerdo",
      "Membro inferior direito",
      "Membro inferior esquerdo",
      "Outros"
    ]
  ],
  "pega": [
    "Boa condição de pega?",
    [
      "Sim",
      "Não"
    ]
  ],
  "piso": [
    "Pisos em boas condições para o transporte?",
    [
      "Sim",
      "Não"
    ]
  ],
  "peso": [
    "Peso e tamanho compatíveis com PRO-028184?",
    [
      "Sim",
      "Não"
    ]
  ],
  "altura_carga": [
    "Necessidade de erguer, retirar, armazenar ou carregar materiais",
    [
      "Próximo ao solo",
      "Acima dos ombros"
    ]
  ],
  "distancia_carga": [
    "Levantamento não eventual com distância horizontal superior a 60 cm?",
    [
      "Sim",
      "Não",
      "N/A"
    ]
  ],
  "maquinas": [
    "Máquinas, equipamentos e ferramentas",
    [
      "Fácil manuseio",
      "Proporciona conforto, leveza e eficiência",
      "Ferramentas pesadas estão sustentadas",
      "Outros"
    ]
  ],
  "posturas": [
    "Posturas adotadas durante o trabalho",
    [
      "Somente em pé parado",
      "Extensão excessiva de braços e nuca",
      "Em pé e andando",
      "Flexão, inclinação ou torção constante do tronco",
      "Sentado",
      "Fácil visualização e operação",
      "Alternando",
      "Tarefa dentro da área de alcance do trabalhador",
      "Presença de elevação de ombros",
      "Livre de quinas vivas ou arestas",
      "Outros"
    ]
  ],
  "assento": [
    "Assento — postura sentada",
    [
      "Ajuste de fácil manuseio do assento",
      "Ajuste de fácil manuseio da região lombar",
      "Densidade do estofado adequada e em bom estado",
      "Apoio para os pés ajustável, permitindo apoio total da planta dos pés, quando aplicável",
      "A postura sentada permite fácil movimentação dos membros inferiores",
      "N/A"
    ]
  ],
  "postura_pe": [
    "Postura em pé",
    [
      "Possibilidade de alternância entre postura sentada e em pé",
      "Assento disponível para pausas nos postos de trabalho",
      "N/A"
    ]
  ],
  "controles": [
    "Medidas de controles existentes",
    [
      "Possibilidade de pausa entre os ciclos",
      "Controles de engenharia",
      "Controles administrativos",
      "Autonomia e flexibilidade",
      "Possibilidade de interromper o trabalho para necessidades fisiológicas",
      "Rodízio de atividades",
      "N/A"
    ]
  ],
  "local_pausa": [
    "Existe local adequado para pausas?",
    [
      "Sim",
      "Não"
    ]
  ],
  "pausa": [
    "Condições do local de pausa",
    [
      "Possui assento para 50% da população que trabalha alternando postura ou 100% para postos em pé",
      "Possui relógio de fácil visualização",
      "Possui acesso fácil e irrestrito à água potável",
      "Próximo dos sanitários",
      "Local possui climatização",
      "N/A"
    ]
  ],
  "ferramentas": [
    "Ferramentas de análise",
    [
      "OCRA",
      "NIOSH",
      "NIOSH by OCRA",
      "Moore e Garg",
      "Check List",
      "NA"
    ]
  ]
} as const;
export const CAMPOS_ETAPA1 = ["gerencia_area", "descricao_ambiente", "data_avaliacao", "revisao", "nome_gere", "jornada", "cargo", "descricao_cargo", "tarefa_analisada", "origem_detalhe", "demanda_ergonomica", "descricao_tarefa", "analise_atividade", "verbalizacao"] as const;
export type FatorVale = { id: string; origem: string; circunstancia: string; situacao: string; tipo: string; estimativa: string; perfil: string; severidade: string; classificacao: string; recomendacoes?: string };
export type AcaoVale = { fator_id: string; o_que: string; por_que: string; onde: string; quem: string; quando: string; como: string; quanto: string };
export type Etapa2Vale = { textos: Record<string, string>; checks: Record<string, string[]>; fotos: import("./aetValeFotos").FotoVale[]; diagnosticos: Record<string, string>; plano: AcaoVale[] };
export function etapa2Vazia(): Etapa2Vale { return { textos: {}, checks: {}, fotos: [{ imagem: "", descricao: "" }, { imagem: "", descricao: "" }], diagnosticos: {}, plano: [] }; }
export function mesclarEtapa2(v?: Partial<Etapa2Vale>): Etapa2Vale { const b = etapa2Vazia(); return { ...b, ...v, textos: { ...v?.textos }, checks: { ...v?.checks }, diagnosticos: { ...v?.diagnosticos }, fotos: v?.fotos?.length ? v.fotos : b.fotos, plano: Array.isArray(v?.plano) ? v.plano : [] }; }
const norm = (v: unknown) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export function exigeDiagnostico(v: string) { return ["medio", "alto", "muito alto", "critico", "moderado"].includes(norm(v)); }
const chaveFator = (...v: unknown[]) => { let h = 2166136261; for (const c of v.map(norm).join("|") ) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };
export function fatoresVale(aprs: any[], aeps: any[], alvo: { setorId: string; funcaoId: string; funcaoNome: string; setorNome?: string; ghe?: string }): FatorVale[] {
  const out: FatorVale[] = [];
  for (const doc of aprs) {
    const s = doc.draft_snapshot || {};
    if (s.setor_id !== alvo.setorId) continue;
    const docIds = s.funcao_id ? [s.funcao_id] : s.funcao_ids || [];
    for (const [i, r] of (s.tabela?.linhas || s.linhas || []).entries()) {
      const ids = r.funcao_ids?.length ? r.funcao_ids : r.funcao_id ? [r.funcao_id] : docIds;
      if (r.setor_id && r.setor_id !== alvo.setorId || !ids.includes(alvo.funcaoId)) continue;
      out.push({ id: `apr:${doc.id}:${r.id || chaveFator(r.circunstancia, r.situacao, r.exigencia)}`, origem: "APR-ERGO", circunstancia: r.circunstancia || "", situacao: r.situacao || "", tipo: r.tipo || "", estimativa: r.estimativa || "", perfil: r.perfil || "", severidade: r.severidade || "", classificacao: r.classificacao || "", recomendacoes: r.recomendacoes || "" });
    }
  }
  const setores = aeps.flatMap(d => (d.setores || []).map((s: any) => ({ d, s })));
  const encontrados = setores.filter(({s}) => {
    if (s.setor_id ? s.setor_id !== alvo.setorId : norm(s.setor_nome) !== norm(alvo.setorNome)) return false;
    if (alvo.ghe && s.ges && norm(s.ges) !== norm(alvo.ghe)) return false;
    const fs = s.funcoes_selecionadas || [];
    const ids = fs.map((f: any) => f?.id).filter(Boolean);
    return ids.length ? ids.includes(alvo.funcaoId) : fs.some((f: any) => norm(f?.nome || f) === norm(alvo.funcaoNome)) || norm(s.funcao_ges) === norm(alvo.funcaoNome);
  });
  for (const encontrado of encontrados.filter(c => c.d.id === encontrados[0]?.d.id)) for (const [i, r] of (encontrado.s.riscos_lista || []).entries()) {
    if (r.funcao_id && r.funcao_id !== alvo.funcaoId || r.funcao_ids?.length && !r.funcao_ids.includes(alvo.funcaoId)) continue;
    out.push({ id: `aep:${encontrado.d.id}:${r.id || chaveFator(encontrado.s.setor_id, encontrado.s.ges, r.fator_risco, r.fonte_geradora)}`, origem: "AEP", circunstancia: r.fator_risco || "", situacao: r.justificativa || "", tipo: r.tipo_agente || "", estimativa: r.probabilidade || "", perfil: r.perfil || "", severidade: r.severidade || "", classificacao: r.nivel_risco === "Crítico" ? "Muito Alto" : r.nivel_risco || "" });
  }
  return out.filter((f, i) => out.findIndex(x => x.id === f.id) === i);
}
export type PropostaVale = { etapa1: Record<string, string>; origens: string[]; etapa2: Etapa2Vale; confirmacoes: string[] };
/** Read-only APR source for Dados da AEP, shared by screen and both downloads. */
export function riscosAprValeAltos(aprs: any[], alvo: Parameters<typeof fatoresVale>[2]): FatorVale[] {
  return fatoresVale(aprs, [], alvo).filter(f => ["alto", "muito alto"].includes(norm(f.classificacao)));
}

/** Ambiguous multi-sector/function forms must not supply another function's evidence. */
export function formulariosValeExatos<T extends { empresa_id: string; contrato_id: string; setor_ids: string[]; dados: any }>(formularios: T[], alvo: { empresaId: string; contratoId: string; setorId: string; funcaoId: string }) {
  return formularios.filter(f => f.empresa_id === alvo.empresaId && f.contrato_id === alvo.contratoId &&
    f.setor_ids.length === 1 && f.setor_ids[0] === alvo.setorId &&
    Array.isArray(f.dados?.funcoes) && f.dados.funcoes.length > 0 && f.dados.funcoes.every((id: string) => id === alvo.funcaoId));
}
export function aplicarPropostaVale<T extends { etapa2: Etapa2Vale; origens: string[] }>(atual: T, proposta: PropostaVale, substituir: boolean): T {
  const out: any = { ...atual, etapa2: mesclarEtapa2(atual.etapa2) };
  const merge = (a: Record<string, any>, b: Record<string, any>, permitidos?: string[]) => {
    for (const [k, v] of Object.entries(b || {})) if ((!permitidos || permitidos.includes(k)) && v && (substituir || !a[k] || Array.isArray(a[k]) && !a[k].length)) a[k] = v;
  };
  merge(out, proposta.etapa1, [...CAMPOS_ETAPA1]);
  if (substituir || !atual.origens.length) out.origens = proposta.origens;
  merge(out.etapa2.textos, proposta.etapa2.textos, Object.keys(TEXTOS_ETAPA2));
  merge(out.etapa2.checks, proposta.etapa2.checks, Object.keys(CHECKS_ETAPA2));
  merge(out.etapa2.diagnosticos, proposta.etapa2.diagnosticos);
  if (substituir || !out.etapa2.plano.length) out.etapa2.plano = proposta.etapa2.plano;
  return out;
}
