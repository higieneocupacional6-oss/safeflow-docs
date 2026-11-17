import jsPDF from "jspdf";
import autoTable, { type CellInput } from "jspdf-autotable";
import type { LinhaApr } from "../../supabase/functions/_shared/aprErgoIa";

type CabecalhoPdf = Record<string, string>;
type ColunaPdf = { key: keyof LinhaApr; titulo: string; w: string };
type CorPdf = [number, number, number];
export const TITULO_PDF_APR = "ANEXO 3 – ANÁLISE PRELIMINAR DE RISCOS ERGONÔMICOS (APR-ERGO)";
/** Legacy validation badges may have been copied into any saved text field. Originals stay intact. */
export function textoPdfApr(texto: string): string {
  return texto.replace(/\[\s*IA\s*[·:—-]?\s*validar\s*\]/gi, "").trim();
}
export function nomePdfApr(setor: string, empresa: string) {
  const seguro = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return `APR_ERGO_${seguro(setor) || "SETOR"}_${seguro(empresa) || "Empresa"}_2026.pdf`;
}

/** Vector text and explicit row continuations keep all content, not screenshots or clipped A4 slices. */
export function gerarPdfApr(cab: CabecalhoPdf, linhas: LinhaApr[], colunas: ColunaPdf[], cores: Record<string, { fundo: CorPdf; texto: CorPdf }> = {}): Blob {
  cab = Object.fromEntries(Object.entries(cab).map(([k, v]) => [k, textoPdfApr(v)]));
  linhas = linhas.map((l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, typeof v === "string" ? textoPdfApr(v) : v])) as LinhaApr);
  colunas = colunas.map((c) => ({ ...c, titulo: textoPdfApr(c.titulo) }));
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3", compress: true });
  const margem = 10, largura = doc.internal.pageSize.getWidth() - margem * 2;
  const soma = colunas.reduce((n, c) => n + parseFloat(c.w), 0);
  const larguras = colunas.map((c) => largura * parseFloat(c.w) / soma);
  const tabela = { theme: "grid" as const, margin: { left: margem, right: margem, top: 17, bottom: 15 }, styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak" as const, lineWidth: 0.2, lineColor: 0, fillColor: 255, textColor: 0 }, headStyles: { fillColor: 217, textColor: 0, fontStyle: "bold" as const, halign: "center" as const }, rowPageBreak: "avoid" as const };
  const campo = (label: string, key: string, colSpan: number): CellInput => ({ content: `${label} ${cab[key] || ""}`, colSpan });
  const identificacao: CellInput[][] = [
    [{ content: TITULO_PDF_APR, colSpan: 13, styles: { fontStyle: "bold", fontSize: 12, halign: "center", fillColor: [0, 51, 153], textColor: 255 } }],
    [campo("Empresa:", "empresa", 5), campo("Data:", "data", 3), campo("Nº de pessoas expostas:", "pessoas", 5)],
    [{ content: "", colSpan: 5 }, campo("Local SSO:", "localSso", 4), campo("Local Físico:", "localFisico", 4)],
    [campo("Nome do GERE:", "gere", 11), campo("Gerência de área:", "gerencia", 2)],
    [campo("Cargo:", "cargo", 13)],
    [campo("Descrição das atividades/tarefas desempenhadas:\n", "atividades", 13)],
    [campo("Descrição do ambiente de trabalho:\n", "ambiente", 13)],
  ];
  const columnStyles = Object.fromEntries(larguras.map((w, i) => [i, { cellWidth: w }]));
  autoTable(doc, { ...tabela, startY: 10, body: identificacao, columnStyles });
  const fim = () => (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const fotosPorLinha: string[][] = [];
  const body: CellInput[][] = [];
  doc.setFontSize(8);
  for (const linha of linhas) {
    const textos = colunas.map((c, i) => {
      doc.setFont("helvetica", ["perfil", "classificacao", "recomendacoes"].includes(c.key) ? "bold" : "normal");
      return c.key === "fotos" ? [] : doc.splitTextToSize(String(linha[c.key] || ""), larguras[i] - 3.6) as string[];
    });
    // At most 28 text lines per physical row; each photo gets its own continuation when needed.
    const partes = Math.max(1, ...textos.map((t) => Math.ceil(t.length / 28)), linha.fotos.length);
    for (let p = 0; p < partes; p++) {
      fotosPorLinha.push(linha.fotos[p] ? [linha.fotos[p]] : []);
      body.push(colunas.map((c, i) => ({ content: c.key === "fotos" ? "" : textos[i].slice(p * 28, (p + 1) * 28).join("\n"), styles: {
        ...(c.key === "fotos" && linha.fotos[p] ? { minCellHeight: 48 } : {}),
        ...(["perfil", "classificacao", "recomendacoes"].includes(c.key) ? { fontStyle: "bold" as const } : {}),
        ...(c.key === "classificacao" && cores[linha.classificacao] ? { fillColor: cores[linha.classificacao].fundo, textColor: cores[linha.classificacao].texto } : {}),
      } })));
      if (p > 0) {
        const cenario = colunas.findIndex((c) => c.key === "cenario");
        if (cenario >= 0) body[body.length - 1][cenario] = { content: `${linha.cenario}\n(cont.)`, styles: { fontSize: 7 } };
      }
    }
  }
  autoTable(doc, { ...tabela, startY: fim(), head: [colunas.map((c) => c.titulo)], body, columnStyles, showHead: "everyPage",
    didDrawCell: (d) => {
      if (d.section !== "body" || colunas[d.column.index]?.key !== "fotos") return;
      const foto = fotosPorLinha[d.row.index]?.[0];
      if (!foto) return;
      const props = doc.getImageProperties(foto);
      const maxW = d.cell.width - 4, maxH = d.cell.height - 4;
      const escala = Math.min(maxW / props.width, maxH / props.height);
      const w = props.width * escala, h = props.height * escala;
      doc.addImage(foto, props.fileType, d.cell.x + (d.cell.width - w) / 2, d.cell.y + (d.cell.height - h) / 2, w, h);
    },
  });
  autoTable(doc, { ...tabela, startY: fim() + 2, body: [[`Elaborador: ${cab.elaborador || ""}`]], styles: { ...tabela.styles, fontStyle: "bold" } });
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(0);
    if (p > 1) doc.text(`APR-ERGO — ${cab.empresa || ""} — ${cab.gere || ""}`, margem, 10, { maxWidth: largura });
    doc.text(`Página ${p}/${total}`, doc.internal.pageSize.getWidth() - margem, doc.internal.pageSize.getHeight() - 7, { align: "right" });
  }
  return doc.output("blob");
}

export function baixarBlobApr(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}