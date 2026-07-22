// Gerador de PDF profissional para relatórios ergonômicos.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AvaliacaoErgonomica } from "./types";

const NOMES: Record<string, string> = {
  RULA: "RULA — Rapid Upper Limb Assessment",
  REBA: "REBA — Rapid Entire Body Assessment",
  NIOSH: "NIOSH — Equação Revisada de Levantamento",
  OCRA: "OCRA Checklist",
  OWAS: "OWAS — Ovako Working Posture Analysis System",
  STRAIN_INDEX: "Strain Index (Moore & Garg)",
  ROSA: "ROSA — Rapid Office Strain Assessment",
};

function fmtDate(d: string): string {
  try { return new Date(d + "T00:00:00").toLocaleDateString("pt-BR"); } catch { return d; }
}

export function gerarPdfErgonomia(av: AvaliacaoErgonomica): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 15;

  // Cabeçalho
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Relatório de Avaliação Ergonômica", 10, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(NOMES[av.ferramenta] || av.ferramenta, 10, 17);
  doc.setTextColor(0, 0, 0);
  y = 30;

  // Identificação
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("Identificação", 10, y); y += 2;
  autoTable(doc, {
    startY: y + 2,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    head: [["Campo", "Valor"]],
    headStyles: { fillColor: [30, 58, 138] },
    body: [
      ["Colaborador", av.cabecalho.colaborador_nome || "-"],
      ["Função", av.cabecalho.funcao || "-"],
      ["Empresa", av.cabecalho.empresa_nome || "-"],
      ["Setor", av.cabecalho.setor_nome || "-"],
      ["Data da avaliação", fmtDate(av.cabecalho.data_avaliacao)],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Respostas
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("Respostas fornecidas", 10, y);
  const respostasArr = Object.entries(av.respostas || {}).map(([k, v]) => {
    let val = "";
    if (v === null || v === undefined) val = "-";
    else if (typeof v === "object") val = JSON.stringify(v);
    else val = String(v);
    return [k, val];
  });
  autoTable(doc, {
    startY: y + 2,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2 },
    head: [["Parâmetro", "Valor"]],
    headStyles: { fillColor: [30, 58, 138] },
    body: respostasArr,
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Memória de cálculo
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("Memória de cálculo", 10, y);
  autoTable(doc, {
    startY: y + 2,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    head: [["Etapa", "Valor", "Detalhe"]],
    headStyles: { fillColor: [30, 58, 138] },
    body: av.resultado.memoria_calculo.map((m) => [m.etapa, String(m.valor), m.detalhe || ""]),
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Resultado
  if (y > 240) { doc.addPage(); y = 15; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("Resultado", 10, y);
  autoTable(doc, {
    startY: y + 2,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 3 },
    body: [
      [{ content: "Escore final", styles: { fontStyle: "bold" } }, String(av.resultado.escore_final)],
      [{ content: "Classificação do risco", styles: { fontStyle: "bold" } }, av.resultado.classificacao],
      [{ content: "Nível de ação", styles: { fontStyle: "bold" } }, av.resultado.nivel_acao],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Recomendações / interpretação
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("Interpretação e recomendações", 10, y);
  y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const lines = doc.splitTextToSize(av.resultado.recomendacoes, W - 20);
  doc.text(lines, 10, y);
  y += lines.length * 5 + 6;

  // Rodapé
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(120);
    doc.text(
      `SafeDocs • ${NOMES[av.ferramenta] || av.ferramenta} • Página ${i}/${total}`,
      W / 2, 290, { align: "center" }
    );
  }

  return doc.output("blob");
}
