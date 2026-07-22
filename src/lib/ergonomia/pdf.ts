// Gerador de PDF profissional para relatórios ergonômicos.
// IMPORTANTE: O PDF nunca deve exibir objetos JSON, IDs, chaves booleanas cruas
// ou estruturas internas — apenas informações técnicas legíveis ao usuário.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AvaliacaoErgonomica, FerramentaTipo } from "./types";
import { OWAS_LABELS } from "./owas";

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

// ────────── Interpretadores por ferramenta (respostas legíveis) ──────────
type Row = [string, string];

const yn = (b: unknown) => (b ? "Sim" : "Não");

const RULA_LABELS = {
  braco: { 1: "-20° a +20°", 2: ">20° (extensão ou flexão)", 3: "20° a 45° de flexão", 4: "45° a 90° de flexão" },
  antebraco: { 1: "60° a 100° de flexão", 2: "< 60° ou > 100°" },
  punho: { 1: "Neutro (0°)", 2: "0° a 15°", 3: "> 15°" },
  torcaoPunho: { 1: "Faixa média", 2: "Próximo do limite" },
  pescoco: { 1: "0° a 10° de flexão", 2: "10° a 20°", 3: "> 20°", 4: "Em extensão" },
  tronco: { 1: "Ereto", 2: "0° a 20°", 3: "20° a 60°", 4: "> 60°" },
  pernas: { 1: "Apoiadas e equilibradas", 2: "Sem apoio adequado" },
  carga: {
    0: "Menos de 2 kg, intermitente",
    1: "2 a 10 kg, intermitente",
    2: "2 a 10 kg, estático ou repetitivo",
    3: "Acima de 10 kg ou com impacto",
  },
} as const;

const REBA_LABELS = {
  tronco: RULA_LABELS.tronco,
  pescoco: { 1: "0° a 20°", 2: "> 20°", 3: "Em extensão" },
  pernas: { 1: "Bilateral (estável)", 2: "Unilateral / instável" },
  pernasFlexao: { 0: "Sem flexão relevante", 1: "Joelhos 30° a 60°", 2: "Joelhos > 60°" },
  carga: { 0: "< 5 kg", 1: "5 a 10 kg", 2: "> 10 kg" },
  bracoSup: { 1: "-20° a 20°", 2: "20° a 45° ou extensão > 20°", 3: "45° a 90°", 4: "> 90°" },
  antebraco: { 1: "60° a 100°", 2: "< 60° ou > 100°" },
  punho: { 1: "0° a 15°", 2: "> 15°" },
  acoplamento: { 0: "Bom", 1: "Regular", 2: "Ruim", 3: "Inaceitável" },
} as const;

function respostasRula(r: any): Row[] {
  return [
    ["Braço", (RULA_LABELS.braco as any)[r.braco]],
    ["Ombro elevado", yn(r.bracoAdicionais?.ombroElevado)],
    ["Braço abduzido", yn(r.bracoAdicionais?.abduzido)],
    ["Braço apoiado", yn(r.bracoAdicionais?.apoiado)],
    ["Braço acima de 90°", yn(r.bracoAdicionais?.bracoMuitoAlto)],
    ["Antebraço", (RULA_LABELS.antebraco as any)[r.antebraco]],
    ["Antebraço cruza o corpo / fora da linha média",
      yn(r.antebracoAdicionais?.cruzaCorpo || r.antebracoAdicionais?.foraLinhaMedia)],
    ["Punho", (RULA_LABELS.punho as any)[r.punho]],
    ["Punho desviado da linha média", yn(r.punhoDesviado)],
    ["Torção do punho", (RULA_LABELS.torcaoPunho as any)[r.torcaoPunho]],
    ["Pescoço", (RULA_LABELS.pescoco as any)[r.pescoco]],
    ["Pescoço torcido", yn(r.pescocoAdicionais?.torcido)],
    ["Pescoço inclinado lateralmente", yn(r.pescocoAdicionais?.inclinado)],
    ["Tronco", (RULA_LABELS.tronco as any)[r.tronco]],
    ["Tronco torcido", yn(r.troncoAdicionais?.torcido)],
    ["Tronco inclinado lateralmente", yn(r.troncoAdicionais?.inclinado)],
    ["Pernas", (RULA_LABELS.pernas as any)[r.pernas]],
    ["Uso muscular estático / repetitivo", yn(r.usoMuscular)],
    ["Carga / força", (RULA_LABELS.carga as any)[r.carga]],
  ];
}

function respostasReba(r: any): Row[] {
  return [
    ["Tronco", (REBA_LABELS.tronco as any)[r.tronco]],
    ["Tronco torcido", yn(r.troncoAjuste?.torcido)],
    ["Tronco inclinado lateralmente", yn(r.troncoAjuste?.inclinado)],
    ["Pescoço", (REBA_LABELS.pescoco as any)[r.pescoco]],
    ["Pescoço torcido", yn(r.pescocoAjuste?.torcido)],
    ["Pescoço inclinado", yn(r.pescocoAjuste?.inclinado)],
    ["Pernas", (REBA_LABELS.pernas as any)[r.pernas]],
    ["Flexão de joelhos", (REBA_LABELS.pernasFlexao as any)[r.pernasFlexao]],
    ["Carga", (REBA_LABELS.carga as any)[r.carga]],
    ["Carga com impacto", yn(r.cargaImpacto)],
    ["Braço superior", (REBA_LABELS.bracoSup as any)[r.bracoSup]],
    ["Ombro elevado", yn(r.bracoAjuste?.ombroElevado)],
    ["Braço abduzido", yn(r.bracoAjuste?.abduzido)],
    ["Braço apoiado", yn(r.bracoAjuste?.apoiado)],
    ["Antebraço", (REBA_LABELS.antebraco as any)[r.antebraco]],
    ["Punho", (REBA_LABELS.punho as any)[r.punho]],
    ["Punho desviado / torcido", yn(r.punhoDesviado)],
    ["Acoplamento (pega)", (REBA_LABELS.acoplamento as any)[r.acoplamento]],
    ["Postura estática > 1 min", yn(r.atividade?.estatico)],
    ["Movimento repetitivo > 4×/min", yn(r.atividade?.repetitivo)],
    ["Mudanças rápidas / instáveis", yn(r.atividade?.instavel)],
  ];
}

function respostasNiosh(r: any): Row[] {
  const durLabel: Record<string, string> = { curta: "Curta (≤ 1h)", moderada: "Moderada (≤ 2h)", longa: "Longa (≤ 8h)" };
  const acoLabel: Record<string, string> = { bom: "Bom", regular: "Regular", ruim: "Ruim" };
  return [
    ["Peso da carga", `${r.peso_carga_kg} kg`],
    ["Distância horizontal (H)", `${r.H_cm} cm`],
    ["Altura vertical inicial (V)", `${r.V_cm} cm`],
    ["Deslocamento vertical (D)", `${r.D_cm} cm`],
    ["Ângulo de assimetria (A)", `${r.A_graus}°`],
    ["Frequência de levantamentos", `${r.F_por_min} por minuto`],
    ["Duração da tarefa", durLabel[r.duracao] || String(r.duracao)],
    ["Qualidade do acoplamento (pega)", acoLabel[r.acoplamento] || String(r.acoplamento)],
  ];
}

function respostasOwas(r: any): Row[] {
  return [
    ["Postura das costas", (OWAS_LABELS.costas as any)[r.costas]],
    ["Posição dos braços", (OWAS_LABELS.bracos as any)[r.bracos]],
    ["Posição das pernas", (OWAS_LABELS.pernas as any)[r.pernas]],
    ["Carga manipulada", (OWAS_LABELS.carga as any)[r.carga]],
  ];
}

function interpretarRespostas(ferramenta: FerramentaTipo, respostas: any): Row[] {
  try {
    if (ferramenta === "RULA") return respostasRula(respostas);
    if (ferramenta === "REBA") return respostasReba(respostas);
    if (ferramenta === "NIOSH") return respostasNiosh(respostas);
    if (ferramenta === "OWAS") return respostasOwas(respostas);
  } catch { /* ignore */ }
  return [];
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

  // Parâmetros avaliados (respostas legíveis)
  const respostas = interpretarRespostas(av.ferramenta, av.respostas);
  if (respostas.length > 0) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text("Parâmetros avaliados", 10, y);
    autoTable(doc, {
      startY: y + 2,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 2 },
      head: [["Item", "Situação observada"]],
      headStyles: { fillColor: [30, 58, 138] },
      body: respostas,
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Memória de cálculo (técnica, sem estruturas internas)
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("Memória de cálculo", 10, y);
  autoTable(doc, {
    startY: y + 2,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    head: [["Etapa", "Pontuação", "Descrição"]],
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
