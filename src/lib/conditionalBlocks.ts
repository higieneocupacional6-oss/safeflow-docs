/**
 * Blocos condicionais nos templates LTCAT e Laudo de Insalubridade.
 *
 * Marcadores no template (texto simples, sem chaves Mustache):
 *   #inicio_texto_risco_<chave>
 *   ... conteúdo ...
 *   #fim_texto_risco_<chave>
 *
 * Se o risco não existir no cadastro, todo o bloco é removido do documento
 * final. Se existir, apenas os marcadores são apagados.
 *
 * Chaves suportadas:
 *   ruido                 → Físico + Ruído + Quantitativo
 *   calor                 → Físico + Calor + Quantitativo
 *   vci                   → Físico + Vibração Corpo Inteiro + Quantitativo
 *   vmb                   → Físico + Vibração Mãos e Braços + Quantitativo
 *   poeira_silica         → Químico + Poeira/Sílica + Quantitativo
 *   quimico_quantitativo  → Qualquer Químico Quantitativo
 *   quimico_qualitativo   → Qualquer Químico Qualitativo
 *   biologico             → Biológico + Qualitativo
 */

import PizZip from "pizzip";

const BLOCK_KEYS = [
  "risco_ruido",
  "risco_calor",
  "risco_vci",
  "risco_vmb",
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

    if (isFisico && isQuant && !!r?.is_ruido) present.add("risco_ruido");
    if (isFisico && isQuant && !!r?.is_calor) present.add("risco_calor");
    if (isFisico && isQuant && !!r?.is_vibracao_corpo_inteiro) present.add("risco_vci");
    if (isFisico && isQuant && !!r?.is_vibracao_maos_bracos) present.add("risco_vmb");

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
    const shortKey = key.replace(/^risco_/, "");
    const patterns = [key, `risco_${shortKey}`];
    for (const p of patterns) {
      const re = new RegExp(
        `#inicio_texto_${p}[\\s\\S]*?#fim_texto_${p}`,
        "gi",
      );
      if (!present.has(key)) {
        out = out.replace(re, "");
      }
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

/** Aplica remoção de blocos e limpeza de marcadores em um XML de documento. */
function stripConditionalBlocksInXml(xml: string, present: Set<string>): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) return xml;

  const paras = Array.from(doc.getElementsByTagNameNS("*", "p")) as Element[];

  const startRe = /#inicio_texto_([a-z0-9_]+)/i;
  const endRe = /#fim_texto_([a-z0-9_]+)/i;
  const toRemove: Element[] = [];
  let removingKey: string | null = null;

  for (const p of paras) {
    const text = paragraphText(p);
    if (removingKey) {
      toRemove.push(p);
      const em = text.match(endRe);
      if (em && em[1].toLowerCase() === removingKey) removingKey = null;
      continue;
    }
    const sm = text.match(startRe);
    if (sm) {
      const key = sm[1].toLowerCase();
      if (!present.has(key)) {
        toRemove.push(p);
        const em = text.match(endRe);
        if (!(em && em[1].toLowerCase() === key)) {
          removingKey = key;
        }
      } else {
        stripSubstringFromParagraph(p, new RegExp(`#inicio_texto_${key}`, "gi"));
        const em = text.match(endRe);
        if (em) stripSubstringFromParagraph(p, new RegExp(`#fim_texto_${em[1]}`, "gi"));
      }
    } else {
      const em = text.match(endRe);
      if (em) stripSubstringFromParagraph(p, new RegExp(`#fim_texto_${em[1]}`, "gi"));
    }
  }

  toRemove.forEach((p) => p.parentNode?.removeChild(p));
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

    const targets = ["word/document.xml", "word/header1.xml", "word/header2.xml", "word/header3.xml", "word/footer1.xml", "word/footer2.xml", "word/footer3.xml"];
    for (const name of targets) {
      const file = zip.file(name);
      if (!file) continue;
      const xml = file.asText();
      const newXml = stripConditionalBlocksInXml(xml, present);
      if (newXml !== xml) zip.file(name, newXml);
    }

    const out = zip.generate({ type: "blob", mimeType: docxBlob.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    return out;
  } catch (err) {
    console.error("[conditionalBlocks] falha ao processar DOCX:", err);
    return docxBlob;
  }
}
