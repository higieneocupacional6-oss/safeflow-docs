export const SITUACOES_APR = [
  "Posturas incômodas ou pouco confortáveis", "Esforço físico", "Movimentação manual de cargas",
  "Compressão mecânica", "Movimentos repetitivos", "Ritmo e condições de trabalho", "Carga cognitiva",
  "Desconforto mental", "Desconforto acústico", "Desconforto térmico", "Desconforto visual", "Desconforto por vibração",
] as const;
export const TIPOS_APR = ["Físico", "Organizacional", "Cognitivo", "Ambiental"] as const;
export const MAX_BASE_APR = 6;
export const CAMPOS_APR = ["cenario", "circunstancia", "situacao", "exigencia", "tipo", "medidas", "estimativa", "intensidade", "perfil", "severidade", "classificacao", "recomendacoes"] as const;
export type LinhaApr = Record<typeof CAMPOS_APR[number], string> & { fotos: string[] };
export type PropostaApr = { linhas: LinhaApr[]; fontes_aep: string[]; observacoes: string };

/** Merge is explicitly field-level: photos and unmatched manual rows always survive. */
export function aplicarPropostaApr(atuais: LinhaApr[], propostas: LinhaApr[], substituir: boolean): LinhaApr[] {
  return Array.from({ length: Math.max(atuais.length, propostas.length) }, (_, i) => {
    const atual = atuais[i]; const nova = propostas[i];
    const campos = Object.fromEntries(CAMPOS_APR.map((k) => [k, nova?.[k]?.trim() && (substituir || !atual?.[k]?.trim()) ? nova[k] : atual?.[k] || ""])) as Record<typeof CAMPOS_APR[number], string>;
    return { ...campos, fotos: atual?.fotos || [] };
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