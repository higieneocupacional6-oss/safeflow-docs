import { ESTIMATIVAS_APR, INTENSIDADES_APR, perfilApr, classificacaoApr } from "./aprErgoPlanilha.ts";
export { SITUACOES_APR, TIPOS_APR } from "./aprErgoPlanilha.ts";
export const MAX_BASE_APR = 6;
export const CAMPOS_APR = ["cenario", "circunstancia", "situacao", "exigencia", "tipo", "medidas", "estimativa", "intensidade", "perfil", "severidade", "classificacao", "recomendacoes"] as const;
export type LinhaApr = Record<typeof CAMPOS_APR[number], string> & { fotos: string[]; funcao_id?: string; funcao_ids?: string[]; funcao_nome?: string; setor_id?: string };
export const CAMPOS_RESUMO_APR = ["atividades", "ambiente"] as const;
export type ResumoApr = Record<typeof CAMPOS_RESUMO_APR[number], string>;
export type PropostaApr = { linhas: LinhaApr[]; fontes_aep: string[]; observacoes: string; cabecalho?: ResumoApr };

export function aplicarResumoApr<T extends ResumoApr>(atual: T, proposta: Partial<ResumoApr> | undefined, substituir: boolean): T {
  const resultado = { ...atual };
  for (const k of CAMPOS_RESUMO_APR) {
    const valor = proposta?.[k]?.trim();
    if (valor && (substituir || !atual[k].trim())) resultado[k] = valor;
  }
  return resultado;
}
export function contarConflitosResumoApr(atual: ResumoApr, proposta?: Partial<ResumoApr>): number {
  return CAMPOS_RESUMO_APR.filter((k) => atual[k].trim() && proposta?.[k]?.trim() && atual[k].trim() !== proposta[k]?.trim()).length;
}
/** Conduta administrativa fixa (matriz de conduta da APR-HO); acompanha sempre a classificação calculada. */
export const CONDUTAS_APR: Record<string, string> = {
  "SEM RISCO": "Nenhuma ação é requerida e nenhum registro documental precisa ser mantido.",
  BAIXO: "Há medidas de controle eficientes. Devem ser gerenciadas na busca de melhorias contínuas.",
  "MÉDIO": "Devem ser gerenciadas na busca de melhorias contínuas e medidas de controle implementadas.",
  ALTO: "Faz-se necessária recomendação para o controle da exposição, com investigação da ocorrência do risco e plano de ação (AET + Plano de ação).",
  "MUITO ALTO": "Faz-se necessária recomendação para o controle da exposição, com investigação da ocorrência do risco e plano de ação (AET + Plano de ação).",
};
export function condutaApr(classificacao: string): string {
  return CONDUTAS_APR[classificacao === "Não se Aplica" ? "SEM RISCO" : classificacao] || "";
}
const CONDUTAS_UNICAS = [...new Set(Object.values(CONDUTAS_APR))];
/** Remove a conduta anterior do início e insere a do nível atual, preservando o texto restante. */
export function sincronizarCondutaApr(recomendacoes: string, classificacao: string): string {
  if (classificacao === "ALTO" || classificacao === "MUITO ALTO") return condutaApr(classificacao);
  let resto = recomendacoes.trim(); let achou = true;
  while (achou) { achou = false; for (const c of CONDUTAS_UNICAS) if (resto.startsWith(c)) { resto = resto.slice(c.length).trim(); achou = true; } }
  return [condutaApr(classificacao), resto].filter(Boolean).join("\n");
}

/** Merge is explicitly field-level: photos and unmatched manual rows always survive. */
export function aplicarPropostaApr(atuais: LinhaApr[], propostas: LinhaApr[], substituir: boolean): LinhaApr[] {
  return Array.from({ length: Math.max(atuais.length, propostas.length) }, (_, i) => {
    const atual = atuais[i]; const nova = propostas[i];
    const campos = Object.fromEntries(CAMPOS_APR.map((k) => [k, nova?.[k]?.trim() && (substituir || !atual?.[k]?.trim()) ? nova[k] : atual?.[k] || ""])) as Record<typeof CAMPOS_APR[number], string>;
    const vinculo = atual?.circunstancia.trim() && !substituir ? atual : nova?.funcao_id || nova?.funcao_ids?.length ? nova : atual;
    return recalcularLinhaApr({ ...campos, fotos: atual?.fotos || [], funcao_id: vinculo?.funcao_id, funcao_ids: vinculo?.funcao_ids, funcao_nome: vinculo?.funcao_nome, setor_id: vinculo?.setor_id });
  });
}
export function contarConflitosApr(atuais: LinhaApr[], propostas: LinhaApr[]): number {
  return propostas.reduce((n, l, i) => n + CAMPOS_APR.filter((k) => atuais[i]?.[k]?.trim() && l[k]?.trim() && atuais[i][k].trim() !== l[k].trim()).length, 0);
}
/** No quantity cap: exact function/sector identity and distinct technical circumstances only. */
export function cenariosValidosApr<T extends { funcao_id?: string; funcao_ids?: string[]; setor_id?: string; circunstancia: string; situacao: string; exigencia: string }>(linhas: T[], setorId: string, funcaoIds: string[]): T[] {
  const vistos = new Set<string>();
  const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  return linhas.filter((l) => {
    const ids = l.funcao_ids?.length ? l.funcao_ids : l.funcao_id ? [l.funcao_id] : [];
    if (l.setor_id !== setorId || !ids.length || ids.some((id) => !funcaoIds.includes(id)) || !l.circunstancia.trim() || !l.situacao || !l.exigencia) return false;
    const chave = JSON.stringify([normalizar(l.circunstancia), normalizar(l.situacao), normalizar(l.exigencia)]);
    if (vistos.has(chave)) return false;
    vistos.add(chave); return true;
  });
}

/** Generated content only: remove registry names without touching saved/manual cells. */
export function circunstanciaTecnicaApr(texto: unknown, nomes: string[]): string {
  if (typeof texto !== "string") return "";
  let resultado = texto;
  for (const nome of [...nomes].filter(Boolean).sort((a, b) => b.length - a.length)) {
    const literal = nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    resultado = resultado.replace(new RegExp(`(?<![\\p{L}\\p{N}])${literal}(?![\\p{L}\\p{N}])`, "giu"), "");
  }
  return resultado.replace(/^\s*[-—–:;,/]+\s*/, "").replace(/\s+/g, " ").trim();
}
export function formulariosCompativeisApr<T extends { setor_ids: string[]; dados: unknown }>(formularios: T[], setorId: string, funcaoIds: string[]): T[] {
  return formularios.filter((f) => {
    if (f.setor_ids.length !== 1 || f.setor_ids[0] !== setorId) return false;
    const dados = f.dados as { funcoes?: string[] } | null;
    return !dados?.funcoes?.length || dados.funcoes.every((id) => funcaoIds.includes(id));
  });
}

/** Recalcula as colunas automáticas exatamente como Formulario!K e M. */
export function recalcularLinhaApr<T extends { estimativa: string; intensidade: string; severidade: string; perfil: string; classificacao: string; recomendacoes?: string }>(l: T): T {
  const perfil = perfilApr(l.estimativa, l.intensidade);
  const classificacao = classificacaoApr(perfil, l.severidade);
  return { ...l, perfil, classificacao, ...(typeof l.recomendacoes === "string" ? { recomendacoes: sincronizarCondutaApr(l.recomendacoes, classificacao) } : {}) };
}

/** Only unambiguous single D/I marks from Anexo 01 are transferred, mapped by level to the spreadsheet options. */
export function classificacoesSalvasApr(marcas: Record<string, string>) {
  const unico = (prefixo: string, opcoes: [string, number][]) => {
    const ativos = Object.entries(marcas).filter(([k, v]) => new RegExp(`^${prefixo}[1-5]$`).test(k) && String(v).trim());
    return ativos.length === 1 ? opcoes[Number(ativos[0][0].slice(1)) - 1]?.[0] || "" : "";
  };
  return { estimativa: unico("D", ESTIMATIVAS_APR), intensidade: unico("I", INTENSIDADES_APR) };
}
