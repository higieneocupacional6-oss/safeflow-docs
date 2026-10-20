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

export function criarRegistroAprErgo(setor: AprErgoSetor, empresaId: string, contratoId: string, empresaNome: string, registroId: string) {
  if (setor.empresa_id !== empresaId || setor.contrato_id !== contratoId) {
    throw new Error("O setor não pertence à empresa e ao contrato selecionados.");
  }
  return {
    id: registroId,
    tipo: "APR-ERGO",
    empresa_id: empresaId,
    contrato_id: contratoId,
    empresa_nome: empresaNome,
    nome_documento: `APR-ERGO — ${setor.nome_setor}`,
    status: "rascunho",
    draft_snapshot: { setor_id: setor.id },
  };
}

export function setorDoRegistroAprErgo(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object" || !("setor_id" in snapshot)) return null;
  return typeof snapshot.setor_id === "string" ? snapshot.setor_id : null;
}