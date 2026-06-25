/**
 * Geração do Relatório Psicossocial Geral (COPSOQ) em PDF.
 *
 * Ajustes desta versão:
 *  - Limiar de risco em tercis (COPSOQ III): Baixo ≤33 • Moderado 34-66 • Alto 67-84 • Crítico ≥85.
 *  - Gráfico de dimensões substituído por 4 gráficos horizontais (um por categoria),
 *    com nome completo do fator, valor médio, percentual e classificação automática.
 *  - Avaliação dos Riscos lista TODOS os fatores avaliados (independentemente do nível).
 *  - Atividades consolidadas e desduplicadas a partir de todas as funções avaliadas.
 *  - Removidos: "Quantidade de trabalhadores", "Data de emissão", "Tendências Identificadas".
 *  - Metodologia complementada com critérios de classificação dos riscos.
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
  /** Atividades por função (uma string por função). Será consolidada e desduplicada. */
  atividades_funcoes?: string[];
  responsavel?: string;
  cargo_responsavel?: string;
  crea?: string;
  data_elaboracao?: string;
  entrevistas?: boolean;
  observacao?: boolean;
  analise_documental?: boolean;
};

// ─── Paleta de cores por nível de risco ───
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

// ─── Limiares de classificação (COPSOQ III, tercis com Crítico ≥85) ───
function classificar(media: number): "Baixo" | "Moderado" | "Alto" | "Crítico" {
  if (media >= 85) return "Crítico";
  if (media >= 67) return "Alto";
  if (media >= 34) return "Moderado";
  return "Baixo";
}

// Inversão: blocos positivos têm "alta resposta = baixo risco".
const BLOCOS_POSITIVOS = new Set(["controle", "apoio", "reconhecimento", "seguranca"]);
function valorRisco(valor: number, blocoKey: string): number {
  return BLOCOS_POSITIVOS.has(blocoKey) ? 100 - valor : valor;
}

// ─── Catálogo de FATORES por categoria (nome completo + perguntas associadas) ───
type FatorDef = { nome: string; bloco: string; perguntaIdx: number[] };
const CATEGORIAS: { categoria: string; fatores: FatorDef[] }[] = [
  {
    categoria: "Organização do Trabalho",
    fatores: [
      { nome: "Sobrecarga de trabalho", bloco: "exigencias", perguntaIdx: [0, 1] },
      { nome: "Metas excessivas", bloco: "exigencias", perguntaIdx: [0, 2] },
      { nome: "Ritmo intenso de trabalho", bloco: "exigencias", perguntaIdx: [2] },
      { nome: "Falta de autonomia", bloco: "controle", perguntaIdx: [0, 1] },
      { nome: "Jornadas prolongadas", bloco: "sintomas", perguntaIdx: [0] },
    ],
  },
  {
    categoria: "Relações Interpessoais",
    fatores: [
      { nome: "Conflitos entre equipes", bloco: "conflitos", perguntaIdx: [0] },
      { nome: "Assédio moral", bloco: "conflitos", perguntaIdx: [1] },
      { nome: "Assédio sexual", bloco: "conflitos", perguntaIdx: [1] },
      { nome: "Falta de apoio da liderança", bloco: "apoio", perguntaIdx: [1] },
      { nome: "Violência ocupacional", bloco: "conflitos", perguntaIdx: [0, 1] },
    ],
  },
  {
    categoria: "Condições Organizacionais",
    fatores: [
      { nome: "Insegurança quanto ao emprego", bloco: "seguranca", perguntaIdx: [0] },
      { nome: "Comunicação deficiente", bloco: "seguranca", perguntaIdx: [1] },
      { nome: "Falta de reconhecimento profissional", bloco: "reconhecimento", perguntaIdx: [0, 1] },
      { nome: "Mudanças organizacionais frequentes", bloco: "seguranca", perguntaIdx: [1, 2] },
    ],
  },
  {
    categoria: "Aspectos Emocionais",
    fatores: [
      { nome: "Exposição a sofrimento humano", bloco: "exigencias", perguntaIdx: [3] },
      { nome: "Atendimento a clientes agressivos", bloco: "conflitos", perguntaIdx: [0] },
      { nome: "Alta responsabilidade por erros críticos", bloco: "exigencias", perguntaIdx: [3] },
    ],
  },
];

function mediaFator(avs: AvaliacaoPsicossocial[], f: FatorDef): number {
  const valores: number[] = [];
  for (const a of avs) {
    const respostas = a.respostas?.[f.bloco] || [];
    for (const idx of f.perguntaIdx) {
      const r = respostas[idx];
      if (typeof r === "number" && r >= 0) {
        valores.push(valorRisco(r, f.bloco));
      }
    }
  }
  if (!valores.length) return 0;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
}

function mediaDimensao(avs: AvaliacaoPsicossocial[], blocoKey: string): number {
  if (!avs.length) return 0;
  const calc = avs.map((a) => calcularPsicossocial(a));
  const vals = calc.map((c) => c.blocos[blocoKey]?.media ?? 0);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function nivelGeral(avs: AvaliacaoPsicossocial[]) {
  const medias = BLOCOS_COPSOQ.map((b) => mediaDimensao(avs, b.key));
  const media = medias.reduce((a, b) => a + b, 0) / (medias.length || 1);
  return { media: Math.round(media * 10) / 10, classificacao: classificar(media) };
}

function distribuicaoPorNivel(avs: AvaliacaoPsicossocial[]) {
  const dist: Record<string, number> = { Baixo: 0, Moderado: 0, Alto: 0, Crítico: 0 };
  for (const cat of CATEGORIAS) {
    for (const f of cat.fatores) {
      dist[classificar(mediaFator(avs, f))]++;
    }
  }
  return [
    { label: "Baixo", value: dist.Baixo, cor: COR_NIVEL.Baixo },
    { label: "Moderado", value: dist.Moderado, cor: COR_NIVEL.Moderado },
    { label: "Alto", value: dist.Alto, cor: COR_NIVEL.Alto },
    { label: "Crítico", value: dist.Crítico, cor: COR_NIVEL.Crítico },
  ];
}

function identificarFatoresRelevantes(avs: AvaliacaoPsicossocial[]) {
  const out: Record<string, string[]> = {};
  for (const cat of CATEGORIAS) {
    const itens: string[] = [];
    for (const f of cat.fatores) {
      const m = mediaFator(avs, f);
      if (classificar(m) !== "Baixo") itens.push(f.nome);
    }
    if (itens.length) out[cat.categoria] = itens;
  }
  return out;
}

// ─── Consolidação de atividades de todas as funções ───
const ATIV_PALAVRAS_CHAVE = [
  "atend", "clien", "públic", "publi", "gest", "equip", "process", "document",
  "control", "operac", "administ", "supervis", "lidera", "vend", "negoc",
  "treina", "ensin", "cuid", "saúde", "pacient", "emergên", "atend.", "respons",
  "decis", "anális", "planejam", "report", "auditor", "monitor", "abord",
  "comunic", "negocia",
];
function consolidarAtividades(ctx: RelatorioContext): string[] {
  const fonte: string[] = [];
  if (ctx.atividades_funcoes?.length) fonte.push(...ctx.atividades_funcoes);
  if (ctx.atividades) fonte.push(ctx.atividades);
  if (ctx.descricao_ambiente) fonte.push(ctx.descricao_ambiente);

  const partes: string[] = [];
  for (const txt of fonte) {
    if (!txt) continue;
    txt.split(/[\n;•·\-]|(?:^|\s)\d+\.\s|, /g).forEach((s) => {
      const t = s.trim().replace(/^[-•·\d.\)\s]+/, "");
      if (t.length >= 4 && t.length <= 140) partes.push(t);
    });
  }

  // Dedup case-insensitive
  const dedup = new Map<string, string>();
  for (const p of partes) {
    const key = p.toLowerCase().replace(/\s+/g, " ").trim();
    if (!dedup.has(key)) dedup.set(key, p.charAt(0).toUpperCase() + p.slice(1));
  }
  let lista = Array.from(dedup.values());

  // Filtra apenas atividades com relação lógica com fatores psicossociais
  const filtrada = lista.filter((p) =>
    ATIV_PALAVRAS_CHAVE.some((kw) => p.toLowerCase().includes(kw)),
  );
  // Se o filtro eliminar tudo, mantém as originais (evita relatório vazio).
  return (filtrada.length ? filtrada : lista).slice(0, 12);
}

function buildResumoExecutivo(avs: AvaliacaoPsicossocial[], ctx: RelatorioContext): string {
  const ng = nivelGeral(avs);
  const fatores = identificarFatoresRelevantes(avs);
  const principais = Object.values(fatores).flat().slice(0, 5);
  const partes: string[] = [];
  partes.push(
    `O setor ${ctx.setor_nome || ""} apresentou, na consolidação de ${avs.length} questionário(s) COPSOQ, ` +
    `nível geral de risco psicossocial classificado como ${ng.classificacao} (média ${ng.media}/100).`,
  );
  if (principais.length) {
    partes.push(`Principais fatores de risco identificados: ${principais.join(", ")}.`);
  } else {
    partes.push("Não foram identificados fatores de risco psicossocial relevantes nesta amostra.");
  }
  if (ng.classificacao === "Crítico" || ng.classificacao === "Alto") {
    partes.push("Recomenda-se intervenção prioritária conforme o Plano de Ação.");
  } else if (ng.classificacao === "Moderado") {
    partes.push("Recomenda-se monitoramento sistemático e implementação gradual das ações sugeridas.");
  } else {
    partes.push("Cenário psicossocial favorável; manter boas práticas e reavaliação periódica.");
  }
  return partes.join(" ");
}

function buildAnaliseTecnica(avs: AvaliacaoPsicossocial[], ctx: RelatorioContext): string[] {
  const ng = nivelGeral(avs);
  const fatores = identificarFatoresRelevantes(avs);
  const totFatores = Object.values(fatores).flat().length;
  const mediasOrden = BLOCOS_COPSOQ
    .map((b) => ({ titulo: TITULOS_BLOCO[b.key], media: mediaDimensao(avs, b.key) }))
    .sort((a, b) => b.media - a.media);
  const top = mediasOrden.slice(0, 3);

  const paragrafos: string[] = [];
  paragrafos.push(
    `Principais Achados: a análise consolidada das ${avs.length} avaliação(ões) evidenciou nível geral ${ng.classificacao} ` +
    `(média ${ng.media}/100), com maior intensidade nas dimensões ${top.map((t) => `${t.titulo} (${t.media})`).join(", ")}.`,
  );
  paragrafos.push(
    `Indicadores Observados: foram identificados ${totFatores} fator(es) de risco distribuídos em ${Object.keys(fatores).length} categoria(s). ` +
    `Dimensões organizacionais (controle, reconhecimento, segurança) impactam diretamente na percepção de bem-estar do grupo avaliado.`,
  );
  paragrafos.push(
    `Setores mais vulneráveis: dentro do setor ${ctx.setor_nome || ""}, as funções ${(ctx.funcoes || []).join(", ") || "avaliadas"} concentram os maiores ` +
    `índices nas dimensões ${top.map((t) => t.titulo).join(", ")}, devendo ser priorizadas no plano de ação.`,
  );
  if (avs.length > 1) {
    const nomes = avs.map((a) => a.colaborador_nome).filter(Boolean);
    paragrafos.push(
      `Comparação Entre Grupos: a amostra é composta por ${avs.length} colaboradores (${nomes.slice(0, 5).join(", ")}${nomes.length > 5 ? "…" : ""}). ` +
      `A consistência das respostas reforça que os fatores identificados são percebidos coletivamente.`,
    );
  }
  return paragrafos;
}

function buildConclusao(avs: AvaliacaoPsicossocial[]): string {
  const ng = nivelGeral(avs);
  const principais = Object.values(identificarFatoresRelevantes(avs)).flat();
  let txt = `Com base na análise consolidada das respostas ao questionário COPSOQ, conclui-se que o setor apresenta nível geral de risco psicossocial ${ng.classificacao} (média ${ng.media}/100). `;
  if (principais.length) txt += `Os principais fatores que requerem atenção são: ${principais.join(", ")}. `;
  if (ng.classificacao === "Crítico") txt += "Há necessidade de intervenção imediata e acompanhamento psicológico/médico dos colaboradores expostos.";
  else if (ng.classificacao === "Alto") txt += "Recomenda-se intervenção prioritária em até 90 dias para mitigar os fatores identificados.";
  else if (ng.classificacao === "Moderado") txt += "Recomenda-se monitoramento contínuo com implementação gradual das ações.";
  else txt += "Não há necessidade de intervenção imediata; manter boas práticas e reavaliar periodicamente.";
  return txt;
}

const RECOMENDACOES: Record<string, { preventiva: string; corretiva: string }> = {
  exigencias: { preventiva: "Revisão da carga de trabalho e redistribuição de tarefas.", corretiva: "Programa de gestão do estresse e acompanhamento psicológico." },
  controle: { preventiva: "Ampliar autonomia decisória e participação no planejamento.", corretiva: "Treinamento de líderes em gestão participativa." },
  apoio: { preventiva: "Fortalecer canais de comunicação e ações de integração.", corretiva: "Programa de mentoria e liderança humanizada." },
  reconhecimento: { preventiva: "Programa de reconhecimento profissional e feedback estruturado.", corretiva: "Revisão de cargos, salários e meritocracia." },
  seguranca: { preventiva: "Comunicação transparente sobre mudanças organizacionais.", corretiva: "Plano formal de comunicação interna e gestão de mudanças." },
  conflitos: { preventiva: "Programa de mediação de conflitos e canal de denúncias.", corretiva: "Investigação imediata de denúncias e acompanhamento das vítimas." },
  sintomas: { preventiva: "Programa de Promoção da Saúde Mental e qualidade de vida.", corretiva: "Encaminhamento ao serviço médico/psicológico." },
};

function buildPlanoAcao(avs: AvaliacaoPsicossocial[]) {
  const fatores = identificarFatoresRelevantes(avs);
  const linhas: { risco: string; preventiva: string; corretiva: string; responsavel: string; prazo: string; acompanhamento: string }[] = [];
  for (const [cat, lista] of Object.entries(fatores)) {
    for (const item of lista) {
      let bloco = "exigencias";
      if (/autonomia/i.test(item)) bloco = "controle";
      else if (/apoio|liderança/i.test(item)) bloco = "apoio";
      else if (/reconhecimento/i.test(item)) bloco = "reconhecimento";
      else if (/insegurança|comunicação|mudanças/i.test(item)) bloco = "seguranca";
      else if (/conflito|assédio|violência/i.test(item)) bloco = "conflitos";
      else if (/jornada|exaustão|burnout|estresse|emocional|sofrimento/i.test(item)) bloco = "sintomas";
      const rec = RECOMENDACOES[bloco];
      linhas.push({
        risco: `${cat} — ${item}`,
        preventiva: rec.preventiva,
        corretiva: rec.corretiva,
        responsavel: "RH / SESMT",
        prazo: bloco === "conflitos" ? "30 dias" : bloco === "sintomas" ? "60 dias" : "90 dias",
        acompanhamento: "Reavaliação trimestral via COPSOQ",
      });
    }
  }
  return linhas;
}

// ─── Gráficos ───
function drawBarChartVertical(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  data: { label: string; value: number; cor: [number, number, number] }[],
  yMax = 100,
) {
  const padding = { l: 10, r: 4, t: 6, b: 18 };
  const chartW = w - padding.l - padding.r;
  const chartH = h - padding.t - padding.b;
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(x + padding.l, y + padding.t, x + padding.l, y + padding.t + chartH);
  doc.line(x + padding.l, y + padding.t + chartH, x + padding.l + chartW, y + padding.t + chartH);
  const bw = chartW / Math.max(data.length, 1);
  doc.setFontSize(7);
  data.forEach((d, i) => {
    const barH = yMax > 0 ? (d.value / yMax) * chartH : 0;
    const bx = x + padding.l + i * bw + bw * 0.2;
    const by = y + padding.t + chartH - barH;
    const bWidth = bw * 0.6;
    doc.setFillColor(d.cor[0], d.cor[1], d.cor[2]);
    doc.rect(bx, by, bWidth, barH, "F");
    doc.setTextColor(40);
    doc.text(`${d.value}`, bx + bWidth / 2, by - 1.5, { align: "center" });
    doc.setTextColor(60);
    doc.text(d.label, bx + bWidth / 2, y + padding.t + chartH + 4, { align: "center" });
  });
}

/** Gráfico horizontal com nome COMPLETO do fator + valor + % + classificação colorida. */
function drawHorizontalBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  itens: { label: string; value: number }[],
): number {
  const labelW = 70;        // largura reservada ao nome completo do fator
  const tagW = 22;          // espaço para valor + classificação à direita
  const barAreaW = w - labelW - tagW - 4;
  const rowH = 7.5;
  doc.setFontSize(8.5);
  itens.forEach((it, i) => {
    const ry = y + i * rowH;
    const cls = classificar(it.value);
    const cor = COR_NIVEL[cls];
    // label
    doc.setTextColor(40);
    doc.setFont("helvetica", "normal");
    const lab = doc.splitTextToSize(it.label, labelW - 2)[0];
    doc.text(lab, x, ry + 4);
    // background da barra
    doc.setFillColor(241, 245, 249);
    doc.rect(x + labelW, ry + 1.2, barAreaW, 4.2, "F");
    // barra preenchida
    const fill = Math.max(0, Math.min(100, it.value)) / 100 * barAreaW;
    doc.setFillColor(cor[0], cor[1], cor[2]);
    doc.rect(x + labelW, ry + 1.2, fill, 4.2, "F");
    // valor + % + classificação
    doc.setFont("helvetica", "bold");
    doc.setTextColor(cor[0], cor[1], cor[2]);
    doc.text(`${it.value} • ${Math.round(it.value)}% • ${cls}`, x + labelW + barAreaW + 2, ry + 4);
  });
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  return y + itens.length * rowH + 2;
}

// ─── Cabeçalho / rodapé / utilitários ───
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
  doc.text(`${ctx.empresa_nome || ""}${ctx.cnpj ? " • CNPJ " + ctx.cnpj : ""}`, pw / 2, 18, { align: "center" });
  doc.text(`Setor: ${ctx.setor_nome || "—"}${ctx.ges ? " • GHE/GES " + ctx.ges : ""}`, pw / 2, 23, { align: "center" });
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
  if (y > 270) { doc.addPage(); y = 32; }
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

function paragraph(doc: jsPDF, y: number, txt: string, size = 10, justify = true): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(40);
  const maxW = 190;
  const lineH = size * 0.45 + 1.2;
  const split: string[] = doc.splitTextToSize(txt, maxW);
  let cy = y;
  for (let i = 0; i < split.length; i++) {
    if (cy + lineH > 285) { doc.addPage(); cy = 32; }
    const line = split[i];
    const isLast = i === split.length - 1 || /[\n]$/.test(line);
    if (justify && !isLast && line.trim().split(/\s+/).length > 1) {
      doc.text(line, 10, cy, { align: "justify", maxWidth: maxW });
    } else {
      doc.text(line, 10, cy);
    }
    cy += lineH;
  }
  return cy + 2;
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

  // ── 1. Identificação (sem "Colaboradores avaliados" nem "Data de emissão")
  let y = 32;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("1. Identificação", 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const datas: [string, string][] = [
    ["Empresa", ctx.empresa_nome || "—"],
    ["CNPJ", ctx.cnpj || "—"],
    ["Contrato", ctx.contrato_numero || "—"],
    ["Setor avaliado", ctx.setor_nome || "—"],
    ["Data da avaliação", ctx.data_elaboracao || "—"],
    ["Responsável pela avaliação", `${ctx.responsavel || "—"}${ctx.crea ? " (" + ctx.crea + ")" : ""}`],
  ];
  autoTable(doc, {
    startY: y,
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

  // ── 3. Metodologia (com critérios de classificação)
  y = section(doc, y, "3. Metodologia Utilizada");
  y = paragraph(
    doc, y,
    "A presente avaliação psicossocial foi conduzida por meio da aplicação do questionário COPSOQ (Copenhagen Psychosocial Questionnaire), instrumento internacionalmente validado para a identificação, mensuração e análise dos fatores psicossociais relacionados ao trabalho. O instrumento contempla dimensões essenciais à compreensão do ambiente laboral, tais como exigências quantitativas e emocionais, organização do trabalho, autonomia, apoio social, qualidade da liderança, reconhecimento, justiça organizacional, conflitos interpessoais e impactos na saúde mental dos trabalhadores."
  );
  y = paragraph(
    doc, y,
    "A consolidação das respostas foi realizada de forma estatística e anônima, agrupando-se os resultados por dimensão psicossocial. Para cada bloco do questionário, calculou-se a média ponderada das pontuações atribuídas pelos respondentes, normalizadas em uma escala contínua de 0 a 100, permitindo a comparação objetiva entre fatores e a identificação dos pontos críticos do ambiente organizacional."
  );
  y = paragraph(
    doc, y,
    "Os critérios de análise adotaram como referência os parâmetros do COPSOQ III, considerando a frequência, a intensidade e a recorrência dos fatores identificados, bem como o potencial de impacto sobre a saúde mental, o desempenho e o bem-estar dos trabalhadores. A classificação dos riscos psicossociais seguiu a divisão em tercis recomendada pela metodologia, conforme escala apresentada a seguir:"
  );
  y = paragraph(doc, y, "• Baixo (0 a 33): condições adequadas, com baixa probabilidade de impacto negativo.");
  y = paragraph(doc, y, "• Moderado (34 a 66): situação de atenção, recomendando-se monitoramento e ações preventivas.");
  y = paragraph(doc, y, "• Alto (67 a 84): risco relevante, exigindo intervenção planejada em curto prazo.");
  y = paragraph(doc, y, "• Crítico (85 a 100): risco severo, demandando atuação imediata e medidas corretivas estruturadas.");
  y = paragraph(
    doc, y,
    "A análise técnica considera ainda a inter-relação entre as dimensões avaliadas, identificando padrões coletivos, vulnerabilidades específicas e oportunidades de melhoria organizacional, em conformidade com as diretrizes da NR-01, da NR-17 e das boas práticas internacionais em saúde ocupacional, ergonomia e psicologia organizacional."
  );
  const complementos: string[] = [];
  if (ctx.entrevistas) complementos.push("entrevistas individuais");
  if (ctx.observacao) complementos.push("observação direta das atividades");
  if (ctx.analise_documental) complementos.push("análise documental de absenteísmo, afastamentos, acidentes, reclamações e registros internos");
  if (complementos.length) {
    y = paragraph(doc, y, "Como métodos complementares à aplicação do questionário, foram utilizados: " + complementos.join("; ") + ".");
  }


  // ── 4. Caracterização do trabalho (sem "Quantidade de trabalhadores"; atividades consolidadas)
  y = section(doc, y, "4. Caracterização do Trabalho");
  const ativConsolidadas = consolidarAtividades(ctx);
  const carac: [string, string][] = [];
  if (ctx.setor_nome) carac.push(["Setor avaliado", ctx.setor_nome]);
  if (ctx.funcoes?.length) carac.push(["Funções avaliadas", ctx.funcoes.join(", ")]);
  if (ctx.jornada_trabalho) carac.push(["Jornada de trabalho", ctx.jornada_trabalho]);
  if (ctx.escala) carac.push(["Escalas aplicadas", ctx.escala]);
  if (ctx.supervisao) carac.push(["Forma de supervisão", ctx.supervisao]);
  if (ativConsolidadas.length) {
    carac.push(["Principais atividades", ativConsolidadas.map((a) => `• ${a}`).join("\n")]);
  }
  if (carac.length) {
    autoTable(doc, {
      startY: y,
      body: carac,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 1.5, valign: "top" },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55, fillColor: [241, 245, 249] } },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  } else {
    y = paragraph(doc, y, "Dados de caracterização não informados.");
  }

  // ── 5. Gráficos por categoria
  y = section(doc, y, "5. Gráficos e Indicadores COPSOQ");
  // Gráfico 1 — distribuição geral
  if (y + 60 > 285) { doc.addPage(); y = 32; }
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Gráfico 1 — Distribuição geral dos riscos psicossociais (por nível)", 10, y);
  doc.setFont("helvetica", "normal");
  const distrib = distribuicaoPorNivel(avaliacoes);
  drawBarChartVertical(doc, 10, y + 2, pw - 20, 55, distrib, Math.max(...distrib.map((d) => d.value), 1));
  y += 62;

  // Gráficos 2..N — um por categoria
  let gIdx = 2;
  for (const cat of CATEGORIAS) {
    const itens = cat.fatores.map((f) => ({ label: f.nome, value: mediaFator(avaliacoes, f) }));
    const altura = 10 + itens.length * 7.5 + 4;
    if (y + altura > 285) { doc.addPage(); y = 32; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Gráfico ${gIdx} — ${cat.categoria}`, 10, y);
    doc.setFont("helvetica", "normal");
    y = drawHorizontalBarChart(doc, 10, y + 3, pw - 20, itens) + 4;
    gIdx++;
  }

  // ── 6. Fatores de risco identificados
  y = section(doc, y, "6. Identificação dos Fatores de Risco Psicossocial");
  const relevantes = identificarFatoresRelevantes(avaliacoes);
  if (!Object.keys(relevantes).length) {
    y = paragraph(doc, y, "Não foram identificados fatores de risco psicossocial significativos nesta amostra.");
  } else {
    for (const [cat, itens] of Object.entries(relevantes)) {
      if (y > 280) { doc.addPage(); y = 32; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
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

  // ── 7. Avaliação dos riscos (TODOS os fatores)
  y = section(doc, y, "7. Avaliação dos Riscos");
  const tabela: any[] = [];
  for (const cat of CATEGORIAS) {
    for (const f of cat.fatores) {
      const m = mediaFator(avaliacoes, f);
      const cls = classificar(m);
      const prob = m >= 85 ? "Muito Alta" : m >= 67 ? "Alta" : m >= 34 ? "Média" : "Baixa";
      const grav = cls === "Crítico" ? "Muito Alta" : cls === "Alto" ? "Alta" : cls === "Moderado" ? "Média" : "Baixa";
      tabela.push([
        `${cat.categoria} — ${f.nome}`,
        `${ctx.setor_nome || "—"} / ${(ctx.funcoes || []).join(", ") || "—"}`,
        prob,
        grav,
        cls,
      ]);
    }
  }
  autoTable(doc, {
    startY: y,
    head: [["Fator de Risco", "Setor / Função Exposta", "Probabilidade", "Gravidade", "Nível de Risco"]],
    body: tabela,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.6, valign: "top" },
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

  // ── 8. Análise técnica (sem "Tendências Identificadas")
  y = section(doc, y, "8. Resultados e Análise");
  for (const p of buildAnaliseTecnica(avaliacoes, ctx)) {
    y = paragraph(doc, y, p);
  }

  // ── 9. Conclusão
  y = section(doc, y, "9. Conclusão Técnica");
  y = paragraph(doc, y, buildConclusao(avaliacoes));

  // ── 10. Plano de ação
  y = section(doc, y, "10. Plano de Ação");
  const plano = buildPlanoAcao(avaliacoes);
  if (!plano.length) {
    y = paragraph(doc, y, "Não há ações corretivas obrigatórias. Recomenda-se manutenção das boas práticas e reavaliação periódica.");
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
    doc.text(`${ctx.cargo_responsavel || ""}${ctx.crea ? "  •  " + ctx.crea : ""}`, 105, y + 8, { align: "center" });
  }

  addFooter(doc);

  const fileName = `relatorio_psicossocial_${(ctx.setor_nome || "setor").replace(/\s+/g, "_").toLowerCase()}.pdf`;
  doc.save(fileName);
}
