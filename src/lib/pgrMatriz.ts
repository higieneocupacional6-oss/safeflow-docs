// Matriz de Risco 3x3 — Probabilidade x Severidade
// Resultado = Probabilidade * Severidade (1..9)
// Classificação:
//   1-2  → Trivial / Baixo
//   3-4  → Moderado / Médio
//   6-9  → Substancial / Alto

export type Nivel = 1 | 2 | 3;

export const PROBABILIDADE_LABELS: Record<Nivel, string> = {
  1: "Baixa",
  2: "Média",
  3: "Alta",
};

export const SEVERIDADE_LABELS: Record<Nivel, string> = {
  1: "Leve",
  2: "Moderada",
  3: "Grave",
};

export type Classificacao = {
  resultado: number;
  nivel: "Baixo" | "Médio" | "Alto";
  classificacao: "Trivial" | "Moderado" | "Substancial";
  cor: string; // hsl token-friendly bg color
  corBadge: string;
};

export function calcularMatriz(p: Nivel, s: Nivel): Classificacao {
  const resultado = p * s;
  if (resultado <= 2) {
    return {
      resultado,
      nivel: "Baixo",
      classificacao: "Trivial",
      cor: "bg-emerald-500",
      corBadge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    };
  }
  if (resultado <= 4) {
    return {
      resultado,
      nivel: "Médio",
      classificacao: "Moderado",
      cor: "bg-amber-500",
      corBadge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    };
  }
  return {
    resultado,
    nivel: "Alto",
    classificacao: "Substancial",
    cor: "bg-red-500",
    corBadge: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  };
}

export const CELL_COLOR: Record<number, string> = {
  1: "bg-emerald-500/80",
  2: "bg-emerald-500/80",
  3: "bg-amber-500/80",
  4: "bg-amber-500/80",
  6: "bg-red-500/80",
  9: "bg-red-500/80",
};
