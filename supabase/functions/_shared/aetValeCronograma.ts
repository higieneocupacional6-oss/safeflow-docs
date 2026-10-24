import type { AcaoVale } from "./aetValeIa.ts";

export const MESES_VALE = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const CORES_MES_VALE = ["", "azul", "verde", "vermelho"] as const;
export type CorMesVale = typeof CORES_MES_VALE[number];
export type AcaoMensalVale = AcaoVale & { id: string; documento_id: string; setor_id: string; funcao_id: string; risco: string; funcao: string; realizado: string; meses: Record<string, CorMesVale> };
export type CronogramaVale = { anoInicial: number; anoFinal: number; nomesMeses: Record<string, string>; acoes: AcaoMensalVale[]; templateId: string };
export function cronogramaVazio(ano = new Date().getFullYear()): CronogramaVale { return { anoInicial: ano, anoFinal: ano, nomesMeses: {}, acoes: [], templateId: "" }; }
export function mesesCronograma(inicial: number, final: number) {
  if (!Number.isInteger(inicial) || !Number.isInteger(final) || inicial < 1900 || final > 2200 || final < inicial) return [];
  return Array.from({ length: (final - inicial + 1) * 12 }, (_, i) => {
    const ano = inicial + Math.floor(i / 12), mes = i % 12;
    return { id: `${ano}-${String(mes + 1).padStart(2, "0")}`, nome: `${MESES_VALE[mes]}/${String(ano).slice(-2)}`, ano };
  });
}
export function proximaCorVale(cor: CorMesVale): CorMesVale { return CORES_MES_VALE[(CORES_MES_VALE.indexOf(cor) + 1) % CORES_MES_VALE.length]; }
export function novaAcaoMensal(id: string): AcaoMensalVale { return { id, documento_id: "", setor_id: "", funcao_id: "", risco: "", funcao: "", fator_id: "", o_que: "", por_que: "", onde: "", quando: "", quem: "", como: "", quanto: "", realizado: "", meses: {} }; }
// Preserve manual rows, dates, labels and monthly colors; suggestions only add new technical actions.
export function mesclarAcoesMensais(atual: CronogramaVale, propostas: AcaoMensalVale[]): CronogramaVale {
  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const chave = (a: AcaoMensalVale) => `${a.documento_id}|${a.fator_id}|${norm(a.o_que)}`;
  const vistos = new Set(atual.acoes.map(chave));
  const novas = propostas.filter(a => { const k = chave(a); if (!a.o_que.trim() || vistos.has(k)) return false; vistos.add(k); return true; });
  return { ...atual, acoes: [...atual.acoes, ...novas] };
}