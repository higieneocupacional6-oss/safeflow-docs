import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  GrupoRelatorio, MedidaControle, NivelRisco, PROB_LABELS, SEV_LABELS,
  hexNivel, nivelDeRisco, resumoPorGrupo, riscosParaPgr, matrizOcupada,
  indicadoresPreenchidos,
} from "@/lib/psicoRelatorio";

const AZUL: [number, number, number] = [23, 58, 94];
const CINZA: [number, number, number] = [240, 243, 247];
const BORDA: [number, number, number] = [205, 213, 224];

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
  /** Texto técnico interpretativo dos indicadores organizacionais. */
  interpretacaoIndicadores?: string;
  /** Texto introdutório do plano de ação. */
  introPlanoAcao?: string;
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
  const M = 52;                 // margens laterais
  const CONT = W - M * 2;       // 491pt
  const TOPO = 72;              // início do conteúdo em páginas de continuação
  const RODAPE = H - 64;        // limite inferior do conteúdo

  const novaPagina = () => { doc.addPage(); return TOPO; };
  const garantir = (y: number, altura: number) => (y + altura > RODAPE ? novaPagina() : y);

  // ---------- Capa ----------
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, W, 210, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.text(textoPdf("RELATÓRIO TÉCNICO DE"), M, 96);
  doc.text(textoPdf("AVALIAÇÃO PSICOSSOCIAL"), M, 126);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(textoPdf("NR-01 · NR-17 — Gerenciamento de Riscos Psicossociais"), M, 152);

  doc.setTextColor(30, 30, 30);
  let y = 248;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const razao = doc.splitTextToSize(cel(p.empresa?.razao_social), CONT);
  doc.text(razao, M, y);
  y += 18 * razao.length + 10;
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
    margin: { left: M, right: M, top: TOPO, bottom: 64 },
    theme: "grid",
    rowPageBreak: "avoid",
    styles: { fontSize: 9.5, cellPadding: 6, overflow: "linebreak", valign: "top", lineColor: BORDA, lineWidth: 0.4 },
    headStyles: { fillColor: AZUL, textColor: 255, fontSize: 9.5 },
    head: [[textoPdf("Identificação da empresa"), ""]],
    columnStyles: { 0: { cellWidth: 175, fontStyle: "bold", fillColor: CINZA }, 1: { cellWidth: CONT - 175 } },
    body: capa.map(([k, v]) => [textoPdf(k), cel(v)]),
  });

  /**
   * Cabeçalho de seção. Só abre nova página quando não há espaço útil suficiente,
   * evitando grandes áreas em branco entre as seções.
   */
  const sec = (titulo: string, atual?: number) => {
    let yy = atual ?? TOPO;
    if (atual === undefined || yy + 120 > RODAPE) {
      doc.addPage();
      yy = 46;
    } else {
      yy += 10;
    }
    doc.setFillColor(...AZUL);
    doc.rect(M, yy, CONT, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(textoPdf(titulo).toUpperCase(), M + 10, yy + 17, { maxWidth: CONT - 20 });
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    return yy + 46;
  };

  /** Parágrafo justificado, com quebra de página segura (última linha nunca esticada). */
  const paragrafo = (texto: string, top: number, tamanho = 9.5) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(tamanho);
    let yy = top;
    const blocos = textoPdf(texto || "—").split("\n");
    for (const bloco of blocos) {
      if (!bloco.trim()) { yy += 5; continue; }
      const linhas: string[] = doc.splitTextToSize(bloco, CONT);
      linhas.forEach((linha, i) => {
        yy = garantir(yy, 14);
        const ultima = i === linhas.length - 1;
        if (ultima || linha.trim().split(/\s+/).length < 4) doc.text(linha, M, yy);
        else doc.text(linha, M, yy, { align: "justify", maxWidth: CONT });
        yy += tamanho + 4.5;
      });
      yy += 6;
    }
    return yy + 4;
  };

  const subtitulo = (texto: string, top: number) => {
    // mantém o título junto ao conteúdo correspondente
    const yy = garantir(top, 90);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(textoPdf(texto), M, yy, { maxWidth: CONT });
    doc.setFont("helvetica", "normal");
    return yy + 16;
  };

  const tabela = (opts: any) => {
    autoTable(doc, {
      margin: { left: M, right: M, top: TOPO, bottom: 64 },
      theme: "grid",
      tableWidth: CONT,
      rowPageBreak: "avoid",
      showHead: "everyPage",
      styles: { fontSize: 8, cellPadding: 4.5, overflow: "linebreak", valign: "top", lineWidth: 0.4, lineColor: BORDA },
      headStyles: { fillColor: AZUL, textColor: 255, fontSize: 8, halign: "left", valign: "middle" },
      ...opts,
    });
    return (doc as any).lastAutoTable.finalY + 16;
  };

  // ---------- 1. Setores / GHE ----------
  y = sec("1. Identificação dos setores / GHE-GES");
  for (const g of p.grupos) {
    y = tabela({
      startY: garantir(y, 110),
      head: [[textoPdf(`${g.setor} — ${g.ghe}`), ""]],
      columnStyles: { 0: { cellWidth: 165, fontStyle: "bold", fillColor: CINZA }, 1: { cellWidth: CONT - 165 } },
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
  y = sec("2. Metodologia utilizada", y);
  y = paragrafo(p.metodologia, y);

  // ---------- 3. Fatores ----------
  y = sec("3. Fatores de risco psicossocial investigados", y);
  y = paragrafo(
    "Todas as dimensões investigadas no instrumento aplicado estão apresentadas a seguir, independentemente do resultado obtido. Fator investigado não se confunde com fator de risco caracterizado: quando não há evidências suficientes de agravamento, o fator é registrado como investigado e classificado em nível Baixo ou como não identificado, mantendo-se a rastreabilidade integral da avaliação.",
    y, 9.5,
  );

  for (const g of p.grupos) {
    if (!g.fatores.length) continue;
    y = subtitulo(`${g.setor} — ${g.ghe}`, y);
    for (const f of g.fatores) {
      const nivelTxt = f.sustentado === false ? `${f.nivel} — não identificado` : f.nivel;
      y = tabela({
        startY: garantir(y, 180),
        columnStyles: { 0: { cellWidth: 140, fontStyle: "bold", fillColor: CINZA }, 1: { cellWidth: CONT - 140 } },
        headStyles: {
          fillColor: hexNivel(f.nivel), textColor: 255, fontSize: 8.5, halign: "left", valign: "middle",
        },
        head: [[textoPdf(f.fator), textoPdf(`Nível: ${nivelTxt}  |  P${f.probabilidade} x S${f.severidade}`)]],
        body: [
          ["Descrição", f.descricao],
          ["Fonte / Causa", f.fonte],
          ["Situação de exposição", f.situacao],
          ["Trabalhadores expostos", String(f.expostos || "—")],
          ["Frequência", f.frequencia],
          ["Interpretação técnica", (f as any).interpretacao],
          ["Consequências potenciais", f.consequencias],
          ["Controles existentes", f.controles],
        ].map(([k, v]) => [textoPdf(k), cel(v)]),
      });
    }
  }

  // ---------- 4. Resultado ----------
  y = sec("4. Resultado da avaliação", y);
  const totalTrab = p.grupos.reduce((a, g) => a + (g.trabalhadores || 0), 0) || 1;
  y = tabela({
    startY: y,
    head: [["Setor / GHE", "Investig.", "Baixo", "Não ident.", "Médio", "Alto", "Crítico", "Predominante", "% trab."].map(textoPdf)],
    columnStyles: {
      0: { cellWidth: 118 }, 1: { cellWidth: 46, halign: "center" }, 2: { cellWidth: 38, halign: "center" },
      3: { cellWidth: 50, halign: "center" }, 4: { cellWidth: 38, halign: "center" }, 5: { cellWidth: 34, halign: "center" },
      6: { cellWidth: 40, halign: "center" }, 7: { cellWidth: 82 }, 8: { cellWidth: 45, halign: "center" },
    },
    body: p.grupos.map((g) => {
      const r = resumoPorGrupo(g);
      return [
        cel(`${g.setor} — ${g.ghe}`), String(r.investigados),
        String(r.cont.Baixo), String(r.naoIdentificado), String(r.cont["Médio"]),
        String(r.cont.Alto), String(r.cont["Crítico"]),
        cel(r.predominante),
        `${Math.round(((g.trabalhadores || 0) / totalTrab) * 100)}%`,
      ];
    }),
  });

  const prioritarios = p.grupos
    .filter((g) => g.fatores.some((f) => f.nivel === "Alto" || f.nivel === "Crítico"))
    .map((g) => `${g.setor} (${g.ghe})`);
  y = paragrafo(
    prioritarios.length
      ? `Setores prioritários para intervenção, conforme os fatores caracterizados em níveis Alto ou Crítico: ${prioritarios.join("; ")}.`
      : "Não foram identificados setores em condição prioritária de intervenção nesta avaliação.",
    y, 9.5,
  );

  // ---------- Matriz (somente riscos caracterizados) ----------
  const ocup = matrizOcupada(p.grupos);
  const totalMatriz = Object.values(ocup).reduce((a, b) => a + b, 0);
  const cell = 56, x0 = M + 100, alturaMatriz = cell * 4 + 52;

  y = garantir(y, alturaMatriz + 60);
  y = subtitulo("Matriz de risco — Probabilidade x Severidade", y);
  y = paragrafo(
    "A matriz representa somente os riscos caracterizados que demandam representação metodológica. Fatores classificados em nível Baixo e fatores não identificados não são plotados, permanecendo registrados nas seções 3 e 4.1 para fins de rastreabilidade.",
    y, 9,
  );

  if (!totalMatriz) {
    y = paragrafo(
      "Nenhum risco caracterizado a representar na matriz conforme os critérios da metodologia adotada.",
      y, 9.5,
    );
  } else {
    y = garantir(y, alturaMatriz);
    doc.setFontSize(7.6);
    doc.setFont("helvetica", "normal");
    for (let s = 4; s >= 1; s--) {
      const row = 4 - s;
      doc.text(textoPdf(SEV_LABELS[s - 1]), M, y + row * cell + cell / 2, { maxWidth: 94 });
      for (let pr = 1; pr <= 4; pr++) {
        const n = nivelDeRisco(pr, s);
        const [r, g2, b] = hexNivel(n);
        const qtd = ocup[`${pr}-${s}`] || 0;
        doc.setFillColor(r, g2, b);
        doc.setGState(new (doc as any).GState({ opacity: qtd ? 1 : 0.25 }));
        doc.rect(x0 + (pr - 1) * cell, y + row * cell, cell - 4, cell - 4, "F");
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
        if (qtd) {
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text(String(qtd), x0 + (pr - 1) * cell + (cell - 4) / 2, y + row * cell + (cell - 4) / 2 + 3.5, { align: "center" });
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.6);
          doc.setTextColor(30, 30, 30);
        }
      }
    }
    const yEixo = y + 4 * cell + 10;
    for (let pr = 1; pr <= 4; pr++) {
      doc.text(textoPdf(PROB_LABELS[pr - 1]), x0 + (pr - 1) * cell + (cell - 4) / 2, yEixo, { align: "center", maxWidth: cell - 4 });
    }
    y = yEixo + 24;
  }

  // ---------- PGR (rastreabilidade completa) ----------
  const pgr = riscosParaPgr(p.grupos);
  y = garantir(y, 110);
  y = subtitulo("4.1 Riscos recomendados para gerenciamento no PGR", y);
  y = paragrafo(
    "Constam todos os fatores investigados, com distinção entre o resultado da avaliação e a necessidade de intervenção. Fatores classificados como Baixo ou não identificados permanecem registrados para assegurar a rastreabilidade completa da avaliação.",
    y, 9,
  );
  y = tabela({
    startY: y,
    styles: { fontSize: 7.6, cellPadding: 4, overflow: "linebreak", valign: "top", lineWidth: 0.4, lineColor: BORDA },
    headStyles: { fillColor: AZUL, textColor: 255, fontSize: 7.6, halign: "left", valign: "middle" },
    head: [["Setor", "GHE/GES", "Fator investigado", "Resultado", "Intervenção", "Justificativa técnica"].map(textoPdf)],
    columnStyles: {
      0: { cellWidth: 66 }, 1: { cellWidth: 52 }, 2: { cellWidth: 78 },
      3: { cellWidth: 88 }, 4: { cellWidth: 76 }, 5: { cellWidth: 131 },
    },
    body: pgr.length
      ? pgr.map((r) => [cel(r.setor), cel(r.ghe), cel(r.fator), cel(r.resultado), cel(r.intervencao), cel(r.justificativa)])
      : [[textoPdf("Nenhum fator investigado registrado."), "—", "—", "—", "—", "—"]],
  });

  // ---------- 5. Medidas ----------
  y = sec("5. Medidas de prevenção e controle", y);
  y = tabela({
    startY: y,
    styles: { fontSize: 7.8, cellPadding: 4, overflow: "linebreak", valign: "top", lineWidth: 0.4, lineColor: BORDA },
    headStyles: { fillColor: AZUL, textColor: 255, fontSize: 7.8, halign: "left", valign: "middle" },
    head: [["Setor / GHE — Risco", "Medida recomendada", "Tipo", "Prazo", "Prioridade"].map(textoPdf)],
    columnStyles: {
      0: { cellWidth: 118 }, 1: { cellWidth: 195 }, 2: { cellWidth: 66 },
      3: { cellWidth: 58 }, 4: { cellWidth: 54 },
    },
    body: p.medidas.length
      ? p.medidas.map((m) => [cel(`${m.grupo} — ${m.risco}`), cel(m.medida), cel(m.tipo), cel(m.prazo), cel(m.prioridade)])
      : [["—", textoPdf("Não aplicável"), "—", "—", "—"]],
  });

  // ---------- 6. Indicadores ----------
  y = sec("6. Indicadores organizacionais", y);
  const { numericos, qualitativos } = indicadoresPreenchidos(p.indicadores);

  if (!numericos.length && !qualitativos.length) {
    y = paragrafo("Não foram informados indicadores organizacionais para esta avaliação.", y);
  } else {
    if (numericos.length) {
      y = subtitulo("Indicadores quantitativos informados", y);
      const max = Math.max(...numericos.map((n) => n.valor)) || 1;
      const rotulo = 190, larguraMax = CONT - rotulo - 58;
      for (const n of numericos) {
        y = garantir(y, 26);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.2);
        doc.setTextColor(40, 46, 56);
        const linhas = doc.splitTextToSize(textoPdf(n.label), rotulo - 10);
        doc.text(linhas[0], M, y + 10);
        const [r, g2, b] = hexToRgb(n.cor);
        const bw = Math.max(3, (larguraMax * Math.abs(n.valor)) / max);
        doc.setFillColor(r, g2, b);
        doc.roundedRect(M + rotulo, y, bw, 13, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.text(textoPdf(n.texto), M + rotulo + bw + 6, y + 10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        y += 22;
      }
      y += 8;
    }

    if (qualitativos.length) {
      y = garantir(y, 60);
      y = subtitulo("Indicadores qualitativos informados", y);
      y = tabela({
        startY: y,
        columnStyles: { 0: { cellWidth: 190, fontStyle: "bold", fillColor: CINZA }, 1: { cellWidth: CONT - 190 } },
        head: [[textoPdf("Indicador"), textoPdf("Informação registrada")]],
        body: qualitativos.map((q) => [textoPdf(q.label), cel(q.texto)]),
      });
    }

    y = garantir(y, 90);
    y = subtitulo("Análise técnica dos indicadores", y);
    y = paragrafo(p.interpretacaoIndicadores || "", y);
  }

  // ---------- 7. Comparativo ----------
  y = sec("7. Comparativo entre setores", y);
  y = tabela({
    startY: y,
    styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak", valign: "top", lineWidth: 0.4, lineColor: BORDA },
    head: [["Setor / GHE", "Fatores investigados", "Baixo", "Não identificado", "Médio", "Alto", "Crítico", "Trab. envolvidos"].map(textoPdf)],
    columnStyles: {
      0: { cellWidth: 126 }, 1: { cellWidth: 62, halign: "center" }, 2: { cellWidth: 40, halign: "center" },
      3: { cellWidth: 66, halign: "center" }, 4: { cellWidth: 40, halign: "center" },
      5: { cellWidth: 36, halign: "center" }, 6: { cellWidth: 42, halign: "center" }, 7: { cellWidth: 79, halign: "center" },
    },
    body: p.grupos.map((g) => {
      const r = resumoPorGrupo(g);
      return [
        cel(`${g.setor} — ${g.ghe}`), String(r.investigados),
        String(r.cont.Baixo), String(r.naoIdentificado), String(r.cont["Médio"]),
        String(r.cont.Alto), String(r.cont["Crítico"]),
        String(g.trabalhadores || "—"),
      ];
    }),
  });
  y = garantir(y, 80);
  y = subtitulo("Evolução histórica", y);
  y = paragrafo(p.historico, y);

  // ---------- 8. Conclusão ----------
  y = sec("8. Conclusão técnica", y);
  y = paragrafo(p.conclusao, y);

  // ---------- 9. Plano de ação ----------
  y = sec("9. Plano de ação", y);
  if (p.introPlanoAcao) y = paragrafo(p.introPlanoAcao, y);
  y = tabela({
    startY: y,
    styles: { fontSize: 7.6, cellPadding: 4, overflow: "linebreak", valign: "top", lineWidth: 0.4, lineColor: BORDA },
    headStyles: { fillColor: AZUL, textColor: 255, fontSize: 7.6, halign: "left", valign: "middle" },
    head: [["Risco", "Ação", "Responsável", "Prazo", "Prioridade", "Status", "Evidência"].map(textoPdf)],
    columnStyles: {
      0: { cellWidth: 96 }, 1: { cellWidth: 148 }, 2: { cellWidth: 52 }, 3: { cellWidth: 54 },
      4: { cellWidth: 52 }, 5: { cellWidth: 48 }, 6: { cellWidth: 41 },
    },
    body: p.medidas.length
      ? p.medidas.map((m) => [cel(`${m.grupo} — ${m.risco}`), cel(m.medida), cel(m.responsavel), cel(m.prazo), cel(m.prioridade), cel(m.status), cel(m.evidencia)])
      : [["—", textoPdf("Não aplicável"), "—", "—", "—", "—", "—"]],
  });

  // ---------- 10. Responsáveis ----------
  y = sec("10. Responsáveis e registros", y);
  y = tabela({
    startY: y,
    styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak", valign: "top", lineWidth: 0.4, lineColor: BORDA },
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

  y = garantir(y + 54, 70);
  doc.setDrawColor(60, 60, 60);
  doc.line(M, y, M + 200, y);
  doc.line(W - M - 200, y, W - M, y);
  doc.setFontSize(8.5);
  doc.text(doc.splitTextToSize(cel(p.identificacao.responsavel_nome) || "Profissional responsável", 200)[0], M, y + 14);
  doc.text(doc.splitTextToSize(cel(p.registros.responsavel_empresa) || "Responsável da empresa", 200)[0], W - M - 200, y + 14);

  // ---------- Rodapé / numeração ----------
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i === 1) continue;
    doc.setDrawColor(220, 226, 234);
    doc.line(M, H - 46, W - M, H - 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(110, 118, 130);
    const rodape = doc.splitTextToSize(
      textoPdf(`${p.empresa?.razao_social || ""} — Relatório Técnico de Avaliação Psicossocial`),
      CONT - 110,
    )[0];
    doc.text(rodape, M, H - 31);
    doc.text(`Página ${i} de ${total}`, W - M, H - 31, { align: "right" });
    doc.setTextColor(30, 30, 30);
  }

  const nome = `Relatorio_Psicossocial_${(p.empresa?.razao_social || "empresa").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "_")}.pdf`;
  doc.save(nome);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}
