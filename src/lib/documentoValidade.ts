import { normalizeDateOnly } from "@/lib/dateOnly";
import type { StatusDoc } from "@/lib/notificacoes";
import { calcStatus } from "@/lib/notificacoes";

/** Tipos com controle de vencimento (cadastro manual ou gerados pelo sistema). */
export const TIPOS_CONTROLE_VENCIMENTO = [
  "LTCAT",
  "INSALUBRIDADE",
  "AET",
  "AEP",
  "AET-VALE",
  "AEP-VALE",
  "PERICULOSIDADE",
  "PGR",
  "PCMSO",
] as const;

export type TipoControleVencimento = (typeof TIPOS_CONTROLE_VENCIMENTO)[number];

export const TIPOS_CADASTRO_MANUAL: { value: TipoControleVencimento; label: string }[] = [
  { value: "LTCAT", label: "LTCAT" },
  { value: "INSALUBRIDADE", label: "Insalubridade" },
  { value: "AET", label: "AET" },
  { value: "AEP", label: "AEP" },
  { value: "AET-VALE", label: "AET (Vale)" },
  { value: "AEP-VALE", label: "AEP (Vale)" },
  { value: "PERICULOSIDADE", label: "Laudo de Periculosidade" },
  { value: "PGR", label: "PGR" },
  { value: "PCMSO", label: "PCMSO" },
];

/** Sempre fora do controle de vencimentos. */
export const TIPOS_EXCLUIDOS_VENCIMENTO = new Set([
  "APR-ERGO",
  "APR-ERGO-PLANO",
  "AET-VALE-PLANO",
]);

const MESES_12 = new Set<string>(["PGR", "PCMSO"]);
const MESES_24 = new Set<string>([
  "LTCAT",
  "INSALUBRIDADE",
  "AET",
  "AEP",
  "AET-VALE",
  "AEP-VALE",
  "PERICULOSIDADE",
]);

export function mesesValidadePorTipo(tipo: string): number | null {
  if (MESES_12.has(tipo)) return 12;
  if (MESES_24.has(tipo)) return 24;
  return null;
}

export function labelTipoDocumento(tipo: string): string {
  return TIPOS_CADASTRO_MANUAL.find((t) => t.value === tipo)?.label || tipo;
}

/** Soma meses em data civil YYYY-MM-DD (sem timezone). */
export function addMonthsDateOnly(value: string, months: number): string {
  const date = normalizeDateOnly(value);
  if (!date || !Number.isFinite(months)) return "";
  const [y, m, d] = date.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const dim = daysInMonth(ny, nm);
  const day = Math.min(d, dim);
  return `${String(ny).padStart(4, "0")}-${String(nm).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function calcularDataValidade(tipo: string, dataElaboracao: string | null | undefined): string | null {
  const elab = normalizeDateOnly(dataElaboracao);
  const meses = mesesValidadePorTipo(tipo);
  if (!elab || meses == null) return null;
  return addMonthsDateOnly(elab, meses) || null;
}

export type DocumentoVencimentoLike = {
  tipo: string;
  status?: string | null;
  data_elaboracao?: string | null;
  data_validade?: string | null;
};

/**
 * APR-ERGO e planos ficam fora.
 * AET-VALE do módulo (não manual) fica fora; AET-VALE/AEP-VALE manuais entram.
 */
export function entraNoControleVencimento(doc: DocumentoVencimentoLike): boolean {
  if (TIPOS_EXCLUIDOS_VENCIMENTO.has(doc.tipo)) return false;
  if (doc.tipo === "AET-VALE" && doc.status !== "manual") return false;
  if (mesesValidadePorTipo(doc.tipo) == null) return false;
  return !!normalizeDateOnly(doc.data_elaboracao);
}

export function validadeEfetiva(doc: DocumentoVencimentoLike): string | null {
  if (!entraNoControleVencimento(doc)) return null;
  const stored = normalizeDateOnly(doc.data_validade);
  if (stored) return stored;
  return calcularDataValidade(doc.tipo, doc.data_elaboracao);
}

export function statusVencimentoDocumento(doc: DocumentoVencimentoLike): StatusDoc | null {
  return calcStatus(validadeEfetiva(doc));
}

export function labelStatusVencimento(status: StatusDoc | null): string {
  if (status === "vencido") return "Vencido";
  if (status === "proximo") return "A vencer";
  if (status === "no_prazo") return "No prazo";
  return "—";
}
