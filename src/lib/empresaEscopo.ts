/** Slug de rota quando a empresa não tem contrato (escopo só da empresa). */
export const CONTRATO_INDEPENDENTE_SLUG = "independente";

export type EmpresaEscopoLite = {
  id?: string;
  sem_contrato?: boolean | null;
};

/** Empresa cadastrada como independente (sem vínculo de contrato). */
export function empresaSemContrato(empresa?: EmpresaEscopoLite | null): boolean {
  return empresa?.sem_contrato === true;
}

/** Converte param de URL / select em contrato_id persistível (null se independente). */
export function contratoIdPersistivel(contratoId?: string | null): string | null {
  if (!contratoId || contratoId === CONTRATO_INDEPENDENTE_SLUG) return null;
  return contratoId;
}

/** Valor de select/rota para empresa independente. */
export function contratoIdParaUi(contratoId?: string | null, semContrato?: boolean): string {
  if (semContrato) return CONTRATO_INDEPENDENTE_SLUG;
  return contratoId || "";
}

/** Rótulo amigável quando não há contrato. */
export function rotuloContratoOuIndependente(opts: {
  semContrato?: boolean;
  numero?: string | null;
  nomeContratante?: string | null;
}): string {
  if (opts.semContrato) return "Empresa independente (sem contrato)";
  const num = (opts.numero || "").trim();
  const nome = (opts.nomeContratante || "").trim();
  if (num && nome) return `${num} — ${nome}`;
  if (num) return num;
  if (nome) return nome;
  return "Contrato";
}
