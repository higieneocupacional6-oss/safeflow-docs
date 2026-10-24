import { dateOnlyDay, todayDateOnly } from "@/lib/dateOnly";
export type StatusDoc = "no_prazo" | "proximo" | "vencido";

export function calcStatus(dataValidade: string | null): StatusDoc | null {
  if (!dataValidade) return null;
  const diff = diasParaVencimento(dataValidade);
  if (diff === null) return null;
  if (diff < 0) return "vencido";
  if (diff <= 30) return "proximo";
  return "no_prazo";
}

export function diasParaVencimento(dataValidade: string | null): number | null {
  if (!dataValidade) return null;
  const diff = dateOnlyDay(dataValidade) - dateOnlyDay(todayDateOnly());
  return Number.isFinite(diff) ? diff : null;
}
