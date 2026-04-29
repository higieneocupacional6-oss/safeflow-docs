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

// ───────────────────────────────────────────────────────────────────────────
// SANITIZAÇÃO HTML — remove tudo que costuma corromper DOCX no Word:
//  • tabelas aninhadas (Word não aceita confiavelmente <table> dentro de <td>)
//  • shapes/textbox/objetos flutuantes (<svg>, <object>, <embed>, <iframe>,
//    <canvas>, <video>, <audio>, <form>, <input>, <button>, <textarea>)
//  • alturas fixas em <tr>/<td>/<table> (height=, style="height:..")
//  • atributos de posicionamento absoluto/float que quebram fluxo
//  • <script>/<style> dentro do body, comentários condicionais MS Office
// ───────────────────────────────────────────────────────────────────────────
function sanitizeHtmlForDocx(html: string): string {
  let out = html;

  // Remover scripts e comentários condicionais Office
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "");

  // Remover elementos incompatíveis (shapes, textboxes, objetos flutuantes, form controls)
  const incompatTags = [
    "svg", "object", "embed", "iframe", "canvas", "video", "audio",
    "form", "input", "button", "textarea", "select", "option",
    "v:shape", "v:textbox", "v:rect", "v:line", "v:group", "o:OLEObject",
    "w:drawing", "w:pict",
  ];
  for (const tag of incompatTags) {
    const safe = tag.replace(":", "\\:");
    out = out.replace(new RegExp(`<${safe}\\b[\\s\\S]*?<\\/${safe}>`, "gi"), "");
    out = out.replace(new RegExp(`<${safe}\\b[^>]*\\/>`, "gi"), "");
  }

  // Remover alturas fixas em table/tr/td/th (tanto attr height= como style:height)
  out = out.replace(/<(table|tr|td|th)\b([^>]*)>/gi, (_m, tag, attrs) => {
    let a = attrs as string;
    a = a.replace(/\s+height\s*=\s*"[^"]*"/gi, "");
    a = a.replace(/\s+height\s*=\s*'[^']*'/gi, "");
    a = a.replace(/\s+height\s*=\s*[^\s>]+/gi, "");
    a = a.replace(/style\s*=\s*"([^"]*)"/gi, (_s, css) => {
      const cleaned = (css as string)
        .replace(/(^|;)\s*height\s*:[^;]+/gi, "$1")
        .replace(/(^|;)\s*min-height\s*:[^;]+/gi, "$1")
        .replace(/(^|;)\s*max-height\s*:[^;]+/gi, "$1")
        .replace(/(^|;)\s*position\s*:\s*(absolute|fixed)[^;]*/gi, "$1")
        .replace(/(^|;)\s*float\s*:[^;]+/gi, "$1")
        .replace(/^;+|;+$/g, "");
      return cleaned ? `style="${cleaned}"` : "";
    });
    return `<${tag}${a}>`;
  });

  // Achatamento de tabelas aninhadas: substitui <table> interno por <div>
  // (loop até não haver mais aninhamento)
  for (let i = 0; i < 5; i++) {
    const before = out;
    out = out.replace(
      /<td\b([^>]*)>([\s\S]*?)<\/td>/gi,
      (full, tdAttrs: string, inner: string) => {
        if (!/<table\b/i.test(inner)) return full;
        const flat = inner
          .replace(/<table\b[^>]*>/gi, '<div class="flat-table">')
          .replace(/<\/table>/gi, "</div>")
          .replace(/<thead\b[^>]*>|<\/thead>|<tbody\b[^>]*>|<\/tbody>|<tfoot\b[^>]*>|<\/tfoot>/gi, "")
          .replace(/<tr\b[^>]*>/gi, '<div class="flat-row">')
          .replace(/<\/tr>/gi, "</div>")
          .replace(/<t[hd]\b[^>]*>/gi, '<span class="flat-cell">')
          .replace(/<\/t[hd]>/gi, "</span> ");
        return `<td${tdAttrs}>${flat}</td>`;
      },
    );
    if (out === before) break;
  }

  return out;
}

// ───────────────────────────────────────────────────────────────────────────
// VALIDAÇÃO ZIP/XML — abre o .docx gerado, confere se é um ZIP válido,
// se contém word/document.xml e se o XML faz parse. Em caso de problema,
// lança erro claro para o caller exibir.
// ───────────────────────────────────────────────────────────────────────────
/**
 * Cria um proxy recursivo onde:
 *  - variáveis ausentes => "" (string vazia, em branco no documento)
 *  - arrays preservados (loops continuam funcionando)
 *  - valores explícitos (0, false, "") preservados
 * Mustache trata "" como falsy para seções, o que é o comportamento desejado:
 * blocos opcionais somem se vazios; campos soltos ficam em branco.
 */
function createSafeDataProxy(data: any): any {
  if (data === null || data === undefined) return {};
  if (Array.isArray(data)) return data.map(createSafeDataProxy);
  if (typeof data !== "object") return data;

  return new Proxy(data, {
    get(target, prop: string) {
      if (prop in target) {
        const v = (target as any)[prop];
        if (v === null || v === undefined) return "";
        if (Array.isArray(v)) return v.map(createSafeDataProxy);
        if (typeof v === "object") return createSafeDataProxy(v);
        return v;
      }
      // Mustache testa propriedades como "length", funções, etc.
      // Retornar "" cobre o caso de variável ausente sem quebrar loops.
      return "";
    },
    has() {
      // força Mustache a sempre achar a chave (e usar nosso get -> "")
      return true;
    },
  });
}

/** Remove seções Mustache (#/^/) potencialmente desbalanceadas como último recurso. */
function stripUnresolvedSections(tpl: string): string {
  return tpl.replace(/\{\{\s*[#^]\s*[\w.-]+\s*\}\}/g, "")
            .replace(/\{\{\s*\/\s*[\w.-]+\s*\}\}/g, "");
}

async function validateGeneratedDocx(blob: Blob): Promise<void> {
  const PizZip = (await import("pizzip")).default;
  const buf = await blob.arrayBuffer();
  let zip: any;
  try {
    zip = new PizZip(buf);
  } catch (e: any) {
    throw new Error(`DOCX gerado não é um ZIP válido: ${e?.message || e}`);
  }
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("DOCX gerado não contém word/document.xml");
  const xml = docFile.asText();
  if (!xml || xml.length < 100) throw new Error("word/document.xml vazio ou truncado");
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const errNode = doc.getElementsByTagName("parsererror")[0];
    if (errNode) throw new Error(errNode.textContent || "XML inválido");
  } catch (e: any) {
    throw new Error(`word/document.xml inválido: ${e?.message || e}`);
  }
}

/**
 * Render an HTML template with Mustache and convert to a .docx Blob.
 * Pipeline:
 *   1. Render Mustache (com normalização de loops mal balanceados)
 *   2. Post-processing de SETOR/GES (split de tabelas, espaçadores)
 *   3. Sanitização (remove shapes/textbox/aninhamentos/alturas fixas)
 *   4. Conversão html-docx-js
 *   5. Validação ZIP/XML do DOCX final
 */
export async function renderHtmlTemplateToDocx(
  htmlTemplate: string,
  data: Record<string, any>,
): Promise<Blob> {
  // (0) Normalização preventiva de loops Mustache mal formatados
  //     — fecha seções abertas no fim do template para evitar render abortar.
  let safeTemplate = htmlTemplate;
  try {
    Mustache.parse(safeTemplate);
  } catch {
    // Heurística simples: para cada {{#tag}} sem {{/tag}}, adiciona o fechamento no fim.
    const opens = [...safeTemplate.matchAll(/\{\{\s*#\s*([\w.-]+)\s*\}\}/g)].map((m) => m[1]);
    const closes = [...safeTemplate.matchAll(/\{\{\s*\/\s*([\w.-]+)\s*\}\}/g)].map((m) => m[1]);
    const missing: string[] = [];
    const closeCount: Record<string, number> = {};
    closes.forEach((c) => (closeCount[c] = (closeCount[c] || 0) + 1));
    opens.forEach((o) => {
      if ((closeCount[o] || 0) > 0) closeCount[o]--;
      else missing.push(o);
    });
    safeTemplate += missing.reverse().map((t) => `{{/${t}}}`).join("");
  }

  // Wrapper de dados resiliente: variáveis ausentes => "" (string vazia),
  // arrays ausentes => [] (loop não quebra). Preserva valores explícitos
  // (incluindo 0, false, "") para não comer dados legítimos.
  const safeData = createSafeDataProxy(data);

  let rendered: string;
  try {
    rendered = Mustache.render(safeTemplate, safeData);
  } catch (err) {
    console.warn("[renderHtmlTemplateToDocx] Mustache.render falhou, aplicando fallback:", err);
    // Fallback: renderiza o que conseguir; remove tags Mustache não resolvidas
    // para garantir que o documento seja sempre finalizado.
    try {
      rendered = Mustache.render(stripUnresolvedSections(safeTemplate), safeData);
    } catch {
      rendered = safeTemplate
        .replace(/\{\{[#^/][^}]*\}\}/g, "")
        .replace(/\{\{[^}]*\}\}/g, "");
    }
  }

  // Limpa quaisquer tags Mustache órfãs remanescentes (campo ausente => em branco)
  rendered = rendered.replace(/\{\{\s*[#^/!>]?[^}]*\}\}/g, "");

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
            `<table${tableAttrs} class="setor-block page-break">${thead}<tbody>${part}</tbody></table>` +
            `<p class="block-spacer">&nbsp;</p>`,
        );
      return tables.join("\n");
    },
  );

  // (2) Empacotar conteúdo entre START/END do mesmo id em <div class="setor-block">.
  wrapped = wrapped.replace(
    /<!--LV_SETOR_START:([^>]*?)-->([\s\S]*?)<!--LV_SETOR_END:\1-->/g,
    (_full, _id: string, content: string) =>
      `<div class="setor-block page-break">${content}</div><p class="block-spacer">&nbsp;</p>`,
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
          `<table${tableAttrs} class="setor-block page-break">${thead}<tbody>${row}</tbody></table>` +
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

  // (5) SANITIZAÇÃO FINAL — limpeza de elementos incompatíveis com Word.
  wrapped = sanitizeHtmlForDocx(wrapped);

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; }
    h1 { font-size: 18pt; margin: 0 0 12pt 0; } 
    h2 { font-size: 14pt; margin: 16pt 0 8pt 0; page-break-after: avoid; } 
    h3 { font-size: 12pt; margin: 12pt 0 6pt 0; page-break-after: avoid; }
    p { margin: 4pt 0; }

    .ges-block, .setor-block, div[data-ges], div.ges {
      display: block;
      margin: 0 0 24pt 0;
      padding: 0;
      page-break-inside: auto;
      page-break-after: always;  /* quebra automática entre GES/GHE */
      break-inside: auto;
      break-after: page;
    }
    .ges-block.page-break, .setor-block.page-break {
      page-break-after: always;
      break-after: page;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 8pt 0 16pt 0;
      page-break-inside: auto;
      break-inside: auto;
      table-layout: auto;
      height: auto;
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
      height: auto;
    }
    th { background: #eaeaea; }

    table.setor-block.page-break,
    .setor-block.page-break,
    .ges-block.page-break,
    tr.page-break {
      page-break-before: always;
      break-before: page;
    }

    .block-spacer { height: 12pt; line-height: 12pt; margin: 0; padding: 0; }
    .flat-table { display: block; margin: 4pt 0; }
    .flat-row { display: block; margin: 2pt 0; }
    .flat-cell { display: inline-block; margin-right: 6pt; }
  </style></head><body>${wrapped}</body></html>`;

  // Conversão HTML → DOCX
  const mod: any = await import("html-docx-js-typescript");
  const asBlob = mod.asBlob ?? mod.default?.asBlob;
  const out = await asBlob(fullHtml);
  const blob: Blob = out instanceof Blob
    ? out
    : new Blob([out], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

  // Validação final do DOCX gerado
  try {
    await validateGeneratedDocx(blob);
  } catch (e: any) {
    // Não bloqueia download, mas deixa rastro no console pra diagnóstico
    console.error("[renderHtmlTemplateToDocx] validação DOCX falhou:", e?.message || e);
    throw new Error(
      `O documento gerado não passou na validação de integridade: ${e?.message || e}. ` +
      `Revise o template (tabelas aninhadas, shapes ou loops Mustache desbalanceados).`,
    );
  }

  return blob;
}
