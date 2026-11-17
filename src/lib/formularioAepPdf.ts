import { formatDateOnly } from "@/lib/dateOnly";
// PDF do Formulário AEP: exatamente 2 páginas A4 retrato.
// Página 1 = Parte I/II/III; Página 2 = Parte IV + V – Participantes.
// O tamanho da fonte é reduzido automaticamente até cada parte caber em uma página.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CATEGORIAS, DURACAO, INTENSIDADE, COLUNAS, type ReconhecimentoState } from "@/components/formulario-aep/EtapaReconhecimento";

export type LinhaPdf = { texto: string; marcas: Record<string, string> };
export type FormularioAepPdfDados = {
  empresaNome: string;
  contratoNome: string;
  ident: Record<string, string>;
  funcoesNomes: string[];
  atividades: LinhaPdf[];
  controles: LinhaPdf[];
  reconhecimento: ReconhecimentoState;
};

const AZUL: [number, number, number] = [30, 58, 138];
const CINZA: [number, number, number] = [235, 237, 241];
const M = 8; // margem (mm)

const fmtData = (d: string) => formatDateOnly(d, d);
const last = (doc: jsPDF) => (doc as any).lastAutoTable.finalY as number;

function cabecalho(doc: jsPDF, titulo: string, sub: string) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...AZUL);
  doc.rect(M, M, W - 2 * M, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text(titulo, W / 2, M + 4, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7);
  doc.text(sub, W / 2, M + 7.5, { align: "center" });
  doc.setTextColor(0, 0, 0);
  return M + 11;
}

function pagina1(doc: jsPDF, d: FormularioAepPdfDados, fs: number) {
  const W = doc.internal.pageSize.getWidth();
  const sub = `${d.empresaNome} • Contrato ${d.contratoNome}`;
  let y = cabecalho(doc, "Anexo 01 - Formulário de Antecipação e Reconhecimento de Riscos", sub);
  const base = { theme: "grid" as const, margin: { left: M, right: M }, styles: { fontSize: fs, cellPadding: 1, overflow: "linebreak" as const, lineColor: [150, 150, 150] as [number, number, number], lineWidth: 0.1 }, headStyles: { fillColor: AZUL, textColor: 255, fontStyle: "bold" as const, halign: "center" as const } };
  const titulo = (t: string) => autoTable(doc, { ...base, startY: y, head: [[t]], body: [] });
  const i = d.ident;

  titulo("I – IDENTIFICAÇÃO E CARACTERIZAÇÃO"); y = last(doc);
  autoTable(doc, {
    ...base, startY: y,
    head: [["Gerência Executiva", "Gerência", "Local Físico", "Nome GERE", "Código GERE"]],
    headStyles: { ...base.headStyles, fillColor: CINZA, textColor: 20 },
    body: [[i.gerencia_executiva, i.gerencia, i.local_fisico, i.nome_gere, i.codigo_gere].map((v) => v || "")],
  });
  y = last(doc);
  autoTable(doc, {
    ...base, startY: y,
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 48, fillColor: CINZA } },
    body: [
      ["Funções amostradas em campo", d.funcoesNomes.join("; ")],
      ["Data da avaliação", i.horario_avaliacao || ""],
      ["Jornada de trabalho", i.jornada || ""],
      ["Nº de trabalhadores expostos", i.expostos || ""],
      ["Descrição resumida", i.descricao || ""],
    ],
  });
  y = last(doc) + 3;

  const tabela = (t: string, legenda: string, colTexto: string, cols: readonly string[], linhas: LinhaPdf[]) => {
    titulo(t); y = last(doc);
    doc.setFontSize(fs - 0.5);
    const leg = doc.splitTextToSize(legenda, W - 2 * M);
    doc.text(leg, M, y + fs * 0.4);
    y += leg.length * fs * 0.42 + 1;
    autoTable(doc, {
      ...base, startY: y,
      head: [["ID", colTexto, ...cols]],
      headStyles: { ...base.headStyles, fillColor: CINZA, textColor: 20 },
      columnStyles: Object.fromEntries([[0, { cellWidth: 8, halign: "center" }], ...cols.map((_, k) => [k + 2, { cellWidth: 9, halign: "center" }])]),
      body: linhas.map((l, k) => [String(k + 1), l.texto || "", ...cols.map((c) => l.marcas?.[c] || "")]),
    });
    y = last(doc) + 3;
  };
  tabela("II – PRIORIZAÇÃO DE DEMANDA – ATIVIDADES CRÍTICAS",
    "Critérios de criticidade: AF – Afastamentos | RE – Restritos | IN – Incidentes | QO – Queixas Osteomusculares",
    "Atividades", ["AF", "RE", "IN", "QO"], d.atividades);
  tabela("III – MEDIDAS DE CONTROLE EXISTENTES/CIRCUNSTÂNCIAS DE EXIGÊNCIAS ERGONÔMICAS",
    "Tipos de Controle: PI – Proteção Individual | MS – Manutenção e Substituição | CM – Coletiva e Minimização | CE – Coletiva e Engenharia | AD – Administrativa | ME – Médico | CP – Capacitação",
    "Descrição do Controle/Circunstância de Exigência Ergonômica", ["PI", "MS", "CM", "CE", "AD", "ME", "CP"], d.controles);
}

const MATRIZ: [string, number[]][] = [
  ["E", [64, 96, 160, 288, 416]], ["D", [32, 48, 80, 144, 208]], ["C", [16, 24, 40, 72, 104]], ["B", [8, 12, 20, 36, 52]],
];
const cor = (v: number): [number, number, number] => (v >= 140 ? [220, 60, 60] : v >= 70 ? [245, 160, 70] : v >= 25 ? [250, 215, 90] : [90, 200, 130]);
const SEVERIDADE = [
  ["A", "Efeitos que melhoram com repouso durante a jornada (pausas)"],
  ["B", "Efeitos que melhoram com repouso entre jornadas"],
  ["C", "Efeitos que reduzem a capacidade de trabalho, podendo gerar restrição ou recuperação acima do descanso entre jornadas"],
  ["D", "Efeitos irreversíveis (doenças/lesões) que podem gerar afastamento ou reavaliação da função"],
  ["E", "Efeitos irreversíveis que podem gerar perda da capacidade laboral"],
];

function pagina2(doc: jsPDF, d: FormularioAepPdfDados, fs: number) {
  const W = doc.internal.pageSize.getWidth();
  let y = cabecalho(doc, "IV - RECONHECIMENTO E CLASSIFICAÇÃO", `${d.empresaNome} • Contrato ${d.contratoNome}`);
  const st = { fontSize: fs, cellPadding: 0.6, lineColor: [150, 150, 150] as [number, number, number], lineWidth: 0.1, halign: "center" as const, valign: "middle" as const };
  const pequeno = { theme: "grid" as const, styles: { ...st, fontSize: Math.max(fs - 0.5, 4) }, headStyles: { fillColor: CINZA, textColor: 20, fontStyle: "bold" as const } };
  const larg = W - 2 * M;

  // Matriz (esquerda), Níveis/Probabilidade (centro), Severidade (direita)
  autoTable(doc, {
    ...pequeno, startY: y, margin: { left: M }, tableWidth: larg * 0.3,
    head: [["Sev. \\ Freq.", "1", "2", "3", "4", "5"]],
    body: MATRIZ.map(([l, vals]) => [l, ...vals.map(String)]),
    didParseCell: (h) => { if (h.section === "body" && h.column.index > 0) { h.cell.styles.fillColor = cor(Number(h.cell.raw)); h.cell.styles.fontStyle = "bold"; } },
  });
  const y1 = last(doc);
  autoTable(doc, {
    ...pequeno, startY: y, margin: { left: M + larg * 0.31 }, tableWidth: larg * 0.13,
    head: [["Níveis de Risco", ""]],
    body: [[">= 140", "M. Alto"], ["70 - 140", "Alto"], ["25 - 70", "Médio"], ["< 25", "Baixo"]],
    didParseCell: (h) => { if (h.section === "body" && h.column.index === 0) h.cell.styles.fillColor = cor([140, 70, 25, 0][h.row.index]); },
  });
  const y2 = last(doc);
  autoTable(doc, {
    ...pequeno, startY: y, margin: { left: M + larg * 0.45 }, tableWidth: larg * 0.17,
    head: [["Nível", "Índice", "Probabilidade"]],
    body: [["1 a 3", "1", "Raro"], ["4 a 7", "2", "Pouco Provável"], ["8 a 11", "3", "Ocasional"], ["12 a 16", "4", "Provável"], ["17 a 20", "5", "Frequente"]],
  });
  const y3 = last(doc);
  autoTable(doc, {
    ...pequeno, startY: y, margin: { left: M + larg * 0.63 }, tableWidth: larg * 0.37,
    head: [["", "Severidade"]],
    columnStyles: { 0: { cellWidth: 4 }, 1: { halign: "left" } },
    body: SEVERIDADE,
  });
  y = Math.max(y1, y2, y3, last(doc)) + 1.5;

  // Legenda de Duração/Intensidade
  autoTable(doc, {
    ...pequeno, startY: y, margin: { left: M, right: M },
    head: [["Duração Total da Exposição (D)", "Intensidade/Nível (I)"]],
    columnStyles: { 0: { halign: "left" }, 1: { halign: "left" } },
    body: DURACAO.map((t, k) => [`D${t}`, `I${INTENSIDADE[k]}`]),
  });
  y = last(doc) + 1.5;

  const colW = 5.2;
  const body: any[] = [];
  CATEGORIAS.forEach(([titulo, itens]) => {
    body.push([{ content: titulo, colSpan: 1 + COLUNAS.length, styles: { fillColor: CINZA, fontStyle: "bold" } }]);
    itens.forEach((item) => {
      const codigo = item.split(":")[0];
      body.push([
        { content: item, styles: { halign: "left" } },
        ...COLUNAS.map((c) => d.reconhecimento.marcas[codigo]?.[c] || ""),
      ]);
    });
  });
  autoTable(doc, {
    theme: "grid", startY: y, margin: { left: M, right: M }, styles: st,
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: "bold" },
    head: [
      [{ content: "Fator de risco ergonômico", rowSpan: 2, styles: { valign: "middle" } },
        { content: "Duração", colSpan: 5 }, { content: "Intensidade/Nível", colSpan: 5 }, { content: "ID Atividade", colSpan: 5 }],
      COLUNAS.map((c) => c.slice(1)),
    ],
    columnStyles: Object.fromEntries(COLUNAS.map((_, k) => [k + 1, { cellWidth: colW }])),
    body,
  });
  y = last(doc) + 1.5;

  const p = d.reconhecimento.participantes;
  autoTable(doc, {
    theme: "grid", startY: y, margin: { left: M, right: M }, styles: { ...st, fontSize: fs + 0.5, halign: "left", cellPadding: 1.2 },
    head: [[{ content: "V - PARTICIPANTES", colSpan: 4, styles: { halign: "center" } }]],
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 2: { fontStyle: "bold", cellWidth: 22 } },
    body: [
      ["Profissional Avaliador:", p.avaliador || "", "Avaliado:", p.avaliado || ""],
      ["Reconhecimento realizado em:", fmtData(p.data || ""), "Assinatura:", p.assinatura || ""],
    ],
  });
}

function rodape(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5); doc.setTextColor(120);
    doc.text(`SegDocs • Formulário AEP • Página ${i}/${total}`, W / 2, H - 4, { align: "center" });
  }
}

/** Gera a parte num documento temporário com a maior fonte que caiba numa única página. */
function maiorFonte(render: (doc: jsPDF, fs: number) => void, inicio: number) {
  for (let fs = inicio; fs >= 3.5; fs -= 0.25) {
    const t = new jsPDF({ unit: "mm", format: "a4" });
    render(t, fs);
    const H = t.internal.pageSize.getHeight();
    if (t.getNumberOfPages() === 1 && last(t) <= H - 8) return fs;
  }
  return 3.5;
}

export function gerarPdfFormularioAep(d: FormularioAepPdfDados): Blob {
  return new Blob([montarDocumento(d).output("arraybuffer")], { type: "application/pdf" });
}

export function montarDocumento(d: FormularioAepPdfDados): jsPDF {
  const f1 = maiorFonte((doc, fs) => pagina1(doc, d, fs), 9);
  const f2 = maiorFonte((doc, fs) => pagina2(doc, d, fs), 7);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  pagina1(doc, d, f1);
  doc.addPage();
  pagina2(doc, d, f2);
  // Garantia: nunca entregar páginas extras.
  while (doc.getNumberOfPages() > 2) doc.deletePage(doc.getNumberOfPages());
  rodape(doc);
  return doc;
}
