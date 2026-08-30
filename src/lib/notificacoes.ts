export type StatusDoc = "no_prazo" | "proximo" | "vencido";

export function calcStatus(dataValidade: string | null): StatusDoc | null {
  if (!dataValidade) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(dataValidade);
  v.setHours(0, 0, 0, 0);
  const diff = Math.floor((v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "vencido";
  if (diff <= 30) return "proximo";
  return "no_prazo";
}

export function diasParaVencimento(dataValidade: string | null): number | null {
  if (!dataValidade) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(dataValidade);
  v.setHours(0, 0, 0, 0);
  return Math.floor((v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}
