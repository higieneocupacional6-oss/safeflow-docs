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

/**
 * Sanitiza o texto para as fontes padrão do jsPDF (codificação WinAnsi/CP-1252),
 * preservando integralmente a acentuação do português do Brasil e substituindo
 * apenas os símbolos que não possuem glifo correspondente.
 */
const MAPA_SIMBOLOS: Record<string, string> = {
  "≥": ">=", "≤": "<=", "≠": "<>", "→": "->", "←": "<-", "⇒": "=>",
  "✓": "-", "✔": "-", "✗": "x", "•": "-", "‣": "-", "▪": "-", "●": "-",
  "\u00a0": " ", "\u2007": " ", "\u202f": " ", "\ufeff": "", "\u200b": "",
  "″": '"', "′": "'", "‑": "-", "‒": "-", "―": "-",
};

export function textoPdf(v: any): string {
  let s = v === null || v === undefined ? "" : String(v);
  s = s.normalize("NFC");
  s = s.replace(/[≥≤≠→←⇒✓✔✗•‣▪●\u00a0\u2007\u202f\ufeff\u200b″′‑‒―]/g, (c) => MAPA_SIMBOLOS[c] ?? " ");
  // remove controles e qualquer caractere fora do conjunto suportado pelas fontes padrão
  s = s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  s = s.replace(/[^\u0009\u000a\u0020-\u024f\u2010-\u2027\u2030-\u205e\u20ac]/g, "");
  return s.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").trim();
}

const cel = (v: any) => textoPdf(v) || "—";

export function gerarPdfPsicossocial(p: PdfPayload) {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  doc.setProperties({ title: textoPdf(p.titulo), subject: "Relatório Técnico de Avaliação Psicossocial" });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 42;
  const CONT = W - M * 2;
  const TOPO = 60;         // início do conteúdo em páginas de continuação
  const RODAPE = H - 58;   // limite inferior do conteúdo

  const novaPagina = () => { doc.addPage(); return TOPO; };
  const garantir = (y: number, altura: number) => (y + altura > RODAPE ? novaPagina() : y);

  // ---------- Capa ----------
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, W, 210, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("RELATORIO TECNICO DE".normalize(), M, 96);
  doc.text(textoPdf("AVALIAÇÃO PSICOSSOCIAL"), M, 126);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(textoPdf("NR-01 · NR-17 — Gerenciamento de Riscos Psicossociais"), M, 152);

  doc.setTextColor(30, 30, 30);
  let y = 250;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(doc.splitTextToSize(cel(p.empresa?.razao_social), CONT), M, y);
  y += 26;
  doc.setFont("helvetica", "normal");

  const capa: [string, string][] = [
    ["Nome fantasia", p.identificacao.nome_fantasia],
    ["CNPJ", p.identificacao.cnpj],
    ["CNAE", p.identificacao.cnae],
    ["Endereço", p.identificacao.endereco],
    ["Unidade / Estabelecimento", p.identificacao.unidade],
    ["Contrato", p.contrato?.numero_contrato],
    ["Responsável pela avaliação", p.identificacao.responsavel_nome],
    ["Registro profissional", p.identificacao.responsavel_registro],
    ["Data da avaliação", p.identificacao.data_avaliacao],
    ["Versão do documento", p.registros.versao],
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, top: TOPO, bottom: 58 },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: AZUL, textColor: 255 },
    head: [[textoPdf("Identificação da empresa"), ""]],
    columnStyles: { 0: { cellWidth: 170, fontStyle: "bold", fillColor: CINZA }, 1: { cellWidth: CONT - 170 } },
    body: capa.map(([k, v]) => [textoPdf(k), cel(v)]),
  });

  const sec = (titulo: string) => {
    doc.addPage();
    doc.setFillColor(...AZUL);
    doc.rect(M, 40, CONT, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(textoPdf(titulo).toUpperCase(), M + 10, 57, { maxWidth: CONT - 20 });
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    return 86;
  };

  /** Parágrafo justificado, com quebra de página segura (última linha nunca esticada). */
  const paragrafo = (texto: string, top: number, tamanho = 9.5) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(tamanho);
    let yy = top;
    const blocos = textoPdf(texto || "—").split("\n");
    for (const bloco of blocos) {
      if (!bloco.trim()) { yy += 6; continue; }
      const linhas: string[] = doc.splitTextToSize(bloco, CONT);
      linhas.forEach((linha, i) => {
        yy = garantir(yy, 14);
        const ultima = i === linhas.length - 1;
        if (ultima || linha.trim().split(/\s+/).length < 4) doc.text(linha, M, yy);
        else doc.text(linha, M, yy, { align: "justify", maxWidth: CONT });
        yy += tamanho + 4.5;
      });
      yy += 5;
    }
    return yy + 4;
  };

  const subtitulo = (texto: string, top: number) => {
    const yy = garantir(top, 26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(textoPdf(texto), M, yy, { maxWidth: CONT });
    doc.setFont("helvetica", "normal");
    return yy + 12;
  };

  const tabela = (opts: any) => {
    autoTable(doc, {
      margin: { left: M, right: M, top: TOPO, bottom: 58 },
      theme: "grid",
      tableWidth: CONT,
      rowPageBreak: "auto",
      styles: { fontSize: 7.5, cellPadding: 3.5, overflow: "linebreak", valign: "top", lineWidth: 0.3 },
      headStyles: { fillColor: AZUL, textColor: 255, fontSize: 7.5, halign: "left" },
      ...opts,
    });
    return (doc as any).lastAutoTable.finalY + 16;
  };

  // ---------- 1. Setores / GHE ----------
  y = sec("1. Identificação dos setores / GHE-GES");
  for (const g of p.grupos) {
    y = tabela({
      startY: garantir(y, 90),
      head: [[textoPdf(`${g.setor} — ${g.ghe}`), ""]],
      columnStyles: { 0: { cellWidth: 150, fontStyle: "bold", fillColor: CINZA }, 1: { cellWidth: CONT - 150 } },
      body: [
        ["Funções envolvidas", g.funcoes.join(", ")],
        ["Quantidade de trabalhadores", String(g.trabalhadores || "—")],
        ["Descrição resumida das atividades", g.atividades],
        ["Jornada / turno", g.jornada],
        ["Características da organização do trabalho", g.organizacao],
      ].map(([k, v]) => [textoPdf(k), cel(v)]),
    });
  }

  // ---------- 2. Metodologia ----------
  y = sec("2. Metodologia utilizada");
  paragrafo(p.metodologia, y);

  // ---------- 3. Fatores ----------
  y = sec("3. Fatores de risco psicossocial investigados");
  y = paragrafo(
    "Todas as dimensões investigadas no instrumento aplicado estão apresentadas a seguir. Fator investigado não se confunde com fator de risco caracterizado: quando não há evidências suficientes de agravamento, o fator é registrado como investigado e classificado em nível Baixo, mantendo-se a rastreabilidade da avaliação.",
    y, 9,
  );
  for (const g of p.grupos) {
    if (!g.fatores.length) continue;
    y = subtitulo(`${g.setor} — ${g.ghe}`, y);
    y = tabela({
      startY: y,
      styles: { fontSize: 6.2, cellPadding: 2.6, overflow: "linebreak", valign: "top", lineWidth: 0.3 },
      headStyles: { fillColor: AZUL, textColor: 255, fontSize: 6.2, halign: "left" },
      head: [[
        "Fator", "Descrição", "Fonte/Causa", "Situação", "Exp.", "Freq.", "P", "S", "Nível",
        "Interpretação", "Consequências", "Controles",
      ].map(textoPdf)],
      columnStyles: {
        0: { cellWidth: 52 }, 1: { cellWidth: 62 }, 2: { cellWidth: 62 }, 3: { cellWidth: 58 },
        4: { cellWidth: 20, halign: "center" }, 5: { cellWidth: 34 },
        6: { cellWidth: 14, halign: "center" }, 7: { cellWidth: 14, halign: "center" },
        8: { cellWidth: 34, halign: "center" }, 9: { cellWidth: 68 }, 10: { cellWidth: 62 },
      },
      body: g.fatores.map((f) => [
        cel(f.fator), cel(f.descricao), cel(f.fonte), cel(f.situacao), String(f.expostos || "—"),
        cel(f.frequencia), String(f.probabilidade), String(f.severidade), cel(f.nivel),
        cel((f as any).interpretacao), cel(f.consequencias), cel(f.controles),
      ]),
      didParseCell: (d: any) => {
        if (d.section === "body" && d.column.index === 8) {
          d.cell.styles.fillColor = hexNivel(d.cell.raw as NivelRisco);
          d.cell.styles.textColor = [255, 255, 255];
          d.cell.styles.fontStyle = "bold";
        }
      },
    });
  }

  // ---------- 4. Resultado ----------
  y = sec("4. Resultado da avaliação");
  const totalTrab = p.grupos.reduce((a, g) => a + (g.trabalhadores || 0), 0) || 1;
  y = tabela({
    startY: y,
    styles: { fontSize: 7.4, cellPadding: 3.5, overflow: "linebreak", valign: "top", lineWidth: 0.3 },
    head: [["Setor / GHE", "Fatores", "Baixo", "Médio", "Alto", "Crítico", "Predominante", "Prioritários", "% trab."].map(textoPdf)],
    columnStyles: {
      0: { cellWidth: 108 }, 1: { cellWidth: 34, halign: "center" }, 2: { cellWidth: 32, halign: "center" },
      3: { cellWidth: 32, halign: "center" }, 4: { cellWidth: 30, halign: "center" }, 5: { cellWidth: 34, halign: "center" },
      6: { cellWidth: 58 }, 7: { cellWidth: 130 }, 8: { cellWidth: 42, halign: "center" },
    },
    body: p.grupos.map((g) => {
      const r = resumoPorGrupo(g);
      return [
        cel(`${g.setor} — ${g.ghe}`), String(g.fatores.length),
        String(r.cont.Baixo), String(r.cont["Médio"]), String(r.cont.Alto), String(r.cont["Crítico"]),
        cel(r.predominante), cel(r.criticos.join("; ")),
        `${Math.round(((g.trabalhadores || 0) / totalTrab) * 100)}%`,
      ];
    }),
  });

  // ---------- Matriz ----------
  const cell = 58, x0 = M + 96, alturaMatriz = cell * 4 + 46;
  y = garantir(y, alturaMatriz + 24);
  y = subtitulo("Matriz de risco — Probabilidade x Severidade", y);
  const ocup: Record<string, number> = {};
  p.grupos.forEach((g) => g.fatores.forEach((f) => {
    const k = `${f.probabilidade}-${f.severidade}`;
    ocup[k] = (ocup[k] || 0) + 1;
  }));
  doc.setFontSize(7.2);
  doc.setFont("helvetica", "normal");
  for (let s = 4; s >= 1; s--) {
    const row = 4 - s;
    doc.text(textoPdf(SEV_LABELS[s - 1]), M, y + row * cell + cell / 2, { maxWidth: 90 });
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
        doc.setFontSize(10);
        doc.text(String(qtd), x0 + (pr - 1) * cell + (cell - 4) / 2, y + row * cell + (cell - 4) / 2 + 3, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(30, 30, 30);
      }
    }
  }
  const yEixo = y + 4 * cell + 8;
  for (let pr = 1; pr <= 4; pr++) {
    doc.text(textoPdf(PROB_LABELS[pr - 1]), x0 + (pr - 1) * cell + (cell - 4) / 2, yEixo, { align: "center", maxWidth: cell - 4 });
  }
  y = yEixo + 26;

  // ---------- PGR ----------
  const pgr = riscosParaPgr(p.grupos);
  y = garantir(y, 90);
  y = subtitulo("Riscos recomendados para gerenciamento no PGR", y);
  y = tabela({
    startY: y,
    head: [["Setor", "GHE/GES", "Fator de risco", "Nível", "Justificativa técnica"].map(textoPdf)],
    columnStyles: {
      0: { cellWidth: 80 }, 1: { cellWidth: 66 }, 2: { cellWidth: 88 },
      3: { cellWidth: 44, halign: "center" }, 4: { cellWidth: CONT - 278 },
    },
    body: pgr.length
      ? pgr.map((r) => [cel(r.setor), cel(r.ghe), cel(r.fator), cel(r.nivel), cel(r.justificativa)])
      : [["—", "—", textoPdf("Nenhum risco demanda gerenciamento adicional no PGR conforme os resultados obtidos."), "—", "—"]],
  });

  // ---------- 5. Medidas ----------
  y = sec("5. Medidas de prevenção e controle");
  tabela({
    startY: y,
    styles: { fontSize: 6.8, cellPadding: 3, overflow: "linebreak", valign: "top", lineWidth: 0.3 },
    headStyles: { fillColor: AZUL, textColor: 255, fontSize: 6.8, halign: "left" },
    head: [["Setor / GHE", "Risco", "Medida recomendada", "Tipo", "Responsável", "Prazo", "Prioridade", "Status", "Evidência"].map(textoPdf)],
    columnStyles: {
      0: { cellWidth: 70 }, 1: { cellWidth: 62 }, 2: { cellWidth: 138 }, 3: { cellWidth: 56 },
      4: { cellWidth: 54 }, 5: { cellWidth: 60 }, 6: { cellWidth: 46 }, 7: { cellWidth: 46 },
      8: { cellWidth: CONT - 532 },
    },
    body: p.medidas.length
      ? p.medidas.map((m) => [cel(m.grupo), cel(m.risco), cel(m.medida), cel(m.tipo), cel(m.responsavel), cel(m.prazo), cel(m.prioridade), cel(m.status), cel(m.evidencia)])
      : [["—", "—", textoPdf("Não aplicável"), "—", "—", "—", "—", "—", "—"]],
  });

  // ---------- 6. Indicadores ----------
  y = sec("6. Indicadores organizacionais");
  const inds = INDICADORES_CAMPOS.filter((c) => (p.indicadores?.[c.key] || "").trim());
  if (!inds.length) {
    paragrafo("Não foram informados indicadores organizacionais para esta avaliação.", y);
  } else {
    let cx = M, cy = y;
    const cw = (CONT - 12) / 2, ch = 54;
    for (const c of inds) {
      if (cy + ch > RODAPE) { cy = novaPagina(); cx = M; }
      doc.setFillColor(...CINZA);
      doc.rect(cx, cy, cw, ch, "F");
      doc.setDrawColor(210, 216, 224);
      doc.rect(cx, cy, cw, ch);
      doc.setFontSize(7.2);
      doc.setTextColor(90, 100, 115);
      doc.text(textoPdf(c.label).toUpperCase(), cx + 10, cy + 17, { maxWidth: cw - 20 });
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...AZUL);
      const valor = doc.splitTextToSize(cel(p.indicadores[c.key]), cw - 20)[0];
      doc.text(valor, cx + 10, cy + 40);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      if (cx === M) cx = M + cw + 12; else { cx = M; cy += ch + 12; }
    }
    y = (cx === M ? cy : cy + ch + 12) + 14;

    const nums = inds
      .map((c) => ({ label: c.label, v: parseFloat(String(p.indicadores[c.key]).replace(",", ".")) }))
      .filter((x) => Number.isFinite(x.v));
    if (nums.length) {
      y = garantir(y, 40 + nums.length * 18);
      y = subtitulo("Indicadores quantitativos", y);
      const max = Math.max(...nums.map((n) => n.v)) || 1;
      for (const n of nums) {
        y = garantir(y, 20);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(doc.splitTextToSize(textoPdf(n.label), 150)[0], M, y + 8);
        const larguraMax = CONT - 160 - 60;
        const bw = Math.max(2, (larguraMax * n.v) / max);
        doc.setFillColor(...AZUL);
        doc.rect(M + 160, y, bw, 11, "F");
        doc.text(String(n.v), M + 166 + bw, y + 8.5);
        y += 18;
      }
    }
  }

  // ---------- 7. Comparativo ----------
  y = sec("7. Comparativo entre setores");
  y = tabela({
    startY: y,
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak", valign: "top", lineWidth: 0.3 },
    head: [["Setor", "Nº de riscos", "Baixo", "Médio", "Alto", "Crítico", "Trabalhadores expostos"].map(textoPdf)],
    columnStyles: {
      0: { cellWidth: CONT - 340 }, 1: { cellWidth: 60, halign: "center" }, 2: { cellWidth: 44, halign: "center" },
      3: { cellWidth: 44, halign: "center" }, 4: { cellWidth: 44, halign: "center" },
      5: { cellWidth: 44, halign: "center" }, 6: { cellWidth: 104, halign: "center" },
    },
    body: p.grupos.map((g) => {
      const r = resumoPorGrupo(g);
      return [
        cel(`${g.setor} — ${g.ghe}`), String(g.fatores.length),
        String(r.cont.Baixo), String(r.cont["Médio"]), String(r.cont.Alto), String(r.cont["Crítico"]),
        String(g.trabalhadores || "—"),
      ];
    }),
  });
  y = garantir(y, 60);
  y = subtitulo("Evolução histórica", y);
  paragrafo(p.historico, y);

  // ---------- 8. Conclusão ----------
  y = sec("8. Conclusão técnica");
  paragrafo(p.conclusao, y);

  // ---------- 9. Plano de ação ----------
  y = sec("9. Plano de ação");
  tabela({
    startY: y,
    styles: { fontSize: 7, cellPadding: 3.5, overflow: "linebreak", valign: "top", lineWidth: 0.3 },
    headStyles: { fillColor: AZUL, textColor: 255, fontSize: 7, halign: "left" },
    head: [["Risco", "Ação", "Responsável", "Prazo", "Prioridade", "Status", "Evidência"].map(textoPdf)],
    columnStyles: {
      0: { cellWidth: 110 }, 1: { cellWidth: 168 }, 2: { cellWidth: 62 }, 3: { cellWidth: 70 },
      4: { cellWidth: 50 }, 5: { cellWidth: 54 }, 6: { cellWidth: CONT - 514 },
    },
    body: p.medidas.length
      ? p.medidas.map((m) => [cel(`${m.grupo} — ${m.risco}`), cel(m.medida), cel(m.responsavel), cel(m.prazo), cel(m.prioridade), cel(m.status), cel(m.evidencia)])
      : [["—", textoPdf("Não aplicável"), "—", "—", "—", "—", "—"]],
  });

  // ---------- 10. Responsáveis ----------
  y = sec("10. Responsáveis e registros");
  y = tabela({
    startY: y,
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak", valign: "top", lineWidth: 0.3 },
    columnStyles: { 0: { cellWidth: 190, fontStyle: "bold", fillColor: CINZA }, 1: { cellWidth: CONT - 190 } },
    head: [[textoPdf("Responsáveis e registros"), ""]],
    body: [
      ["Profissional responsável", p.identificacao.responsavel_nome],
      ["Registro profissional", p.identificacao.responsavel_registro],
      ["Aplicador da avaliação", p.registros.aplicador],
      ["Responsável da empresa", p.registros.responsavel_empresa],
      ["Data", p.registros.data || p.identificacao.data_avaliacao],
      ["Versão do documento", p.registros.versao || "1.0"],
    ].map(([k, v]) => [textoPdf(k), cel(v)]),
  });

  y = garantir(y + 50, 60);
  doc.setDrawColor(60, 60, 60);
  doc.line(M, y, M + 210, y);
  doc.line(W - M - 210, y, W - M, y);
  doc.setFontSize(8.5);
  doc.text(doc.splitTextToSize(cel(p.identificacao.responsavel_nome) || "Profissional responsável", 210)[0], M, y + 14);
  doc.text(doc.splitTextToSize(cel(p.registros.responsavel_empresa) || "Responsável da empresa", 210)[0], W - M - 210, y + 14);

  // ---------- Rodapé / numeração ----------
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i === 1) continue;
    doc.setDrawColor(220, 226, 234);
    doc.line(M, H - 42, W - M, H - 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 118, 130);
    const rodape = doc.splitTextToSize(
      textoPdf(`${p.empresa?.razao_social || ""} — Relatório Técnico de Avaliação Psicossocial`),
      CONT - 100,
    )[0];
    doc.text(rodape, M, H - 28);
    doc.text(`Página ${i} de ${total}`, W - M, H - 28, { align: "right" });
    doc.setTextColor(30, 30, 30);
  }

  const nome = `Relatorio_Psicossocial_${(p.empresa?.razao_social || "empresa").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "_")}.pdf`;
  doc.save(nome);
}
