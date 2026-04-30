import Mustache from "mustache";

// Render values literally (no HTML escaping); we control the source data.
Mustache.escape = (text: string) => text;

export type HtmlTemplateIssue = {
  tipo: string;
  mensagem: string;
  explicacao: string;
  correcao: string;
  severidade: "erro" | "aviso";
};

/** Validate an HTML template by parsing + sample render with Mustache. */
export async function validateHtmlTemplate(file: File): Promise<HtmlTemplateIssue[]> {
  const issues: HtmlTemplateIssue[] = [];
  try {
    const html = await file.text();
    Mustache.parse(html);
    Mustache.render(html, {
      empresa: "X", razao_social: "X", cnpj: "0",
      setores: [{ setor: "S", riscos: [{ agente_nome: "A", avaliacoes: [{}], epis: [], epcs: [], equipamentos_avaliacao: [] }] }],
    });
  } catch (err: any) {
    issues.push({
      tipo: "Template HTML",
      mensagem: "Erro de sintaxe no template HTML",
      explicacao: err?.message || String(err),
      correcao: "Verifique chaves {{ }} e seções {{#lista}}...{{/lista}} balanceadas",
      severidade: "erro",
    });
  }
  return issues;
}

/**
 * Render an HTML template with Mustache and convert to a .docx Blob.
 *
 * Uses @turbodocx/html-to-docx which generates NATIVE Open XML (real <w:p>, <w:r>, <w:tbl>)
 * instead of the altChunk/MHTML approach used by html-docx-js — that approach produced
 * files that triggered "Erro no Word ao tentar abrir o arquivo" on certain Word versions
 * because Word has to parse an embedded MHT part at open time and frequently rejects it.
 */
export async function renderHtmlTemplateToDocx(
  htmlTemplate: string,
  data: Record<string, any>,
): Promise<Blob> {
  const rendered = Mustache.render(htmlTemplate, data);

  // Body-only HTML — turbodocx wraps it with proper Word document chrome.
  const bodyHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; }
    h1 { font-size: 18pt; font-weight: bold; }
    h2 { font-size: 14pt; font-weight: bold; }
    h3 { font-size: 12pt; font-weight: bold; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
    th { background: #eaeaea; font-weight: bold; }
    p { margin: 4px 0; }
  </style></head><body>${rendered}</body></html>`;

  const mod: any = await import("@turbodocx/html-to-docx");
  const htmlToDocx = mod.default ?? mod;

  const out: any = await htmlToDocx(bodyHtml, undefined, {
    table: { row: { cantSplit: true } },
    footer: false,
    pageNumber: false,
    font: "Arial",
    margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
  });

  // turbodocx returns Blob in browser, Buffer in Node. Normalize to Blob.
  if (out instanceof Blob) return out;
  if (typeof out?.arrayBuffer === "function") {
    const ab = await out.arrayBuffer();
    return new Blob([ab], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  }
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}
