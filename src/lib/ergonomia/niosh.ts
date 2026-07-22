// Equação Revisada de Levantamento NIOSH (Waters et al., 1994).
import type { ResultadoErgonomico } from "./types";

export type NioshInput = {
  peso_carga_kg: number;
  H_cm: number;              // distância horizontal
  V_cm: number;              // altura vertical inicial das mãos
  D_cm: number;              // deslocamento vertical
  A_graus: number;           // ângulo de assimetria
  F_por_min: number;         // frequência de levantamentos por minuto
  duracao: "curta" | "moderada" | "longa"; // ≤1h / ≤2h / ≤8h
  acoplamento: "bom" | "regular" | "ruim";
};

const LC = 23;

// Tabela FM oficial simplificada.
const FM_TABLE: Array<{ freq: number; curta: [number, number]; moderada: [number, number]; longa: [number, number] }> = [
  { freq: 0.2, curta: [1.00, 1.00], moderada: [0.95, 0.95], longa: [0.85, 0.85] },
  { freq: 0.5, curta: [0.97, 0.97], moderada: [0.92, 0.92], longa: [0.81, 0.81] },
  { freq: 1,   curta: [0.94, 0.94], moderada: [0.88, 0.88], longa: [0.75, 0.75] },
  { freq: 2,   curta: [0.91, 0.91], moderada: [0.84, 0.84], longa: [0.65, 0.65] },
  { freq: 3,   curta: [0.88, 0.88], moderada: [0.79, 0.79], longa: [0.55, 0.55] },
  { freq: 4,   curta: [0.84, 0.84], moderada: [0.72, 0.72], longa: [0.45, 0.45] },
  { freq: 5,   curta: [0.80, 0.80], moderada: [0.60, 0.60], longa: [0.35, 0.35] },
  { freq: 6,   curta: [0.75, 0.75], moderada: [0.50, 0.50], longa: [0.27, 0.27] },
  { freq: 7,   curta: [0.70, 0.70], moderada: [0.42, 0.42], longa: [0.22, 0.22] },
  { freq: 8,   curta: [0.60, 0.60], moderada: [0.35, 0.35], longa: [0.18, 0.18] },
  { freq: 9,   curta: [0.52, 0.52], moderada: [0.30, 0.30], longa: [0.00, 0.15] },
  { freq: 10,  curta: [0.45, 0.45], moderada: [0.26, 0.26], longa: [0.00, 0.13] },
  { freq: 11,  curta: [0.41, 0.41], moderada: [0.00, 0.23], longa: [0.00, 0.00] },
  { freq: 12,  curta: [0.37, 0.37], moderada: [0.00, 0.21], longa: [0.00, 0.00] },
  { freq: 13,  curta: [0.00, 0.34], moderada: [0.00, 0.00], longa: [0.00, 0.00] },
  { freq: 14,  curta: [0.00, 0.31], moderada: [0.00, 0.00], longa: [0.00, 0.00] },
  { freq: 15,  curta: [0.00, 0.28], moderada: [0.00, 0.00], longa: [0.00, 0.00] },
];

function fm(f: number, dur: NioshInput["duracao"], V: number): number {
  if (f > 15) return 0;
  // Encontrar linha imediatamente superior
  const row = FM_TABLE.find((r) => f <= r.freq) ?? FM_TABLE[FM_TABLE.length - 1];
  const [v_low, v_high] = row[dur];
  return V < 75 ? v_low : v_high;
}

function cm(aco: NioshInput["acoplamento"], V: number): number {
  if (aco === "bom") return 1.00;
  if (aco === "regular") return V < 75 ? 0.95 : 1.00;
  return V < 75 ? 0.90 : 0.90;
}

export function calcularNiosh(i: NioshInput): ResultadoErgonomico {
  const H = Math.max(25, i.H_cm);
  const HM = i.H_cm > 63 ? 0 : 25 / H;

  const VM = i.V_cm > 175 ? 0 : 1 - 0.003 * Math.abs(i.V_cm - 75);

  const D = Math.max(25, i.D_cm);
  const DM = i.D_cm > 175 ? 0 : 0.82 + 4.5 / D;

  const AM = i.A_graus > 135 ? 0 : 1 - 0.0032 * i.A_graus;
  const FM = fm(i.F_por_min, i.duracao, i.V_cm);
  const CM = cm(i.acoplamento, i.V_cm);

  const RWL = LC * HM * VM * DM * AM * FM * CM;
  const LI = RWL > 0 ? i.peso_carga_kg / RWL : Infinity;

  let classificacao: string;
  let nivel_acao: string;
  let recomendacoes: string;
  if (!isFinite(LI) || LI > 3) {
    classificacao = "Risco alto (LI > 3)";
    nivel_acao = "Intervenção imediata";
    recomendacoes = "Redesenhar a tarefa: aproximar carga, elevar origem, reduzir deslocamento vertical, eliminar torções, mecanizar transporte.";
  } else if (LI > 1) {
    classificacao = "Risco moderado (1 < LI ≤ 3)";
    nivel_acao = "Ação necessária";
    recomendacoes = "Reduzir peso ou frequência, aproximar a carga do corpo, ajustar altura de origem e destino, melhorar acoplamento (pega).";
  } else {
    classificacao = "Risco baixo (LI ≤ 1)";
    nivel_acao = "Aceitável para a maioria dos trabalhadores";
    recomendacoes = "Manter condições atuais e monitorar mudanças na tarefa, carga ou frequência.";
  }

  return {
    escore_final: Number(LI.toFixed(2)),
    classificacao,
    nivel_acao,
    recomendacoes,
    memoria_calculo: [
      { etapa: "LC (constante)", valor: LC, detalhe: "kg" },
      { etapa: "HM (horizontal)", valor: HM.toFixed(3), detalhe: `H=${i.H_cm}cm` },
      { etapa: "VM (vertical)", valor: VM.toFixed(3), detalhe: `V=${i.V_cm}cm` },
      { etapa: "DM (deslocamento)", valor: DM.toFixed(3), detalhe: `D=${i.D_cm}cm` },
      { etapa: "AM (assimetria)", valor: AM.toFixed(3), detalhe: `A=${i.A_graus}°` },
      { etapa: "FM (frequência)", valor: FM.toFixed(3), detalhe: `${i.F_por_min}/min • ${i.duracao}` },
      { etapa: "CM (acoplamento)", valor: CM.toFixed(3), detalhe: i.acoplamento },
      { etapa: "RWL", valor: RWL.toFixed(2), detalhe: "kg (limite recomendado)" },
      { etapa: "Peso da carga", valor: i.peso_carga_kg, detalhe: "kg" },
      { etapa: "LI (Índice de Levantamento)", valor: isFinite(LI) ? LI.toFixed(2) : "∞" },
    ],
  };
}
