import { supabase } from "@/integrations/supabase/client";
import { TIPO_AEP_AET, lerSnapshotAepAet, type AepAetDraftSnapshot } from "@/lib/aepAetFormulario";
import {
  listAepAetOffline,
  updateAepAetOffline,
  type AepAetOfflineAvaliacao,
} from "@/lib/aepAetOfflineDb";

export type AepAetSyncResult = {
  total: number;
  synced: number;
  duplicates: number;
  errors: number;
  items: Array<{
    client_id: string;
    status: "synced" | "error" | "duplicate";
    message?: string;
    server_id?: string | null;
    funcao_nome?: string;
    setor_nome?: string;
  }>;
};

/**
 * Envia avaliações offline pendentes ao banco (documentos AEP-AET).
 * Nunca remove o registro local antes da confirmação do servidor.
 */
export async function syncAepAetOfflinePendentes(opts: {
  empresaId: string;
  contratoId: string;
  clientIds?: string[];
  userId?: string | null;
}): Promise<AepAetSyncResult> {
  const pending = await listAepAetOffline({
    empresaId: opts.empresaId,
    contratoId: opts.contratoId,
    statuses: ["pending", "error", "syncing"],
  });

  const queue = pending.filter((item) => {
    if (opts.clientIds?.length) return opts.clientIds.includes(item.client_id);
    return true;
  });

  const result: AepAetSyncResult = {
    total: queue.length,
    synced: 0,
    duplicates: 0,
    errors: 0,
    items: [],
  };

  for (const item of queue) {
    await updateAepAetOffline(item.client_id, {
      sync_status: "syncing",
      error_message: null,
    });

    try {
      const outcome = await enviarAvaliacao(item, opts.userId || null);
      if (outcome.ok) {
        await updateAepAetOffline(item.client_id, {
          sync_status: "synced",
          synced_at: new Date().toISOString(),
          server_id: outcome.serverId || item.server_id,
          status_doc: outcome.statusDoc || item.status_doc,
          error_message: null,
        });
        if (outcome.duplicate) {
          result.duplicates += 1;
          result.items.push({
            client_id: item.client_id,
            status: "duplicate",
            server_id: outcome.serverId,
            message: outcome.message || "Já sincronizada anteriormente",
            funcao_nome: item.funcao_nome,
            setor_nome: item.setor_nome,
          });
        } else {
          result.synced += 1;
          result.items.push({
            client_id: item.client_id,
            status: "synced",
            server_id: outcome.serverId,
            funcao_nome: item.funcao_nome,
            setor_nome: item.setor_nome,
          });
        }
      } else {
        await updateAepAetOffline(item.client_id, {
          sync_status: "error",
          error_message: outcome.error,
        });
        result.errors += 1;
        result.items.push({
          client_id: item.client_id,
          status: "error",
          message: outcome.error,
          funcao_nome: item.funcao_nome,
          setor_nome: item.setor_nome,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha na sincronização";
      await updateAepAetOffline(item.client_id, {
        sync_status: "error",
        error_message: message,
      });
      result.errors += 1;
      result.items.push({
        client_id: item.client_id,
        status: "error",
        message,
        funcao_nome: item.funcao_nome,
        setor_nome: item.setor_nome,
      });
    }
  }

  return result;
}

async function enviarAvaliacao(
  item: AepAetOfflineAvaliacao,
  userId: string | null,
): Promise<{
  ok: boolean;
  serverId?: string;
  statusDoc?: string;
  duplicate?: boolean;
  message?: string;
  error?: string;
}> {
  const snapshot: AepAetDraftSnapshot = {
    setor_id: item.setor_id,
    funcao_id: item.funcao_id,
    dados: item.dados,
  };

  const basePatch = {
    draft_snapshot: snapshot,
    current_step: item.dados.etapa_atual || 0,
    last_modified_by: userId,
    empresa_nome: item.empresa_nome,
    nome_documento: `AEP/AET — ${item.setor_nome || "Setor"} — ${item.funcao_nome || "Função"}`,
    status: item.status_doc || "rascunho",
    offline_client_id: item.client_id,
    offline_device_id: item.device_id,
    offline_device_label: item.device_label,
  };

  // 1) Já sincronizada por offline_client_id?
  {
    const { data: byClient, error } = await supabase
      .from("documentos")
      .select("id, status, offline_device_id, draft_snapshot")
      .eq("tipo", TIPO_AEP_AET)
      .eq("offline_client_id", item.client_id)
      .maybeSingle();
    if (error && !isMissingColumnError(error.message)) {
      return { ok: false, error: error.message };
    }
    if (byClient?.id) {
      // Não sobrescrever se outro dispositivo for o dono do mesmo client_id (improvável) —
      // client_id é único; atualiza o registro correspondente.
      const { data: updated, error: upErr } = await supabase
        .from("documentos")
        .update(basePatch as never)
        .eq("id", byClient.id)
        .eq("tipo", TIPO_AEP_AET)
        .eq("empresa_id", item.empresa_id)
        .select("id, status")
        .single();
      if (upErr) return { ok: false, error: upErr.message };
      return {
        ok: true,
        serverId: updated.id,
        statusDoc: updated.status,
        duplicate: true,
        message: "Atualizada (já existia no servidor)",
      };
    }
  }

  // 2) Atualizar pelo server_id local (aberto a partir do online)
  if (item.server_id) {
    const { data: existing, error: getErr } = await supabase
      .from("documentos")
      .select("id, offline_client_id, offline_device_id")
      .eq("id", item.server_id)
      .eq("tipo", TIPO_AEP_AET)
      .eq("empresa_id", item.empresa_id)
      .maybeSingle();
    if (getErr) return { ok: false, error: getErr.message };
    if (!existing) {
      // servidor não tem mais o id — segue para insert / match por função
    } else {
      const occupiedByOther =
        existing.offline_client_id &&
        existing.offline_client_id !== item.client_id;
      if (occupiedByOther) {
        return {
          ok: false,
          error: "Este registro no servidor pertence a outra avaliação offline.",
        };
      }
      const { data: updated, error: upErr } = await supabase
        .from("documentos")
        .update(basePatch as never)
        .eq("id", item.server_id)
        .eq("tipo", TIPO_AEP_AET)
        .eq("empresa_id", item.empresa_id)
        .select("id, status")
        .single();
      if (upErr) return { ok: false, error: upErr.message };
      return { ok: true, serverId: updated.id, statusDoc: updated.status };
    }
  }

  // 3) Já existe avaliação AEP-AET para a mesma função neste contrato?
  {
    const { data: docs, error } = await supabase
      .from("documentos")
      .select("id, offline_client_id, offline_device_id, draft_snapshot")
      .eq("tipo", TIPO_AEP_AET)
      .eq("empresa_id", item.empresa_id)
      .eq("contrato_id", item.contrato_id);
    if (error) return { ok: false, error: error.message };

    const mesmaFuncao = (docs || []).find((d) => {
      const snap = lerSnapshotAepAet(d.draft_snapshot);
      return snap?.funcao_id === item.funcao_id;
    });

    if (mesmaFuncao) {
      const otherClient =
        mesmaFuncao.offline_client_id &&
        mesmaFuncao.offline_client_id !== item.client_id;
      const otherDevice =
        mesmaFuncao.offline_device_id &&
        mesmaFuncao.offline_device_id !== item.device_id &&
        !!mesmaFuncao.offline_client_id;

      if (otherClient || otherDevice) {
        return {
          ok: false,
          error:
            "Já existe avaliação desta função no servidor (outro colaborador/dispositivo). Não sobrescrita.",
        };
      }

      // Sem dono offline ou somos o dono — atualiza
      const { data: updated, error: upErr } = await supabase
        .from("documentos")
        .update(basePatch as never)
        .eq("id", mesmaFuncao.id)
        .eq("tipo", TIPO_AEP_AET)
        .eq("empresa_id", item.empresa_id)
        .select("id, status")
        .single();
      if (upErr) return { ok: false, error: upErr.message };
      return {
        ok: true,
        serverId: updated.id,
        statusDoc: updated.status,
        duplicate: true,
        message: "Vinculada à avaliação existente da função",
      };
    }
  }

  // 4) Insert novo
  const insertPayload = {
    tipo: TIPO_AEP_AET,
    empresa_id: item.empresa_id,
    contrato_id: item.contrato_id,
    ...basePatch,
  };

  let { data: inserted, error: insErr } = await supabase
    .from("documentos")
    .insert(insertPayload as never)
    .select("id, status")
    .single();

  // Ambiente sem migration ainda: tenta sem colunas offline_*
  if (insErr && isMissingColumnError(insErr.message)) {
    const { offline_client_id: _c, offline_device_id: _d, offline_device_label: _l, ...semOffline } = insertPayload as Record<string, unknown>;
    const retry = await supabase
      .from("documentos")
      .insert({
        ...semOffline,
        draft_snapshot: {
          ...snapshot,
          offline_meta: {
            client_id: item.client_id,
            device_id: item.device_id,
            device_label: item.device_label,
          },
        },
      } as never)
      .select("id, status")
      .single();
    inserted = retry.data;
    insErr = retry.error;
  }

  if (insErr) {
    // Concorrência no unique offline_client_id
    if (/offline_client_id|duplicate|unique/i.test(insErr.message)) {
      const { data: again } = await supabase
        .from("documentos")
        .select("id, status")
        .eq("tipo", TIPO_AEP_AET)
        .eq("offline_client_id", item.client_id)
        .maybeSingle();
      if (again?.id) {
        return {
          ok: true,
          serverId: again.id,
          statusDoc: again.status,
          duplicate: true,
          message: "Já importada (corrida)",
        };
      }
    }
    return { ok: false, error: insErr.message };
  }

  return { ok: true, serverId: inserted!.id, statusDoc: inserted!.status };
}

function isMissingColumnError(message: string): boolean {
  return /offline_client_id|column .* does not exist/i.test(message);
}
