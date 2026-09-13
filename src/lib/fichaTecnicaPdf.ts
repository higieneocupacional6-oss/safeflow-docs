import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fichaTipoLabel, formatFichaResultado } from "@/lib/fichaTecnica";

type Contexto = {
  empresa: any;
  contrato?: any;
  setores?: any[];
  funcoes?: any[];
  agentes?: any[];
};

const dataBr = (value?: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "—";
const safe = (value: unknown) => value == null || value === "" ? "—" : String(value);

function finish(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text("SegDocs", 14, 290);
    doc.text(`Página ${page} de ${pages}`, 196, 290, { align: "right" });
  }
}

function header(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(28, 107, 69);
  doc.rect(0, 0, 210, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, 14, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitle, 14, 18);
  doc.setTextColor(20, 20, 20);
}

export function baixarRelatorioFicha(contexto: Contexto, resultados: any[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  header(doc, "Relatório da Ficha Técnica", `${safe(contexto.empresa?.nome_fantasia || contexto.empresa?.razao_social)} · Contrato ${safe(contexto.contrato?.numero_contrato || contexto.contrato?.nome_contratante)}`);
  autoTable(doc, {
    startY: 31,
    theme: "grid",
    head: [["Data", "Setor", "Função", "Agente", "Resultados", "Limite", "Amostrador / série"]],
    body: resultados.map((row) => {
      const setor = contexto.setores?.find((item) => item.id === row.setor_id);
      const funcao = contexto.funcoes?.find((item) => item.id === row.funcao_id);
      const agente = contexto.agentes?.find((item) => item.id === row.agente_id);
      return [dataBr(row.data_avaliacao), safe(setor?.nome_setor), safe(funcao?.nome_funcao), `${fichaTipoLabel(row.tipo)}\n${safe(agente?.nome)}`, formatFichaResultado(row), safe(row.limite_tolerancia), row.amostrador ? `${row.amostrador}${row.amostrador_serie ? ` · ${row.amostrador_serie}` : ""}` : "—"];
    }),
    headStyles: { fillColor: [28, 107, 69], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak", valign: "middle" },
    columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 34 }, 2: { cellWidth: 34 }, 3: { cellWidth: 45 }, 4: { cellWidth: 54 }, 5: { cellWidth: 20 }, 6: { cellWidth: 55 } },
    margin: { left: 10, right: 10, bottom: 14 },
  });
  finish(doc);
  doc.save(`ficha-tecnica-${contexto.contrato?.numero_contrato || "contrato"}.pdf`);
}

export function baixarRelatorioAmostradores(rows: any[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  header(doc, "Relatório de Amostradores Usados", `${rows.length} registro(s) no histórico pesquisado`);
  autoTable(doc, {
    startY: 31,
    theme: "grid",
    head: [["Data da avaliação", "Amostrador", "Nº de série / identificação", "Empresa", "Contrato", "Agente"]],
    body: rows.map((row) => [dataBr(row.data_avaliacao), safe(row.amostrador), safe(row.amostrador_serie), safe(row.empresa_nome), safe(row.contrato_nome), safe(row.agente_nome)]),
    headStyles: { fillColor: [28, 107, 69], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 2.4, overflow: "linebreak", valign: "middle" },
    margin: { left: 12, right: 12, bottom: 14 },
  });
  finish(doc);
  doc.save("amostradores-usados.pdf");
}