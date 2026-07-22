// Gerador determinístico da AET.
// Não utiliza IA conversacional. Usa regras de negócio + banco de conhecimento interno
// + processamento dos dados do cadastro + análise de anexos (imagens e PDFs).
// Nunca inventa informações — quando um dado é ausente, indica ser estimativa ou omite.

import { acharConhecimento, CONHECIMENTO_GENERICO, FuncaoConhecimento } from "./aetKnowledgeBase";

// pdfjs-dist (extração de texto de PDFs no navegador)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — sem tipos publicados no build legacy
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker;

export type AetGenInput = {
  descricao: string;
  contexto: any;
  anexos: File[];
  instrucoes_usuario?: string;
};


export type AetGenOutput = {
  posto_trabalho: string;
  descricao_atividade: string;
  analise_organizacional: string;
  ritmo_complexidade: string;
  jornada_aspectos: string;
  caracterizacao_biomecanica: string;
  diagnostico_ergonomico: string;
  conclusao: string;
  cronoanalise: { tarefa: string; tempo: string; risco: string }[];
  avaliacoes_dimensionais: Record<string, string>;
  avaliacoes_quantitativas_analise: string;
  plano_acao: {
    o_que: string; como: string; justificativa: string; prioridade: string;
    resultado_esperado: string; responsavel: string; prazo: string;
  }[];
  _debug?: any;
};

const j = (...parts: (string | null | undefined | false)[]) =>
  parts.filter((p) => typeof p === "string" && p.trim().length > 0).join(" ");

// ─────────── Extração de texto de PDF ───────────
export async function extrairTextoPdf(file: File): Promise<string> {
  try {
    const buf = await file.arrayBuffer();
    const pdf = await (pdfjsLib as any).getDocument({ data: buf, disableWorker: false }).promise;
    const paginas: string[] = [];
    const maxPg = Math.min(pdf.numPages, 20);
    for (let i = 1; i <= maxPg; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const txt = content.items.map((it: any) => it.str).join(" ");
      paginas.push(txt);
    }
    return paginas.join("\n").replace(/\s+/g, " ").trim();
  } catch (e) {
    console.warn("extrairTextoPdf falhou", file.name, e);
    return "";
  }
}

// Palavras-chave para identificar tópicos em textos livres (descrição + PDFs)
const KEYWORDS = {
  mobiliario: ["cadeira", "mesa", "bancada", "monitor", "notebook", "teclado", "mouse", "apoio", "prateleira"],
  postura: ["sentado", "em pé", "agachado", "ajoelhado", "inclinad", "flexão", "flexao", "torção", "torcao", "sobrecabeça", "sobrecabeca"],
  carga: ["kg", "peso", "levanta", "transport", "carga", "empurr", "puxa"],
  ambiente: ["ruído", "ruido", "calor", "frio", "iluminação", "iluminacao", "ventilação", "ventilacao", "poeira", "gás", "gas"],
  epi: ["luva", "capacete", "óculos", "oculos", "protetor auricular", "abafador", "botina", "cinto"],
  organizacional: ["meta", "supervis", "pressão", "pressao", "prazo", "pausa", "revezamento", "rodízio", "rodizio", "hora extra"],
  psicossocial: ["estresse", "ansiedade", "sobrecarga mental", "cobrança", "cobranca", "assédio", "assedio"],
  altura: ["altura", "escada", "andaime", "telhado", "plataforma"],
};

function extrairTopicos(texto: string): Record<string, string[]> {
  const t = texto.toLowerCase();
  const out: Record<string, string[]> = {};
  for (const [cat, kws] of Object.entries(KEYWORDS)) {
    const achados = kws.filter((k) => t.includes(k));
    if (achados.length) out[cat] = achados;
  }
  return out;
}

// Extrai frases do texto que mencionem palavras-chave (para citação)
function extrairFrasesRelevantes(texto: string, palavras: string[], maxFrases = 5): string[] {
  const frases = texto.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const norm = (s: string) => s.toLowerCase();
  const rel = frases.filter((f) => palavras.some((p) => norm(f).includes(p)));
  return rel.slice(0, maxFrases);
}

// ─────────── Análise de imagens (sem invenção) ───────────
export function analisarImagens(anexos: File[]): {
  quantidade: number;
  nomes: string[];
  dicas_por_nome: string[];
} {
  const imgs = anexos.filter((f) => f.type.startsWith("image/"));
  const nomes = imgs.map((f) => f.name);
  const dicasVocab = [
    "cadeira", "mesa", "monitor", "notebook", "teclado", "mouse", "ferramenta", "máquina", "maquina",
    "bancada", "posto", "postura", "epi", "circulacao", "circulação", "iluminacao", "iluminação",
    "layout", "armazenamento", "estoque",
  ];
  const dicas_por_nome: string[] = [];
  for (const n of nomes) {
    const nn = n.toLowerCase();
    const achados = dicasVocab.filter((v) => nn.includes(v));
    if (achados.length) dicas_por_nome.push(`${n}: possível referência a ${achados.join(", ")}`);
  }
  return { quantidade: imgs.length, nomes, dicas_por_nome };
}

// ─────────── Interpretações técnicas dos escores ───────────
function interpretarFerramenta(f: { tipo: string; resultado: string; dados_avaliacao?: string }): string {
  const tipo = (f.tipo || "").toUpperCase();
  const r = (f.resultado || "").trim();
  const num = parseFloat(r.replace(",", "."));
  if (tipo.includes("RULA")) {
    if (!isNaN(num)) {
      if (num <= 2) return `RULA ${r}: postura aceitável.`;
      if (num <= 4) return `RULA ${r}: investigar — mudanças podem ser necessárias.`;
      if (num <= 6) return `RULA ${r}: investigar e mudar em breve — risco moderado a alto.`;
      return `RULA ${r}: investigar e mudar imediatamente — risco muito alto para MMSS/pescoço.`;
    }
  }
  if (tipo.includes("REBA")) {
    if (!isNaN(num)) {
      if (num <= 1) return `REBA ${r}: risco desprezível.`;
      if (num <= 3) return `REBA ${r}: risco baixo — mudança pode ser necessária.`;
      if (num <= 7) return `REBA ${r}: risco médio — investigar e mudar em breve.`;
      if (num <= 10) return `REBA ${r}: risco alto — investigar e implantar mudanças.`;
      return `REBA ${r}: risco muito alto — implantar mudanças imediatamente.`;
    }
  }
  if (tipo.includes("OCRA")) {
    if (!isNaN(num)) {
      if (num <= 7.5) return `OCRA Checklist ${r}: risco aceitável.`;
      if (num <= 11) return `OCRA Checklist ${r}: risco muito leve — intervenções recomendadas.`;
      if (num <= 14) return `OCRA Checklist ${r}: risco leve — reorganização do trabalho.`;
      if (num <= 22.5) return `OCRA Checklist ${r}: risco médio — intervenções obrigatórias.`;
      return `OCRA Checklist ${r}: risco alto — intervenções urgentes.`;
    }
  }
  if (tipo.includes("NIOSH") || tipo.includes("LI")) {
    if (!isNaN(num)) {
      if (num < 1) return `NIOSH LI ${r}: carga aceitável para a maioria dos trabalhadores.`;
      if (num < 2) return `NIOSH LI ${r}: risco aumentado — redesenho recomendado.`;
      if (num < 3) return `NIOSH LI ${r}: risco elevado — redesenho obrigatório.`;
      return `NIOSH LI ${r}: risco muito elevado — não realizar sem redesenho.`;
    }
  }
  if (tipo.includes("OWAS")) {
    if (!isNaN(num)) {
      if (num === 1) return `OWAS categoria 1: postura normal, sem correção.`;
      if (num === 2) return `OWAS categoria 2: postura com risco, corrigir a médio prazo.`;
      if (num === 3) return `OWAS categoria 3: postura com dano, corrigir logo.`;
      return `OWAS categoria ${r}: corrigir imediatamente.`;
    }
  }
  if (tipo.includes("MOORE") || tipo.includes("STRAIN")) {
    if (!isNaN(num)) {
      if (num <= 3) return `Strain Index ${r}: risco baixo.`;
      if (num <= 5) return `Strain Index ${r}: risco incerto.`;
      if (num <= 7) return `Strain Index ${r}: risco elevado.`;
      return `Strain Index ${r}: risco muito elevado.`;
    }
  }
  return `${f.tipo}: resultado ${r}.`;
}

// ─────────── Geradores por seção ───────────
function gerarPostoTrabalho(ctx: any, kb: FuncaoConhecimento, dicasImg: string[], pdfTexto: string, obs: string): string {
  const emp = ctx.empresa || {};
  const setor = ctx.setor || {};
  const funcoes: string[] = (ctx.funcoes || []).map((f: any) => f.nome).filter(Boolean);

  const usuFrases = extrairFrasesRelevantes(obs, KEYWORDS.mobiliario.concat(KEYWORDS.ambiente));
  const pdfFrases = extrairFrasesRelevantes(pdfTexto, KEYWORDS.mobiliario);

  const dim = ctx.avaliacoes_dimensionais || {};
  const dimTxt: string[] = [];
  const dimLabels: Record<string, string> = {
    altura_mesa: "altura da mesa/superfície de trabalho",
    altura_assento: "altura do assento",
    profundidade_assento: "profundidade do assento",
    monitor: "posicionamento do monitor",
    distancia_olho_monitor: "distância olho-monitor",
    espaco_pernas: "espaço para pernas",
  };
  for (const k of Object.keys(dimLabels)) {
    const item = dim[k];
    if (item && (item.medida || item.avaliacao)) {
      dimTxt.push(`${dimLabels[k]}${item.medida ? ` medida em ${item.medida}` : ""}${item.avaliacao ? ` — ${item.avaliacao}` : ""}`);
    }
  }

  return j(
    `A avaliação ergonômica foi realizada no setor ${setor.nome || "informado"}${setor.ges ? ` (GES/GHE ${setor.ges})` : ""} da empresa ${emp.razao_social || "avaliada"}${funcoes.length ? `, no posto de trabalho ocupado pela(s) função(ões) ${funcoes.join(", ")}` : ""}.`,
    setor.descricao_ambiente ? `Descrição do ambiente informada no cadastro: ${setor.descricao_ambiente}.` : null,
    kb.posto,
    usuFrases.length ? `Observações in loco: ${usuFrases.join(" ")}` : null,
    pdfFrases.length ? `Elementos identificados em documentos anexos: ${pdfFrases.slice(0, 3).join(" ")}` : null,
    dimTxt.length ? `Avaliações dimensionais cadastradas: ${dimTxt.join("; ")}.` : "Recomenda-se aferir dimensões do mobiliário conforme NR-17.3.3 e ISO 9241 quando não informadas.",
    dicasImg.length ? `Fotografias anexadas fornecem evidência visual complementar (${dicasImg.length} referência(s) contextual(is) identificada(s) no material fornecido).` : null,
  );
}

function gerarDescricaoAtividade(ctx: any, kb: FuncaoConhecimento, obs: string): string {
  const funcoes: any[] = ctx.funcoes || [];
  const atividadesCadastro = funcoes.map((f) => f.descricao_atividades).filter(Boolean).join(" ");
  const usuFrases = extrairFrasesRelevantes(obs, ["realiz", "execut", "faz", "opera", "atende", "utiliz", "manuse"]);

  const lista = atividadesCadastro
    ? `Atividades descritas no cadastro da(s) função(ões): ${atividadesCadastro}`
    : `Sequência operacional típica da função (base de conhecimento interno, sujeita a validação em campo): ${kb.atividades.map((a) => `(i) ${a}`).join("; ")}.`;

  return j(
    lista,
    usuFrases.length ? `Observações complementares do avaliador em campo: ${usuFrases.join(" ")}` : null,
    "Cada tarefa deve ser executada respeitando os procedimentos operacionais padrão (POP) da empresa e as normas regulamentadoras aplicáveis.",
  );
}

function gerarAnaliseOrganizacional(ctx: any, kb: FuncaoConhecimento): string {
  const psico = ctx.avaliacao_psicossocial || {};
  const resumo = psico.resumo_editavel || "";
  const avals: any[] = psico.avaliacoes || [];
  const riscosPsico = avals
    .map((a) => a.riscos)
    .filter(Boolean)
    .join(" ");

  return j(
    kb.organizacao,
    resumo ? `Síntese consolidada da avaliação psicossocial COPSOQ III do setor: ${resumo}` : null,
    riscosPsico ? `Riscos psicossociais identificados nas avaliações individuais: ${riscosPsico}` : null,
    !resumo && !riscosPsico ? "A avaliação psicossocial (COPSOQ III) deve ser considerada como parte da análise organizacional." : null,
  );
}

function gerarRitmoComplexidade(kb: FuncaoConhecimento, obs: string, ferramentas: any[]): string {
  const usuFrases = extrairFrasesRelevantes(obs, ["ritmo", "repet", "concentr", "atenção", "atencao", "meta", "pressão", "pressao"]);
  const repet = ferramentas.some((f) => (f.tipo || "").toUpperCase().includes("OCRA"));
  return j(
    kb.ritmo,
    repet ? "A aplicação de OCRA Checklist evidencia o tratamento técnico da repetitividade dos ciclos." : null,
    usuFrases.length ? `Registro do avaliador: ${usuFrases.join(" ")}` : null,
  );
}

function gerarJornada(ctx: any, kb: FuncaoConhecimento, pdfTexto: string): string {
  const emp = ctx.empresa || {};
  const jornadaCad = emp.jornada_trabalho || "";
  const pdfFrases = extrairFrasesRelevantes(pdfTexto, ["jornada", "turno", "escala", "hora extra", "intervalo"]);
  return j(
    jornadaCad ? `Jornada cadastrada para a empresa: ${jornadaCad}.` : null,
    kb.jornada,
    pdfFrases.length ? `Referências a jornada em documentos anexos: ${pdfFrases.slice(0, 2).join(" ")}` : null,
    "Devem ser observados os intervalos e pausas previstos em CLT e nos itens NR-17.6 aplicáveis à atividade.",
  );
}

function gerarBiomecanica(ctx: any, kb: FuncaoConhecimento, obs: string): string {
  const ferramentas: any[] = ctx.ferramentas_ergonomicas || [];
  const interpretacoes = ferramentas.map(interpretarFerramenta);
  const usuFrases = extrairFrasesRelevantes(obs, KEYWORDS.postura.concat(KEYWORDS.carga));

  return j(
    kb.biomecanica,
    interpretacoes.length
      ? `Interpretação técnica das ferramentas ergonômicas aplicadas neste posto: ${interpretacoes.join(" ")}`
      : "Recomenda-se aplicação de ferramentas ergonômicas (RULA, REBA, OCRA, NIOSH) para quantificação do risco biomecânico.",
    usuFrases.length ? `Observações posturais registradas em campo: ${usuFrases.join(" ")}` : null,
    "A análise deve ser interpretada em conjunto com as normas ISO 11226 (posturas estáticas) e ISO 11228-1/2/3 (manuseio de cargas).",
  );
}

function gerarCronoanalise(ctx: any, kb: FuncaoConhecimento): { tarefa: string; tempo: string; risco: string }[] {
  const existente = ctx.cronoanalise_previa || [];
  if (Array.isArray(existente) && existente.length > 0) {
    return existente.map((c: any) => ({
      tarefa: String(c.tarefa || ""),
      tempo: String(c.tempo || ""),
      risco: String(c.risco || ""),
    }));
  }
  // Estimativa a partir do banco de conhecimento — SINALIZAR
  return kb.tarefas_crono.map((c) => ({
    tarefa: c.tarefa,
    tempo: `${c.tempo} (estimado)`,
    risco: c.risco,
  }));
}

function analisarQuantitativas(ctx: any): string {
  const av: any[] = ctx.avaliacoes_quantitativas || [];
  if (!av.length) return "Não foram informadas avaliações quantitativas para este setor.";
  const partes: string[] = [];
  for (const a of av) {
    const bloco: string[] = [];
    if (a.especificacao_setor) bloco.push(`Local: ${a.especificacao_setor}.`);
    if (a.ruido_valor) {
      const v = parseFloat(String(a.ruido_valor).replace(",", "."));
      const lim = parseFloat(String(a.limite_ruido || "85").replace(",", "."));
      const status = !isNaN(v) && !isNaN(lim) ? (v > lim ? "ACIMA do limite" : "dentro do limite") : "a comparar";
      bloco.push(`Ruído: ${a.ruido_valor} ${a.ruido_unidade || "dB(A)"} — limite ${a.limite_ruido || "85"} ${a.unidade_limite_ruido || "dB(A)"} (NHO-01/NR-15) — ${status}.`);
    }
    if (a.iluminancia_valor) {
      const v = parseFloat(String(a.iluminancia_valor).replace(",", "."));
      const lim = parseFloat(String(a.limite_iluminancia || "500").replace(",", "."));
      const status = !isNaN(v) && !isNaN(lim) ? (v < lim ? "ABAIXO do recomendado" : "adequado") : "a comparar";
      bloco.push(`Iluminância: ${a.iluminancia_valor} ${a.iluminancia_unidade || "lux"} — recomendado ${a.limite_iluminancia || "500"} ${a.unidade_limite_iluminancia || "lux"} (NBR ISO 8995-1) — ${status}.`);
    }
    if (a.temperatura_valor) {
      bloco.push(`Temperatura: ${a.temperatura_valor} ${a.temperatura_unidade || "°C"}${a.limite_temperatura ? ` — limite ${a.limite_temperatura}` : ""} (ISO 7730 / NR-17.5).`);
    }
    if (bloco.length) partes.push(bloco.join(" "));
  }
  return partes.join(" ") || "Avaliações quantitativas registradas sem valores comparáveis.";
}

function gerarDimensionaisTexto(ctx: any): Record<string, string> {
  const dim = ctx.avaliacoes_dimensionais || {};
  const out: Record<string, string> = {};
  const chaves = ["altura_mesa", "altura_assento", "profundidade_assento", "monitor", "distancia_olho_monitor", "espaco_pernas"];
  const rec: Record<string, string> = {
    altura_mesa: "NR-17.3.3 recomenda superfície regulável ou ajustada ao trabalho e à antropometria do usuário.",
    altura_assento: "NR-17.3.4 exige altura ajustável à estatura e à natureza da tarefa.",
    profundidade_assento: "Profundidade do assento deve permitir apoio da região lombar sem comprimir região poplítea.",
    monitor: "Borda superior do monitor na linha dos olhos, distância 50–70 cm (ISO 9241).",
    distancia_olho_monitor: "Distância recomendada 50–70 cm com ajuste conforme acuidade visual.",
    espaco_pernas: "Espaço livre para pernas conforme NR-17.3.2.",
  };
  for (const k of chaves) {
    const it = dim[k];
    if (it && (it.medida || it.avaliacao)) {
      out[k] = j(it.avaliacao || "", it.medida ? `Medida: ${it.medida}.` : null, rec[k]);
    } else {
      out[k] = `Depende de medição em campo — recomenda-se aferir conforme ${rec[k]}`;
    }
  }
  return out;
}

function gerarDiagnostico(ctx: any, kb: FuncaoConhecimento, biom: string, quant: string, org: string): string {
  const riscos = kb.riscos.join("; ");
  return j(
    "Diagnóstico ergonômico integrado (físico + organizacional + psicossocial):",
    `Do ponto de vista biomecânico: ${biom.slice(0, 500)}`,
    `Do ponto de vista das medições quantitativas: ${quant}`,
    `Do ponto de vista organizacional/psicossocial: ${org.slice(0, 500)}`,
    `Riscos ergonômicos típicos identificados para esta natureza de trabalho: ${riscos}.`,
    "A análise integrada aponta para pontos de atenção que exigem intervenções conforme o plano de ação apresentado, alinhadas à NR-17 e às normas ISO aplicáveis.",
  );
}

function gerarConclusao(ctx: any, kb: FuncaoConhecimento, quantTxt: string): string {
  const funcoes = (ctx.funcoes || []).map((f: any) => f.nome).filter(Boolean).join(", ");
  return j(
    `A Análise Ergonômica do Trabalho (AET) da(s) função(ões) ${funcoes || "avaliada(s)"} identificou pontos de conformidade e não conformidade em relação à NR-17 e normas técnicas correlatas.`,
    `A síntese das avaliações quantitativas indica: ${quantTxt}`,
    "Recomenda-se a implementação do plano de ação proposto, priorizando as ações de maior impacto na saúde ocupacional dos trabalhadores.",
    "Este documento deve ser revisado a cada dois anos ou sempre que houver alteração significativa do posto, processo ou organização do trabalho, conforme boas práticas e Anexos da NR-17.",
  );
}

function gerarPlanoAcao(kb: FuncaoConhecimento, ctx: any): AetGenOutput["plano_acao"] {
  const base = kb.recomendacoes.map((r) => ({
    o_que: r.o_que,
    como: r.como,
    justificativa: `Fundamento normativo: NR-17 e boas práticas ergonômicas; adaptação típica para a natureza da função ${kb.chave}.`,
    prioridade: r.prazo.toLowerCase().includes("imediato") || r.prazo.includes("30") ? "Alta" : r.prazo.includes("60") ? "Média" : "Média",
    resultado_esperado: `Redução do risco ergonômico associado à ação "${r.o_que}", com melhoria mensurável nas avaliações de acompanhamento.`,
    responsavel: r.responsavel,
    prazo: r.prazo,
  }));

  // Ações adicionais decorrentes de dados quantitativos
  const av: any[] = ctx.avaliacoes_quantitativas || [];
  for (const a of av) {
    const v = parseFloat(String(a.ruido_valor || "").replace(",", "."));
    const lim = parseFloat(String(a.limite_ruido || "85").replace(",", "."));
    if (!isNaN(v) && !isNaN(lim) && v > lim) {
      base.push({
        o_que: "Controle de ruído no setor",
        como: "Implementar controles coletivos (enclausuramento, atenuação acústica) e reforçar EPI auditivo de acordo com o NRRsf calculado; incluir no PGR e PCMSO.",
        justificativa: `Ruído medido (${a.ruido_valor} dB(A)) acima do limite de tolerância (${a.limite_ruido} dB(A)) — NR-15 Anexo 1 / NHO-01.`,
        prioridade: "Alta",
        resultado_esperado: "Enquadramento do nível de exposição abaixo do limite de tolerância.",
        responsavel: "SESMT + Engenharia",
        prazo: "90 dias",
      });
    }
    const iv = parseFloat(String(a.iluminancia_valor || "").replace(",", "."));
    const ilim = parseFloat(String(a.limite_iluminancia || "500").replace(",", "."));
    if (!isNaN(iv) && !isNaN(ilim) && iv < ilim) {
      base.push({
        o_que: "Adequação da iluminância do posto",
        como: "Redimensionar projeto luminotécnico para atingir o nível recomendado pela NBR ISO 8995-1 na plano de trabalho.",
        justificativa: `Iluminância medida (${a.iluminancia_valor} lux) abaixo do recomendado (${a.limite_iluminancia} lux) — NBR ISO 8995-1.`,
        prioridade: "Média",
        resultado_esperado: "Iluminância no plano de trabalho igual ou superior ao valor recomendado.",
        responsavel: "Engenharia + Manutenção",
        prazo: "120 dias",
      });
    }
  }

  // Se há psicossocial com risco relevante
  const psico = ctx.avaliacao_psicossocial || {};
  const temPsicoRisco = (psico.avaliacoes || []).some((a: any) =>
    /alto|elevad|crít|crit/i.test(String(a.resultado || "") + " " + String(a.riscos || "")),
  );
  if (temPsicoRisco) {
    base.push({
      o_que: "Programa de manejo dos fatores psicossociais",
      como: "Implantar ações estruturadas a partir dos domínios COPSOQ com alerta (comunicação, autonomia, apoio social, reconhecimento).",
      justificativa: "COPSOQ III identificou domínios em faixa de risco elevado no setor.",
      prioridade: "Alta",
      resultado_esperado: "Redução dos domínios em faixa de risco em reavaliação em 12 meses.",
      responsavel: "RH + SESMT",
      prazo: "120 dias",
    });
  }

  return base;
}

// ─────────── Orquestrador ───────────
export async function gerarAetDeterministica(input: AetGenInput): Promise<AetGenOutput> {
  const { descricao, contexto, anexos, instrucoes_usuario } = input;
  const funcoes: string[] = (contexto?.funcoes || []).map((f: any) => f.nome).filter(Boolean);
  const kb = acharConhecimento(funcoes) || CONHECIMENTO_GENERICO;

  // Análise de anexos
  const imagens = analisarImagens(anexos);
  const pdfs = anexos.filter((f) => f.type === "application/pdf");
  const pdfTextos: string[] = [];
  for (const p of pdfs) {
    const t = await extrairTextoPdf(p);
    if (t) pdfTextos.push(`[${p.name}] ${t}`);
  }
  const pdfTexto = pdfTextos.join("\n\n").slice(0, 40000);

  const posto = gerarPostoTrabalho(contexto, kb, imagens.dicas_por_nome, pdfTexto, descricao || "");
  const atividade = gerarDescricaoAtividade(contexto, kb, descricao || "");
  const organizacional = gerarAnaliseOrganizacional(contexto, kb);
  const ritmo = gerarRitmoComplexidade(kb, descricao || "", contexto.ferramentas_ergonomicas || []);
  const jornada = gerarJornada(contexto, kb, pdfTexto);
  const biom = gerarBiomecanica(contexto, kb, descricao || "");
  const crono = gerarCronoanalise(contexto, kb);
  const dims = gerarDimensionaisTexto(contexto);
  const quantTxt = analisarQuantitativas(contexto);
  const diag = gerarDiagnostico(contexto, kb, biom, quantTxt, organizacional);
  const concl = gerarConclusao(contexto, kb, quantTxt);
  const plano = gerarPlanoAcao(kb, contexto);

  // IMPORTANTE: as instruções personalizadas do usuário NÃO podem ser copiadas
  // literalmente nos campos gerados. Elas são apenas um prompt interno usado
  // pelo modo IA. No modo determinístico local, elas são registradas apenas
  // no _debug e ignoradas na saída visível.
  const instr = (instrucoes_usuario || "").trim();

  return {
    posto_trabalho: posto,
    descricao_atividade: atividade,
    analise_organizacional: organizacional,
    ritmo_complexidade: ritmo,
    jornada_aspectos: jornada,
    caracterizacao_biomecanica: biom,
    diagnostico_ergonomico: diag,
    conclusao: concl,
    cronoanalise: crono,
    avaliacoes_dimensionais: dims,
    avaliacoes_quantitativas_analise: quantTxt,
    plano_acao: plano,
    _debug: {
      knowledge_base_utilizada: kb.chave,
      imagens_analisadas: imagens.quantidade,
      pdfs_analisados: pdfs.length,
      pdf_chars: pdfTexto.length,
      instrucoes_usuario_recebidas: instr.length,
      modo: "deterministico",
    },
  };
}

