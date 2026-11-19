import { supabase } from "@/integrations/supabase/client";
import {
  listPsicoPending,
  updatePsicoPending,
  type PsicoPendingResposta,
} from "@/lib/psicoOfflineDb";

export type PsicoSyncResult = {
  total: number;
  synced: number;
  duplicates: number;
  errors: number;
  items: Array<{
    client_id: string;
    status: "synced" | "error" | "duplicate";
    message?: string;
    server_id?: string | null;
    device_label?: string;
    colaborador_nome?: string | null;
  }>;
};

/**
 * Envia respostas pendentes do IndexedDB via psico_submit_resposta (mesmo fluxo online).
 * NÃO apaga registros locais: marca synced só após ok/duplicate do servidor.
 */
export async function syncPsicoPendingRespostas(opts: {
  token?: string | null;
  avaliacaoId?: string | null;
  clientIds?: string[];
}): Promise<PsicoSyncResult> {
  const pending = await listPsicoPending({
    statuses: ["pending", "error", "syncing"],
  });

  const queue = pending.filter((item) => {
    if (opts.clientIds?.length) return opts.clientIds.includes(item.client_id);
    if (opts.token && item.token === opts.token) return true;
    if (opts.avaliacaoId && item.avaliacao_id === opts.avaliacaoId) return true;
    return false;
  });

  const result: PsicoSyncResult = {
    total: queue.length,
    synced: 0,
    duplicates: 0,
    errors: 0,
    items: [],
  };

  for (const item of queue) {
    await updatePsicoPending(item.client_id, { status: "syncing", error_message: null });
    try {
      const outcome = await submitPendingItem(item);
      if (outcome.ok) {
        await updatePsicoPending(item.client_id, {
          status: "synced",
          synced_at: new Date().toISOString(),
          server_id: outcome.id,
          error_message: null,
        });
        if (outcome.duplicate) {
          result.duplicates += 1;
          result.items.push({
            client_id: item.client_id,
            status: "duplicate",
            server_id: outcome.id,
            message: "Já importada anteriormente",
            device_label: item.device_label,
            colaborador_nome: item.colaborador_nome,
          });
        } else {
          result.synced += 1;
          result.items.push({
            client_id: item.client_id,
            status: "synced",
            server_id: outcome.id,
            device_label: item.device_label,
            colaborador_nome: item.colaborador_nome,
          });
        }
      } else {
        await updatePsicoPending(item.client_id, {
          status: "error",
          error_message: outcome.error,
        });
        result.errors += 1;
        result.items.push({
          client_id: item.client_id,
          status: "error",
          message: outcome.error,
          device_label: item.device_label,
          colaborador_nome: item.colaborador_nome,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha na sincronização";
      await updatePsicoPending(item.client_id, {
        status: "error",
        error_message: message,
      });
      result.errors += 1;
      result.items.push({
        client_id: item.client_id,
        status: "error",
        message,
        device_label: item.device_label,
        colaborador_nome: item.colaborador_nome,
      });
    }
  }

  return result;
}

async function submitPendingItem(item: PsicoPendingResposta): Promise<{
  ok: boolean;
  id?: string;
  duplicate?: boolean;
  error?: string;
}> {
  const payload = {
    ...item.payload,
    offline_client_id: item.client_id,
    offline_device_id: item.device_id,
    offline_device_label: item.device_label,
  };
  const { data: res, error } = await supabase.rpc("psico_submit_resposta", {
    _token: item.token,
    _payload: payload as never,
  });
  if (error) return { ok: false, error: error.message };
  if ((res as { error?: string } | null)?.error) {
    return { ok: false, error: (res as { error: string }).error };
  }
  const body = res as { id?: string; ok?: boolean; duplicate?: boolean } | null;
  return {
    ok: !!body?.ok || !!body?.id,
    id: body?.id,
    duplicate: !!body?.duplicate,
  };
}
