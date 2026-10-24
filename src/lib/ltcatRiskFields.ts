type Row = Record<string, any>;

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