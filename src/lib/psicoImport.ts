// Importador automático de respostas COPSOQ a partir de planilhas (.xlsx/.xls) e PDFs.
// Objetivo: transformar um arquivo bruto em avaliações anonimizadas, agrupáveis por função
// e compatíveis com as funções selecionadas no setor da AET.
import * as XLSX from "xlsx";
import { BLOCOS_COPSOQ } from "@/lib/copsoqBlocos";
import {
  calcularPsicossocial,
  emptyPsicossocial,
  type AvaliacaoPsicossocial,
} from "@/components/PsicossocialModal";

export type ImportWarning = { linha?: number; pagina?: number; mensagem: string };
export type FuncaoSetorPsico = { id?: string; nome: string };
export type FuncaoMappingStatus = "automatico" | "confirmado" | "ambigua" | "fora_setor" | "nao_identificada";
export type FuncaoMappingCandidate = { funcao: string; score: number };
export type FuncaoMapping = {
  original: string;
  funcao?: string;
  score?: number;
  status: FuncaoMappingStatus;
  candidatos?: FuncaoMappingCandidate[];
};
export type ImportOptions = {
  /** Funções selecionadas no setor da AET. Quando informado, o importador só aceita essas funções. */
  funcoesSetor?: FuncaoSetorPsico[];
  /** Mapeamentos confirmados pelo usuário para casos ambíguos: texto original do PDF/planilha → função cadastrada. */
  mapeamentosConfirmados?: Record<string, string>;
};
export type ImportResultado = {
  avaliacoes: AvaliacaoPsicossocial[];
  totalRespondentes: number;
  totalPerguntasReconhecidas: number;
  colunasIgnoradas: string[];
  funcoesEncontradas: string[];
  avisos: ImportWarning[];
  paginasProcessadas?: number;
  paginasComFalha?: number[];
  paginasOcr?: number[];
  mapeamentosFuncoes?: FuncaoMapping[];
  ambiguidadesFuncoes?: FuncaoMapping[];
  funcoesIgnoradas?: string[];
};

// ─── Normalização e fuzzy matching ───
const STOP_WORDS = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "as", "os", "em", "no", "na", "para"]);
const ABBREV: Record<string, string> = {
  aux: "auxiliar",
  auxiliar: "auxiliar",
  adm: "administrativo",
  admin: "administrativo",
  administr: "administrativo",
  administrativo: "administrativo",
  administrativa: "administrativo",
  tec: "tecnico",
  tecn: "tecnico",
  tecnico: "tecnico",
  tecnica: "tecnico",
  seg: "seguranca",
  segur: "seguranca",
  seguranca: "seguranca",
  trab: "trabalho",
  trabalho: "trabalho",
  sup: "supervisor",
  superv: "supervisor",
  supervisor: "supervisor",
  supervisora: "supervisor",
  manut: "manutencao",
  manutencao: "manutencao",
  manutençao: "manutencao",
  eletromecanico: "eletromecanico",
  eletromec: "eletromecanico",
  mec: "mecanico",
  mecanico: "mecanico",
  eletr: "eletrico",
  eletrico: "eletrico",
  op: "operador",
  oper: "operador",
  operador: "operador",
  maq: "maquina",
  maqs: "maquina",
  maquina: "maquina",
  prod: "producao",
  producao: "producao",
};

const FUNCOES_CANONICAS: { rx: RegExp; nome: string }[] = [
  { rx: /\baux\w*\s+adm\w*|\badm\w*\s+aux\w*/i, nome: "Auxiliar Administrativo" },
  { rx: /eletro\s*mec|eletromec/i, nome: "Eletromecânico" },
  { rx: /\btec\w*\s+seg\w*\s+trab\w*|seg\w*\s+trab\w*/i, nome: "Técnico de Segurança do Trabalho" },
  { rx: /\bsup\w*\s+manut\w*|superv\w*\s+manut\w*/i, nome: "Supervisor de Manutenção" },
];

function semAcento(v: string): string {
  return String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C");
}

function normalizarTexto(v: string): string {
  return semAcento(v)
    .toLowerCase()
    .replace(/[|/\\]+/g, " ")
    .replace(/[()[\]{}.,;:!?ºª°•·*_+=~^`´'\"]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(v: string): string[] {
  return normalizarTexto(v)
    .split(/\s+/)
    .map((t) => ABBREV[t] || t)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function normalizarFuncao(v: string): string {
  return tokens(v).join(" ");
}

function distanciaLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function similaridadeTexto(a: string, b: string): number {
  const na = normalizarTexto(a);
  const nb = normalizarTexto(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const dist = distanciaLevenshtein(na, nb);
  return Math.max(0, 1 - dist / Math.max(na.length, nb.length));
}

function tokenOverlapScore(raw: string, target: string): number {
  const rt = tokens(raw);
  const tt = tokens(target);
  if (!rt.length || !tt.length) return 0;
  let matched = 0;
  for (const r of rt) {
    if (tt.some((t) => t === r || t.startsWith(r) || r.startsWith(t))) matched++;
  }
  const recall = matched / rt.length;
  const precision = matched / tt.length;
  return recall * 0.7 + precision * 0.3;
}

function acronymScore(raw: string, target: string): number {
  const compactRaw = tokens(raw).map((t) => t[0]).join("");
  const compactTarget = tokens(target).map((t) => t[0]).join("");
  if (!compactRaw || !compactTarget) return 0;
  if (compactRaw === compactTarget) return 1;
  if (compactTarget.startsWith(compactRaw) || compactRaw.startsWith(compactTarget)) return 0.75;
  return similaridadeTexto(compactRaw, compactTarget) * 0.6;
}

function scoreFuncao(raw: string, target: string): number {
  const r = normalizarFuncao(raw);
  const t = normalizarFuncao(target);
  if (!r || !t) return 0;
  if (r === t) return 1;
  if (t.includes(r) || r.includes(t)) return 0.94;
  const lev = similaridadeTexto(r, t);
  const tok = tokenOverlapScore(r, t);
  const acr = acronymScore(raw, target);
  return Math.max(0, Math.min(1, lev * 0.45 + tok * 0.45 + acr * 0.1));
}

function normalizarFuncaoLivre(raw: string): string {
  const limpo = limparPossivelFuncao(raw);
  for (const c of FUNCOES_CANONICAS) if (c.rx.test(limpo)) return c.nome;
  return limpo || "Não informada";
}

function limparPossivelFuncao(raw: string): string {
  return String(raw || "")
    .replace(/^(fun[cç][aã]o|cargo|ocupa[cç][aã]o|posto|profiss[aã]o)\s*[:\-#nº]*/i, "")
    .replace(/\b(data|setor|respondente|participante|question[aá]rio|id)\b.*$/i, "")
    .replace(/[|•·]+.*$/g, "")
    .replace(/\s{2,}.*/g, "")
    .replace(/^[\s:;\-–—#]+|[\s:;\-–—#]+$/g, "")
    .trim()
    .slice(0, 90);
}

function resolverFuncao(
  original: string,
  options: ImportOptions | undefined,
): { funcao?: string; mapping: FuncaoMapping } {
  const raw = limparPossivelFuncao(original);
  const funcoesSetor = (options?.funcoesSetor || []).filter((f) => f.nome?.trim());
  const confirmado = raw && options?.mapeamentosConfirmados?.[raw];
  if (confirmado) {
    return { funcao: confirmado, mapping: { original: raw, funcao: confirmado, score: 1, status: "confirmado" } };
  }

  if (!funcoesSetor.length) {
    const funcao = normalizarFuncaoLivre(raw || "Não informada");
    return { funcao, mapping: { original: raw || funcao, funcao, score: raw ? 0.8 : 0, status: raw ? "automatico" : "nao_identificada" } };
  }

  if (!raw) {
    return { mapping: { original: "Não identificada", status: "nao_identificada" } };
  }

  const candidatos = funcoesSetor
    .map((f) => ({ funcao: f.nome, score: Math.round(scoreFuncao(raw, f.nome) * 100) / 100 }))
    .sort((a, b) => b.score - a.score);
  const top = candidatos[0];
  const second = candidatos[1];

  if (!top || top.score < 0.68) {
    return { mapping: { original: raw, status: "fora_setor", candidatos: candidatos.slice(0, 3) } };
  }
  if (second && top.score < 0.93 && top.score - second.score < 0.12) {
    return { mapping: { original: raw, status: "ambigua", candidatos: candidatos.slice(0, 3) } };
  }
  return { funcao: top.funcao, mapping: { original: raw, funcao: top.funcao, score: top.score, status: "automatico", candidatos: candidatos.slice(0, 3) } };
}

function pushMappingOnce(lista: FuncaoMapping[], mapping: FuncaoMapping) {
  const key = `${mapping.original}|${mapping.funcao || ""}|${mapping.status}`;
  if (!lista.some((m) => `${m.original}|${m.funcao || ""}|${m.status}` === key)) lista.push(mapping);
}

// ─── Mapeamento textual → valor 0..100 ───
const MAP_TEXTO: { rx: RegExp; valor: number }[] = [
  { rx: /\b(sempre\s*ou\s*quase\s*sempre|quase\s*sempre|sempre)\b/i, valor: 100 },
  { rx: /\b(frequentemente|frequente|muitas\s+vezes)\b/i, valor: 75 },
  { rx: /\b(às\s*vezes|as\s*vezes|ocasionalmente|ocasional|algumas\s+vezes)\b/i, valor: 50 },
  { rx: /\b(raramente|quase\s+nunca|poucas\s+vezes)\b/i, valor: 25 },
  { rx: /\b(nunca)\b/i, valor: 0 },
  { rx: /\b(concordo\s+totalmente)\b/i, valor: 100 },
  { rx: /\b(concordo)\b/i, valor: 75 },
  { rx: /\b(neutro|indiferente)\b/i, valor: 50 },
  { rx: /\b(discordo\s+totalmente)\b/i, valor: 0 },
  { rx: /\b(discordo)\b/i, valor: 25 },
];

function normalizarValor(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v >= 0 && v <= 100 && v % 25 === 0) return v;
    if (v >= 1 && v <= 5) return Math.round(((v - 1) / 4) * 100 / 25) * 25;
    if (v >= 0 && v <= 4) return Math.round((v / 4) * 100 / 25) * 25;
    if (v >= 0 && v <= 10) return Math.round((v / 10) * 100 / 25) * 25;
    return null;
  }
  const s = String(v).trim();
  if (!s) return null;
  const num = Number(s.replace(",", "."));
  if (!Number.isNaN(num)) return normalizarValor(num);
  for (const m of MAP_TEXTO) if (m.rx.test(s)) return m.valor;
  return null;
}

function valorRespostaEmTexto(texto: string): number | null {
  const t = String(texto || "").trim();
  if (!t) return null;
  const marcada = t.match(/(?:☒|■|●|✓|✔|\[x\]|\(x\)|\bx\b)\s*(sempre\s*ou\s*quase\s*sempre|quase\s*sempre|sempre|frequentemente|frequente|muitas\s+vezes|às\s*vezes|as\s*vezes|ocasionalmente|raramente|quase\s+nunca|nunca|concordo\s+totalmente|concordo|neutro|discordo\s+totalmente|discordo)/i);
  if (marcada) return normalizarValor(marcada[1]);
  const explicita = t.match(/(?:resposta|alternativa|op[cç][aã]o|marcado)\s*[:\-–—]?\s*(sempre\s*ou\s*quase\s*sempre|quase\s*sempre|sempre|frequentemente|frequente|muitas\s+vezes|às\s*vezes|as\s*vezes|ocasionalmente|raramente|quase\s+nunca|nunca|concordo\s+totalmente|concordo|neutro|discordo\s+totalmente|discordo|100|75|50|25|0|[1-5])/i);
  if (explicita) return normalizarValor(explicita[1]);
  for (const m of MAP_TEXTO) if (m.rx.test(t)) return m.valor;
  const numFinal = t.match(/(?:resposta|alternativa|op[cç][aã]o)?\s*[:\-–—]?\s*\b(100|75|50|25|0|[1-5])\b\s*$/i);
  if (numFinal) return normalizarValor(Number(numFinal[1]));
  return null;
}

// ─── Identifica coluna de função / de nome ───
const RX_FUNCAO = /(fun[cç][aã]o|cargo|ocupa[cç][aã]o|posto|profiss[aã]o)/i;
const RX_NOME = /(nome|colaborador|respondente|funcion[aá]rio|participante)/i;
const RX_DATA = /(data|dt\.?)$/i;
const RX_ID_SISTEMA = /^(id|carimbo|timestamp|email|e-?mail|telefone|cpf|matr[ií]cula|idade|sexo|g[eê]nero)/i;

// ─── Mapeamento pergunta → pergunta/bloco por conteúdo ───
type PerguntaDef = { bloco: string; perguntaIdx: number; pergunta: string; norm: string };
const PERGUNTAS_COPSOQ: PerguntaDef[] = BLOCOS_COPSOQ.flatMap((b) =>
  b.perguntas.map((pergunta, perguntaIdx) => ({ bloco: b.key, perguntaIdx, pergunta, norm: normalizarTexto(pergunta) })),
);

const BLOCO_KEYWORDS: Record<string, RegExp[]> = {
  exigencias: [/exig[eê]nc|sobrecarga|ritmo|r[aá]pido|prazo|acúmul|acumul|emocion|mental/i],
  controle: [/controle|autonomia|decid|influ[eê]nc|pausas?|planej/i],
  apoio: [/apoio|colega|ajuda|equipe|superior|l[ií]der|comunica/i],
  reconhecimento: [/reconhec|valoriz|feedback|remunera|sal[aá]ri/i],
  seguranca: [/seguran[cç]a|emprego|inst[aá]vel|mudan[cç]a|previs/i],
  conflitos: [/conflito|ass[eé]dio|desrespe|discrim|viol[eê]nc/i],
  sintomas: [/estress|cansaço|cansaco|sono|dormir|ansiedad|irritab|dor de cabe|burnout|exaust/i],
};

function blocoDaPergunta(pergunta: string): string {
  for (const [key, rxs] of Object.entries(BLOCO_KEYWORDS)) {
    if (rxs.some((rx) => rx.test(pergunta))) return key;
  }
  return "";
}

function perguntaScore(texto: string, pergunta: PerguntaDef): number {
  const t = normalizarTexto(texto).replace(/\b(0|25|50|75|100|[1-5])\b/g, " ");
  if (!t) return 0;
  if (t.includes(pergunta.norm) || pergunta.norm.includes(t)) return 0.96;
  const tok = tokenOverlapScore(t, pergunta.norm);
  const lev = similaridadeTexto(t.slice(0, 160), pergunta.norm);
  const bloco = blocoDaPergunta(texto) === pergunta.bloco ? 0.08 : 0;
  return Math.min(1, tok * 0.6 + lev * 0.32 + bloco);
}

function identificarPergunta(texto: string): PerguntaDef | null {
  const candidatos = PERGUNTAS_COPSOQ
    .map((p) => ({ p, score: perguntaScore(texto, p) }))
    .sort((a, b) => b.score - a.score);
  const top = candidatos[0];
  const second = candidatos[1];
  if (!top || top.score < 0.48) return null;
  if (second && top.score < 0.82 && top.score - second.score < 0.08) return null;
  return top.p;
}

function extrairRespostaParaSegmento(segmentos: string[], idx: number): number | null {
  const atual = segmentos[idx] || "";
  const depoisInterrogacao = atual.includes("?") ? atual.split("?").slice(1).join("?") : "";
  const depoisSeparador = atual.match(/(?:resposta|alternativa|op[cç][aã]o)\s*[:\-–—].*$/i)?.[0]
    || atual.split(/[:\-–—]/).slice(1).join(" ");
  const candidatos = [depoisInterrogacao, depoisSeparador, segmentos[idx + 1] || "", segmentos[idx + 2] || ""];
  for (const c of candidatos) {
    const v = valorRespostaEmTexto(c);
    if (v !== null) return v;
  }
  const linhaCurta = atual.length < 90 ? valorRespostaEmTexto(atual) : null;
  return linhaCurta;
}

// ─── Parser principal ───
export async function importarArquivoPsicossocial(file: File, options?: ImportOptions): Promise<ImportResultado> {
  const nome = file.name.toLowerCase();
  if (nome.endsWith(".pdf")) return importarPdf(file, options);
  if (nome.endsWith(".xlsx") || nome.endsWith(".xls") || nome.endsWith(".csv")) return importarPlanilha(file, options);
  throw new Error("Formato de arquivo não suportado. Use .xlsx, .xls, .csv ou .pdf.");
}

async function importarPlanilha(file: File, options?: ImportOptions): Promise<ImportResultado> {
  const nome = file.name.toLowerCase();
  let wb: XLSX.WorkBook;
  if (nome.endsWith(".csv")) {
    // Leitura CSV com autodetecção de separador (vírgula, ponto e vírgula ou tabulação)
    // e suporte a acentuação (UTF-8 / Latin-1).
    let txt = await file.text();
    // Remove BOM
    if (txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1);
    wb = XLSX.read(txt, { type: "string", raw: false });
  } else {
    const buf = await file.arrayBuffer();
    wb = XLSX.read(buf, { type: "array" });
  }
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Planilha vazia.");
  const sheet = wb.Sheets[sheetName];
  const linhas: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  if (linhas.length < 2) throw new Error("Planilha sem dados suficientes.");


  let headerIdx = 0;
  let melhor = 0;
  for (let i = 0; i < Math.min(8, linhas.length); i++) {
    const strCount = linhas[i].filter((c) => typeof c === "string" && c.trim().length > 2).length;
    if (strCount > melhor) { melhor = strCount; headerIdx = i; }
  }
  const header: string[] = linhas[headerIdx].map((c) => String(c ?? "").trim());
  const dados = linhas.slice(headerIdx + 1).filter((r) => r.some((c) => c !== "" && c !== null));

  type ColDef = { idx: number; nome: string; tipo: "funcao" | "nome" | "data" | "pergunta" | "ignorar"; bloco?: string; perguntaIdx?: number };
  const colunas: ColDef[] = header.map((h, i) => {
    if (!h) return { idx: i, nome: h, tipo: "ignorar" };
    if (RX_FUNCAO.test(h)) return { idx: i, nome: h, tipo: "funcao" };
    if (RX_NOME.test(h)) return { idx: i, nome: h, tipo: "nome" };
    if (RX_DATA.test(h)) return { idx: i, nome: h, tipo: "data" };
    if (RX_ID_SISTEMA.test(h)) return { idx: i, nome: h, tipo: "ignorar" };
    const q = identificarPergunta(h);
    if (q) return { idx: i, nome: h, tipo: "pergunta", bloco: q.bloco, perguntaIdx: q.perguntaIdx };
    return { idx: i, nome: h, tipo: "pergunta", bloco: blocoDaPergunta(h) };
  });

  const perguntasCols = colunas.filter((c) => c.tipo === "pergunta");
  const semBloco = perguntasCols.filter((c) => !c.bloco);
  if (semBloco.length && perguntasCols.length) {
    const seq: { bloco: string; perguntaIdx: number }[] = [];
    for (const b of BLOCOS_COPSOQ) for (let i = 0; i < b.perguntas.length; i++) seq.push({ bloco: b.key, perguntaIdx: i });
    perguntasCols.forEach((c, i) => {
      if (!c.bloco) {
        const pos = Math.floor((i / perguntasCols.length) * seq.length);
        c.bloco = seq[Math.min(pos, seq.length - 1)].bloco;
        c.perguntaIdx = seq[Math.min(pos, seq.length - 1)].perguntaIdx;
      }
    });
  }

  const colunasIgnoradas = colunas.filter((c) => c.tipo === "ignorar" && c.nome).map((c) => c.nome);
  const avisos: ImportWarning[] = [];
  const mapeamentosFuncoes: FuncaoMapping[] = [];
  const funcoesEncontradas = new Set<string>();
  const avaliacoes: AvaliacaoPsicossocial[] = [];
  let totalPerguntasReconhecidas = 0;

  for (let li = 0; li < dados.length; li++) {
    const row = dados[li];
    const av = emptyPsicossocial();
    for (const b of BLOCOS_COPSOQ) av.respostas[b.key] = new Array(b.perguntas.length).fill(-1);

    let funcaoRaw = "";
    let contagemRespostas = 0;

    for (const col of colunas) {
      const cell = row[col.idx];
      if (col.tipo === "funcao") {
        const v = String(cell ?? "").trim();
        if (v) funcaoRaw = v;
      } else if (col.tipo === "data") {
        const v = String(cell ?? "").trim();
        if (v) av.data_avaliacao = normalizarData(v) || av.data_avaliacao;
      } else if (col.tipo === "pergunta" && col.bloco) {
        const valor = normalizarValor(cell);
        if (valor !== null) {
          if (typeof col.perguntaIdx === "number") av.respostas[col.bloco][col.perguntaIdx] = valor;
          else av.respostas[col.bloco].push(valor);
          contagemRespostas++;
        }
      }
    }

    if (contagemRespostas < 3) {
      avisos.push({ linha: headerIdx + 2 + li, mensagem: "Linha ignorada por não conter respostas suficientes." });
      continue;
    }

    const { funcao, mapping } = resolverFuncao(funcaoRaw || "Não informada", options);
    pushMappingOnce(mapeamentosFuncoes, mapping);
    if (!funcao) {
      avisos.push({ linha: headerIdx + 2 + li, mensagem: `Função "${mapping.original}" não foi associada às funções selecionadas do setor.` });
      continue;
    }

    av.colaborador_nome = "";
    av.funcao = funcao;
    funcoesEncontradas.add(funcao);
    totalPerguntasReconhecidas += contagemRespostas;
    avaliacoes.push(calcularPsicossocial(av));
  }

  return montarResultado({ avaliacoes, totalPerguntasReconhecidas, colunasIgnoradas, funcoesEncontradas, avisos, mapeamentosFuncoes });
}

function normalizarData(v: string): string | null {
  const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = "20" + y;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return null;
}

function montarResultado(base: Omit<ImportResultado, "totalRespondentes" | "funcoesEncontradas" | "ambiguidadesFuncoes" | "funcoesIgnoradas"> & { funcoesEncontradas: Set<string> }): ImportResultado {
  const ambiguidadesFuncoes = (base.mapeamentosFuncoes || []).filter((m) => m.status === "ambigua");
  const funcoesIgnoradas = (base.mapeamentosFuncoes || [])
    .filter((m) => m.status === "fora_setor" || m.status === "nao_identificada")
    .map((m) => m.original);
  return {
    ...base,
    totalRespondentes: base.avaliacoes.length,
    funcoesEncontradas: Array.from(base.funcoesEncontradas).sort(),
    ambiguidadesFuncoes,
    funcoesIgnoradas,
  };
}

// ─── Parser robusto de PDF ───
const MAX_PAGINAS_PDF = 50;

async function extrairTextoPagina(page: any): Promise<string> {
  const content = await page.getTextContent();
  if (!content.items?.length) return "";
  const items = content.items
    .map((it: any) => ({ str: it.str as string, x: it.transform?.[4] ?? 0, y: it.transform?.[5] ?? 0 }))
    .filter((it: any) => it.str && it.str.trim());
  if (!items.length) return "";
  items.sort((a: any, b: any) => (b.y - a.y) || (a.x - b.x));
  const linhas: string[] = [];
  let atualY: number | null = null;
  let buf: string[] = [];
  for (const it of items) {
    if (atualY === null || Math.abs(it.y - atualY) < 3) {
      buf.push(it.str);
      atualY = atualY ?? it.y;
    } else {
      linhas.push(buf.join(" ").replace(/\s+/g, " ").trim());
      buf = [it.str];
      atualY = it.y;
    }
  }
  if (buf.length) linhas.push(buf.join(" ").replace(/\s+/g, " ").trim());
  return linhas.filter(Boolean).join("\n");
}

async function ocrPagina(page: any, Tesseract: any): Promise<string> {
  try {
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    await page.render({ canvasContext: ctx, viewport }).promise;
    const { data } = await Tesseract.recognize(canvas, "por+eng");
    return String(data?.text || "");
  } catch {
    return "";
  }
}

function extrairFuncaoDoBloco(bloco: string, options?: ImportOptions): string {
  const linhas = bloco.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const rotulos = [
    /Fun[cç][aã]o\s*[:\-–—#nº]?\s*([^\n\r|]{2,100})/i,
    /Cargo\s*[:\-–—#nº]?\s*([^\n\r|]{2,100})/i,
    /Ocupa[cç][aã]o\s*[:\-–—#nº]?\s*([^\n\r|]{2,100})/i,
    /Profiss[aã]o\s*[:\-–—#nº]?\s*([^\n\r|]{2,100})/i,
  ];
  for (const rx of rotulos) {
    const m = bloco.match(rx);
    if (m?.[1]) return limparPossivelFuncao(m[1]);
  }

  const funcoes = options?.funcoesSetor || [];
  if (funcoes.length) {
    const candidatos: { linha: string; score: number }[] = [];
    for (const linha of linhas.slice(0, 35)) {
      const limpa = limparPossivelFuncao(linha);
      if (!limpa || limpa.length < 3 || /nome|cpf|email|telefone|data|empresa|setor/i.test(limpa)) continue;
      const score = Math.max(...funcoes.map((f) => scoreFuncao(limpa, f.nome)));
      if (score >= 0.72) candidatos.push({ linha: limpa, score });
    }
    candidatos.sort((a, b) => b.score - a.score);
    if (candidatos[0]) return candidatos[0].linha;
  }
  return "Não informada";
}

function splitRespondentes(textoCompleto: string): string[] {
  const texto = textoCompleto.replace(/\r/g, "\n");
  const rx = /(?=(?:^|\n)\s*(?:Respondente|Participante|Question[aá]rio|ID\s*(?:do)?\s*respondente)\s*[:\-#nº\d]|(?:^|\n)\s*(?:Fun[cç][aã]o|Cargo|Ocupa[cç][aã]o|Profiss[aã]o)\s*[:\-–—#nº])/gim;
  let blocos = texto.split(rx).map((b) => b.trim()).filter((b) => b.length > 40);
  if (blocos.length <= 1) blocos = [texto.trim()].filter(Boolean);
  return blocos;
}

async function importarPdf(file: File, options?: ImportOptions): Promise<ImportResultado> {
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerUrl: string = (await import("pdfjs-dist/legacy/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  const totalPaginas = Math.min(doc.numPages, MAX_PAGINAS_PDF);
  const avisos: ImportWarning[] = [];
  const paginasComFalha: number[] = [];
  const paginasOcr: number[] = [];
  const textosPorPagina: string[] = [];
  let Tesseract: any = null;

  if (doc.numPages > MAX_PAGINAS_PDF) {
    avisos.push({ mensagem: `PDF possui ${doc.numPages} páginas; processadas as primeiras ${MAX_PAGINAS_PDF}.` });
  }

  for (let p = 1; p <= totalPaginas; p++) {
    try {
      const pg = await doc.getPage(p);
      let txt = await extrairTextoPagina(pg);
      if (txt.replace(/\s/g, "").length < 30) {
        if (!Tesseract) {
          try {
            const mod: any = await import("tesseract.js");
            Tesseract = mod.default || mod;
          } catch {
            avisos.push({ pagina: p, mensagem: "Página sem texto pesquisável e OCR indisponível." });
          }
        }
        if (Tesseract) {
          const ocrTxt = await ocrPagina(pg, Tesseract);
          if (ocrTxt.trim().length > txt.length) {
            txt = ocrTxt;
            paginasOcr.push(p);
          }
        }
      }
      textosPorPagina.push(txt || "");
      if (!txt.trim()) {
        paginasComFalha.push(p);
        avisos.push({ pagina: p, mensagem: "Página sem conteúdo interpretável." });
      }
    } catch (e: any) {
      paginasComFalha.push(p);
      avisos.push({ pagina: p, mensagem: `Falha ao ler página: ${e?.message || "erro desconhecido"}` });
      textosPorPagina.push("");
    }
  }

  const textoCompleto = textosPorPagina.join("\n\n");
  const blocos = splitRespondentes(textoCompleto);
  const avaliacoes: AvaliacaoPsicossocial[] = [];
  const funcoesEncontradas = new Set<string>();
  const mapeamentosFuncoes: FuncaoMapping[] = [];
  let totalPerguntasReconhecidas = 0;

  for (const bloco of blocos) {
    const funcaoRaw = extrairFuncaoDoBloco(bloco, options);
    const { funcao, mapping } = resolverFuncao(funcaoRaw, options);
    pushMappingOnce(mapeamentosFuncoes, mapping);
    if (!funcao) {
      avisos.push({ mensagem: `Função "${mapping.original}" ignorada por não pertencer ao setor selecionado ou exigir confirmação.` });
      continue;
    }

    const av = emptyPsicossocial();
    for (const b of BLOCOS_COPSOQ) av.respostas[b.key] = new Array(b.perguntas.length).fill(-1);
    const segmentos = bloco
      .split(/\n+|(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9])/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 3);

    let count = 0;
    for (let i = 0; i < segmentos.length; i++) {
      const janelaPergunta = [segmentos[i], segmentos[i + 1] || ""].join(" ");
      const pergunta = identificarPergunta(janelaPergunta) || identificarPergunta(segmentos[i]);
      if (!pergunta) continue;
      const valor = extrairRespostaParaSegmento(segmentos, i);
      if (valor !== null && av.respostas[pergunta.bloco][pergunta.perguntaIdx] < 0) {
        av.respostas[pergunta.bloco][pergunta.perguntaIdx] = valor;
        count++;
      }
    }

    if (count < 3) continue;
    av.colaborador_nome = "";
    av.funcao = funcao;
    funcoesEncontradas.add(funcao);
    totalPerguntasReconhecidas += count;
    avaliacoes.push(calcularPsicossocial(av));
  }

  if (!avaliacoes.length) {
    avisos.push({ mensagem: "Não foi possível reconhecer respostas suficientes neste PDF. Verifique se o arquivo contém perguntas/respostas do COPSOQ ou confirme os mapeamentos de função indicados." });
  }

  return montarResultado({
    avaliacoes,
    totalPerguntasReconhecidas,
    colunasIgnoradas: [],
    funcoesEncontradas,
    avisos,
    paginasProcessadas: totalPaginas,
    paginasComFalha,
    paginasOcr,
    mapeamentosFuncoes,
  });
}