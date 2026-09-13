import { supabase } from "@/integrations/supabase/client";

export class ConcurrentEditError extends Error {
  current: Record<string, unknown> | null;

  constructor(current: Record<string, unknown> | null) {
    super("Este registro foi alterado por outra pessoa. Atualize os dados antes de salvar novamente.");
    this.name = "ConcurrentEditError";
    this.current = current;
  }
}

type SharedTable =
  | "empresas"
  | "contratos"
  | "setores"
  | "funcoes"
  | "riscos"
  | "documentos"
  | "aet_documentos"
  | "aep_documentos"
  | "pcmso_documentos";

export async function updateWithVersion<T extends Record<string, unknown>>(
  table: SharedTable,
  id: string,
  expectedVersion: number,
  patch: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await (supabase as any).rpc("update_shared_record", {
    _table_name: table,
    _record_id: id,
    _expected_version: expectedVersion,
    _patch: patch,
  });
  if (error) throw error;
  if (!data?.ok) throw new ConcurrentEditError(data?.current ?? null);
  return data.record as T;
}

export const conflictMessage = (error: unknown) =>
  error instanceof ConcurrentEditError
    ? error.message
    : error instanceof Error
      ? error.message
      : "Não foi possível salvar.";
