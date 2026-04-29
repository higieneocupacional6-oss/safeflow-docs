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

  // ──────────────────────────────────────────────────────────────────────────
  // POST-PROCESSING: cada SETOR (GES/GHE) é um BLOCO INDEPENDENTE.
  //
  // Marcadores injetados pelo payload:
  //   {{inicio_setor}} -> <!--LV_SETOR_START:<id>-->
  //   {{fim_setor}}    -> <!--LV_SETOR_END:<id>-->
  //
  // Cenários tratados:
  //  (1) Tabela contém múltiplos START internamente: dividimos em N tabelas
  //      independentes, uma por setor, repetindo o <thead>.
  //  (2) Conteúdo entre START e END do mesmo id é empacotado em
  //      <div class="setor-block"> com espaçador no final.
  //  (3) Compatibilidade legada: tabela única com várias <tr data-setor>/
  //      class*="setor"/"ges" também é dividida em N tabelas.
  //  (4) Espaçador entre tabelas/blocos consecutivos (DOCX ignora margem
  //      entre tabelas irmãs).
  // ──────────────────────────────────────────────────────────────────────────
  let wrapped = rendered;

  // (1) Dividir tabelas que contenham marcadores LV_SETOR_START internamente.
  wrapped = wrapped.replace(
    /<table\b([^>]*)>([\s\S]*?)<\/table>/gi,
    (full, tableAttrs: string, inner: string) => {
      const startMatches = inner.match(/<!--LV_SETOR_START:[^>]*?-->/g);
      if (!startMatches || startMatches.length < 2) return full;

      const theadMatch = inner.match(/<thead\b[\s\S]*?<\/thead>/i);
      const thead = theadMatch ? theadMatch[0] : "";
      const body = thead ? inner.replace(thead, "") : inner;

      const parts = body.split(/(?=<!--LV_SETOR_START:[^>]*?-->)/);
      const tables = parts
        .filter((p) => p.trim())
        .map(
          (part) =>
            `<table${tableAttrs} class="setor-block">${thead}<tbody>${part}</tbody></table>` +
            `<p class="block-spacer">&nbsp;</p>`,
        );
      return tables.join("\n");
    },
  );

  // (2) Empacotar conteúdo entre START/END do mesmo id em <div class="setor-block">.
  wrapped = wrapped.replace(
    /<!--LV_SETOR_START:([^>]*?)-->([\s\S]*?)<!--LV_SETOR_END:\1-->/g,
    (_full, _id: string, content: string) =>
      `<div class="setor-block">${content}</div><p class="block-spacer">&nbsp;</p>`,
  );

  // Limpa marcadores órfãos (sem par)
  wrapped = wrapped.replace(/<!--LV_SETOR_(?:START|END):[^>]*?-->/g, "");

  // (3) Compatibilidade legada: tabela única com múltiplas linhas marcadas como setor.
  wrapped = wrapped.replace(
    /<table\b([^>]*)>([\s\S]*?)<\/table>/gi,
    (full, tableAttrs: string, inner: string) => {
      const setorRowRegex = /<tr\b[^>]*(?:data-setor|class\s*=\s*"[^"]*(?:setor|ges)[^"]*")[^>]*>[\s\S]*?<\/tr>/gi;
      const setorRows = inner.match(setorRowRegex);
      if (!setorRows || setorRows.length < 2) return full;

      const theadMatch = inner.match(/<thead\b[\s\S]*?<\/thead>/i);
      const thead = theadMatch ? theadMatch[0] : "";

      const pieces = setorRows.map(
        (row) =>
          `<table${tableAttrs} class="setor-block">${thead}<tbody>${row}</tbody></table>` +
          `<p class="block-spacer">&nbsp;</p>`,
      );
      return pieces.join("\n");
    },
  );

  // (4) Espaçador entre tabelas/blocos consecutivos.
  wrapped = wrapped.replace(
    /<\/table>(\s*)(?=<table|<h[1-6]|<div|<section)/gi,
    "</table><p class=\"block-spacer\">&nbsp;</p>$1",
  );
  wrapped = wrapped.replace(/<\/table>(\s*)$/i, "</table><p class=\"block-spacer\">&nbsp;</p>");
  wrapped = wrapped.replace(
    /<\/div>(\s*)(?=<div[^>]*(?:class\s*=\s*"[^"]*(?:setor-block|ges-block)[^"]*"|data-setor|data-ges))/gi,
    "</div><p class=\"block-spacer\">&nbsp;</p>$1",
  );

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

    /* Tables: never overlap, always full-width, avoid splitting rows.
       Cada SETOR vira sua PRÓPRIA tabela (ver post-processing acima).        */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 8pt 0 16pt 0;
      page-break-inside: auto;
      break-inside: auto;
      table-layout: auto; /* expansão automática conforme conteúdo */
      height: auto;       /* nunca usar altura fixa */
    }
    tr { page-break-inside: avoid; break-inside: avoid; height: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th, td {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
      height: auto;       /* células expandem conforme texto */
    }
    th { background: #eaeaea; }

    /* Quebra de página opcional entre setores/GES quando marcado */
    table.setor-block.page-break,
    .setor-block.page-break,
    .ges-block.page-break,
    tr.page-break {
      page-break-before: always;
      break-before: page;
    }

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
