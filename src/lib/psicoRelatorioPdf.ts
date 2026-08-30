import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  GrupoRelatorio, MedidaControle, NivelRisco, PROB_LABELS, SEV_LABELS,
  hexNivel, nivelDeRisco, resumoPorGrupo, riscosParaPgr, INDICADORES_CAMPOS,
} from "@/lib/psicoRelatorio";

const AZUL: [number, number, number] = [23, 58, 94];
const CINZA: [number, number, number] = [240, 243, 247];

export type PdfPayload = {
  empresa: any;
  contrato: any;
  identificacao: Record<string, string>;
  metodologia: string;
  grupos: GrupoRelatorio[];
  medidas: MedidaControle[];
  conclusao: string;
  indicadores: Record<string, string>;
  historico: string;
  registros: Record<string, string>;
  titulo: string;
};

export function gerarPdfPsicossocial(p: PdfPayload) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 42;

  // ---------- Capa ----------
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, W, 210, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("RELATÓRIO TÉCNICO DE", M, 96);
  doc.text("AVALIAÇÃO PSICOSSOCIAL", M, 126);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("NR-01 · NR-17 — Gerenciamento de Riscos Psicossociais", M, 152);

  doc.setTextColor(30, 30, 30);
  let y = 260;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(p.empresa?.razao_social || "—", M, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const capa: [string, string][] = [
    ["Nome fantasia", p.identificacao.nome_fantasia],
    ["CNPJ", p.identificacao.cnpj],
    ["CNAE", p.identificacao.cnae],
    ["Endereço", p.identificacao.endereco],
    ["Unidade / Estabelecimento", p.identificacao.unidade],
    ["Contrato", p.contrato?.numero_contrato || "—"],
    ["Responsável pela avaliação", p.identificacao.responsavel_nome],
    ["Registro profissional", p.identificacao.responsavel_registro],
    ["Data da avaliação", p.identificacao.data_avaliacao],
    ["Versão do documento", p.registros.versao],
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: AZUL },
    head: [["Identificação da empresa", ""]],
    columnStyles: { 0: { cellWidth: 170, fontStyle: "bold", fillColor: CINZA } },
    body: capa.map(([k, v]) => [k, v || "—"]),
  });

  const sec = (titulo: string) => {
    doc.addPage();
    doc.setFillColor(...AZUL);
    doc.rect(M, 46, W - M * 2, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(titulo.toUpperCase(), M + 10, 63);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    return 92;
  };

  const paragrafo = (texto: string, top: number) => {
    doc.setFontSize(9.5);
    const linhas = doc.splitTextToSize(texto || "—", W - M * 2);
    let yy = top;
    for (const l of linhas) {
      if (yy > H - 70) { doc.addPage(); yy = 60; }
      doc.text(l, M, yy, { align: "justify", maxWidth: W - M * 2 });
      yy += 13;
    }
    return yy + 8;
  };

  // ---------- Setores / GHE ----------
  y = sec("1. Identificação dos setores / GHE-GES");
  for (const g of p.grupos) {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: AZUL, fontSize: 9 },
      head: [[`${g.setor} — ${g.ghe}`, ""]],
      columnStyles: { 0: { cellWidth: 150, fontStyle: "bold", fillColor: CINZA } },
      body: [
        ["Funções envolvidas", g.funcoes.join(", ")],
        ["Quantidade de trabalhadores", String(g.trabalhadores || "—")],
        ["Descrição das atividades", g.atividades],
        ["Jornada / turno", g.jornada],
        ["Organização do trabalho", g.organizacao],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 14;
    if (y > H - 120) { doc.addPage(); y = 60; }
  }

  // ---------- Metodologia ----------
  y = sec("2. Metodologia utilizada");
  paragrafo(p.metodologia, y);

  // ---------- Fatores ----------
  y = sec("3. Fatores de risco psicossocial");
  for (const g of p.grupos) {
    if (!g.fatores.length) continue;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    if (y > H - 120) { doc.addPage(); y = 60; }
    doc.text(`${g.setor} — ${g.ghe}`, M, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      styles: { fontSize: 6.6, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: AZUL, fontSize: 6.6 },
      head: [[
        "Fator", "Descrição", "Fonte/Causa", "Situação de exposição", "Expostos",
        "Freq.", "P", "S", "Nível", "Consequências", "Controles existentes",
      ]],
      body: g.fatores.map((f) => [
        f.fator, f.descricao, f.fonte, f.situacao, String(f.expostos || "—"),
        f.frequencia, String(f.probabilidade), String(f.severidade), f.nivel,
        f.consequencias, f.controles,
      ]),
      didParseCell: (d: any) => {
        if (d.section === "body" && d.column.index === 8) {
          d.cell.styles.fillColor = hexNivel(d.cell.raw as NivelRisco);
          d.cell.styles.textColor = [255, 255, 255];
          d.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 16;
  }

  // ---------- Resultado ----------
  y = sec("4. Resultado da avaliação");
  const totalTrab = p.grupos.reduce((a, g) => a + (g.trabalhadores || 0), 0) || 1;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: AZUL },
    head: [["Setor / GHE", "Fatores", "Baixo", "Médio", "Alto", "Crítico", "Predominante", "Prioritários", "% trab."]],
    body: p.grupos.map((g) => {
      const r = resumoPorGrupo(g);
      return [
        `${g.setor} — ${g.ghe}`, String(g.fatores.length),
        String(r.cont.Baixo), String(r.cont["Médio"]), String(r.cont.Alto), String(r.cont["Crítico"]),
        r.predominante, r.criticos.join("; ") || "—",
        `${Math.round(((g.trabalhadores || 0) / totalTrab) * 100)}%`,
      ];
    }),
  });
  y = (doc as any).lastAutoTable.finalY + 20;

  // ---------- Matriz ----------
  if (y > H - 260) { doc.addPage(); y = 60; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Matriz de risco — Probabilidade × Severidade", M, y);
  y += 14;
  const ocup: Record<string, number> = {};
  p.grupos.forEach((g) => g.fatores.forEach((f) => {
    const k = `${f.probabilidade}-${f.severidade}`;
    ocup[k] = (ocup[k] || 0) + 1;
  }));
  const cell = 62, x0 = M + 92;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  for (let s = 4; s >= 1; s--) {
    const row = 4 - s;
    doc.text(SEV_LABELS[s - 1], M, y + row * cell + cell / 2, { maxWidth: 88 });
    for (let pr = 1; pr <= 4; pr++) {
      const n = nivelDeRisco(pr, s);
      const [r, g2, b] = hexNivel(n);
      const qtd = ocup[`${pr}-${s}`] || 0;
      doc.setFillColor(r, g2, b);
      doc.setGState(new (doc as any).GState({ opacity: qtd ? 1 : 0.28 }));
      doc.rect(x0 + (pr - 1) * cell, y + row * cell, cell - 4, cell - 4, "F");
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
      if (qtd) {
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(String(qtd), x0 + (pr - 1) * cell + (cell - 4) / 2, y + row * cell + (cell - 4) / 2, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
      }
    }
  }
  const yEixo = y + 4 * cell + 6;
  for (let pr = 1; pr <= 4; pr++) {
    doc.text(PROB_LABELS[pr - 1], x0 + (pr - 1) * cell + (cell - 4) / 2, yEixo, { align: "center", maxWidth: cell });
  }
  y = yEixo + 24;

  // ---------- PGR ----------
  const pgr = riscosParaPgr(p.grupos);
  if (y > H - 160) { doc.addPage(); y = 60; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Riscos recomendados para gerenciamento no PGR", M, y);
  autoTable(doc, {
    startY: y + 8,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: AZUL },
    head: [["Setor", "GHE/GES", "Fator de risco", "Nível", "Justificativa técnica"]],
    body: pgr.length
      ? pgr.map((r) => [r.setor, r.ghe, r.fator, r.nivel, r.justificativa])
      : [["—", "—", "Nenhum risco demanda gerenciamento adicional no PGR conforme os resultados obtidos.", "—", "—"]],
  });

  // ---------- Medidas ----------
  y = sec("5. Medidas de prevenção e controle");
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { fontSize: 7.2, cellPadding: 3.5, overflow: "linebreak" },
    headStyles: { fillColor: AZUL },
    head: [["Setor / GHE", "Risco", "Medida recomendada", "Tipo", "Responsável", "Prazo", "Prioridade", "Status", "Evidência"]],
    body: p.medidas.length
      ? p.medidas.map((m) => [m.grupo, m.risco, m.medida, m.tipo, m.responsavel || "—", m.prazo || "—", m.prioridade, m.status, m.evidencia || "—"])
      : [["—", "—", "Não aplicável", "—", "—", "—", "—", "—", "—"]],
  });

  // ---------- Indicadores ----------
  y = sec("6. Indicadores organizacionais");
  const inds = INDICADORES_CAMPOS.filter((c) => (p.indicadores?.[c.key] || "").trim());
  if (!inds.length) {
    paragrafo("Não foram informados indicadores organizacionais para esta avaliação.", y);
  } else {
    // cards
    let cx = M, cy = y;
    const cw = (W - M * 2 - 12) / 2, ch = 54;
    for (const c of inds) {
      if (cy + ch > H - 70) { doc.addPage(); cy = 60; cx = M; }
      doc.setFillColor(...CINZA);
      doc.rect(cx, cy, cw, ch, "F");
      doc.setDrawColor(210, 216, 224);
      doc.rect(cx, cy, cw, ch);
      doc.setFontSize(7.5);
      doc.setTextColor(90, 100, 115);
      doc.text(c.label.toUpperCase(), cx + 10, cy + 18, { maxWidth: cw - 20 });
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...AZUL);
      doc.text(String(p.indicadores[c.key]).slice(0, 34), cx + 10, cy + 40, { maxWidth: cw - 20 });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      if (cx === M) cx = M + cw + 12; else { cx = M; cy += ch + 12; }
    }
    y = cy + ch + 20;

    // gráfico de barras simples (valores numéricos)
    const nums = inds
      .map((c) => ({ label: c.label, v: parseFloat(String(p.indicadores[c.key]).replace(",", ".")) }))
      .filter((x) => Number.isFinite(x.v));
    if (nums.length) {
      if (y > H - 200) { doc.addPage(); y = 60; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Indicadores quantitativos", M, y);
      y += 14;
      const max = Math.max(...nums.map((n) => n.v)) || 1;
      for (const n of nums) {
        if (y > H - 70) { doc.addPage(); y = 60; }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(n.label, M, y + 8, { maxWidth: 150 });
        const bw = ((W - M * 2 - 200) * n.v) / max;
        doc.setFillColor(...AZUL);
        doc.rect(M + 160, y, Math.max(2, bw), 11, "F");
        doc.text(String(n.v), M + 166 + Math.max(2, bw), y + 8.5);
        y += 18;
      }
    }
  }

  // ---------- Comparativo ----------
  y = sec("7. Comparativo entre setores");
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: AZUL },
    head: [["Setor", "Nº de riscos", "Baixo", "Médio", "Alto", "Crítico", "Trabalhadores expostos"]],
    body: p.grupos.map((g) => {
      const r = resumoPorGrupo(g);
      return [
        `${g.setor} — ${g.ghe}`, String(g.fatores.length),
        String(r.cont.Baixo), String(r.cont["Médio"]), String(r.cont.Alto), String(r.cont["Crítico"]),
        String(g.trabalhadores || "—"),
      ];
    }),
  });
  y = (doc as any).lastAutoTable.finalY + 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Evolução histórica", M, y);
  paragrafo(p.historico, y + 16);

  // ---------- Conclusão ----------
  y = sec("8. Conclusão técnica");
  paragrafo(p.conclusao, y);

  // ---------- Plano de ação ----------
  y = sec("9. Plano de ação");
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: AZUL },
    head: [["Risco", "Ação", "Responsável", "Prazo", "Prioridade", "Status", "Evidência"]],
    body: p.medidas.length
      ? p.medidas.map((m) => [`${m.grupo} — ${m.risco}`, m.medida, m.responsavel || "—", m.prazo || "—", m.prioridade, m.status, m.evidencia || "—"])
      : [["—", "Não aplicável", "—", "—", "—", "—", "—"]],
  });

  // ---------- Responsáveis ----------
  y = sec("10. Responsáveis e registros");
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: AZUL },
    columnStyles: { 0: { cellWidth: 190, fontStyle: "bold", fillColor: CINZA } },
    head: [["Responsáveis e registros", ""]],
    body: [
      ["Profissional responsável", p.identificacao.responsavel_nome || "—"],
      ["Registro profissional", p.identificacao.responsavel_registro || "—"],
      ["Aplicador da avaliação", p.registros.aplicador || "—"],
      ["Responsável da empresa", p.registros.responsavel_empresa || "—"],
      ["Data", p.registros.data || p.identificacao.data_avaliacao || "—"],
      ["Versão do documento", p.registros.versao || "1.0"],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 60;
  if (y > H - 120) { doc.addPage(); y = 120; }
  doc.setDrawColor(60, 60, 60);
  doc.line(M, y, M + 220, y);
  doc.line(W - M - 220, y, W - M, y);
  doc.setFontSize(8.5);
  doc.text(p.identificacao.responsavel_nome || "Profissional responsável", M, y + 14);
  doc.text(p.registros.responsavel_empresa || "Responsável da empresa", W - M - 220, y + 14);

  // ---------- Rodapé / numeração ----------
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i === 1) continue;
    doc.setDrawColor(220, 226, 234);
    doc.line(M, H - 44, W - M, H - 44);
    doc.setFontSize(7.5);
    doc.setTextColor(110, 118, 130);
    doc.text(`${p.empresa?.razao_social || ""} — Relatório Técnico de Avaliação Psicossocial`, M, H - 30, { maxWidth: W - M * 2 - 90 });
    doc.text(`Página ${i} de ${total}`, W - M, H - 30, { align: "right" });
    doc.setTextColor(30, 30, 30);
  }

  const nome = `Relatorio_Psicossocial_${(p.empresa?.razao_social || "empresa").replace(/[^\w]+/g, "_")}.pdf`;
  doc.save(nome);
}
