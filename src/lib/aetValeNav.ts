/** Monta a rota da lista AET (VALE) preservando empresa, contrato e setores selecionados. */
export function rotaAetValeEscopo(opts: {
  empresaId?: string | null;
  contratoId?: string | null;
  setores?: string[] | null;
}): string {
  const p = new URLSearchParams();
  const empresa = String(opts.empresaId || "").trim();
  const contrato = String(opts.contratoId || "").trim();
  const setores = [...new Set((opts.setores || []).map((id) => String(id || "").trim()).filter(Boolean))];
  if (empresa) p.set("empresa", empresa);
  if (contrato) p.set("contrato", contrato);
  if (setores.length) p.set("setores", setores.join(","));
  const q = p.toString();
  return q ? `/documentos/aet-vale?${q}` : "/documentos/aet-vale";
}

export function setoresDaQuery(raw: string | null | undefined): string[] {
  return [...new Set(String(raw || "").split(",").map((s) => s.trim()).filter(Boolean))];
}
