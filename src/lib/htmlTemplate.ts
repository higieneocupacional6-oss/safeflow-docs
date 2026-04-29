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

  // Wrap each GES/Setor block in a container with spacing + page-break controls.
  // Mustache outputs each {{#setores}}...{{/setores}} iteration sequentially; we
  // post-process the HTML to wrap consecutive content between GES markers in
  // <div class="ges-block"> when the template doesn't already provide one.
  const wrapped = rendered;

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; }
    h1 { font-size: 18pt; margin: 0 0 12pt 0; } 
    h2 { font-size: 14pt; margin: 16pt 0 8pt 0; page-break-after: avoid; } 
    h3 { font-size: 12pt; margin: 12pt 0 6pt 0; page-break-after: avoid; }
    p { margin: 4pt 0; }

    /* GES / Setor block layout — each block flows independently with spacing */
    .ges-block, .setor-block, div[data-ges], div.ges {
      display: block;
      margin: 0 0 24pt 0;
      padding: 0;
      page-break-inside: auto;
      page-break-after: auto;
      break-inside: auto;
    }
    /* Force a clean page between large blocks when explicitly marked */
    .ges-block.page-break, .setor-block.page-break {
      page-break-after: always;
      break-after: page;
    }

    /* Tables: never overlap, always full-width, avoid splitting rows */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 8pt 0 16pt 0;
      page-break-inside: auto;
      break-inside: auto;
    }
    tr { page-break-inside: avoid; break-inside: avoid; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th, td {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: top;
      word-wrap: break-word;
    }
    th { background: #eaeaea; }

    /* Spacer paragraph used between consecutive tables/blocks in DOCX */
    .block-spacer { height: 12pt; line-height: 12pt; margin: 0; padding: 0; }
  </style></head><body>${wrapped}</body></html>`;

  // Dynamic import: keeps it out of the initial bundle and avoids SSR/Node-only side effects on boot.
  const mod: any = await import("html-docx-js-typescript");
  const asBlob = mod.asBlob ?? mod.default?.asBlob;
  const out = await asBlob(fullHtml);
  return out instanceof Blob
    ? out
    : new Blob([out], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
