import { ESTIMATIVAS_APR, INTENSIDADES_APR, perfilApr, classificacaoApr } from "./aprErgoPlanilha.ts";
export { SITUACOES_APR, TIPOS_APR } from "./aprErgoPlanilha.ts";
export const MAX_BASE_APR = 6;
export const CAMPOS_APR = ["cenario", "circunstancia", "situacao", "exigencia", "tipo", "medidas", "estimativa", "intensidade", "perfil", "severidade", "classificacao", "recomendacoes"] as const;
export type LinhaApr = Record<typeof CAMPOS_APR[number], string> & { fotos: string[] };
export type PropostaApr = { linhas: LinhaApr[]; fontes_aep: string[]; observacoes: string };

/** Merge is explicitly field-level: photos and unmatched manual rows always survive. */
export function aplicarPropostaApr(atuais: LinhaApr[], propostas: LinhaApr[], substituir: boolean): LinhaApr[] {
  return Array.from({ length: Math.max(atuais.length, propostas.length) }, (_, i) => {
    const atual = atuais[i]; const nova = propostas[i];
    const campos = Object.fromEntries(CAMPOS_APR.map((k) => [k, nova?.[k]?.trim() && (substituir || !atual?.[k]?.trim()) ? nova[k] : atual?.[k] || ""])) as Record<typeof CAMPOS_APR[number], string>;
    return recalcularLinhaApr({ ...campos, fotos: atual?.fotos || [] });
  });
}
export function contarConflitosApr(atuais: LinhaApr[], propostas: LinhaApr[]): number {
  return propostas.reduce((n, l, i) => n + CAMPOS_APR.filter((k) => atuais[i]?.[k]?.trim() && l[k]?.trim() && atuais[i][k].trim() !== l[k].trim()).length, 0);
}
export function formulariosCompativeisApr<T extends { setor_ids: string[]; dados: unknown }>(formularios: T[], setorId: string, funcaoIds: string[]): T[] {
  return formularios.filter((f) => {
    if (f.setor_ids.length !== 1 || f.setor_ids[0] !== setorId) return false;
    const dados = f.dados as { funcoes?: string[] } | null;
    return !dados?.funcoes?.length || dados.funcoes.every((id) => funcaoIds.includes(id));
  });
}

/** Recalcula as colunas automáticas exatamente como Formulario!K e M. */
export function recalcularLinhaApr<T extends { estimativa: string; intensidade: string; severidade: string; perfil: string; classificacao: string }>(l: T): T {
  const perfil = perfilApr(l.estimativa, l.intensidade);
  return { ...l, perfil, classificacao: classificacaoApr(perfil, l.severidade) };
}

/** Only unambiguous single D/I marks from Anexo 01 are transferred, mapped by level to the spreadsheet options. */
export function classificacoesSalvasApr(marcas: Record<string, string>) {
  const unico = (prefixo: string, opcoes: [string, number][]) => {
    const ativos = Object.entries(marcas).filter(([k, v]) => new RegExp(`^${prefixo}[1-5]$`).test(k) && String(v).trim());
    return ativos.length === 1 ? opcoes[Number(ativos[0][0].slice(1)) - 1]?.[0] || "" : "";
  };
  return { estimativa: unico("D", ESTIMATIVAS_APR), intensidade: unico("I", INTENSIDADES_APR) };
}
