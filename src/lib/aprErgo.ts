export type AprErgoSetor = {
  id: string;
  empresa_id: string;
  contrato_id: string | null;
  nome_setor: string;
  ghe_ges: string | null;
  funcoes: { id: string; nome_funcao: string }[];
};

export function setoresAprErgoDoContrato(setores: AprErgoSetor[], empresaId: string, contratoId: string) {
  return setores.filter((s) => s.empresa_id === empresaId && s.contrato_id === contratoId);
}

export function criarRegistroAprErgo(setor: AprErgoSetor, empresaId: string, contratoId: string, empresaNome: string, registroId: string, funcaoId: string) {
  if (setor.empresa_id !== empresaId || setor.contrato_id !== contratoId) {
    throw new Error("O setor não pertence à empresa e ao contrato selecionados.");
  }
  const funcao = setor.funcoes.find((f) => f.id === funcaoId);
  if (!funcao) throw new Error("A função não pertence ao setor selecionado.");
  return {
    id: registroId,
    tipo: "APR-ERGO",
    empresa_id: empresaId,
    contrato_id: contratoId,
    empresa_nome: empresaNome,
    nome_documento: `APR-ERGO — ${setor.nome_setor} — ${funcao.nome_funcao}`,
    status: "rascunho",
    draft_snapshot: { setor_id: setor.id, funcao_id: funcao.id },
  };
}

export function setorDoRegistroAprErgo(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object" || !("setor_id" in snapshot)) return null;
  return typeof snapshot.setor_id === "string" ? snapshot.setor_id : null;
}
export function funcaoDoRegistroAprErgo(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object" || !("funcao_id" in snapshot)) return null;
  return typeof snapshot.funcao_id === "string" ? snapshot.funcao_id : null;
}

export function nomeRegistroAprErgo(snapshot: unknown, funcoes: AprErgoSetor["funcoes"]): string {
  const fid = funcaoDoRegistroAprErgo(snapshot);
  if (fid) return funcoes.find((f) => f.id === fid)?.nome_funcao || "Função removida do cadastro";
  const snap = snapshot && typeof snapshot === "object" ? snapshot as Record<string, unknown> : {};
  const tabela = snap.tabela as { cabecalho?: { cargo?: string }; linhas?: { funcao_id?: string; funcao_ids?: string[] }[] } | undefined;
  const ids = Array.isArray(snap.funcao_ids) ? snap.funcao_ids : tabela?.linhas?.flatMap((l) => l.funcao_ids || (l.funcao_id ? [l.funcao_id] : [])) || [];
  const nomes = [...new Set(funcoes.filter((f) => !ids.length || ids.includes(f.id)).map((f) => f.nome_funcao))];
  return nomes.join("; ") || tabela?.cabecalho?.cargo?.trim() || "Função não identificada";
}

/** Only never-saved records are drafts; saving marks status "salvo". */
export function rotuloStatusAprErgo(status: string) {
  return status === "rascunho" ? "Rascunho" : "Salvo";
}
