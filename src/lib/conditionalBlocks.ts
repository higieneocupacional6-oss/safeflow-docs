/**
 * Blocos condicionais nos templates LTCAT e Laudo de Insalubridade.
 *
 * Marcadores no template (texto simples, sem chaves Mustache), cada um em
 * seu próprio parágrafo:
 *
 *   #inicio_texto_risco_<chave>
 *   ... conteúdo (títulos, textos, tabelas, imagens) ...
 *   #fim_texto_risco_<chave>
 *
 * Quando o risco correspondente NÃO existe no cadastro, TUDO entre os
 * marcadores é removido — parágrafos, tabelas, imagens, quebras de linha
 * e quebras de página — sem deixar espaços em branco no documento final.
 *
 * Quando o risco existe, apenas os próprios marcadores são apagados.
 *
 * Chaves suportadas:
 *   ruido                      → Físico + Ruído + Quantitativo
 *   calor                      → Físico + Calor + Quantitativo
 *   vci                        → Físico + Vibração Corpo Inteiro + Quantitativo
 *   vmb                        → Físico + Vibração Mãos e Braços + Quantitativo
 *   radiacao_nao_ionizante     → Físico + Radiação Não Ionizante
 *   poeira_silica              → Químico + Poeira/Sílica + Quantitativo
 *   quimico_quantitativo       → Qualquer Químico Quantitativo
 *   quimico_qualitativo        → Qualquer Químico Qualitativo
 *   biologico                  → Biológico + Qualitativo
 */

import PizZip from "pizzip";

const BLOCK_KEYS = [
  "risco_ruido",
  "risco_calor",
  "risco_vci",
  "risco_vmb",
  "risco_radiacao_nao_ionizante",
  "risco_poeira_silica",
  "risco_quimico_quantitativo",
  "risco_quimico_qualitativo",
  "risco_biologico",
] as const;

export type ConditionalBlockKey = (typeof BLOCK_KEYS)[number];

function norm(s: any): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Determina quais blocos devem permanecer no documento. */
export function computePresentBlocks(templateData: any): Set<string> {
  const present = new Set<string>();
  const setores = Array.isArray(templateData?.setores) ? templateData.setores : [];
  const allRiscos: any[] = setores.flatMap((s: any) => s?.riscos || []);

  for (const r of allRiscos) {
    const nome = norm(r?.agente_nome);
    const isQuant = !!r?.is_quantitativo;
    const isQual = !!r?.is_qualitativo;
    const isFisico = !!(r?.is_fisico || r?.is_agente_fisico);
    const isQuimico = !!(r?.is_quimico || r?.is_agente_quimico);
    const isBiologico = !!(r?.is_biologico || r?.is_agente_biologico);
    const isRadNaoIon =
      !!r?.is_radiacao_nao_ionizante ||
      (nome.includes("radiac") && nome.includes("nao") && nome.includes("ioniz")) ||
      (nome.includes("radiac") && nome.includes("n.ion"));

    if (isFisico && isQuant && !!r?.is_ruido) present.add("risco_ruido");
    if (isFisico && isQuant && !!r?.is_calor) present.add("risco_calor");
    if (isFisico && isQuant && !!r?.is_vibracao_corpo_inteiro) present.add("risco_vci");
    if (isFisico && isQuant && !!r?.is_vibracao_maos_bracos) present.add("risco_vmb");
    if (isFisico && isRadNaoIon) present.add("risco_radiacao_nao_ionizante");

    if (isQuimico && isQuant) {
      present.add("risco_quimico_quantitativo");
      if (nome.includes("poeira") && nome.includes("silic")) {
        present.add("risco_poeira_silica");
      }
    }
    if (isQuimico && isQual) present.add("risco_quimico_qualitativo");
    if (isBiologico && isQual) present.add("risco_biologico");
  }

  return present;
}

// ─────────────────────────────── HTML ───────────────────────────────

/** Remove blocos condicionais de um template HTML (string). */
export function stripConditionalBlocksHtml(html: string, present: Set<string>): string {
  let out = html;

  for (const key of BLOCK_KEYS) {
    if (present.has(key)) continue;
    const shortKey = key.replace(/^risco_/, "");
    const patterns = [key, `risco_${shortKey}`];
    for (const p of patterns) {
      const re = new RegExp(
        `#inicio_texto_${p}[\\s\\S]*?#fim_texto_${p}`,
        "gi",
      );
      out = out.replace(re, "");
    }
  }

  // Remove marcadores residuais (blocos que permaneceram).
  out = out.replace(/#(?:inicio|fim)_texto_[a-z0-9_]+/gi, "");
  // Limpa parágrafos vazios que sobraram.
  out = out.replace(/<p[^>]*>\s*<\/p>/gi, "");
  return out;
}

// ─────────────────────────────── DOCX ───────────────────────────────

/** Concatena texto visível de um `<w:p>` a partir dos `<w:t>` filhos. */
function paragraphText(p: Element): string {
  const ts = p.getElementsByTagNameNS("*", "t");
  let text = "";
  for (let i = 0; i < ts.length; i++) text += ts[i].textContent || "";
  return text;
}

/**
 * Remove uma substring do parágrafo, mesmo se ela estiver dividida em
 * múltiplos `<w:t>`. Reescreve os `<w:t>` mantendo apenas o primeiro com
 * o texto restante.
 */
function stripSubstringFromParagraph(p: Element, needle: RegExp) {
  const ts = Array.from(p.getElementsByTagNameNS("*", "t"));
  if (ts.length === 0) return;
  const joined = ts.map((t) => t.textContent || "").join("");
  if (!needle.test(joined)) return;
  const remaining = joined.replace(needle, "");
  ts[0].textContent = remaining;
  for (let i = 1; i < ts.length; i++) ts[i].textContent = "";
}

/**
 * Remove nós irmãos consecutivos entre `startNode` e `endNode` (inclusive),
 * ignorando estruturas do `<w:sectPr>` para não quebrar a paginação do docx.
 */
function removeSiblingsRange(startNode: Node, endNode: Node) {
  const parent = startNode.parentNode;
  if (!parent) return;
  const toRemove: Node[] = [];
  let cur: Node | null = startNode;
  while (cur) {
    toRemove.push(cur);
    if (cur === endNode) break;
    cur = cur.nextSibling;
  }
  // Preserva o <w:sectPr> (definições de seção) caso esteja no meio.
  for (const n of toRemove) {
    if (
      n.nodeType === 1 &&
      ((n as Element).localName === "sectPr" ||
        (n as Element).tagName?.endsWith(":sectPr"))
    ) {
      continue;
    }
    parent.removeChild(n);
  }
}

/**
 * Localiza o "nó bloco" (parágrafo ou tabela) que é irmão direto do
 * primeiro ancestral comum a startPara/endPara. Subir na árvore garante
 * que, se os marcadores estiverem em parágrafos aninhados dentro de uma
 * célula de tabela, ainda assim removemos a tabela inteira.
 */
function ascendToCommonBlock(startPara: Element, endPara: Element): [Node, Node] | null {
  // Coleta cadeia de ancestrais do endPara.
  const endAncestors = new Set<Node>();
  let n: Node | null = endPara;
  while (n) {
    endAncestors.add(n);
    n = n.parentNode;
  }
  // Sobe a partir do startPara até encontrar um ancestral comum.
  let s: Node | null = startPara;
  let sChild: Node = startPara;
  while (s) {
    const parent = s.parentNode;
    if (!parent) return null;
    if (endAncestors.has(parent)) {
      // Encontra o filho do 'parent' que contém endPara.
      let eChild: Node = endPara;
      while (eChild.parentNode && eChild.parentNode !== parent) {
        eChild = eChild.parentNode;
      }
      return [sChild, eChild];
    }
    sChild = s;
    s = parent;
  }
  return null;
}

/** Aplica remoção de blocos e limpeza de marcadores em um XML de documento. */
function stripConditionalBlocksInXml(xml: string, present: Set<string>): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) return xml;

  const startRe = /#inicio_texto_([a-z0-9_]+)/i;
  const endRe = /#fim_texto_([a-z0-9_]+)/i;
  const startReG = /#inicio_texto_[a-z0-9_]+/gi;
  const endReG = /#fim_texto_[a-z0-9_]+/gi;

  // Coleta todos os parágrafos e mapeia marcadores presentes.
  const paras = Array.from(doc.getElementsByTagNameNS("*", "p")) as Element[];

  interface Marker { key: string; para: Element; index: number; }
  const starts: Marker[] = [];
  const ends: Marker[] = [];
  paras.forEach((p, i) => {
    const text = paragraphText(p);
    const sm = text.match(startRe);
    if (sm) starts.push({ key: sm[1].toLowerCase(), para: p, index: i });
    const em = text.match(endRe);
    if (em) ends.push({ key: em[1].toLowerCase(), para: p, index: i });
  });

  // Emparelha start↔end (mesma chave, end após start, mais próximo).
  const usedEnds = new Set<number>();
  interface Pair { key: string; start: Element; end: Element; }
  const pairs: Pair[] = [];
  for (const s of starts) {
    const match = ends.find(
      (e) => e.key === s.key && e.index >= s.index && !usedEnds.has(e.index),
    );
    if (match) {
      usedEnds.add(match.index);
      pairs.push({ key: s.key, start: s.para, end: match.para });
    }
  }

  // Aplica remoções para blocos NÃO presentes.
  for (const { key, start, end } of pairs) {
    if (present.has(key)) continue;
    if (start === end) {
      start.parentNode?.removeChild(start);
      continue;
    }
    const common = ascendToCommonBlock(start, end);
    if (!common) continue;
    removeSiblingsRange(common[0], common[1]);
  }

  // Para os blocos que permaneceram, remove apenas os marcadores.
  const remainingParas = Array.from(doc.getElementsByTagNameNS("*", "p")) as Element[];
  for (const p of remainingParas) {
    const text = paragraphText(p);
    if (startReG.test(text)) {
      stripSubstringFromParagraph(p, /#inicio_texto_[a-z0-9_]+/gi);
    }
    startReG.lastIndex = 0;
    if (endReG.test(text)) {
      stripSubstringFromParagraph(p, /#fim_texto_[a-z0-9_]+/gi);
    }
    endReG.lastIndex = 0;
    // Remove parágrafo que ficou totalmente vazio após limpar marcadores.
    const finalText = paragraphText(p).trim();
    const hasDrawing = p.getElementsByTagNameNS("*", "drawing").length > 0;
    const hasBreak = p.getElementsByTagNameNS("*", "br").length > 0;
    if (!finalText && !hasDrawing && !hasBreak) {
      // só remove se realmente sobrou de um marcador residual (para
      // não apagar parágrafos vazios usados para espaçamento intencional
      // que já continham marcadores antes)
      if (text.match(startRe) || text.match(endRe)) {
        p.parentNode?.removeChild(p);
      }
    }
  }

  return new XMLSerializer().serializeToString(doc);
}

/** Recebe um Blob .docx renderizado e devolve outro Blob com blocos removidos. */
export async function stripConditionalBlocksDocx(
  docxBlob: Blob,
  present: Set<string>,
): Promise<Blob> {
  try {
    const buf = await docxBlob.arrayBuffer();
    const zip = new PizZip(buf);

    const targets = [
      "word/document.xml",
      "word/header1.xml", "word/header2.xml", "word/header3.xml",
      "word/footer1.xml", "word/footer2.xml", "word/footer3.xml",
    ];
    for (const name of targets) {
      const file = zip.file(name);
      if (!file) continue;
      const xml = file.asText();
      const newXml = stripConditionalBlocksInXml(xml, present);
      if (newXml !== xml) zip.file(name, newXml);
    }

    const out = zip.generate({
      type: "blob",
      mimeType:
        docxBlob.type ||
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    return out;
  } catch (err) {
    console.error("[conditionalBlocks] falha ao processar DOCX:", err);
    return docxBlob;
  }
}
