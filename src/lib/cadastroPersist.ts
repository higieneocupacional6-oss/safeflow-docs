import { supabase } from "@/integrations/supabase/client";
import { ConcurrentEditError, conflictMessage, updateWithVersion, type SharedTable } from "@/lib/concurrency";

function errorParts(error: unknown): { code: string; message: string } {
  if (!error || typeof error !== "object") return { code: "", message: "" };
  const value = error as { code?: unknown; message?: unknown };
  return {
    code: typeof value.code === "string" ? value.code : "",
    message: typeof value.message === "string" ? value.message : error instanceof Error ? error.message : "",
  };
}

/** Mensagem de gravação para cadastros compartilhados. A causa continua vindo do banco. */
export function catalogErrorMessage(error: unknown): string {
  if (error instanceof ConcurrentEditError) return error.message;
  const { code, message } = errorParts(error);
  if (code === "23505" || /duplicate key|unique constraint/i.test(message)) {
    return "Já existe um registro com estes dados. Atualize a lista para ver o que outro usuário gravou.";
  }
  if (code === "23502" || /não pode ser nulo|not-null constraint/i.test(message)) {
    return message || "Um campo obrigatório ficou vazio e o cadastro não foi gravado.";
  }
  if (code === "42501" || /row-level security|autenticação obrigatória/i.test(message)) {
    return "Seu perfil não tem permissão para gravar este cadastro.";
  }
  return conflictMessage(error);
}

/** Insere e só considera salvo depois que o banco devolve o id. */
export async function insertCatalog(table: string, payload: Record<string, unknown>) {
  const { data, error } = await (supabase as any).from(table).insert(payload).select("id").single();
  if (error) throw error;
  if (!data?.id) throw new Error("O banco não confirmou a gravação deste cadastro.");
  return data as { id: string };
}

/** Atualiza somente se ninguém gravou o mesmo registro desde a leitura. */
export async function updateCatalog<T extends Record<string, unknown>>(
  table: SharedTable,
  id: string,
  version: number | null | undefined,
  payload: Record<string, unknown>,
) {
  return updateWithVersion<T>(table, id, version ?? 1, payload);
}

/** Exclusão confirmada pelo retorno da linha. RLS que não altera nada não é sucesso silencioso. */
export async function deleteCatalog(table: string, id: string) {
  const { data, error } = await (supabase as any).from(table).delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data?.length) {
    throw new Error("O registro não foi excluído. Atualize a lista: ele pode ter sido alterado por outro usuário.");
  }
}
