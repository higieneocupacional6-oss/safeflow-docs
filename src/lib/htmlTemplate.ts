import Mustache from "mustache";
// @ts-ignore - no types shipped
import HTMLtoDOCX from "html-to-docx-buffer";

// Disable HTML escaping so values like "&" render literally (we control the data)
Mustache.escape = (text: string) => text;

export type HtmlTemplateIssue = {
  tipo: string;
  mensagem: string;
  explicacao: string;
  correcao: string;
  severidade: "erro" | "aviso";
};

/**
 * Validate an HTML template by attempting a Mustache render with a sample payload.
 * Catches unbalanced sections / parse errors.
 */
export async function validateHtmlTemplate(file: File): Promise<HtmlTemplateIssue[]> {
  const issues: HtmlTemplateIssue[] = [];
  try {
    const html = await file.text();
    Mustache.parse(html); // throws on syntax errors
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

/** Render an HTML template string with Mustache and convert to DOCX buffer. */
export async function renderHtmlTemplateToDocx(
  htmlTemplate: string,
  data: Record<string, any>,
): Promise<Blob> {
  const rendered = Mustache.render(htmlTemplate, data);

  // Wrap in a minimal HTML document with reasonable defaults so tables/headers survive
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; }
    h1 { font-size: 18pt; }
    h2 { font-size: 14pt; }
    h3 { font-size: 12pt; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
    th { background: #eaeaea; }
    p { margin: 4px 0; }
  </style></head><body>${rendered}</body></html>`;

  const buffer: ArrayBuffer = await HTMLtoDOCX(fullHtml, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
    margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
    font: "Arial",
  });

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}
