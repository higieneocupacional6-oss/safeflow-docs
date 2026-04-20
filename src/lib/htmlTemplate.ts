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
 * Uses html-docx-js (browser-safe) loaded dynamically to avoid impacting initial bundle.
 */
export async function renderHtmlTemplateToDocx(
  htmlTemplate: string,
  data: Record<string, any>,
): Promise<Blob> {
  const rendered = Mustache.render(htmlTemplate, data);

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; }
    h1 { font-size: 18pt; } h2 { font-size: 14pt; } h3 { font-size: 12pt; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
    th { background: #eaeaea; }
    p { margin: 4px 0; }
  </style></head><body>${rendered}</body></html>`;

  // Dynamic import: keeps it out of the initial bundle and avoids SSR/Node-only side effects on boot.
  const mod: any = await import("html-docx-js/dist/html-docx");
  const htmlDocx = mod.default ?? mod;
  const out = htmlDocx.asBlob(fullHtml);
  return out instanceof Blob
    ? out
    : new Blob([out], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
