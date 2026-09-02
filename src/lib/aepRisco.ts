// Matriz de risco da AEP — reutiliza a matriz 3x3 (Probabilidade x Severidade)
// já adotada no sistema (src/lib/pgrMatriz.ts), apenas detalhando a faixa alta
// em "Alto" e "Crítico" conforme exigido no documento AEP.
import { PROBABILIDADE_LABELS, SEVERIDADE_LABELS, type Nivel } from "@/lib/pgrMatriz";

export const PROBABILIDADES = [
  PROBABILIDADE_LABELS[1],
  PROBABILIDADE_LABELS[2],
  PROBABILIDADE_LABELS[3],
] as const;

export const SEVERIDADES = [
  SEVERIDADE_LABELS[1],
  SEVERIDADE_LABELS[2],
  SEVERIDADE_LABELS[3],
] as const;

export const TIPOS_AGENTE_ERGONOMICO = [
  "Ergonômico físico",
  "Ergonômico organizacional",
  "Ergonômico cognitivo",
  "Ergonômico psicossocial",
] as const;

export type NivelRiscoAep = "Trivial" | "Moderado" | "Alto" | "Crítico" | "";

export type RiscoErgonomico = {
  tipo_agente: string;
  fator_risco: string;
  fonte_geradora: string;
  possiveis_danos: string;
  controle_existente: string;
  probabilidade: string;
  severidade: string;
  nivel_risco: NivelRiscoAep;
  medidas: string;
};

export const emptyRiscoErgonomico = (): RiscoErgonomico => ({
  tipo_agente: "",
  fator_risco: "",
  fonte_geradora: "",
  possiveis_danos: "",
  controle_existente: "",
  probabilidade: "",
  severidade: "",
  nivel_risco: "",
  medidas: "",
});

const toNivel = (label: string, labels: Record<Nivel, string>): Nivel | null => {
  const v = (label || "").trim().toLowerCase();
  if (!v) return null;
  const entry = (Object.entries(labels) as [string, string][]).find(
    ([, l]) => l.toLowerCase() === v,
  );
  if (entry) return Number(entry[0]) as Nivel;
  // aceita sinônimos vindos da IA
  if (["baixa", "baixo", "leve", "1"].includes(v)) return 1;
  if (["média", "media", "moderada", "moderado", "2"].includes(v)) return 2;
  if (["alta", "alto", "grave", "3"].includes(v)) return 3;
  return null;
};

export function calcularNivelRiscoAep(probabilidade: string, severidade: string): NivelRiscoAep {
  const p = toNivel(probabilidade, PROBABILIDADE_LABELS);
  const s = toNivel(severidade, SEVERIDADE_LABELS);
  if (!p || !s) return "";
  const r = p * s;
  if (r <= 1) return "Trivial";
  if (r <= 3) return "Moderado";
  if (r <= 6) return "Alto";
  return "Crítico";
}

export const CORES_NIVEL_RISCO: Record<Exclude<NivelRiscoAep, "">, string> = {
  Trivial: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40",
  Moderado: "bg-amber-400/20 text-amber-700 dark:text-amber-400 border-amber-500/40",
  Alto: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/40",
  Crítico: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40",
};

export const HEX_NIVEL_RISCO: Record<Exclude<NivelRiscoAep, "">, string> = {
  Trivial: "#16a34a",
  Moderado: "#eab308",
  Alto: "#f97316",
  Crítico: "#dc2626",
};
