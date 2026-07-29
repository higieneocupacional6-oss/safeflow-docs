/**
 * Regras genéricas de existência de risco por Setor/GHE e limpeza do
 * contexto enviado ao template (LTCAT e Laudo de Insalubridade).
 *
 * Princípio: o template só recebe o que realmente existe no cadastro.
 * Nenhuma coleção vazia, nenhum bloco condicional falso é enviado — assim
 * os blocos {{#setores}}, {{#riscos}}, {{#avaliacoes}}, {{#epis}},
 * {{#is_*}} e {{#exibir_media_*}} simplesmente não renderizam.
 */

export const temValor = (v: any): boolean =>
  v != null && String(v).trim() !== "" && String(v).trim().toLowerCase() !== "null";

/** Uma avaliação é válida quando possui resultado ou análise técnica. */
export const avaliacaoValida = (a: any): boolean =>
  !!a &&
  (temValor(a.resultado) ||
    temValor(a.resultado_calor) ||
    temValor(a.ibutg_resultado) ||
    temValor(a.ibutg_medido) ||
    temValor(a.exposicao) ||
    temValor(a.aren_resultado) ||
    temValor(a.aren) ||
    temValor(a.vdvr_resultado) ||
    temValor(a.vdvr) ||
    temValor(a.dose_percentual) ||
    temValor(a.parecer_tecnico) ||
    temValor(a.descricao_avaliacao) ||
    temValor(a.situacao) ||
    (Array.isArray(a.componentes_amostra) &&
      a.componentes_amostra.some((c: any) => temValor(c?.resultado))));

/**
 * Informações técnicas vinculadas ao risco — cobre agentes qualitativos
 * (físicos, químicos e biológicos), que não possuem medição.
 */
export const riscoTemInfoTecnica = (r: any): boolean =>
  !!r &&
  (temValor(r.parecer_tecnico) ||
    temValor(r.descricao_avaliacao) ||
    temValor(r.resultado) ||
    temValor(r.fonte_geradora) ||
    temValor(r.danos_saude) ||
    temValor(r.medidas_controle) ||
    temValor(r.tipo_exposicao) ||
    temValor(r.propagacao) ||
    temValor(r.codigo_esocial) ||
    temValor(r.aposentadoria_especial) ||
    (Array.isArray(r.epis) && r.epis.length > 0));

/** Risco existe no Setor/GHE quando há avaliação válida OU info técnica. */
export const riscoExiste = (r: any): boolean =>
  !!r &&
  ((Array.isArray(r.avaliacoes) && r.avaliacoes.some(avaliacaoValida)) ||
    riscoTemInfoTecnica(r));

const COLLECTION_KEYS = [
  "avaliacoes",
  "epis",
  "epcs",
  "epi_epc",
  "componentes",
  "componentes_amostra",
  "equipamentos",
  "equipamentos_avaliacao",
  "setores",
  "riscos",
  "funcoes",
];

/**
 * Remove do objeto de risco: coleções vazias e blocos condicionais falsos
 * ({{#is_*}}, {{#exibir_*}}, {{#ibutg_*_carga_solar}}). O que não existe
 * não chega ao Handlebars/Docxtemplater.
 */
export const sanitizeRisco = <T extends Record<string, any>>(r: T): T => {
  const out: Record<string, any> = { ...r };

  for (const k of COLLECTION_KEYS) {
    if (Array.isArray(out[k])) {
      if (k === "avaliacoes") out[k] = out[k].filter(avaliacaoValida);
      if (out[k].length === 0) delete out[k];
    }
  }

  for (const k of Object.keys(out)) {
    const isBlockFlag =
      k.startsWith("is_") || k.startsWith("exibir_") || k.startsWith("ibutg_") && typeof out[k] === "boolean";
    if (isBlockFlag && out[k] === false) delete out[k];
  }

  return out as T;
};

/** Aplica a regra a um setor: filtra riscos inexistentes e limpa o contexto. */
export const sanitizeSetor = <T extends Record<string, any>>(s: T): T | null => {
  const riscos = (Array.isArray(s?.riscos) ? s.riscos : [])
    .filter(riscoExiste)
    .map((r: any) => {
      const limpo = sanitizeRisco(r);
      if (Array.isArray((limpo as any).setores)) {
        (limpo as any).setores = (limpo as any).setores.map((sub: any) => sanitizeRisco(sub));
      }
      return limpo;
    });
  if (riscos.length === 0) return null;
  return { ...s, riscos } as T;
};

/** Filtra a lista de setores, removendo os que ficaram sem riscos. */
export const sanitizeSetores = (setores: any[]): any[] =>
  (setores || []).map(sanitizeSetor).filter(Boolean) as any[];
