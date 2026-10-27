type Row = Record<string, any>;

const textoCampo = (value: unknown) => (value == null ? "" : String(value).trim());

/** Descrição técnica gravada nesta avaliação, com fallback só nas linhas dela. */
export function descricaoTecnicaGravada(origem: unknown, linhas: unknown[] = []) {
  const registro = (origem || {}) as Row;
  const direta = textoCampo(registro.descricao_tecnica) || textoCampo(registro.descricao_avaliacao);
  if (direta) return direta;
  for (const linha of linhas) {
    const atual = (linha || {}) as Row;
    const valor = textoCampo(atual.descricao_avaliacao) || textoCampo(atual.descricao_tecnica);
    if (valor) return valor;
  }
  return "";
}

/** Same-risk fields only; no lookup in another agent, sector or document. */
export function ltcatEvaluationFields(risk: Row, row: Row, techniques: Row[]) {
  const technique = techniques.find(t => t.id === (row.tecnica_id || risk.tecnica_id))?.nome || "";
  return {
    descricao_avaliacao: row.descricao_avaliacao || row.descricao_tecnica || risk.descricao_tecnica || risk.descricao_avaliacao || "",
    colaborador: row.colaborador || "",
    tecnica_amostragem: technique,
    tecnica: technique,
    tipo_exposicao: row.tipo_exposicao || risk.tipo_exposicao || "",
  };
}

/** Risk-loop scalars aggregate only their own evaluations, retaining each row below. */
export function ltcatRiskFields(entries: Row[], evaluations: Row[], techniques: Row[]) {
  const join = (values: unknown[]) => [...new Set(values.map(v => String(v || "").trim()).filter(Boolean))].join("; ");
  const fields = entries.map(r => ltcatEvaluationFields(r, r, techniques));
  return {
    descricao_avaliacao: join(evaluations.map(a => a.descricao_avaliacao).concat(fields.map(f => f.descricao_avaliacao))),
    colaborador: join(evaluations.map(a => a.colaborador)),
    tecnica_amostragem: join(fields.map(f => f.tecnica_amostragem)),
    tecnica: join(fields.map(f => f.tecnica)),
    tipo_exposicao: join(fields.map(f => f.tipo_exposicao)),
  };
}