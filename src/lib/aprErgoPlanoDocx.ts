import {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, Packer, PageNumber, PageOrientation,
  Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from "docx";
import type { AcaoPlanoApr } from "@/lib/aprErgoPlano";

const borda = { style: BorderStyle.SINGLE, size: 4, color: "9CA3AF" };
const bordas = { top: borda, bottom: borda, left: borda, right: borda };
const COLS: [keyof AcaoPlanoApr, string, number][] = [
  ["funcao", "Função", 1300], ["risco", "Risco identificado", 1700], ["prioridade", "Prioridade", 900],
  ["o_que", "O que (What)", 1700], ["por_que", "Por que (Why)", 1600], ["onde", "Onde (Where)", 1100],
  ["quando", "Quando (When)", 1000], ["quem", "Quem (Who)", 1100], ["como", "Como (How)", 1700],
  ["quanto", "Quanto (How much)", 900], ["resultado_esperado", "Resultado esperado", 1478],
];
const LARGURA = COLS.reduce((s, c) => s + c[2], 0); // 14478 = A4 paisagem com margens de 1,5 cm

const celula = (texto: string, largura: number, cabecalho = false) => new TableCell({
  borders: bordas, width: { size: largura, type: WidthType.DXA },
  margins: { top: 60, bottom: 60, left: 80, right: 80 },
  shading: cabecalho ? { fill: "E5E7EB", type: ShadingType.CLEAR } : undefined,
  children: (texto || "—").split(/\r?\n/).map((linha) => new Paragraph({ children: [new TextRun({ text: linha, bold: cabecalho, size: 16 })] })),
});

export function nomeArquivoPlanoDocx(empresa: string, contrato: string) {
  const limpar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `Plano_Acao_APR_ERGO_${limpar(empresa) || "Empresa"}_${limpar(contrato) || "Contrato"}.docx`;
}

export function montarPlanoAprDocx(acoes: AcaoPlanoApr[], empresa: string, contrato: string): Document {
  const grupos = new Map<string, AcaoPlanoApr[]>();
  for (const a of acoes) {
    const chave = a.setor || "Sem setor vinculado";
    grupos.set(chave, [...(grupos.get(chave) || []), a]);
  }
  const setores = [...grupos.keys()].sort((x, y) => x.localeCompare(y, "pt-BR", { numeric: true }));
  const conteudo: (Paragraph | Table)[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PLANO DE AÇÃO 5W2H — APR-ERGO", bold: true, size: 32, color: "1F4E79" })] }),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Empresa: ", bold: true }), new TextRun(empresa || "—")] }),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Contrato: ", bold: true }), new TextRun(contrato || "—")] }),
    new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: "Total de ações: ", bold: true }), new TextRun(String(acoes.length))] }),
  ];
  for (const setor of setores) {
    conteudo.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: `Setor: ${setor}`, bold: true, size: 24 })] }));
    conteudo.push(new Table({
      width: { size: LARGURA, type: WidthType.DXA }, columnWidths: COLS.map((c) => c[2]),
      rows: [
        new TableRow({ tableHeader: true, children: COLS.map(([, t, w]) => celula(t, w, true)) }),
        ...grupos.get(setor)!.map((a) => new TableRow({ cantSplit: false, children: COLS.map(([k, , w]) => celula(String(a[k] ?? ""), w)) })),
      ],
    }));
  }
  if (!acoes.length) conteudo.push(new Paragraph("Nenhuma ação cadastrada no plano salvo."));
  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Página ", size: 16 }), new TextRun({ children: [PageNumber.CURRENT], size: 16 })] })] }) },
      children: conteudo,
    }],
  });
  return doc;
}

export function gerarPlanoAprDocx(acoes: AcaoPlanoApr[], empresa: string, contrato: string): Promise<Blob> {
  return Packer.toBlob(montarPlanoAprDocx(acoes, empresa, contrato));
}
