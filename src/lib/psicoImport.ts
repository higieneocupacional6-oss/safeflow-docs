// Importador automático de respostas COPSOQ a partir de planilhas (.xlsx/.xls) e PDFs.
// Objetivo: transformar um arquivo bruto em uma lista de AvaliacaoPsicossocial
// já anonimizada (sem nomes) e agrupável por função.
import * as XLSX from "xlsx";
import {
  BLOCOS_COPSOQ,
  calcularPsicossocial,
  emptyPsicossocial,
  type AvaliacaoPsicossocial,
} from "@/components/PsicossocialModal";

export type ImportWarning = { linha?: number; pagina?: number; mensagem: string };
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
};

// ─── Mapeamento textual → valor 0..100 ───
const MAP_TEXTO: { rx: RegExp; valor: number }[] = [
  { rx: /nunca/i, valor: 0 },
  { rx: /raramente|quase nunca/i, valor: 25 },
  { rx: /(às|as)\s*vezes|(as|às)vezes|ocasional/i, valor: 50 },
  { rx: /frequente|frequentemente|muitas vezes/i, valor: 75 },
  { rx: /sempre|sempre\s*ou\s*quase/i, valor: 100 },
  // Escala positiva/negativa alternativa
  { rx: /discordo totalmente/i, valor: 0 },
  { rx: /discordo/i, valor: 25 },
  { rx: /neutro|indiferente/i, valor: 50 },
  { rx: /concordo totalmente/i, valor: 100 },
  { rx: /concordo/i, valor: 75 },
];

function normalizarValor(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    // 0..100 já normalizado
    if (v >= 0 && v <= 100 && v % 25 === 0) return v;
    // Escala 1..5
    if (v >= 1 && v <= 5) return Math.round(((v - 1) / 4) * 100 / 25) * 25;
    // Escala 0..4
    if (v >= 0 && v <= 4) return Math.round((v / 4) * 100 / 25) * 25;
    // Escala 0..10
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

// ─── Identifica coluna de função / de nome ───
const RX_FUNCAO = /(fun[cç][aã]o|cargo|ocupa[cç][aã]o|posto|profiss[aã]o)/i;
const RX_NOME = /(nome|colaborador|respondente|funcion[aá]rio|participante)/i;
const RX_DATA = /(data|dt\.?)/i;
const RX_ID_SISTEMA = /^(id|carimbo|timestamp|email|e-?mail|telefone|cpf|matr[ií]cula|idade|sexo|g[eê]nero)/i;

// ─── Mapeamento pergunta → bloco por palavras-chave ───
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

// ─── Parser principal de planilha ───
export async function importarArquivoPsicossocial(file: File): Promise<ImportResultado> {
  const nome = file.name.toLowerCase();
  if (nome.endsWith(".pdf")) return importarPdf(file);
  if (nome.endsWith(".xlsx") || nome.endsWith(".xls")) return importarPlanilha(file);
  throw new Error("Formato de arquivo não suportado. Use .xlsx, .xls ou .pdf.");
}

async function importarPlanilha(file: File): Promise<ImportResultado> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Planilha vazia.");
  const sheet = wb.Sheets[sheetName];
  const linhas: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  if (linhas.length < 2) throw new Error("Planilha sem dados suficientes.");

  // Detecta linha de cabeçalho (a que tem mais palavras não vazias)
  let headerIdx = 0;
  let melhor = 0;
  for (let i = 0; i < Math.min(6, linhas.length); i++) {
    const strCount = linhas[i].filter((c) => typeof c === "string" && c.trim().length > 2).length;
    if (strCount > melhor) { melhor = strCount; headerIdx = i; }
  }
  const header: string[] = linhas[headerIdx].map((c) => String(c ?? "").trim());
  const dados = linhas.slice(headerIdx + 1).filter((r) => r.some((c) => c !== "" && c !== null));

  // Classifica cada coluna
  type ColDef = { idx: number; nome: string; tipo: "funcao" | "nome" | "data" | "pergunta" | "ignorar"; bloco?: string };
  const colunas: ColDef[] = header.map((h, i) => {
    if (!h) return { idx: i, nome: h, tipo: "ignorar" };
    if (RX_FUNCAO.test(h)) return { idx: i, nome: h, tipo: "funcao" };
    if (RX_NOME.test(h)) return { idx: i, nome: h, tipo: "nome" };
    if (RX_DATA.test(h)) return { idx: i, nome: h, tipo: "data" };
    if (RX_ID_SISTEMA.test(h)) return { idx: i, nome: h, tipo: "ignorar" };
    return { idx: i, nome: h, tipo: "pergunta", bloco: blocoDaPergunta(h) };
  });

  // Distribuição automática para perguntas sem bloco identificado — ordem dos blocos
  const perguntasCols = colunas.filter((c) => c.tipo === "pergunta");
  const semBloco = perguntasCols.filter((c) => !c.bloco);
  if (semBloco.length && perguntasCols.length) {
    // Se maioria das perguntas não foi classificada, distribui proporcionalmente
    if (semBloco.length > perguntasCols.length / 2) {
      const totalPerguntasCopsoq = BLOCOS_COPSOQ.reduce((a, b) => a + b.perguntas.length, 0);
      const seq: string[] = [];
      for (const b of BLOCOS_COPSOQ) for (let i = 0; i < b.perguntas.length; i++) seq.push(b.key);
      perguntasCols.forEach((c, i) => {
        if (!c.bloco) {
          const pos = Math.floor((i / perguntasCols.length) * totalPerguntasCopsoq);
          c.bloco = seq[Math.min(pos, seq.length - 1)];
        }
      });
    } else {
      // Poucas sem bloco → joga na dimensão "exigencias" (neutro) só p/ não perder
      for (const c of semBloco) c.bloco = "exigencias";
    }
  }

  const colunasIgnoradas = colunas
    .filter((c) => c.tipo === "ignorar" && c.nome)
    .map((c) => c.nome);
  const avisos: ImportWarning[] = [];
  const funcoesEncontradas = new Set<string>();
  const avaliacoes: AvaliacaoPsicossocial[] = [];
  let totalPerguntasReconhecidas = 0;

  for (let li = 0; li < dados.length; li++) {
    const row = dados[li];
    const av = emptyPsicossocial();
    // Zera respostas
    for (const b of BLOCOS_COPSOQ) av.respostas[b.key] = [];

    let funcao = "";
    let contagemRespostas = 0;

    for (const col of colunas) {
      const cell = row[col.idx];
      if (col.tipo === "funcao") {
        const v = String(cell ?? "").trim();
        if (v) funcao = v;
      } else if (col.tipo === "data") {
        const v = String(cell ?? "").trim();
        if (v) av.data_avaliacao = normalizarData(v) || av.data_avaliacao;
      } else if (col.tipo === "pergunta" && col.bloco) {
        const valor = normalizarValor(cell);
        if (valor !== null) {
          av.respostas[col.bloco].push(valor);
          contagemRespostas++;
        } else {
          av.respostas[col.bloco].push(-1);
        }
      }
      // "nome" é intencionalmente ignorado (anonimização)
    }

    if (contagemRespostas < 3) {
      avisos.push({ linha: headerIdx + 2 + li, mensagem: "Linha ignorada por não conter respostas suficientes." });
      continue;
    }

    // Remove marcadores -1 do final para não distorcer médias
    for (const b of BLOCOS_COPSOQ) {
      av.respostas[b.key] = (av.respostas[b.key] || []).filter((v) => v >= 0);
      if (!av.respostas[b.key].length) av.respostas[b.key] = [];
    }

    av.colaborador_nome = ""; // anonimizado
    av.funcao = funcao || "Não informada";
    funcoesEncontradas.add(av.funcao);
    totalPerguntasReconhecidas += contagemRespostas;
    avaliacoes.push(calcularPsicossocial(av));
  }

  return {
    avaliacoes,
    totalRespondentes: avaliacoes.length,
    totalPerguntasReconhecidas,
    colunasIgnoradas,
    funcoesEncontradas: Array.from(funcoesEncontradas).sort(),
    avisos,
  };
}

function normalizarData(v: string): string | null {
  // dd/mm/aaaa → aaaa-mm-dd
  const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    let [_, d, mo, y] = m;
    if (y.length === 2) y = "20" + y;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return null;
}

// ─── Parser robusto de PDF ───
// - Extrai texto por página preservando quebras de linha (via posição Y dos itens).
// - Aplica OCR (tesseract.js — pt+eng) automaticamente em páginas sem texto pesquisável.
// - Processa até 50 páginas; nunca aborta o documento por causa de uma página falha.
// - Reconhece múltiplos respondentes por marcadores (Função/Cargo/Respondente/ID).
const MAX_PAGINAS_PDF = 50;

async function extrairTextoPagina(page: any): Promise<string> {
  const content = await page.getTextContent();
  if (!content.items?.length) return "";
  // Ordena itens por Y desc, X asc para reconstruir linhas
  const items = content.items
    .map((it: any) => ({
      str: it.str as string,
      x: it.transform?.[4] ?? 0,
      y: it.transform?.[5] ?? 0,
    }))
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

async function importarPdf(file: File): Promise<ImportResultado> {
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
      // Fallback OCR quando a página não possui texto pesquisável útil
      if (txt.replace(/\s/g, "").length < 30) {
        if (!Tesseract) {
          try { Tesseract = await import("tesseract.js"); } catch {
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

  // Divide em respondentes: quebra por marcadores comuns
  const RX_SPLIT = /(?=(?:Fun[cç][aã]o|Cargo|Respondente|Participante|Colaborador|ID\s*(?:do)?\s*respondente|Question[aá]rio)\s*[:\-#nº]?\s*)/i;
  let blocos = textoCompleto.split(RX_SPLIT).map((b) => b.trim()).filter((b) => b.length > 40);
  if (blocos.length <= 1) {
    // fallback: usa o documento inteiro como um único respondente
    blocos = [textoCompleto];
  }

  const avaliacoes: AvaliacaoPsicossocial[] = [];
  const funcoesEncontradas = new Set<string>();
  let totalPerguntasReconhecidas = 0;

  for (const bloco of blocos) {
    const mFun =
      bloco.match(/Fun[cç][aã]o\s*[:\-]\s*([^\n\r|]+?)(?:\s{2,}|$|\n)/i) ||
      bloco.match(/Cargo\s*[:\-]\s*([^\n\r|]+?)(?:\s{2,}|$|\n)/i) ||
      bloco.match(/Ocupa[cç][aã]o\s*[:\-]\s*([^\n\r|]+?)(?:\s{2,}|$|\n)/i);
    const funcao = (mFun?.[1] || "Não informada").trim().slice(0, 80);

    const av = emptyPsicossocial();
    for (const b of BLOCOS_COPSOQ) av.respostas[b.key] = [];

    // Divide em segmentos (linhas ou sentenças) e tenta casar pergunta+resposta
    const segmentos = bloco
      .split(/\n+|(?<=[\.?!])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9])/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 5);

    let count = 0;
    for (let i = 0; i < segmentos.length; i++) {
      const linha = segmentos[i];
      const blocoKey = blocoDaPergunta(linha);
      if (!blocoKey) continue;
      // Busca resposta na mesma linha ou nas próximas 2
      const janela = [linha, segmentos[i + 1] || "", segmentos[i + 2] || ""].join(" ");
      let valor: number | null = null;
      for (const m of MAP_TEXTO) if (m.rx.test(janela)) { valor = m.valor; break; }
      if (valor === null) {
        const num = janela.match(/\b(0|25|50|75|100|[1-5])\b/);
        if (num) valor = normalizarValor(Number(num[1]));
      }
      if (valor !== null) {
        av.respostas[blocoKey].push(valor);
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
    avisos.push({ mensagem: "Não foi possível reconhecer respostas neste PDF. Verifique se o arquivo contém as perguntas e respostas do COPSOQ ou prefira exportar em Excel." });
  }

  return {
    avaliacoes,
    totalRespondentes: avaliacoes.length,
    totalPerguntasReconhecidas,
    colunasIgnoradas: [],
    funcoesEncontradas: Array.from(funcoesEncontradas).sort(),
    avisos,
    paginasProcessadas: totalPaginas,
    paginasComFalha,
    paginasOcr,
  };
}
