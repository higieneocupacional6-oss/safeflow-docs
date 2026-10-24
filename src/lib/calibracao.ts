import { normalizeDateOnly } from "@/lib/dateOnly";
export type CalibStatus = "conforme" | "atencao" | "vencido" | "sem_data";

export const SITUACAO_OPERACIONAL_OPCOES = [
  "Aparelhos enviados",
  "Calibração em andamento",
  "Aparelhos em logística",
  "Aparelho calibrado",
] as const;

export type SituacaoOperacional = (typeof SITUACAO_OPERACIONAL_OPCOES)[number];

export function mesesDesde(dataISO?: string | null): number | null {
  if (!dataISO) return null;
  const date = normalizeDateOnly(dataISO);
  if (!date) return null;
  const [year, month, day] = date.split("-").map(Number);
  const now = new Date();
  let m = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  if (now.getDate() < day) m -= 1;
  return Math.max(0, m);
}

export function statusCalibracao(dataISO?: string | null): {
  status: CalibStatus;
  label: string;
  meses: number | null;
} {
  const meses = mesesDesde(dataISO);
  if (meses === null) return { status: "sem_data", label: "Sem data", meses: null };
  if (meses >= 12) return { status: "vencido", label: "Vencido", meses };
  if (meses >= 9) return { status: "atencao", label: "Atenção", meses };
  return { status: "conforme", label: "Em Conformidade", meses };
}

export function statusBadgeClasses(status: CalibStatus): string {
  switch (status) {
    case "conforme":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
    case "atencao":
      return "bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950 dark:text-amber-200";
    case "vencido":
      return "bg-red-100 text-red-800 border-red-400 dark:bg-red-950 dark:text-red-200 ring-2 ring-red-400/60";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
