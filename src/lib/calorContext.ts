/**
 * Lógica pura de contexto da Tabela de Calor (IBUTG) usada pelos módulos
 * LTCAT e Insalubridade.
 *
 * Motivo: os valores de calor podem ser informados de duas formas na UI —
 * pelo "Cálculo IBUTG" (tbn/tg/tbs) ou digitados diretamente no campo
 * "Exposição". O contexto do template precisa aceitar as duas origens,
 * caso contrário os blocos {{#ibutg_com_carga_solar}} /
 * {{#ibutg_sem_carga_solar}} nunca são renderizados.
 */

/** Converte texto de tempo de exposição em horas decimais. */
export const parseTempoExposicaoHoras = (raw: any): number => {
  if (raw == null) return 0;
  const s = String(raw).trim().toLowerCase().replace(",", ".");
  if (!s) return 0;
  if (/^\d+:\d{1,2}$/.test(s)) {
    const [h, m] = s.split(":").map(Number);
    return h + (m || 0) / 60;
  }
  const hMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:h(?:oras?)?|hr)/);
  const mMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:min(?:utos?)?|m\b)/);
  if (hMatch || mMatch) {
    const h = hMatch ? parseFloat(hMatch[1]) : 0;
    const m = mMatch ? parseFloat(mMatch[1]) : 0;
    return h + m / 60;
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

/** Valor de IBUTG de uma linha de calor (aceita fallbacks do formulário). */
export const getIbutgValor = (r: any): number => {
  const raw =
    r?.ibutg_resultado ?? r?.ibutg_medido ?? r?.exposicao ?? r?.resultado_calor ?? r?.resultado ?? "";
  return parseFloat(String(raw).replace(",", "."));
};

/** Linhas de calor que possuem IBUTG válido (> 0). */
export const filtrarCalorComIbutg = (rows: any[]): any[] =>
  (rows || []).filter((r) => {
    const ib = getIbutgValor(r);
    return isFinite(ib) && ib > 0;
  });

/**
 * IBUTG médio ponderado pelo tempo: Σ(IBUTG_i·T_i)/ΣT_i.
 * Sem tempos informados, cai para média aritmética simples.
 */
export const calcIbutgMedio = (rows: any[]): number | null => {
  if (!rows || !rows.length) return null;
  let num = 0;
  let den = 0;
  const simples: number[] = [];
  for (const r of rows) {
    const ib = getIbutgValor(r);
    if (!isFinite(ib) || ib <= 0) continue;
    simples.push(ib);
    const T = parseTempoExposicaoHoras(r?.tempo_exposicao);
    if (T <= 0) continue;
    num += ib * T;
    den += T;
  }
  if (den > 0) return num / den;
  if (simples.length) return simples.reduce((a, b) => a + b, 0) / simples.length;
  return null;
};

/** Média + flag de exibição para o bloco {{#exibir_media_ibutg}}. */
export const buildMediaIbutg = (rows: any[]): { ibutg_medio: string; exibir_media_ibutg: boolean } => {
  const validas = filtrarCalorComIbutg(rows);
  const media = validas.length > 1 ? calcIbutgMedio(validas) : null;
  const ibutg_medio = media == null ? "" : media.toFixed(2);
  return { ibutg_medio, exibir_media_ibutg: !!ibutg_medio };
};

export interface CalorFlags {
  ibutg_resultado: string;
  ibutg_limite: string;
  ibutg_tipo: "" | "com_carga_solar" | "sem_carga_solar";
  ibutg_com_carga_solar: boolean;
  ibutg_sem_carga_solar: boolean;
  situacao: string;
}

/**
 * Deriva os blocos condicionais e variáveis do bloco de calor de uma linha.
 * Garante que apenas UM dos blocos de carga solar seja verdadeiro.
 */
export const buildCalorFlags = (res: any): CalorFlags => {
  const ib = getIbutgValor(res);
  const lim = parseFloat(
    String(res?.ibutg_limite ?? res?.limite_tolerancia_calor ?? res?.limite_tolerancia ?? "").replace(",", "."),
  );
  const temIbutg = isFinite(ib) && ib > 0;
  const tipo =
    res?.ibutg_tipo === "com_carga_solar" || res?.ibutg_tipo === "sem_carga_solar"
      ? res.ibutg_tipo
      : String(res?.tbs_valores || "").trim()
        ? "com_carga_solar"
        : "sem_carga_solar";
  const situacao =
    res?.situacao ||
    (temIbutg && isFinite(lim) && lim > 0 ? (ib <= lim ? "Seguro" : "Nocivo") : "");
  return {
    ibutg_resultado: temIbutg ? String(ib) : "",
    ibutg_limite: isFinite(lim) && lim > 0 ? String(lim) : "",
    ibutg_tipo: temIbutg ? (tipo as any) : "",
    ibutg_com_carga_solar: temIbutg && tipo === "com_carga_solar",
    ibutg_sem_carga_solar: temIbutg && tipo === "sem_carga_solar",
    situacao,
  };
};
