/**
 * Geração do Relatório Psicossocial Geral (COPSOQ) em PDF.
 *
 * Consolida todas as avaliações COPSOQ realizadas para um setor:
 *   - Cabeçalho corporativo
 *   - Resumo executivo dinâmico
 *   - Metodologia
 *   - Caracterização do trabalho
 *   - Gráficos (distribuição de risco e médias por dimensão)
 *   - Identificação dos fatores de risco
 *   - Tabela de avaliação de riscos (colorida)
 *   - Análise técnica
 *   - Conclusão
 *   - Plano de ação
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AvaliacaoPsicossocial,
  BLOCOS_COPSOQ,
  calcularPsicossocial,
} from "@/components/PsicossocialModal";

export type RelatorioContext = {
  empresa_nome?: string;
  cnpj?: string;
  contrato_numero?: string;
  setor_nome?: string;
  ges?: string;
  descricao_ambiente?: string;
  funcoes?: string[];
  jornada_trabalho?: string;
  escala?: string;
  supervisao?: string;
  atividades?: string;
  numero_funcionarios?: string | number;
  responsavel?: string;
  cargo_responsavel?: string;
  crea?: string;
  data_elaboracao?: string;
  entrevistas?: boolean;
  observacao?: boolean;
  analise_documental?: boolean;
};

const COR_NIVEL: Record<string, [number, number, number]> = {
  Baixo: [34, 197, 94],     // verde
  Moderado: [234, 179, 8],  // amarelo
  Alto: [249, 115, 22],     // laranja
  Crítico: [220, 38, 38],   // vermelho
};

const TITULOS_BLOCO: Record<string, string> = {
  exigencias: "Exigências psicológicas",
  controle: "Controle sobre o trabalho",
  apoio: "Apoio social",
  reconhecimento: "Reconhecimento",
  seguranca: "Segurança no emprego",
  conflitos: "Conflitos / Conflito trabalho-família",
  sintomas: "Estresse / Burnout (sintomas)",
};

const FATORES_POR_CATEGORIA: Record<string, { bloco: string; condicao: "alto" | "baixo"; rotulo: string }[]> = {
  "Organização do Trabalho": [
    { bloco: "exigencias", condicao: "alto", rotulo: "Sobrecarga de trabalho" },
    { bloco: "exigencias", condicao: "alto", rotulo: "Ritmo intenso / metas excessivas" },
    { bloco: "controle", condicao: "alto", rotulo: "Falta de autonomia" },
    { bloco: "sintomas", condicao: "alto", rotulo: "Jornadas prolongadas / exaustão" },
  ],
  "Relações Interpessoais": [
    { bloco: "conflitos", condicao: "alto", rotulo: "Conflitos entre equipes" },
    { bloco: "conflitos", condicao: "alto", rotulo: "Indícios de assédio moral" },
    { bloco: "apoio", condicao: "alto", rotulo: "Falta de apoio da liderança" },
  ],
  "Condições Organizacionais": [
    { bloco: "seguranca", condicao: "alto", rotulo: "Insegurança quanto ao emprego" },
    { bloco: "reconhecimento", condicao: "alto", rotulo: "Falta de reconhecimento profissional" },
    { bloco: "seguranca", condicao: "alto", rotulo: "Comunicação deficiente / mudanças organizacionais" },
  ],
  "Aspectos Emocionais": [
    { bloco: "exigencias", condicao: "alto", rotulo: "Sobrecarga emocional na função" },
    { bloco: "sintomas", condicao: "alto", rotulo: "Alta responsabilidade por erros críticos" },
  ],
};

const RECOMENDACOES: Record<string, { preventiva: string; corretiva: string }> = {
  exigencias: {
    preventiva: "Revisão da carga de trabalho e redistribuição de tarefas; planejamento de metas factíveis.",
    corretiva: "Programa de gestão do estresse, pausas regulamentadas e acompanhamento psicológico.",
  },
  controle: {
    preventiva: "Ampliar autonomia decisória e promover participação dos colaboradores no planejamento.",
    corretiva: "Treinamento de líderes em gestão participativa e revisão de processos rígidos.",
  },
  apoio: {
    preventiva: "Fortalecer canais de comunicação e ações de integração de equipes.",
    corretiva: "Programa de mentoria e apoio social no trabalho; capacitação de liderança humanizada.",
  },
  reconhecimento: {
    preventiva: "Implementar programa de reconhecimento profissional e feedback estruturado.",
    corretiva: "Revisar política de cargos, salários e meritocracia.",
  },
  seguranca: {
    preventiva: "Comunicação transparente sobre planos, mudanças e perspectivas organizacionais.",
    corretiva: "Plano formal de comunicação interna e gestão de mudanças.",
  },
  conflitos: {
    preventiva: "Programa de mediação de conflitos e canal de denúncias confidencial.",
    corretiva: "Investigação imediata de denúncias de assédio e acompanhamento psicossocial das vítimas.",
  },
  sintomas: {
    preventiva: "Programa de Promoção da Saúde Mental e qualidade de vida no trabalho.",
    corretiva: "Encaminhamento ao serviço médico/psicológico e avaliação clínica individualizada.",
  },
};

function mediaDimensao(avs: AvaliacaoPsicossocial[], blocoKey: string): number {
  if (!avs.length) return 0;
  const calc = avs.map((a) => calcularPsicossocial(a));
  const vals = calc.map((c) => c.blocos[blocoKey]?.media ?? 0);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function classificar(media: number): "Baixo" | "Moderado" | "Alto" | "Crítico" {
  if (media <= 25) return "Baixo";
  if (media <= 50) return "Moderado";
  if (media <= 75) return "Alto";
  return "Crítico";
}

function nivelGeral(avs: AvaliacaoPsicossocial[]) {
  const medias = BLOCOS_COPSOQ.map((b) => mediaDimensao(avs, b.key));
  const media = medias.reduce((a, b) => a + b, 0) / (medias.length || 1);
  return { media: Math.round(media * 10) / 10, classificacao: classificar(media) };
}

function distribuicaoPorNivel(avs: AvaliacaoPsicossocial[]) {
  const dist = { Baixo: 0, Moderado: 0, Médio: 0, Alto: 0, Crítico: 0 } as Record<string, number>;
  for (const a of avs) {
    const c = calcularPsicossocial(a);
    for (const b of BLOCOS_COPSOQ) {
      const cls = c.blocos[b.key]?.classificacao || "—";
      if (cls === "Moderado") dist["Médio"]++;
      else if (dist[cls] !== undefined) dist[cls]++;
    }
  }
  return [
    { label: "Baixo", value: dist["Baixo"], cor: COR_NIVEL["Baixo"] },
    { label: "Médio", value: dist["Médio"], cor: COR_NIVEL["Moderado"] },
    { label: "Alto", value: dist["Alto"], cor: COR_NIVEL["Alto"] },
    { label: "Crítico", value: dist["Crítico"], cor: COR_NIVEL["Crítico"] },
  ];
}

function identificarFatores(avs: AvaliacaoPsicossocial[]) {
  const medias: Record<string, number> = {};
  BLOCOS_COPSOQ.forEach((b) => (medias[b.key] = mediaDimensao(avs, b.key)));

  const resultado: Record<string, string[]> = {};
  for (const [cat, lista] of Object.entries(FATORES_POR_CATEGORIA)) {
    const itens: string[] = [];
    for (const f of lista) {
      const m = medias[f.bloco] || 0;
      // Para todos os blocos, o cálculo já converte para "risco" (positivo invertido).
      if (m > 50 && !itens.includes(f.rotulo)) itens.push(f.rotulo);
    }
    if (itens.length) resultado[cat] = itens;
  }
  return resultado;
}

function buildResumoExecutivo(
  avs: AvaliacaoPsicossocial[],
  ctx: RelatorioContext,
): string {
  const ng = nivelGeral(avs);
  const fatores = identificarFatores(avs);
  const principais = Object.values(fatores).flat().slice(0, 4);
  const partes: string[] = [];
  partes.push(
    `O setor ${ctx.setor_nome || ""} apresentou, na consolidação de ${avs.length} questionário(s) COPSOQ, ` +
    `nível geral de risco psicossocial classificado como ${ng.classificacao} (média ${ng.media}).`,
  );
  if (principais.length) {
    partes.push(
      `Os principais fatores de risco identificados foram: ${principais.join(", ")}.`,
    );
  } else {
    partes.push("Não foram identificados fatores de risco psicossocial relevantes nesta amostra.");
  }
  if (ng.classificacao === "Crítico" || ng.classificacao === "Alto") {
    partes.push(
      "Recomenda-se intervenção prioritária com adoção de medidas preventivas e corretivas descritas no Plano de Ação.",
    );
  } else if (ng.classificacao === "Moderado") {
    partes.push(
      "Recomenda-se monitoramento sistemático e implementação progressiva das ações sugeridas neste relatório.",
    );
  } else {
    partes.push(
      "O cenário psicossocial é favorável; recomenda-se manter as boas práticas e realizar nova avaliação periódica.",
    );
  }
  return partes.join(" ");
}

function buildAnaliseTecnica(avs: AvaliacaoPsicossocial[]): string[] {
  const ng = nivelGeral(avs);
  const fatores = identificarFatores(avs);
  const mediasOrden = BLOCOS_COPSOQ
    .map((b) => ({ key: b.key, titulo: TITULOS_BLOCO[b.key], media: mediaDimensao(avs, b.key) }))
    .sort((a, b) => b.media - a.media);
  const top = mediasOrden.slice(0, 3);

  const paragrafos: string[] = [];
  paragrafos.push(
    `Principais Achados: a análise consolidada das ${avs.length} avaliação(ões) evidenciou nível geral ${ng.classificacao} ` +
    `(média ${ng.media}/100), com maior intensidade nas dimensões ${top.map((t) => `${t.titulo} (${t.media})`).join(", ")}.`,
  );
  const totFatores = Object.values(fatores).flat().length;
  paragrafos.push(
    `Indicadores Observados: foram identificados ${totFatores} fator(es) de risco distribuídos em ${Object.keys(fatores).length} categoria(s) de análise psicossocial. ` +
    `Os percentuais médios indicam que dimensões organizacionais (controle, reconhecimento, segurança) impactam diretamente na percepção de bem-estar.`,
  );
  if (avs.length > 1) {
    const nomes = avs.map((a) => a.colaborador_nome).filter(Boolean);
    paragrafos.push(
      `Comparação Entre Grupos: a amostra é composta por ${avs.length} colaboradores (${nomes.slice(0, 5).join(", ")}${nomes.length > 5 ? "…" : ""}). ` +
      `A consistência das respostas reforça que os fatores identificados são percebidos coletivamente, e não como percepção isolada.`,
    );
  }
  paragrafos.push(
    `Tendências Identificadas: os dados indicam que as dimensões com piores resultados devem ser priorizadas no Plano de Ação, ` +
    `pois apresentam correlação direta com sintomas de estresse ocupacional e potencial desenvolvimento de quadros de burnout.`,
  );
  return paragrafos;
}

function buildConclusao(avs: AvaliacaoPsicossocial[]): string {
  const ng = nivelGeral(avs);
  const fatores = identificarFatores(avs);
  const principais = Object.values(fatores).flat();
  let txt = `Com base na análise consolidada das respostas ao questionário COPSOQ, conclui-se que o setor apresenta nível geral de risco psicossocial ${ng.classificacao} (média ${ng.media}/100). `;
  if (principais.length) {
    txt += `Os principais fatores que requerem atenção são: ${principais.join(", ")}. `;
  }
  if (ng.classificacao === "Crítico") {
    txt += "Há necessidade de intervenção imediata, com adoção das medidas preventivas e corretivas detalhadas no Plano de Ação, e acompanhamento psicológico/médico ocupacional dos colaboradores expostos.";
  } else if (ng.classificacao === "Alto") {
    txt += "Recomenda-se intervenção prioritária em até 90 dias para mitigar os fatores identificados antes que se traduzam em adoecimento.";
  } else if (ng.classificacao === "Moderado") {
    txt += "Recomenda-se monitoramento contínuo, com implementação gradual das ações de promoção da saúde mental.";
  } else {
    txt += "Não há necessidade de intervenção imediata; recomenda-se manter as boas práticas atuais e reavaliar periodicamente.";
  }
  return txt;
}

function buildPlanoAcao(avs: AvaliacaoPsicossocial[]) {
  const fatores = identificarFatores(avs);
  const linhas: { risco: string; preventiva: string; corretiva: string; responsavel: string; prazo: string; acompanhamento: string }[] = [];
  for (const [cat, lista] of Object.entries(fatores)) {
    for (const item of lista) {
      // Identifica bloco mais provável a partir do rótulo
      let blocoChave = "exigencias";
      if (/autonomia/i.test(item)) blocoChave = "controle";
      else if (/apoio|liderança/i.test(item)) blocoChave = "apoio";
      else if (/reconhecimento/i.test(item)) blocoChave = "reconhecimento";
      else if (/insegurança|comunicação|mudanças/i.test(item)) blocoChave = "seguranca";
      else if (/conflito|assédio/i.test(item)) blocoChave = "conflitos";
      else if (/exaustão|burnout|estresse|emocional|jornada/i.test(item)) blocoChave = "sintomas";
      const rec = RECOMENDACOES[blocoChave];
      linhas.push({
        risco: `${cat} — ${item}`,
        preventiva: rec.preventiva,
        corretiva: rec.corretiva,
        responsavel: "RH / SESMT",
        prazo: blocoChave === "conflitos" ? "30 dias" : blocoChave === "sintomas" ? "60 dias" : "90 dias",
        acompanhamento: "Reavaliação trimestral via COPSOQ",
      });
    }
  }
  return linhas;
}

// ─── Renderização de gráficos com primitivas do jsPDF ───
function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  data: { label: string; value: number; cor: [number, number, number] }[],
  yMax = 100,
  unit = "",
) {
  const padding = { l: 10, r: 4, t: 6, b: 22 };
  const chartW = w - padding.l - padding.r;
  const chartH = h - padding.t - padding.b;
  // Eixos
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(x + padding.l, y + padding.t, x + padding.l, y + padding.t + chartH);
  doc.line(x + padding.l, y + padding.t + chartH, x + padding.l + chartW, y + padding.t + chartH);

  const bw = chartW / data.length;
  doc.setFontSize(7);
  doc.setTextColor(80);
  data.forEach((d, i) => {
    const barH = yMax > 0 ? (d.value / yMax) * chartH : 0;
    const bx = x + padding.l + i * bw + bw * 0.15;
    const by = y + padding.t + chartH - barH;
    const bWidth = bw * 0.7;
    doc.setFillColor(d.cor[0], d.cor[1], d.cor[2]);
    doc.rect(bx, by, bWidth, barH, "F");
    // valor no topo
    doc.setTextColor(40);
    doc.text(`${d.value}${unit}`, bx + bWidth / 2, by - 1.5, { align: "center" });
    // rótulo abaixo (rotacionado se necessário)
    doc.setTextColor(60);
    const label = d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label;
    doc.text(label, bx + bWidth / 2, y + padding.t + chartH + 4, { align: "center" });
  });
}

function addHeader(doc: jsPDF, ctx: RelatorioContext) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pw, 26, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RELATÓRIO PSICOSSOCIAL GERAL — COPSOQ", pw / 2, 11, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${ctx.empresa_nome || ""}${ctx.cnpj ? " • CNPJ " + ctx.cnpj : ""}`,
    pw / 2,
    18,
    { align: "center" },
  );
  doc.text(
    `Setor: ${ctx.setor_nome || "—"}${ctx.ges ? " • GHE/GES " + ctx.ges : ""}`,
    pw / 2,
    23,
    { align: "center" },
  );
  doc.setTextColor(0);
}

function addFooter(doc: jsPDF) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Relatório gerado automaticamente — Sistema SST", 10, ph - 6);
    doc.text(`Página ${i} de ${total}`, pw - 10, ph - 6, { align: "right" });
  }
}

function section(doc: jsPDF, y: number, titulo: string): number {
  if (y > 270) {
    doc.addPage();
    y = 32;
  }
  doc.setFillColor(15, 23, 42);
  doc.rect(10, y, 190, 7, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(titulo, 13, y + 5);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  return y + 12;
}

function paragraph(doc: jsPDF, y: number, txt: string, size = 10): number {
  doc.setFontSize(size);
  doc.setTextColor(40);
  const split = doc.splitTextToSize(txt, 190);
  if (y + split.length * 4.5 > 285) {
    doc.addPage();
    y = 32;
  }
  doc.text(split, 10, y);
  return y + split.length * 4.5 + 2;
}

export function gerarRelatorioCopsoqPDF(
  avaliacoes: AvaliacaoPsicossocial[],
  ctx: RelatorioContext,
) {
  if (!avaliacoes || avaliacoes.length === 0) {
    throw new Error("Não há avaliações COPSOQ para gerar o relatório.");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();

  addHeader(doc, ctx);

  // ── 1. Cabeçalho (bloco informativo)
  let y = 32;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("1. Identificação", 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const datas = [
    ["Empresa", ctx.empresa_nome || "—"],
    ["CNPJ", ctx.cnpj || "—"],
    ["Contrato", ctx.contrato_numero || "—"],
    ["Setor avaliado", ctx.setor_nome || "—"],
    ["Data da avaliação", ctx.data_elaboracao || "—"],
    ["Colaboradores avaliados", String(avaliacoes.length)],
    ["Responsável pela avaliação", `${ctx.responsavel || "—"}${ctx.crea ? " (" + ctx.crea + ")" : ""}`],
    ["Data de emissão", new Date().toLocaleDateString("pt-BR")],
  ];
  autoTable(doc, {
    startY: y,
    head: [],
    body: datas,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55, fillColor: [241, 245, 249] } },
    margin: { left: 10, right: 10 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── 2. Resumo executivo
  y = section(doc, y, "2. Resumo Executivo");
  y = paragraph(doc, y, buildResumoExecutivo(avaliacoes, ctx));

  // ── 3. Metodologia
  y = section(doc, y, "3. Metodologia Utilizada");
  y = paragraph(
    doc,
    y,
    "A presente avaliação psicossocial foi realizada por meio da aplicação do questionário COPSOQ (Copenhagen Psychosocial Questionnaire), instrumento internacionalmente validado para identificação de fatores psicossociais relacionados ao trabalho. A coleta de informações considerou os dados obtidos através dos questionários respondidos pelos colaboradores, complementados pela análise das condições organizacionais do setor avaliado. Foram considerados aspectos relacionados à organização do trabalho, relações interpessoais, demandas emocionais, liderança, reconhecimento, segurança ocupacional e bem-estar dos trabalhadores.",
  );
  const complementos: string[] = [];
  if (ctx.entrevistas) complementos.push("Entrevistas individuais");
  if (ctx.observacao) complementos.push("Observação das atividades");
  if (ctx.analise_documental) complementos.push("Análise documental (absenteísmo, afastamentos, acidentes, reclamações e registros internos)");
  if (complementos.length) {
    y = paragraph(doc, y, "Métodos complementares utilizados: " + complementos.join("; ") + ".");
  }

  // ── 4. Caracterização do trabalho
  y = section(doc, y, "4. Caracterização do Trabalho");
  const carac: [string, string][] = [];
  if (ctx.setor_nome) carac.push(["Setor avaliado", ctx.setor_nome]);
  if (ctx.funcoes?.length) carac.push(["Funções avaliadas", ctx.funcoes.join(", ")]);
  if (ctx.numero_funcionarios) carac.push(["Quantidade de trabalhadores", String(ctx.numero_funcionarios)]);
  if (ctx.jornada_trabalho) carac.push(["Jornada de trabalho", ctx.jornada_trabalho]);
  if (ctx.escala) carac.push(["Escalas aplicadas", ctx.escala]);
  if (ctx.supervisao) carac.push(["Forma de supervisão", ctx.supervisao]);
  if (ctx.atividades || ctx.descricao_ambiente)
    carac.push(["Principais atividades", ctx.atividades || ctx.descricao_ambiente!]);
  if (carac.length) {
    autoTable(doc, {
      startY: y,
      body: carac,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55, fillColor: [241, 245, 249] } },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  } else {
    y = paragraph(doc, y, "Dados de caracterização não informados.");
  }

  // ── 5. Gráficos e indicadores
  y = section(doc, y, "5. Gráficos e Indicadores COPSOQ");
  // Gráfico 1 — distribuição
  if (y + 60 > 285) { doc.addPage(); y = 32; }
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Gráfico 1 — Distribuição geral dos riscos psicossociais", 10, y);
  doc.setFont("helvetica", "normal");
  drawBarChart(doc, 10, y + 2, pw - 20, 55, distribuicaoPorNivel(avaliacoes), Math.max(...distribuicaoPorNivel(avaliacoes).map((d) => d.value), 1));
  y += 62;

  // Gráfico 2 — média por dimensão
  if (y + 70 > 285) { doc.addPage(); y = 32; }
  doc.setFont("helvetica", "bold");
  doc.text("Gráfico 2 — Pontuação média por dimensão COPSOQ (0-100)", 10, y);
  doc.setFont("helvetica", "normal");
  const dimData = BLOCOS_COPSOQ.map((b) => {
    const m = mediaDimensao(avaliacoes, b.key);
    return { label: TITULOS_BLOCO[b.key] || b.titulo, value: m, cor: COR_NIVEL[classificar(m)] };
  });
  drawBarChart(doc, 10, y + 2, pw - 20, 65, dimData, 100);
  y += 72;

  // ── 6. Fatores de risco
  y = section(doc, y, "6. Identificação dos Fatores de Risco Psicossocial");
  const fatores = identificarFatores(avaliacoes);
  if (!Object.keys(fatores).length) {
    y = paragraph(doc, y, "Não foram identificados fatores de risco psicossocial significativos nesta amostra.");
  } else {
    for (const [cat, itens] of Object.entries(fatores)) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      if (y > 280) { doc.addPage(); y = 32; }
      doc.text(cat, 10, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      for (const item of itens) {
        if (y > 285) { doc.addPage(); y = 32; }
        doc.text(`• ${item}`, 14, y);
        y += 4.5;
      }
      y += 1.5;
    }
  }

  // ── 7. Avaliação dos riscos
  y = section(doc, y, "7. Avaliação dos Riscos");
  const tabela: any[] = [];
  for (const b of BLOCOS_COPSOQ) {
    const m = mediaDimensao(avaliacoes, b.key);
    if (m <= 25) continue;
    const cls = classificar(m);
    const prob = m > 75 ? "Muito Alta" : m > 50 ? "Alta" : m > 25 ? "Média" : "Baixa";
    const grav = cls === "Crítico" ? "Muito Alta" : cls === "Alto" ? "Alta" : cls === "Moderado" ? "Média" : "Baixa";
    tabela.push([TITULOS_BLOCO[b.key] || b.titulo, `${ctx.setor_nome || "—"} / ${(ctx.funcoes || []).join(", ") || "—"}`, prob, grav, cls]);
  }
  if (!tabela.length) {
    y = paragraph(doc, y, "Nenhum risco psicossocial classificado acima de Baixo.");
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Fator de Risco", "Setor / Função Exposta", "Probabilidade", "Gravidade", "Nível de Risco"]],
      body: tabela,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 1.8 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const cor = COR_NIVEL[String(data.cell.raw)];
          if (cor) {
            data.cell.styles.fillColor = cor;
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── 8. Análise técnica
  y = section(doc, y, "8. Resultados e Análise");
  for (const p of buildAnaliseTecnica(avaliacoes)) {
    y = paragraph(doc, y, p);
  }

  // ── 9. Conclusão
  y = section(doc, y, "9. Conclusão Técnica");
  y = paragraph(doc, y, buildConclusao(avaliacoes));

  // ── 10. Plano de ação
  y = section(doc, y, "10. Plano de Ação");
  const plano = buildPlanoAcao(avaliacoes);
  if (!plano.length) {
    y = paragraph(doc, y, "Não há ações corretivas obrigatórias. Recomenda-se a manutenção das boas práticas vigentes e a reavaliação periódica.");
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Risco Identificado", "Medida Preventiva", "Medida Corretiva", "Responsável", "Prazo", "Acompanhamento"]],
      body: plano.map((p) => [p.risco, p.preventiva, p.corretiva, p.responsavel, p.prazo, p.acompanhamento]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.5, valign: "top" },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Assinatura
  if (y > 260) { doc.addPage(); y = 40; }
  y += 12;
  doc.setDrawColor(80);
  doc.line(60, y, 150, y);
  doc.setFontSize(9);
  doc.text(ctx.responsavel || "Responsável Técnico", 105, y + 4, { align: "center" });
  if (ctx.cargo_responsavel || ctx.crea) {
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text(
      `${ctx.cargo_responsavel || ""}${ctx.crea ? "  •  " + ctx.crea : ""}`,
      105,
      y + 8,
      { align: "center" },
    );
  }

  addFooter(doc);

  const fileName = `relatorio_psicossocial_${(ctx.setor_nome || "setor").replace(/\s+/g, "_").toLowerCase()}.pdf`;
  doc.save(fileName);
}
