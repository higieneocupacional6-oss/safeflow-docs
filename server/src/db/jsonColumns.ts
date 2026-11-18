/**
 * Colunas jsonb do schema public (segcrm).
 * node-pg serializa Array JS como array PostgreSQL — isso quebra colunas jsonb.
 * Sempre stringify + cast ::jsonb nestas colunas.
 */
export const JSONB_COLUMNS: Record<string, ReadonlySet<string>> = {
  aep_documentos: new Set(["revisoes", "setores"]),
  aet_documentos: new Set(["revisoes", "setores"]),
  audit_log: new Set(["new_data", "old_data"]),
  documentos: new Set(["draft_snapshot", "revisoes"]),
  ergonomia_avaliacoes: new Set(["respostas"]),
  formularios_aep: new Set(["dados"]),
  pcmso_documentos: new Set([
    "cronograma",
    "epi_blocos",
    "revisoes",
    "setores_snapshot",
    "treinamento_blocos",
  ]),
  psico_indicadores: new Set(["dados"]),
  psico_relatorios: new Set(["dados"]),
  psico_respostas: new Set(["alertas", "blocos", "respostas"]),
};

export const isJsonbColumn = (table: string, column: string): boolean =>
  JSONB_COLUMNS[table]?.has(column) === true;

/**
 * Prepara valor para bind em coluna jsonb.
 * Aceita objeto/array/string JSON; rejeita string vazia (vira null).
 */
export const toJsonbParam = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    JSON.parse(trimmed); // valida; propaga SyntaxError se inválido
    return trimmed;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  // number/boolean → JSON escalar válido
  return JSON.stringify(value);
};

/** Argumentos RPC conhecidos que são jsonb (não uuid[]/text[]). */
const RPC_JSONB_ARGS: Record<string, ReadonlySet<string>> = {
  update_shared_record: new Set(["_patch"]),
  save_ltcat_documento_v2: new Set(["_avaliacoes", "_delete_child_ids", "_document_patch"]),
  sync_ltcat_avaliacoes: new Set(["_avaliacoes"]),
  psico_submit_resposta: new Set(["_payload"]),
  psico_get_public_link: new Set(),
  import_ficha_tecnica_resultados: new Set(),
  has_role: new Set(),
};

export const prepareRpcArg = (
  rpcName: string,
  argName: string,
  value: unknown,
): { value: unknown; cast: string } => {
  if (value == null) return { value: null, cast: "" };
  if (value instanceof Date) return { value: value.toISOString(), cast: "" };

  const forceJsonb = RPC_JSONB_ARGS[rpcName]?.has(argName) === true
    || /(_patch|_payload|_avaliacoes|child_ids|snapshot|dados)$/i.test(argName);

  if (forceJsonb) {
    return { value: toJsonbParam(value), cast: "::jsonb" };
  }

  // Arrays de primitivos (ex.: _delete_avaliacao_ids uuid[]) — deixar o pg serializar.
  if (Array.isArray(value)) {
    if (value.every((item) => item == null || typeof item !== "object")) {
      return { value, cast: "" };
    }
    return { value: toJsonbParam(value), cast: "::jsonb" };
  }

  if (typeof value === "object") {
    return { value: toJsonbParam(value), cast: "::jsonb" };
  }

  return { value, cast: "" };
};
