/**
 * Geração do Relatório Psicossocial Geral (COPSOQ) em PDF.
 *
 * Ajustes desta versão:
 *  - Limiar de risco em tercis (COPSOQ III): Baixo ≤33 • Moderado 34-66 • Alto 67-84 • Crítico ≥85.
 *  - Gráfico de dimensões substituído por 4 gráficos horizontais (um por categoria),
 *    com nome completo do fator, valor médio, percentual e classificação automática.
 *  - Avaliação dos Riscos lista TODOS os fatores avaliados (independentemente do nível).
 *  - Atividades consolidadas e desduplicadas a partir de todas as funções avaliadas.
 *  - Removidos: "Quantidade de trabalhadores", "Data de emissão", "Tendências Identificadas".
 *  - Metodologia complementada com critérios de classificação dos riscos.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AvaliacaoPsicossocial,
  BLOCOS_COPSOQ,
  calcularPsicossocial,
} from "@/components/PsicossocialModal";
import { polaridadePergunta } from "@/lib/copsoqBlocos";

export type RelatorioContext = {
  empresa_nome?: string;
  cnpj?: string;
  contrato_numero?: string;
  setor_nome?: string;
  ges?: string;
  descricao_ambiente?: string;
  funcoes?: string[];
  jornada_trabalho?: string;
  escala?: string;
  supervisao?: string;
  atividades?: string;
  atividades_funcoes?: string[];
  responsavel?: string;
  cargo_responsavel?: string;
  crea?: string;
  data_elaboracao?: string;
  entrevistas?: boolean;
  observacao?: boolean;
  analise_documental?: boolean;

  // ─── Integração AET/AEP (dados ergonômicos do setor) ───
  aet_ritmo_complexidade?: string;
  aet_jornada_aspectos?: string;
  aet_caracterizacao_biomecanica?: string;
  aet_tarefas?: string;
  aet_riscos_observados?: string;
  aet_analise_organizacional?: string;
  aet_diagnostico_ergonomico?: string;
  aet_conclusao?: string;
  aet_plano_acao?: { o_que: string; como: string; responsavel: string; prazo: string }[];
  aet_ferramentas?: {
    tipo: string;
    resultado: string;
    classificacao?: string;
    nivel_acao?: string;
    escore_final?: number | null;
  }[];
  aet_dimensoes?: { item: string; medida: string; avaliacao: string }[];
  aet_cronoanalise?: { tarefa: string; tempo: string; risco: string }[];
};

// ─── Paleta ───
const COR_NIVEL: Record<string, [number, number, number]> = {
  Baixo: [34, 197, 94],
  Moderado: [234, 179, 8],
  Alto: [249, 115, 22],
  Crítico: [220, 38, 38],
};

const TITULOS_BLOCO: Record<string, string> = {
  exigencias: "Exigências psicológicas",
  controle: "Controle e autonomia",
  apoio: "Apoio social",
  reconhecimento: "Reconhecimento e recompensa",
  seguranca: "Segurança e estabilidade",
  conflitos: "Conflitos e conduta",
  sintomas: "Sintomas de estresse / burnout",
  lideranca: "Qualidade da liderança",
};

// ─── Classificação (COPSOQ III, tercis) ───
function classificar(media: number): "Baixo" | "Moderado" | "Alto" | "Crítico" {
  if (media >= 85) return "Crítico";
  if (media >= 67) return "Alto";
  if (media >= 34) return "Moderado";
  return "Baixo";
}

function valorRisco(valor: number, blocoKey: string, perguntaIdx: number): number {
  return polaridadePergunta(blocoKey, perguntaIdx) === "pos" ? 100 - valor : valor;
}

// ─── Fatores por categoria (atualizados para o novo questionário) ───
type FatorDef = { nome: string; bloco: string; perguntaIdx: number[] };
const CATEGORIAS: { categoria: string; fatores: FatorDef[] }[] = [
  {
    categoria: "Organização do Trabalho",
    fatores: [
      { nome: "Ritmo excessivo de trabalho", bloco: "exigencias", perguntaIdx: [0] },
      { nome: "Prazos muito curtos", bloco: "exigencias", perguntaIdx: [1] },
      { nome: "Alta responsabilidade decisória", bloco: "exigencias", perguntaIdx: [2] },
      { nome: "Falta de autonomia sobre o trabalho", bloco: "controle", perguntaIdx: [0, 1] },
      { nome: "Ausência de pausas adequadas", bloco: "controle", perguntaIdx: [2] },
    ],
  },
  {
    categoria: "Relações Interpessoais",
    fatores: [
      { nome: "Conflitos frequentes no ambiente", bloco: "conflitos", perguntaIdx: [0] },
      { nome: "Tratamento desrespeitoso / assédio moral", bloco: "conflitos", perguntaIdx: [2] },
      { nome: "Falta de canal seguro para denúncia de assédio", bloco: "conflitos", perguntaIdx: [3] },
      { nome: "Baixo apoio dos colegas", bloco: "apoio", perguntaIdx: [0, 1] },
      { nome: "Falta de apoio da liderança direta", bloco: "apoio", perguntaIdx: [2] },
    ],
  },
  {
    categoria: "Condições Organizacionais",
    fatores: [
      { nome: "Insegurança quanto ao emprego", bloco: "seguranca", perguntaIdx: [0] },
      { nome: "Insatisfação com o trabalho", bloco: "seguranca", perguntaIdx: [1] },
      { nome: "Preocupação com mudanças organizacionais", bloco: "seguranca", perguntaIdx: [2] },
      { nome: "Falta de reconhecimento profissional", bloco: "reconhecimento", perguntaIdx: [0, 1] },
      { nome: "Ausência de feedback estruturado", bloco: "reconhecimento", perguntaIdx: [2] },
    ],
  },
  {
    categoria: "Liderança e Justiça Organizacional",
    fatores: [
      { nome: "Liderança percebida como parcial/injusta", bloco: "lideranca", perguntaIdx: [0] },
      { nome: "Baixa escuta ativa da liderança", bloco: "lideranca", perguntaIdx: [1] },
      { nome: "Ausência de incentivo ao desenvolvimento", bloco: "lideranca", perguntaIdx: [2] },
    ],
  },
  {
    categoria: "Saúde Mental e Sintomas",
    fatores: [
      { nome: "Sobrecarga emocional", bloco: "exigencias", perguntaIdx: [3] },
      { nome: "Exposição a conflitos interpessoais", bloco: "exigencias", perguntaIdx: [4] },
      { nome: "Interferência trabalho-vida pessoal", bloco: "conflitos", perguntaIdx: [1] },
      { nome: "Distúrbios do sono relacionados ao trabalho", bloco: "sintomas", perguntaIdx: [0] },
      { nome: "Fadiga recorrente", bloco: "sintomas", perguntaIdx: [1] },
      { nome: "Esgotamento emocional (burnout)", bloco: "sintomas", perguntaIdx: [2] },
      { nome: "Exaustão no início da jornada", bloco: "sintomas", perguntaIdx: [3] },
    ],
  },
];

function mediaFator(avs: AvaliacaoPsicossocial[], f: FatorDef): number {
  const valores: number[] = [];
  for (const a of avs) {
    const respostas = a.respostas?.[f.bloco] || [];
    for (const idx of f.perguntaIdx) {
      const r = respostas[idx];
      if (typeof r === "number" && r >= 0) {
        valores.push(valorRisco(r, f.bloco, idx));
      }
    }
  }
  if (!valores.length) return 0;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
}

function mediaDimensao(avs: AvaliacaoPsicossocial[], blocoKey: string): number {
  if (!avs.length) return 0;
  const calc = avs.map((a) => calcularPsicossocial(a));
  const vals = calc.map((c) => c.blocos[blocoKey]?.media ?? 0);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function nivelGeral(avs: AvaliacaoPsicossocial[]) {
  const medias = BLOCOS_COPSOQ.map((b) => mediaDimensao(avs, b.key));
  const media = medias.reduce((a, b) => a + b, 0) / (medias.length || 1);
  return { media: Math.round(media * 10) / 10, classificacao: classificar(media) };
}

function distribuicaoPorNivel(avs: AvaliacaoPsicossocial[]) {
  const dist: Record<string, number> = { Baixo: 0, Moderado: 0, Alto: 0, Crítico: 0 };
  for (const cat of CATEGORIAS) {
    for (const f of cat.fatores) {
      dist[classificar(mediaFator(avs, f))]++;
    }
  }
  return [
    { label: "Baixo", value: dist.Baixo, cor: COR_NIVEL.Baixo },
    { label: "Moderado", value: dist.Moderado, cor: COR_NIVEL.Moderado },
    { label: "Alto", value: dist.Alto, cor: COR_NIVEL.Alto },
    { label: "Crítico", value: dist.Crítico, cor: COR_NIVEL.Crítico },
  ];
}

function identificarFatoresRelevantes(avs: AvaliacaoPsicossocial[]) {
  const out: Record<string, string[]> = {};
  for (const cat of CATEGORIAS) {
    const itens: string[] = [];
    for (const f of cat.fatores) {
      const m = mediaFator(avs, f);
      if (classificar(m) !== "Baixo") itens.push(f.nome);
    }
    if (itens.length) out[cat.categoria] = itens;
  }
  return out;
}

// ─── Consolidação de atividades de todas as funções ───
const ATIV_PALAVRAS_CHAVE = [
  "atend", "clien", "públic", "publi", "gest", "equip", "process", "document",
  "control", "operac", "administ", "supervis", "lidera", "vend", "negoc",
  "treina", "ensin", "cuid", "saúde", "pacient", "emergên", "atend.", "respons",
  "decis", "anális", "planejam", "report", "auditor", "monitor", "abord",
  "comunic", "negocia",
];
function consolidarAtividades(ctx: RelatorioContext): string[] {
  const fonte: string[] = [];
  if (ctx.atividades_funcoes?.length) fonte.push(...ctx.atividades_funcoes);
  if (ctx.atividades) fonte.push(ctx.atividades);
  if (ctx.descricao_ambiente) fonte.push(ctx.descricao_ambiente);

  const partes: string[] = [];
  for (const txt of fonte) {
    if (!txt) continue;
    txt.split(/[\n;•·\-]|(?:^|\s)\d+\.\s|, /g).forEach((s) => {
      const t = s.trim().replace(/^[-•·\d.\)\s]+/, "");
      if (t.length >= 4 && t.length <= 140) partes.push(t);
    });
  }

  // Dedup case-insensitive
  const dedup = new Map<string, string>();
  for (const p of partes) {
    const key = p.toLowerCase().replace(/\s+/g, " ").trim();
    if (!dedup.has(key)) dedup.set(key, p.charAt(0).toUpperCase() + p.slice(1));
  }
  let lista = Array.from(dedup.values());

  // Filtra apenas atividades com relação lógica com fatores psicossociais
  const filtrada = lista.filter((p) =>
    ATIV_PALAVRAS_CHAVE.some((kw) => p.toLowerCase().includes(kw)),
  );
  // Se o filtro eliminar tudo, mantém as originais (evita relatório vazio).
  return (filtrada.length ? filtrada : lista).slice(0, 12);
}

// ─── Fatores de proteção (dimensões percebidas como favoráveis) ───
function identificarFatoresProtecao(avs: AvaliacaoPsicossocial[]): string[] {
  const protecoes: string[] = [];
  const media = (k: string) => mediaDimensao(avs, k);
  if (media("apoio") <= 40) protecoes.push("Bom nível de apoio social entre colegas e liderança");
  if (media("lideranca") <= 40) protecoes.push("Liderança percebida como justa, presente e desenvolvedora");
  if (media("controle") <= 40) protecoes.push("Autonomia decisória e influência sobre o ritmo de trabalho preservadas");
  if (media("reconhecimento") <= 40) protecoes.push("Reconhecimento profissional e feedback adequados");
  if (media("seguranca") <= 40) protecoes.push("Estabilidade e satisfação percebidas no emprego");
  if (media("conflitos") <= 40) protecoes.push("Baixa incidência de conflitos e canais seguros para relato de assédio");
  if (media("sintomas") <= 33) protecoes.push("Ausência de sinais expressivos de fadiga, distúrbios do sono ou burnout");
  return protecoes;
}

// ─── Análise de padrões contextuais (compensações e agravantes) ───
function analisarPadroesContextuais(avs: AvaliacaoPsicossocial[]): { compensadores: string[]; agravantes: string[] } {
  const exig = mediaDimensao(avs, "exigencias");
  const ctrl = mediaDimensao(avs, "controle");
  const apoio = mediaDimensao(avs, "apoio");
  const rec = mediaDimensao(avs, "reconhecimento");
  const lider = mediaDimensao(avs, "lideranca");
  const conf = mediaDimensao(avs, "conflitos");
  const sint = mediaDimensao(avs, "sintomas");
  const seg = mediaDimensao(avs, "seguranca");

  const compensadores: string[] = [];
  const agravantes: string[] = [];

  if (exig >= 67 && apoio <= 40) compensadores.push("alta demanda mitigada por forte apoio social (efeito buffer)");
  if (exig >= 67 && lider <= 40) compensadores.push("exigências elevadas amenizadas por liderança de suporte");
  if (exig >= 50 && ctrl <= 33) compensadores.push("boa autonomia contrabalançando a carga de trabalho");
  if (rec <= 33 && seg <= 33) compensadores.push("reconhecimento e estabilidade percebidos como fatores de proteção");

  if (exig >= 67 && ctrl >= 67) agravantes.push("modelo demanda-controle desequilibrado (Karasek): alta exigência + baixa autonomia");
  if (exig >= 67 && apoio >= 67) agravantes.push("alta demanda combinada a baixo apoio (isolamento — Karasek/Johnson)");
  if (exig >= 67 && rec >= 67) agravantes.push("desequilíbrio esforço-recompensa (modelo de Siegrist)");
  if (lider >= 67 && conf >= 67) agravantes.push("liderança frágil associada a conflitos frequentes (risco de assédio moral)");
  if (sint >= 67 && (apoio >= 67 || lider >= 67)) agravantes.push("sinais de esgotamento sem redes de suporte suficientes — risco de burnout");
  if (conf >= 67 && seg >= 67) agravantes.push("conflitos combinados a insegurança organizacional — clima psicossocial deteriorado");

  return { compensadores, agravantes };
}

function buildResumoExecutivo(avs: AvaliacaoPsicossocial[], ctx: RelatorioContext): string {
  const ng = nivelGeral(avs);
  const fatores = identificarFatoresRelevantes(avs);
  const principais = Object.values(fatores).flat().slice(0, 5);
  const protecoes = identificarFatoresProtecao(avs);
  const partes: string[] = [];
  partes.push(
    `O setor ${ctx.setor_nome || ""} apresentou, na consolidação anonimizada dos questionários COPSOQ aplicados, ` +
    `nível geral de risco psicossocial classificado como ${ng.classificacao} (média ${ng.media}/100).`,
  );
  if (principais.length) partes.push(`Principais fatores de risco identificados: ${principais.join("; ")}.`);
  else partes.push("Não foram identificados fatores de risco psicossocial relevantes nesta avaliação.");
  if (protecoes.length) partes.push(`Fatores de proteção presentes: ${protecoes.slice(0, 3).join("; ")}.`);
  if (ng.classificacao === "Crítico" || ng.classificacao === "Alto") {
    partes.push("Recomenda-se intervenção prioritária conforme o Plano de Ação e a diretriz de Gerenciamento de Riscos Ocupacionais (NR-01).");
  } else if (ng.classificacao === "Moderado") {
    partes.push("Recomenda-se monitoramento sistemático, implementação gradual das ações sugeridas e reavaliação em 12 meses.");
  } else {
    partes.push("Cenário psicossocial favorável; manter boas práticas de gestão e reavaliação periódica em conformidade com a NR-01.");
  }
  return partes.join(" ");
}

function buildPerfilFuncao(avs: AvaliacaoPsicossocial[], ctx: RelatorioContext): string {
  // Cruza funções previstas (ctx.funcoes) com funções que efetivamente responderam,
  // preservando alinhamento por índice com ctx.atividades_funcoes.
  const funcoesCtx = ctx.funcoes || [];
  const descsCtx = ctx.atividades_funcoes || [];
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const respondentes = new Set<string>();
  for (const a of avs) {
    const n = (a.funcao || "").trim();
    if (n) respondentes.add(norm(n));
  }
  // Alvo: união entre selecionadas e respondentes (nome canônico via ctx quando existir)
  const alvoOrdenado: { nome: string; desc: string }[] = [];
  const jaAdd = new Set<string>();
  funcoesCtx.forEach((f, i) => {
    const k = norm(f);
    if (!k || jaAdd.has(k)) return;
    jaAdd.add(k);
    alvoOrdenado.push({ nome: f, desc: (descsCtx[i] || "").trim() });
  });
  for (const a of avs) {
    const nome = (a.funcao || "").trim();
    const k = norm(nome);
    if (!k || jaAdd.has(k)) continue;
    jaAdd.add(k);
    alvoOrdenado.push({ nome, desc: "" });
  }
  if (!alvoOrdenado.length) {
    return "Não foi possível identificar as funções avaliadas para caracterização técnica individual.";
  }
  return alvoOrdenado.map((f) => descreverFuncao(f.nome, f.desc, ctx)).join("\n\n");
}

function descreverFuncao(nome: string, descAtividades: string, ctx: RelatorioContext): string {
  const partes: string[] = [];
  const gesTxt = ctx.ges ? ` (GHE/GES ${ctx.ges})` : "";
  const setorTxt = ctx.setor_nome ? `, vinculada ao setor ${ctx.setor_nome}${gesTxt}` : gesTxt;
  partes.push(`Função ${nome}${setorTxt}.`);

  const d = (descAtividades || "").trim();
  if (d.length >= 6) {
    partes.push(`Natureza das atividades e principais responsabilidades: ${d.replace(/\s+/g, " ")}.`);
  } else {
    partes.push(
      `Natureza das atividades: atividades técnico-operacionais compatíveis com o escopo do setor, sem descrição específica registrada para esta função no cadastro de referência.`,
    );
  }

  const contexto: string[] = [];
  if (ctx.jornada_trabalho) contexto.push(`jornada ${ctx.jornada_trabalho}`);
  if (ctx.escala) contexto.push(`escala ${ctx.escala}`);
  if (ctx.supervisao) contexto.push(`supervisão ${ctx.supervisao}`);
  if (contexto.length) partes.push(`Contexto de trabalho: ${contexto.join(", ")}.`);

  // Inferência léxica de demandas físicas, cognitivas e organizacionais
  const t = d.toLowerCase();
  const fis: string[] = [];
  const cog: string[] = [];
  const org: string[] = [];
  if (/carreg|levant|peso|esfor[çc]o|manuseio|postur|repet/.test(t)) fis.push("manuseio de cargas ou posturas exigentes");
  if (/desloca|caminhad|percurso|externa/.test(t)) fis.push("deslocamentos e trabalho externo");
  if (/máquin|equipament|ferrament|operac/.test(t)) fis.push("operação de equipamentos");
  if (/atend|clien|públic|paci|contato/.test(t)) cog.push("interação frequente com público, clientes ou pacientes");
  if (/decis|anális|planejam|controle|superv|coordena|responsabilidade/.test(t)) cog.push("tomada de decisão e responsabilidade sobre processos");
  if (/document|report|sistema|relat|dados|inform/.test(t)) cog.push("processamento de informações e uso de sistemas");
  if (/prazo|meta|urgen|emergen|turno|plantão|escala/.test(t)) org.push("prazos, metas ou plantões com pressão temporal");
  if (/equipe|colega|grupo|time|multidisc/.test(t)) org.push("trabalho em equipe e interdependência");
  if (/normativ|regulament|auditor|conformidade/.test(t)) org.push("cumprimento de normas e conformidade regulatória");

  const demandas: string[] = [];
  if (fis.length) demandas.push(`físicas (${fis.join(", ")})`);
  if (cog.length) demandas.push(`cognitivas (${cog.join(", ")})`);
  if (org.length) demandas.push(`organizacionais (${org.join(", ")})`);
  if (demandas.length) {
    partes.push(`Principais exigências identificadas: ${demandas.join("; ")} — elementos diretamente relacionados aos fatores psicossociais avaliados nesta análise.`);
  } else {
    partes.push(
      `As exigências físicas, cognitivas e organizacionais são compatíveis com o escopo típico da função, cabendo à avaliação COPSOQ dimensionar a percepção coletiva sobre carga, autonomia, apoio e reconhecimento.`,
    );
  }
  return partes.join(" ");
}

function buildAnaliseTecnica(avs: AvaliacaoPsicossocial[], ctx: RelatorioContext): string[] {
  const ng = nivelGeral(avs);
  const fatores = identificarFatoresRelevantes(avs);
  const totFatores = Object.values(fatores).flat().length;
  const mediasOrden = BLOCOS_COPSOQ
    .map((b) => ({ titulo: TITULOS_BLOCO[b.key] || b.titulo, media: mediaDimensao(avs, b.key) }))
    .sort((a, b) => b.media - a.media);
  const top = mediasOrden.slice(0, 3);
  const { compensadores, agravantes } = analisarPadroesContextuais(avs);

  const paragrafos: string[] = [];
  paragrafos.push(
    `Principais achados: a análise consolidada evidenciou nível geral ${ng.classificacao} ` +
    `(média ${ng.media}/100), com maior intensidade nas dimensões ${top.map((t) => `${t.titulo} (${t.media})`).join(", ")}. ` +
    `Foram identificados ${totFatores} fator(es) de risco distribuídos em ${Object.keys(fatores).length} categoria(s).`,
  );

  if (agravantes.length) {
    paragrafos.push(
      `Padrões agravantes identificados: ${agravantes.join("; ")}. Tais combinações estão associadas na literatura ocupacional ` +
      `(Karasek, Johnson, Siegrist) ao aumento de sofrimento psíquico, adoecimento mental, absenteísmo e presenteísmo.`,
    );
  }
  if (compensadores.length) {
    paragrafos.push(
      `Fatores compensatórios observados: ${compensadores.join("; ")}. Esses elementos atuam como amortecedores organizacionais ` +
      `e devem ser preservados e fortalecidos nas ações de gestão.`,
    );
  }

  paragrafos.push(
    `Coerência e consistência das respostas: a consolidação anonimizada permite avaliar ` +
    `a percepção coletiva. Padrões repetitivos entre as respostas reforçam a validade dos achados como fenômeno organizacional — ` +
    `e não como percepção individual isolada — orientando o foco das intervenções para o nível sistêmico (organização/liderança), ` +
    `conforme preconiza a NR-01.`,
  );

  paragrafos.push(
    `Grupos vulneráveis: no setor ${ctx.setor_nome || "avaliado"}, as funções ${(ctx.funcoes || []).join(", ") || "avaliadas"} ` +
    `concentram os maiores índices nas dimensões ${top.map((t) => t.titulo).join(", ")}, ` +
    `devendo ser priorizadas no plano de ação, com monitoramento nominal-anônimo por função.`,
  );
  return paragrafos;
}

function buildJustificativaTecnica(avs: AvaliacaoPsicossocial[]): string {
  const ng = nivelGeral(avs);
  const criticas = BLOCOS_COPSOQ
    .map((b) => ({ t: TITULOS_BLOCO[b.key] || b.titulo, m: mediaDimensao(avs, b.key), c: classificar(mediaDimensao(avs, b.key)) }))
    .filter((x) => x.c === "Alto" || x.c === "Crítico")
    .sort((a, b) => b.m - a.m);
  let txt = `A classificação geral de risco ${ng.classificacao} (média ${ng.media}/100) fundamenta-se nos critérios de tercis do COPSOQ III `;
  txt += "(Baixo ≤33 • Moderado 34-66 • Alto 67-84 • Crítico ≥85), aplicados a cada uma das 8 dimensões avaliadas. ";
  if (criticas.length) {
    txt += `As dimensões que sustentam a criticidade são: ${criticas.map((c) => `${c.t} (${c.m}, ${c.c})`).join("; ")}. `;
    txt += "A convergência entre múltiplas dimensões elevadas reforça a validade estatística da classificação. ";
  } else {
    txt += "Nenhuma dimensão isolada atingiu níveis Alto ou Crítico, o que sustenta a classificação favorável. ";
  }
  txt += "A metodologia utiliza polaridade por pergunta — perguntas de sentido positivo (autonomia, apoio, liderança) são invertidas antes do cálculo, ";
  txt += "garantindo que a métrica final represente sempre o risco, independentemente da formulação da pergunta. ";
  txt += "Os resultados são interpretados sob a ótica da NR-01 (Gerenciamento de Riscos Ocupacionais), NR-17 (Ergonomia) e das boas práticas internacionais em saúde ocupacional.";
  return txt;
}

function buildConclusao(avs: AvaliacaoPsicossocial[]): string {
  const ng = nivelGeral(avs);
  const principais = Object.values(identificarFatoresRelevantes(avs)).flat();
  const prot = identificarFatoresProtecao(avs);
  let txt = `Conclui-se que o setor apresenta nível geral de risco psicossocial ${ng.classificacao} (média ${ng.media}/100). `;
  if (principais.length) txt += `Os principais fatores que requerem atenção são: ${principais.slice(0, 6).join("; ")}. `;
  if (prot.length) txt += `Como fatores de proteção destacam-se: ${prot.slice(0, 3).join("; ")}. `;
  if (ng.classificacao === "Crítico") txt += "Há necessidade de intervenção imediata (até 30 dias) e acompanhamento psicológico/médico dos colaboradores expostos, com reavaliação em 6 meses.";
  else if (ng.classificacao === "Alto") txt += "Recomenda-se intervenção prioritária em até 90 dias para mitigar os fatores identificados, com reavaliação em 12 meses.";
  else if (ng.classificacao === "Moderado") txt += "Recomenda-se monitoramento contínuo com implementação gradual das ações e reavaliação em 12 meses.";
  else txt += "Não há necessidade de intervenção imediata; recomenda-se manter as boas práticas identificadas e reavaliar em até 24 meses.";
  return txt;
}

// ─── Recomendações por área (Organização, Liderança, RH, SST) ───
type RecArea = { organizacional: string[]; lideranca: string[]; rh: string[]; sst: string[] };
function buildRecomendacoesPorArea(avs: AvaliacaoPsicossocial[]): RecArea {
  const out: RecArea = { organizacional: [], lideranca: [], rh: [], sst: [] };
  const media = (k: string) => mediaDimensao(avs, k);
  const push = (a: keyof RecArea, t: string) => { if (!out[a].includes(t)) out[a].push(t); };

  if (media("exigencias") >= 34) {
    push("organizacional", "Revisar carga de trabalho, redistribuir tarefas e estabelecer limites realistas de prazos.");
    push("organizacional", "Implementar cronogramas participativos e revisão trimestral de metas.");
  }
  if (media("controle") >= 34) {
    push("organizacional", "Ampliar autonomia decisória e permitir flexibilidade sobre ritmo, método e pausas.");
    push("lideranca", "Delegar decisões operacionais e promover gestão participativa.");
  }
  if (media("apoio") >= 34) {
    push("lideranca", "Estabelecer rotinas de 1:1 semanal com escuta ativa e feedback.");
    push("rh", "Criar programa de mentoria interna e ações estruturadas de integração.");
  }
  if (media("reconhecimento") >= 34) {
    push("rh", "Implementar programa formal de reconhecimento (financeiro e simbólico) e feedback estruturado.");
    push("rh", "Revisar política de cargos e salários, garantindo transparência e meritocracia.");
  }
  if (media("seguranca") >= 34) {
    push("organizacional", "Comunicação transparente sobre mudanças organizacionais e planos de futuro.");
    push("rh", "Instituir canais formais para dúvidas sobre estabilidade e trajetória de carreira.");
  }
  if (media("conflitos") >= 34) {
    push("rh", "Instituir programa de mediação de conflitos e canal de denúncia sigiloso e independente.");
    push("lideranca", "Capacitar líderes em prevenção e enfrentamento de assédio moral e sexual.");
    push("sst", "Investigação imediata de denúncias, com acompanhamento psicológico das vítimas.");
  }
  if (media("sintomas") >= 34) {
    push("sst", "Implantar Programa de Promoção da Saúde Mental e qualidade de vida no trabalho.");
    push("sst", "Ampliar acesso a acompanhamento psicológico (interno ou convênio) e triagem periódica de burnout.");
    push("rh", "Rever política de férias, folgas e horas extras para reduzir fadiga acumulada.");
  }
  if (media("lideranca") >= 34) {
    push("lideranca", "Trilha de desenvolvimento em liderança humanizada, escuta ativa e imparcialidade.");
    push("rh", "Avaliação 360º de liderança e vinculação de metas à qualidade da gestão de pessoas.");
  }

  // Se nada foi identificado, entregar plano de manutenção
  if (!Object.values(out).some((v) => v.length)) {
    push("organizacional", "Manter as práticas atuais de gestão e reavaliar psicossocialmente em até 24 meses.");
    push("sst", "Manter monitoramento de indicadores de absenteísmo, afastamentos e clima organizacional.");
  }
  return out;
}

// Pool de ações específicas por fator de risco. Cada fator recebe:
//  - causa provável (raiz do problema),
//  - preventiva (ação estrutural que ataca a causa — evita paliativos),
//  - corretiva (ação direta sobre o quadro já instalado),
//  - responsável primário e prazo de referência.
// A intenção é evitar recomendações genéricas repetidas ("realizar treinamentos",
// "promover palestras") — priorizando redesenho de trabalho, redistribuição de
// tarefas, revisão de processos e ajustes de organização/gestão.
const ACOES_POR_FATOR: Record<
  string,
  { causa: string; preventiva: string; corretiva: string; responsavel: string; prazo: string }
> = {
  "Ritmo excessivo de trabalho": {
    causa: "Dimensionamento de equipe insuficiente para o volume de tarefas ou distribuição desigual da carga entre os postos.",
    preventiva: "Redimensionar a equipe e redistribuir o volume de tarefas com base na capacidade produtiva real, revisando o balanceamento entre postos.",
    corretiva: "Reorganizar o fluxo operacional para eliminar gargalos identificados e reforçar temporariamente pessoal nos pontos críticos até estabilização do ritmo.",
    responsavel: "Gestão do setor / RH",
    prazo: "60 dias",
  },
  "Prazos muito curtos": {
    causa: "Definição de prazos sem participação técnica das equipes executoras e sem análise da capacidade operacional disponível.",
    preventiva: "Instituir processo formal de definição participativa de prazos, com validação técnica prévia por parte de quem executa o trabalho.",
    corretiva: "Renegociar prazos vigentes considerados inviáveis e criar mecanismo formal de replanejamento acionável em situações de sobrecarga.",
    responsavel: "Gestão do setor / Planejamento",
    prazo: "60 dias",
  },
  "Alta responsabilidade decisória": {
    causa: "Concentração excessiva de decisões críticas em poucos colaboradores, sem estrutura de suporte técnico.",
    preventiva: "Descentralizar decisões de rotina por meio de matriz de responsabilidade (RACI) explícita e criar suporte técnico consultivo para decisões complexas.",
    corretiva: "Constituir fórum ou comitê de apoio à decisão para casos de alta complexidade, reduzindo o peso individual sobre o colaborador exposto.",
    responsavel: "Alta Gestão / Gestão do setor",
    prazo: "90 dias",
  },
  "Falta de autonomia sobre o trabalho": {
    causa: "Modelo de gestão excessivamente hierárquico e procedimentos que centralizam decisões operacionais.",
    preventiva: "Ampliar a autonomia funcional por meio de alçadas claras que permitam ao colaborador decidir sobre método, sequência e ritmo de execução.",
    corretiva: "Revisar procedimentos operacionais para eliminar controles redundantes e delegar decisões operacionais ao nível de execução.",
    responsavel: "Gestão do setor / Alta Gestão",
    prazo: "90 dias",
  },
  "Ausência de pausas adequadas": {
    causa: "Organização do trabalho sem previsão formal de intervalos ou de rodízio de postos.",
    preventiva: "Estruturar cronograma de pausas escalonadas dentro da jornada, com rodízio entre postos quando aplicável.",
    corretiva: "Ajustar escala e composição das equipes para assegurar substituição efetiva durante os intervalos.",
    responsavel: "Gestão do setor / SESMT",
    prazo: "30 dias",
  },
  "Conflitos frequentes no ambiente": {
    causa: "Falta de clareza de papéis, sobreposição de responsabilidades ou disputa por recursos entre equipes/áreas.",
    preventiva: "Delimitar formalmente papéis e limites de responsabilidade entre funções e áreas correlatas, reduzindo zonas de atrito.",
    corretiva: "Mediar conflitos vigentes com apoio de área neutra (RH/Psicologia) e reestruturar as interfaces problemáticas entre equipes.",
    responsavel: "RH / Gestão do setor",
    prazo: "45 dias",
  },
  "Tratamento desrespeitoso / assédio moral": {
    causa: "Ausência de política formal de conduta e fragilidade nos canais internos de escuta e apuração.",
    preventiva: "Implantar política formal de conduta com apuração obrigatória, proteção ao denunciante e revisão da linha de comando quando envolvida.",
    corretiva: "Investigar imediatamente os relatos, afastar preventivamente o denunciado quando cabível e prover acompanhamento psicológico às pessoas afetadas.",
    responsavel: "RH / Alta Gestão / SESMT",
    prazo: "Imediato (até 15 dias)",
  },
  "Falta de canal seguro para denúncia de assédio": {
    causa: "Inexistência de canal independente e sigiloso para o recebimento de relatos.",
    preventiva: "Disponibilizar canal externo/independente de denúncias, com anonimato garantido e fluxo de tramitação formalizado.",
    corretiva: "Rever o fluxo atual de recebimento e apuração para assegurar independência em relação à linha de gestão envolvida.",
    responsavel: "RH / Compliance",
    prazo: "60 dias",
  },
  "Baixo apoio dos colegas": {
    causa: "Ambiente competitivo, individualização de metas ou isolamento estrutural entre pares.",
    preventiva: "Redesenhar metas incorporando indicadores coletivos e promover interdependência produtiva entre pares.",
    corretiva: "Reorganizar o arranjo físico e/ou virtual para favorecer trocas técnicas e instituir pares de apoio (buddy system) nas rotinas críticas.",
    responsavel: "Gestão do setor / RH",
    prazo: "60 dias",
  },
  "Falta de apoio da liderança direta": {
    causa: "Sobrecarga da liderança, ausência física ou modelo de gestão distante do dia a dia da equipe.",
    preventiva: "Reduzir a razão liderados/líder para permitir acompanhamento próximo e instituir rotinas obrigatórias de 1:1 estruturado.",
    corretiva: "Redistribuir a equipe entre lideranças disponíveis ou provisionar liderança de apoio nas áreas em maior tensão.",
    responsavel: "Alta Gestão / RH",
    prazo: "60 dias",
  },
  "Insegurança quanto ao emprego": {
    causa: "Comunicação institucional insuficiente sobre planos, resultados e cenário do negócio.",
    preventiva: "Estabelecer rotina periódica de comunicação institucional sobre resultados, planos e horizonte de estabilidade da operação.",
    corretiva: "Comunicar formalmente e com antecedência qualquer alteração estrutural em curso, com plano de transição para os colaboradores afetados.",
    responsavel: "Alta Gestão / RH",
    prazo: "45 dias",
  },
  "Insatisfação com o trabalho": {
    causa: "Desalinhamento entre escopo entregue, expectativas do colaborador e recompensa oferecida.",
    preventiva: "Realinhar escopo e recompensa por meio de revisão da descrição de cargo e política salarial coerente com a entrega efetiva.",
    corretiva: "Abrir diálogos individuais estruturados para redesenhar trajetórias possíveis dentro da organização (job crafting) e regularizar enquadramentos.",
    responsavel: "RH / Gestão do setor",
    prazo: "90 dias",
  },
  "Preocupação com mudanças organizacionais": {
    causa: "Mudanças anunciadas sem plano estruturado de gestão de transição.",
    preventiva: "Adotar metodologia formal de gestão de mudanças, com envolvimento das áreas afetadas desde a fase de planejamento.",
    corretiva: "Constituir comitê de acompanhamento das mudanças em curso, com plantões de esclarecimento e canais dedicados ao público impactado.",
    responsavel: "Alta Gestão / RH",
    prazo: "60 dias",
  },
  "Falta de reconhecimento profissional": {
    causa: "Ausência de critérios objetivos e visíveis para valorização das entregas.",
    preventiva: "Formalizar política de reconhecimento com critérios objetivos, visibilidade das entregas e vinculação a benefícios concretos.",
    corretiva: "Revisar promoções e enquadramentos pendentes e regularizar reconhecimentos represados no ciclo atual.",
    responsavel: "RH / Gestão do setor",
    prazo: "90 dias",
  },
  "Ausência de feedback estruturado": {
    causa: "Inexistência de ritual formal e recorrente de feedback contínuo.",
    preventiva: "Instituir ritmo obrigatório de feedback estruturado (mensal ou trimestral), integrado ao ciclo de gestão de desempenho.",
    corretiva: "Realizar rodada extraordinária de feedback para saldar déficits acumulados e realinhar expectativas com a equipe.",
    responsavel: "Gestão do setor / RH",
    prazo: "45 dias",
  },
  "Liderança percebida como parcial/injusta": {
    causa: "Ausência de critérios objetivos e auditáveis nas decisões cotidianas da liderança.",
    preventiva: "Padronizar critérios de decisão da liderança (distribuição de tarefas, folgas, oportunidades) com registro auditável.",
    corretiva: "Aplicar avaliação 360º sobre os líderes envolvidos e implementar plano de correção individual, com acompanhamento por RH.",
    responsavel: "RH / Alta Gestão",
    prazo: "60 dias",
  },
  "Baixa escuta ativa da liderança": {
    causa: "Modelo de gestão top-down sem canais formais de escuta bidirecional.",
    preventiva: "Criar rituais obrigatórios de escuta bidirecional (reuniões de equipe com pauta aberta, pesquisas rápidas de pulso, caixas de sugestão tratadas).",
    corretiva: "Promover devolutiva formal sobre pontos já levantados pela equipe, demonstrando efetivação das sugestões viáveis.",
    responsavel: "Gestão do setor / RH",
    prazo: "45 dias",
  },
  "Ausência de incentivo ao desenvolvimento": {
    causa: "Falta de plano de carreira ou de orçamento efetivamente alocado ao desenvolvimento das pessoas.",
    preventiva: "Estruturar plano individual de desenvolvimento (PDI) atrelado a metas objetivas e orçamento próprio para viabilizá-lo.",
    corretiva: "Ampliar o portfólio de oportunidades internas (movimentações, projetos transversais, mentorias) para gerar caminhos concretos de evolução.",
    responsavel: "RH / Gestão do setor",
    prazo: "90 dias",
  },
  "Sobrecarga emocional": {
    causa: "Exposição frequente a situações emocionalmente exigentes sem suporte estruturado nem tempo de recuperação.",
    preventiva: "Redesenhar rotinas para reduzir a exposição contínua a situações emocionalmente pesadas (rodízio, tempo de descompressão entre atendimentos, limites por turno).",
    corretiva: "Disponibilizar suporte psicológico regular e protocolo de acolhimento pós-eventos críticos, com liberação temporária quando necessário.",
    responsavel: "SESMT / RH",
    prazo: "45 dias",
  },
  "Exposição a conflitos interpessoais": {
    causa: "Interfaces de trabalho não formalizadas e responsabilidades sobrepostas entre equipes.",
    preventiva: "Formalizar interfaces e regras de convivência entre equipes que colaboram em um mesmo processo, eliminando zonas cinzentas.",
    corretiva: "Mediar conflitos vigentes e ajustar a composição das equipes quando o desgaste interpessoal já estiver instalado.",
    responsavel: "RH / Gestão do setor",
    prazo: "45 dias",
  },
  "Interferência trabalho-vida pessoal": {
    causa: "Ausência de limites claros entre jornada e tempo pessoal / uso excessivo de canais fora do horário.",
    preventiva: "Definir política clara de desconexão, com bloqueio de demandas fora do horário e limites de contato assíncrono.",
    corretiva: "Reorganizar as demandas em curso que estão exigindo trabalho fora do horário, revendo prazos e prioridades.",
    responsavel: "Alta Gestão / RH",
    prazo: "60 dias",
  },
  "Distúrbios do sono relacionados ao trabalho": {
    causa: "Escalas com virada rápida entre turnos, horas extras recorrentes ou pressão contínua fora do horário.",
    preventiva: "Revisar as escalas para garantir intervalo mínimo entre jornadas e limitar horas extras habituais.",
    corretiva: "Encaminhar colaboradores sintomáticos ao serviço médico ocupacional e ajustar imediatamente a escala individual afetada.",
    responsavel: "SESMT / Gestão do setor",
    prazo: "30 dias",
  },
  "Fadiga recorrente": {
    causa: "Volume de trabalho acima da capacidade sustentável e ausência de recuperação efetiva entre ciclos.",
    preventiva: "Ajustar a carga sustentável, redistribuir o volume e garantir folgas efetivas (sem acionamentos de trabalho).",
    corretiva: "Suspender temporariamente demandas não críticas para restaurar a capacidade da equipe e reavaliar volume após a recuperação.",
    responsavel: "Gestão do setor / SESMT",
    prazo: "30 dias",
  },
  "Esgotamento emocional (burnout)": {
    causa: "Combinação prolongada de alta demanda, baixo apoio da liderança e baixo controle sobre o próprio trabalho.",
    preventiva: "Reestruturar simultaneamente demanda, apoio da liderança e autonomia da função — atuando sobre as três alavancas clássicas do burnout.",
    corretiva: "Encaminhar imediatamente casos identificados ao serviço médico/psicológico e afastar preventivamente quando indicado, com plano de retorno gradual.",
    responsavel: "SESMT / RH / Alta Gestão",
    prazo: "Imediato (até 15 dias)",
  },
  "Exaustão no início da jornada": {
    causa: "Recuperação insuficiente entre jornadas e/ou ambiente de trabalho desmotivador que gera antecipação negativa.",
    preventiva: "Revisar intervalos entre jornadas e atuar sobre as causas de desmotivação já identificadas no setor.",
    corretiva: "Investigar individualmente os casos persistentes com apoio ocupacional, considerando remanejamento funcional quando indicado.",
    responsavel: "SESMT / RH",
    prazo: "45 dias",
  },
};

function buildPlanoAcao(avs: AvaliacaoPsicossocial[]) {
  const linhas: {
    risco: string;
    causa: string;
    preventiva: string;
    corretiva: string;
    responsavel: string;
    prazo: string;
    acompanhamento: string;
  }[] = [];
  for (const cat of CATEGORIAS) {
    for (const f of cat.fatores) {
      const media = mediaFator(avs, f);
      const cls = classificar(media);
      if (cls === "Baixo") continue;
      const acao = ACOES_POR_FATOR[f.nome];
      if (!acao) continue;
      // Prazo escalado pela criticidade
      const prazo =
        cls === "Crítico"
          ? "Imediato (até 15 dias)"
          : cls === "Alto"
            ? acao.prazo
            : "90 dias";
      linhas.push({
        risco: `${cat.categoria} — ${f.nome} (${cls}, média ${media}/100)`,
        causa: acao.causa,
        preventiva: acao.preventiva,
        corretiva: acao.corretiva,
        responsavel: acao.responsavel,
        prazo,
        acompanhamento:
          "Reavaliação COPSOQ do fator em até 12 meses; monitoramento intermediário via indicadores de clima, absenteísmo e afastamentos por CID F.",
      });
    }
  }
  return linhas;
}

// ─── Gráficos ───
function drawBarChartVertical(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  data: { label: string; value: number; cor: [number, number, number] }[],
  yMax = 100,
) {
  const padding = { l: 10, r: 4, t: 6, b: 18 };
  const chartW = w - padding.l - padding.r;
  const chartH = h - padding.t - padding.b;
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(x + padding.l, y + padding.t, x + padding.l, y + padding.t + chartH);
  doc.line(x + padding.l, y + padding.t + chartH, x + padding.l + chartW, y + padding.t + chartH);
  const bw = chartW / Math.max(data.length, 1);
  doc.setFontSize(7);
  data.forEach((d, i) => {
    const barH = yMax > 0 ? (d.value / yMax) * chartH : 0;
    const bx = x + padding.l + i * bw + bw * 0.2;
    const by = y + padding.t + chartH - barH;
    const bWidth = bw * 0.6;
    doc.setFillColor(d.cor[0], d.cor[1], d.cor[2]);
    doc.rect(bx, by, bWidth, barH, "F");
    doc.setTextColor(40);
    doc.text(`${d.value}`, bx + bWidth / 2, by - 1.5, { align: "center" });
    doc.setTextColor(60);
    doc.text(d.label, bx + bWidth / 2, y + padding.t + chartH + 4, { align: "center" });
  });
}

/** Gráfico horizontal com nome COMPLETO do fator + valor + % + classificação colorida. */
function drawHorizontalBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  itens: { label: string; value: number }[],
): number {
  const labelW = 70;        // largura reservada ao nome completo do fator
  const tagW = 22;          // espaço para valor + classificação à direita
  const barAreaW = w - labelW - tagW - 4;
  const rowH = 7.5;
  doc.setFontSize(8.5);
  itens.forEach((it, i) => {
    const ry = y + i * rowH;
    const cls = classificar(it.value);
    const cor = COR_NIVEL[cls];
    // label
    doc.setTextColor(40);
    doc.setFont("helvetica", "normal");
    const lab = doc.splitTextToSize(it.label, labelW - 2)[0];
    doc.text(lab, x, ry + 4);
    // background da barra
    doc.setFillColor(241, 245, 249);
    doc.rect(x + labelW, ry + 1.2, barAreaW, 4.2, "F");
    // barra preenchida
    const fill = Math.max(0, Math.min(100, it.value)) / 100 * barAreaW;
    doc.setFillColor(cor[0], cor[1], cor[2]);
    doc.rect(x + labelW, ry + 1.2, fill, 4.2, "F");
    // valor + % + classificação
    doc.setFont("helvetica", "bold");
    doc.setTextColor(cor[0], cor[1], cor[2]);
    doc.text(`${it.value} • ${Math.round(it.value)}% • ${cls}`, x + labelW + barAreaW + 2, ry + 4);
  });
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  return y + itens.length * rowH + 2;
}

// ─── Cabeçalho / rodapé / utilitários ───
function addHeader(doc: jsPDF, ctx: RelatorioContext) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pw, 26, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RELATÓRIO PSICOSSOCIAL GERAL — COPSOQ", pw / 2, 11, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${ctx.empresa_nome || ""}${ctx.cnpj ? " • CNPJ " + ctx.cnpj : ""}`, pw / 2, 18, { align: "center" });
  doc.text(`Setor: ${ctx.setor_nome || "—"}${ctx.ges ? " • GHE/GES " + ctx.ges : ""}`, pw / 2, 23, { align: "center" });
  doc.setTextColor(0);
}

function addFooter(doc: jsPDF) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Relatório gerado automaticamente — Sistema SST", 10, ph - 6);
    doc.text(`Página ${i} de ${total}`, pw - 10, ph - 6, { align: "right" });
  }
}

function section(doc: jsPDF, y: number, titulo: string): number {
  if (y > 270) { doc.addPage(); y = 32; }
  doc.setFillColor(15, 23, 42);
  doc.rect(10, y, 190, 7, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(titulo, 13, y + 5);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  return y + 12;
}

/**
 * Renderização profissional de parágrafo:
 * - `splitTextToSize` para quebra automática.
 * - Justificação por espaçamento entre palavras (nunca entre letras)
 *   evita o efeito de "letras esticadas" produzido pelo `align:"justify"`
 *   nativo do jsPDF quando aplicado a linhas já ajustadas.
 * - `indent` opcional aplicado apenas à primeira linha.
 */
function paragraph(
  doc: jsPDF,
  y: number,
  txt: string,
  size = 10,
  justify = true,
  opts: { indent?: number; leftMargin?: number; rightMargin?: number } = {},
): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(40);

  const pw = doc.internal.pageSize.getWidth();
  const leftMargin = opts.leftMargin ?? 10;
  const rightMargin = opts.rightMargin ?? 10;
  const indent = opts.indent ?? 0;
  const maxW = pw - leftMargin - rightMargin;
  const lineH = size * 0.42 + 1.6;

  // Bullets e itens listados nunca são justificados
  const startsWithBullet = /^\s*(?:[•\-*·]|\d+[\.\)])\s+/.test(String(txt));
  if (startsWithBullet) justify = false;

  // Preserva quebras explícitas do texto
  const paragrafos = String(txt).split(/\n/);
  let cy = y;

  paragrafos.forEach((par) => {
    const first = indent > 0 ? maxW - indent : maxW;
    const linhasFirst: string[] = doc.splitTextToSize(par, first);
    let linhas: string[] = linhasFirst;
    if (indent > 0 && linhasFirst.length > 1) {
      // Re-quebra o restante sem o recuo
      const usadoNaPrimeira = linhasFirst[0];
      const resto = par.slice(usadoNaPrimeira.length).replace(/^\s+/, "");
      const linhasResto = resto
        ? doc.splitTextToSize(resto, maxW)
        : [];
      linhas = [usadoNaPrimeira, ...linhasResto];
    }

    for (let i = 0; i < linhas.length; i++) {
      if (cy + lineH > 285) { doc.addPage(); cy = 32; }
      const line = String(linhas[i] || "");
      const isFirst = i === 0;
      const isLast = i === linhas.length - 1;
      const xStart = leftMargin + (isFirst ? indent : 0);
      const areaW = maxW - (isFirst ? indent : 0);

      const palavras = line.trim().split(/\s+/).filter(Boolean);
      if (!justify || isLast || palavras.length < 2) {
        doc.text(line, xStart, cy);
      } else {
        // Justificação: distribui espaço extra APENAS entre palavras.
        const larguraPalavras = palavras.reduce((s, w) => s + doc.getTextWidth(w), 0);
        const espacoExtra = areaW - larguraPalavras;
        const gap = espacoExtra / (palavras.length - 1);
        // Limite de segurança: não justifica se o gap ficaria absurdo
        // (ex.: linha curta demais). Nesse caso, desenha alinhado à esquerda.
        const espacoNormal = doc.getTextWidth(" ");
        if (gap > espacoNormal * 3.2 || gap <= 0) {
          doc.text(line, xStart, cy);
        } else {
          let cx = xStart;
          for (let w = 0; w < palavras.length; w++) {
            doc.text(palavras[w], cx, cy);
            cx += doc.getTextWidth(palavras[w]) + gap;
          }
        }
      }
      cy += lineH;
    }
    // Pequeno espaço entre parágrafos internos
    if (paragrafos.length > 1) cy += 1;
  });

  return cy + 2;
}

// ─── Integração AET × COPSOQ: cruzamento de dados ergonômicos e psicossociais ───
function buildIntegracaoAet(avs: AvaliacaoPsicossocial[], ctx: RelatorioContext): string[] {
  const paras: string[] = [];
  const norm = (s?: string) => (s || "").toLowerCase();
  const media = (k: string) => mediaDimensao(avs, k);
  const exig = media("exigencias");
  const ctrl = media("controle");
  const apoio = media("apoio");
  const rec = media("reconhecimento");
  const lider = media("lideranca");
  const conf = media("conflitos");
  const sint = media("sintomas");
  const seg = media("seguranca");

  const temAetInfo =
    !!(ctx.aet_ritmo_complexidade || ctx.aet_jornada_aspectos || ctx.aet_caracterizacao_biomecanica ||
       ctx.aet_tarefas || ctx.aet_riscos_observados || ctx.aet_diagnostico_ergonomico ||
       ctx.aet_analise_organizacional || (ctx.aet_ferramentas && ctx.aet_ferramentas.length) ||
       (ctx.aet_plano_acao && ctx.aet_plano_acao.length));

  if (!temAetInfo) {
    paras.push(
      "Esta seção cruza a Análise Ergonômica do Trabalho (AET/AEP) do setor com os resultados psicossociais. " +
      "No momento da geração, a AET vinculada não contém informações complementares suficientes para inferências cruzadas específicas; a análise foi conduzida com base apenas nos dados psicossociais disponíveis.",
    );
    return paras;
  }

  // Ritmo × Exigências
  const ritmo = norm(ctx.aet_ritmo_complexidade);
  if (ritmo) {
    if (/acelerad|intens|elevad|alto|pressao|prazo|urgen/.test(ritmo) && exig >= 50) {
      paras.push(
        `O ritmo de trabalho descrito na AET (${ctx.aet_ritmo_complexidade!.trim().slice(0, 220)}) é coerente com a percepção coletiva ` +
        `de exigências psicológicas classificada como ${classificar(exig)} (média ${exig}/100), reforçando o diagnóstico de sobrecarga quantitativa.`,
      );
    } else {
      paras.push(
        `A caracterização do ritmo/complexidade na AET (${ctx.aet_ritmo_complexidade!.trim().slice(0, 220)}) mostra coerência com a percepção psicossocial de exigências ${classificar(exig)} (média ${exig}/100).`,
      );
    }
  }

  // Organização/jornada × autonomia e apoio
  if (ctx.aet_jornada_aspectos) {
    const j = norm(ctx.aet_jornada_aspectos);
    const rigido = /fixa|rigid|turno|escala|noturn|revez/.test(j);
    if (rigido && ctrl >= 50) {
      paras.push(
        `A jornada descrita na AET (${ctx.aet_jornada_aspectos.trim().slice(0, 220)}) apresenta pouca flexibilidade, o que se alinha à baixa autonomia percebida no COPSOQ (${classificar(ctrl)}, média ${ctrl}/100) — sugerindo que a organização temporal do trabalho é um fator determinante para o quadro psicossocial.`,
      );
    }
  }

  // Análise organizacional (supervisão/gestão) × liderança/apoio
  if (ctx.aet_analise_organizacional) {
    const o = norm(ctx.aet_analise_organizacional);
    const centraliz = /central|hierarq|top-?down|autorit|controle rig/.test(o);
    if (centraliz && (lider >= 50 || apoio >= 50)) {
      paras.push(
        `A análise organizacional registrada na AET indica ${ctx.aet_analise_organizacional.trim().slice(0, 220)}. ` +
        `Esse modelo de gestão é consistente com a percepção coletiva de qualidade da liderança (${classificar(lider)}) e apoio social (${classificar(apoio)}), reforçando a hipótese de que a estrutura de comando concentra decisões e limita canais de suporte.`,
      );
    }
  }

  // Tarefas/atividades × sobrecarga emocional e cognitiva
  const tarefasTxt = norm((ctx.aet_tarefas || "") + " " + (ctx.atividades || "") + " " + (ctx.atividades_funcoes || []).join(" "));
  if (/atend|clien|paci|publ|contato|emerg|conflit/.test(tarefasTxt) && exig >= 50) {
    paras.push(
      `As atividades descritas na AET envolvem contato intensivo com público, clientes ou pacientes — condição diretamente associada à sobrecarga emocional identificada no COPSOQ (média ${mediaFator(avs, { nome: "Sobrecarga emocional", bloco: "exigencias", perguntaIdx: [3] })}/100).`,
    );
  }
  if (/decis|anális|planejam|responsab|supervis|coorden/.test(tarefasTxt) && exig >= 50) {
    paras.push(
      `A AET aponta atividades com alta demanda cognitiva e responsabilidade decisória, o que é coerente com a média ${mediaFator(avs, { nome: "Alta responsabilidade decisória", bloco: "exigencias", perguntaIdx: [2] })}/100 registrada no fator "Alta responsabilidade decisória" do COPSOQ.`,
    );
  }

  // Riscos ergonômicos × sintomas / burnout
  const riscosTxt = norm((ctx.aet_riscos_observados || "") + " " + (ctx.aet_caracterizacao_biomecanica || ""));
  if (riscosTxt && sint >= 50) {
    paras.push(
      `Os riscos ergonômicos observados na AET (${(ctx.aet_riscos_observados || ctx.aet_caracterizacao_biomecanica || "").trim().slice(0, 220)}) potencializam os sintomas de fadiga/estresse identificados no COPSOQ (${classificar(sint)}, média ${sint}/100). A literatura ocupacional aponta interação direta entre sobrecarga física e adoecimento mental, especialmente em contextos de baixo apoio e reconhecimento.`,
    );
  }

  // Ferramentas ergonômicas × plano de ação psicossocial
  if (ctx.aet_ferramentas && ctx.aet_ferramentas.length) {
    const criticas = ctx.aet_ferramentas.filter((f) =>
      /alto|crítico|inaceit|urgen|imedi|4|5/i.test(String(f.classificacao || f.nivel_acao || f.resultado || "")),
    );
    if (criticas.length) {
      paras.push(
        `As avaliações ergonômicas quantitativas aplicadas (${criticas.map((f) => f.tipo).join(", ")}) apontam nível de ação elevado, ` +
        `condição que agrava o quadro psicossocial e reforça a prioridade das ações do Plano constante nesta análise.`,
      );
    } else {
      paras.push(
        `As avaliações ergonômicas aplicadas (${ctx.aet_ferramentas.map((f) => f.tipo).join(", ")}) não indicaram nível de ação crítico, o que não descaracteriza os riscos psicossociais identificados, mas permite priorizar as intervenções organizacionais em relação às biomecânicas.`,
      );
    }
  }

  // Diagnóstico ergonômico já emitido pela AET
  if (ctx.aet_diagnostico_ergonomico) {
    paras.push(
      `O diagnóstico ergonômico registrado na AET — "${ctx.aet_diagnostico_ergonomico.trim().slice(0, 260)}" — foi considerado nesta interpretação psicossocial, ` +
      `garantindo coerência técnica entre os dois documentos e evitando conclusões divergentes sobre a mesma condição de trabalho.`,
    );
  }

  // Consistência global
  paras.push(
    `De forma integrada, os dados da AET e do COPSOQ convergem para caracterizar o setor ${ctx.setor_nome || "avaliado"} como um ambiente cujas condições organizacionais, ` +
    `de conteúdo e de relações interpessoais determinam significativamente o risco psicossocial percebido — orientando as intervenções propostas ao nível sistêmico (organização e gestão), em conformidade com a NR-01 e a NR-17.`,
  );

  return paras;
}

export function gerarRelatorioCopsoqPDF(
  avaliacoes: AvaliacaoPsicossocial[],
  ctx: RelatorioContext,
) {
  if (!avaliacoes || avaliacoes.length === 0) {
    throw new Error("Não há avaliações COPSOQ para gerar o relatório.");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();

  addHeader(doc, ctx);

  // ── 1. Identificação (sem "Colaboradores avaliados" nem "Data de emissão")
  let y = 32;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("1. Identificação", 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const datas: [string, string][] = [
    ["Empresa", ctx.empresa_nome || "—"],
    ["CNPJ", ctx.cnpj || "—"],
    ["Contrato", ctx.contrato_numero || "—"],
    ["Setor avaliado", ctx.setor_nome || "—"],
    ["Data da avaliação", ctx.data_elaboracao || "—"],
    ["Responsável pela avaliação", `${ctx.responsavel || "—"}${ctx.crea ? " (" + ctx.crea + ")" : ""}`],
  ];
  autoTable(doc, {
    startY: y,
    body: datas,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55, fillColor: [241, 245, 249] } },
    margin: { left: 10, right: 10 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── 1.1 Funções Avaliadas — texto técnico (GES, relação e contexto operacional)
  {
    const mapa = new Map<string, string>();
    for (const a of avaliacoes) {
      const nome = (a.funcao || "").trim();
      if (!nome) continue;
      const key = nome.toLocaleLowerCase("pt-BR");
      const label = nome.charAt(0).toUpperCase() + nome.slice(1);
      mapa.set(key, label);
    }
    const funcoesAvaliadas = Array.from(mapa.keys())
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map((k) => mapa.get(k) as string);

    if (funcoesAvaliadas.length) {
      y = section(doc, y, "1.1 Funções Avaliadas");
      const gesTxt = ctx.ges
        ? `pertencentes ao GHE/GES ${ctx.ges}`
        : `pertencentes ao mesmo grupo homogêneo de exposição`;
      const setorTxt = ctx.setor_nome ? ` no setor ${ctx.setor_nome}` : "";
      const listaTxt = funcoesAvaliadas.join(", ");
      const atv = (ctx.atividades || ctx.descricao_ambiente || "").trim().replace(/\s+/g, " ");
      const atvSintese = atv
        ? ` A atividade predominante desempenhada pelo grupo consiste em ${atv.slice(0, 240)}${atv.length > 240 ? "…" : ""}.`
        : "";
      const contextoOp: string[] = [];
      if (ctx.jornada_trabalho) contextoOp.push(`jornada ${ctx.jornada_trabalho}`);
      if (ctx.escala) contextoOp.push(`escala ${ctx.escala}`);
      if (ctx.supervisao) contextoOp.push(`supervisão ${ctx.supervisao}`);
      const ctxTxt = contextoOp.length
        ? ` O contexto operacional comum entre as funções caracteriza-se por ${contextoOp.join(", ")}, o que reforça a pertinência da análise consolidada.`
        : "";
      const txt =
        `As funções avaliadas neste relatório — ${listaTxt} — são ${gesTxt}${setorTxt} e apresentam relação técnica e operacional entre si, ` +
        `compartilhando exposição a fatores psicossociais equivalentes, o que justifica sua análise consolidada sob a metodologia COPSOQ.` +
        atvSintese + ctxTxt;
      y = paragraph(doc, y, txt, 10, true, { indent: 5 });
    }
  }

  // ── 2. Resumo executivo
  y = section(doc, y, "2. Resumo Executivo");
  y = paragraph(doc, y, buildResumoExecutivo(avaliacoes, ctx), 10, true, { indent: 5 });

  // ── 2.1 Perfil da função avaliada
  y = section(doc, y, "2.1 Perfil da(s) Função(ões) Avaliada(s)");
  y = paragraph(doc, y, buildPerfilFuncao(avaliacoes, ctx), 10, true, { indent: 5 });

  // ── 3. Metodologia (com critérios de classificação)
  y = section(doc, y, "3. Metodologia Utilizada");
  y = paragraph(
    doc, y,
    "A presente avaliação psicossocial foi conduzida por meio da aplicação do questionário COPSOQ (Copenhagen Psychosocial Questionnaire), instrumento internacionalmente validado para a identificação, mensuração e análise dos fatores psicossociais relacionados ao trabalho. O instrumento contempla dimensões essenciais à compreensão do ambiente laboral, tais como exigências quantitativas e emocionais, organização do trabalho, autonomia, apoio social, qualidade da liderança, reconhecimento, justiça organizacional, conflitos interpessoais e impactos na saúde mental dos trabalhadores."
  );
  y = paragraph(
    doc, y,
    "A consolidação das respostas foi realizada de forma estatística e anônima, agrupando-se os resultados por dimensão psicossocial. Para cada bloco do questionário, calculou-se a média ponderada das pontuações registradas, normalizadas em uma escala contínua de 0 a 100, permitindo a comparação objetiva entre fatores e a identificação dos pontos críticos do ambiente organizacional."
  );
  y = paragraph(
    doc, y,
    "Os critérios de análise adotaram como referência os parâmetros do COPSOQ III, considerando a frequência, a intensidade e a recorrência dos fatores identificados, bem como o potencial de impacto sobre a saúde mental, o desempenho e o bem-estar dos trabalhadores. A classificação dos riscos psicossociais seguiu a divisão em tercis recomendada pela metodologia, conforme escala apresentada a seguir:"
  );
  y = paragraph(doc, y, "• Baixo (0 a 33): condições adequadas, com baixa probabilidade de impacto negativo.");
  y = paragraph(doc, y, "• Moderado (34 a 66): situação de atenção, recomendando-se monitoramento e ações preventivas.");
  y = paragraph(doc, y, "• Alto (67 a 84): risco relevante, exigindo intervenção planejada em curto prazo.");
  y = paragraph(doc, y, "• Crítico (85 a 100): risco severo, demandando atuação imediata e medidas corretivas estruturadas.");
  y = paragraph(
    doc, y,
    "A análise técnica considera ainda a inter-relação entre as dimensões avaliadas, identificando padrões coletivos, vulnerabilidades específicas e oportunidades de melhoria organizacional, em conformidade com as diretrizes da NR-01, da NR-17 e das boas práticas internacionais em saúde ocupacional, ergonomia e psicologia organizacional."
  );
  const complementos: string[] = [];
  if (ctx.entrevistas) complementos.push("entrevistas individuais");
  if (ctx.observacao) complementos.push("observação direta das atividades");
  if (ctx.analise_documental) complementos.push("análise documental de absenteísmo, afastamentos, acidentes, reclamações e registros internos");
  if (complementos.length) {
    y = paragraph(doc, y, "Como métodos complementares à aplicação do questionário, foram utilizados: " + complementos.join("; ") + ".");
  }


  // ── 4. Caracterização do Trabalho
  //  • Funções: mostra selecionadas x respondentes e diferenças
  //  • Principais atividades: dinâmico, por função, com base nas descrições do cadastro
  y = section(doc, y, "4. Caracterização do Trabalho");
  const _norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const respondentesMap = new Map<string, string>();
  for (const a of avaliacoes) {
    const n = (a.funcao || "").trim();
    if (!n) continue;
    respondentesMap.set(_norm(n), n.charAt(0).toUpperCase() + n.slice(1));
  }
  const respondentes = Array.from(respondentesMap.values()).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const selecionadas = (ctx.funcoes || []).slice().sort((a, b) => a.localeCompare(b, "pt-BR"));
  const respSet = new Set(respondentes.map((f) => _norm(f)));
  const selSet = new Set(selecionadas.map((f) => _norm(f)));
  const soRespondentes = respondentes.filter((f) => !selSet.has(_norm(f)));
  const soSelecionadas = selecionadas.filter((f) => !respSet.has(_norm(f)));

  const carac: [string, string][] = [];
  if (ctx.setor_nome) carac.push(["Setor avaliado", ctx.setor_nome]);
  if (selecionadas.length)
    carac.push(["Funções selecionadas para o relatório", selecionadas.join(", ")]);
  if (respondentes.length)
    carac.push(["Funções respondentes ao COPSOQ", respondentes.join(", ")]);
  if (soSelecionadas.length)
    carac.push(["Selecionadas sem respondentes identificados", soSelecionadas.join(", ")]);
  if (soRespondentes.length)
    carac.push(["Respondentes fora da seleção inicial", soRespondentes.join(", ")]);
  if (ctx.jornada_trabalho) carac.push(["Jornada de trabalho", ctx.jornada_trabalho]);
  if (ctx.escala) carac.push(["Escalas aplicadas", ctx.escala]);
  if (ctx.supervisao) carac.push(["Forma de supervisão", ctx.supervisao]);

  // Principais atividades — dinâmico por função (usa descrições do cadastro)
  const funcoesCtx = ctx.funcoes || [];
  const descsCtx = ctx.atividades_funcoes || [];
  const blocosAtiv: string[] = [];
  funcoesCtx.forEach((f, i) => {
    const d = (descsCtx[i] || "").trim();
    if (d && d.length >= 5) {
      blocosAtiv.push(`▸ ${f}: ${d.replace(/\s+/g, " ")}`);
    }
  });
  if (!blocosAtiv.length && (ctx.atividades || "").trim()) {
    blocosAtiv.push(String(ctx.atividades).trim());
  }
  if (!blocosAtiv.length && (ctx.descricao_ambiente || "").trim()) {
    blocosAtiv.push(String(ctx.descricao_ambiente).trim());
  }
  if (blocosAtiv.length) {
    carac.push(["Principais atividades", blocosAtiv.join("\n\n")]);
  }

  if (carac.length) {
    autoTable(doc, {
      startY: y,
      body: carac,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2,
        valign: "top",
        overflow: "linebreak",
        cellWidth: "wrap",
        lineWidth: 0.15,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 55, fillColor: [241, 245, 249] },
        1: { cellWidth: 135 },
      },
      tableWidth: 190,
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  } else {
    y = paragraph(doc, y, "Dados de caracterização não informados.");
  }

  // ── 5. Gráficos por categoria
  y = section(doc, y, "5. Gráficos e Indicadores COPSOQ");
  // Gráfico 1 — distribuição geral
  if (y + 60 > 285) { doc.addPage(); y = 32; }
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Gráfico 1 — Distribuição geral dos riscos psicossociais (por nível)", 10, y);
  doc.setFont("helvetica", "normal");
  const distrib = distribuicaoPorNivel(avaliacoes);
  drawBarChartVertical(doc, 10, y + 2, pw - 20, 55, distrib, Math.max(...distrib.map((d) => d.value), 1));
  y += 62;

  // Gráficos 2..N — um por categoria
  let gIdx = 2;
  for (const cat of CATEGORIAS) {
    const itens = cat.fatores.map((f) => ({ label: f.nome, value: mediaFator(avaliacoes, f) }));
    const altura = 10 + itens.length * 7.5 + 4;
    if (y + altura > 285) { doc.addPage(); y = 32; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Gráfico ${gIdx} — ${cat.categoria}`, 10, y);
    doc.setFont("helvetica", "normal");
    y = drawHorizontalBarChart(doc, 10, y + 3, pw - 20, itens) + 4;
    gIdx++;
  }

  // ── 6. Fatores de risco identificados
  y = section(doc, y, "6. Identificação dos Fatores de Risco Psicossocial");
  const relevantes = identificarFatoresRelevantes(avaliacoes);
  if (!Object.keys(relevantes).length) {
    y = paragraph(doc, y, "Não foram identificados fatores de risco psicossocial significativos nesta avaliação.");
  } else {
    for (const [cat, itens] of Object.entries(relevantes)) {
      if (y > 280) { doc.addPage(); y = 32; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(cat, 10, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      for (const item of itens) {
        if (y > 285) { doc.addPage(); y = 32; }
        doc.text(`• ${item}`, 14, y);
        y += 4.5;
      }
      y += 1.5;
    }
  }

  // ── 6.1 Fatores de proteção identificados
  y = section(doc, y, "6.1 Fatores de Proteção Identificados");
  const protecoes = identificarFatoresProtecao(avaliacoes);
  if (!protecoes.length) {
    y = paragraph(doc, y, "Não foram identificados fatores de proteção expressivos nesta avaliação. Recomenda-se atuar prioritariamente sobre os fatores de risco listados na seção anterior.");
  } else {
    for (const p of protecoes) {
      if (y > 285) { doc.addPage(); y = 32; }
      doc.setFontSize(9);
      doc.text(`• ${p}`, 14, y);
      y += 4.5;
    }
    y += 2;
  }
  y = section(doc, y, "7. Avaliação dos Riscos");
  const tabela: any[] = [];
  for (const cat of CATEGORIAS) {
    for (const f of cat.fatores) {
      const m = mediaFator(avaliacoes, f);
      const cls = classificar(m);
      const prob = m >= 85 ? "Muito Alta" : m >= 67 ? "Alta" : m >= 34 ? "Média" : "Baixa";
      const grav = cls === "Crítico" ? "Muito Alta" : cls === "Alto" ? "Alta" : cls === "Moderado" ? "Média" : "Baixa";
      tabela.push([
        `${cat.categoria} — ${f.nome}`,
        `${ctx.setor_nome || "—"} / ${(ctx.funcoes || []).join(", ") || "—"}`,
        prob,
        grav,
        cls,
      ]);
    }
  }
  autoTable(doc, {
    startY: y,
    head: [["Fator de Risco", "Setor / Função Exposta", "Probabilidade", "Gravidade", "Nível de Risco"]],
    body: tabela,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8, valign: "top", overflow: "linebreak", cellWidth: "wrap", lineWidth: 0.15 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, halign: "center" },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 60 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 24, halign: "center" },
    },
    tableWidth: 190,
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const cor = COR_NIVEL[String(data.cell.raw)];
        if (cor) {
          data.cell.styles.fillColor = cor;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: 10, right: 10 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── 8. Integração AET × Psicossocial
  y = section(doc, y, "8. Integração AET × Psicossocial");
  for (const p of buildIntegracaoAet(avaliacoes, ctx)) {
    y = paragraph(doc, y, p, 10, true, { indent: 5 });
  }

  // Anexo: síntese dos dados ergonômicos considerados
  const anexoLinhas: [string, string][] = [];
  if (ctx.aet_ritmo_complexidade) anexoLinhas.push(["Ritmo e complexidade (AET)", ctx.aet_ritmo_complexidade]);
  if (ctx.aet_jornada_aspectos) anexoLinhas.push(["Aspectos da jornada (AET)", ctx.aet_jornada_aspectos]);
  if (ctx.aet_analise_organizacional) anexoLinhas.push(["Análise organizacional (AET)", ctx.aet_analise_organizacional]);
  if (ctx.aet_tarefas) anexoLinhas.push(["Tarefas descritas (AET)", ctx.aet_tarefas]);
  if (ctx.aet_caracterizacao_biomecanica) anexoLinhas.push(["Caracterização biomecânica (AET)", ctx.aet_caracterizacao_biomecanica]);
  if (ctx.aet_riscos_observados) anexoLinhas.push(["Riscos observados (AET)", ctx.aet_riscos_observados]);
  if (ctx.aet_diagnostico_ergonomico) anexoLinhas.push(["Diagnóstico ergonômico (AET)", ctx.aet_diagnostico_ergonomico]);
  if (ctx.aet_conclusao) anexoLinhas.push(["Conclusão da AET", ctx.aet_conclusao]);
  if (ctx.aet_ferramentas && ctx.aet_ferramentas.length) {
    anexoLinhas.push([
      "Ferramentas ergonômicas aplicadas",
      ctx.aet_ferramentas
        .map((f) => `${f.tipo}: ${f.resultado || "—"}${f.classificacao ? ` (${f.classificacao})` : ""}${f.nivel_acao ? ` — ação: ${f.nivel_acao}` : ""}`)
        .join("\n"),
    ]);
  }
  if (anexoLinhas.length) {
    autoTable(doc, {
      startY: y,
      head: [["Dado da AET/AEP", "Conteúdo considerado"]],
      body: anexoLinhas,
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 2, valign: "top", overflow: "linebreak", cellWidth: "wrap", lineWidth: 0.15 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: "bold", fillColor: [241, 245, 249] },
        1: { cellWidth: 135 },
      },
      tableWidth: 190,
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── 9. Análise técnica
  y = section(doc, y, "9. Resultados e Análise");
  for (const p of buildAnaliseTecnica(avaliacoes, ctx)) {
    y = paragraph(doc, y, p, 10, true, { indent: 5 });
  }

  // ── 9.1 Justificativa técnica da classificação
  y = section(doc, y, "9.1 Justificativa Técnica da Classificação");
  y = paragraph(doc, y, buildJustificativaTecnica(avaliacoes), 10, true, { indent: 5 });

  // ── 10. Conclusão
  y = section(doc, y, "10. Conclusão Técnica");
  y = paragraph(doc, y, buildConclusao(avaliacoes), 10, true, { indent: 5 });

  // ── 10.1 Recomendações por área
  y = section(doc, y, "10.1 Recomendações por Área de Atuação");
  const recArea = buildRecomendacoesPorArea(avaliacoes);
  const areas: [string, string[]][] = [
    ["Organizacional", recArea.organizacional],
    ["Liderança", recArea.lideranca],
    ["Recursos Humanos", recArea.rh],
    ["SST / SESMT", recArea.sst],
  ];
  for (const [titulo, itens] of areas) {
    if (!itens.length) continue;
    if (y > 275) { doc.addPage(); y = 32; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(titulo, 10, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const it of itens) {
      const split = doc.splitTextToSize(`• ${it}`, pw - 24);
      for (const l of split) {
        if (y > 285) { doc.addPage(); y = 32; }
        doc.text(l, 14, y);
        y += 4.5;
      }
    }
    y += 2;
  }

  // ── 11. Plano de ação
  y = section(doc, y, "11. Plano de Ação");
  const plano = buildPlanoAcao(avaliacoes);
  if (!plano.length) {
    y = paragraph(doc, y, "Não há ações corretivas obrigatórias. Recomenda-se manutenção das boas práticas e reavaliação periódica.");
  } else {
    autoTable(doc, {
      startY: y,
      head: [[
        "Risco Identificado",
        "Causa Provável",
        "Medida Preventiva",
        "Medida Corretiva",
        "Responsável",
        "Prazo",
        "Acompanhamento",
      ]],
      body: plano.map((p) => [
        p.risco,
        p.causa,
        p.preventiva,
        p.corretiva,
        p.responsavel,
        p.prazo,
        p.acompanhamento,
      ]),
      theme: "grid",
      styles: { fontSize: 7.5, cellPadding: 1.4, valign: "top" },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Assinatura
  if (y > 260) { doc.addPage(); y = 40; }
  y += 12;
  doc.setDrawColor(80);
  doc.line(60, y, 150, y);
  doc.setFontSize(9);
  doc.text(ctx.responsavel || "Responsável Técnico", 105, y + 4, { align: "center" });
  if (ctx.cargo_responsavel || ctx.crea) {
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text(`${ctx.cargo_responsavel || ""}${ctx.crea ? "  •  " + ctx.crea : ""}`, 105, y + 8, { align: "center" });
  }

  addFooter(doc);

  const fileName = `relatorio_psicossocial_${(ctx.setor_nome || "setor").replace(/\s+/g, "_").toLowerCase()}.pdf`;
  doc.save(fileName);
}
