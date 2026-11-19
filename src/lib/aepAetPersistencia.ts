import { supabase } from "@/integrations/supabase/client";
import {
  TIPO_AEP_AET,
  type AepAetDados,
  type AepAetDraftSnapshot,
} from "@/lib/aepAetFormulario";
import {
  getAepAetOffline,
  getAepAetOfflineByServerId,
  saveAepAetOffline,
  updateAepAetOffline,
  upsertAepAetOfflineFromServer,
  type AepAetModo,
  type AepAetOfflineAvaliacao,
} from "@/lib/aepAetOfflineDb";

export async function persistirAepAetOnline(args: {
  documentoId: string;
  empresaId: string;
  setorId: string;
  funcaoId: string;
  dados: AepAetDados;
  userId?: string | null;
  marcarSalvo?: boolean;
  marcarRascunho?: boolean;
  offlineClientId?: string | null;
  offlineDeviceId?: string | null;
  offlineDeviceLabel?: string | null;
}): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const etapaAtual = args.dados.etapa_atual;
  const snapshot: AepAetDraftSnapshot = {
    setor_id: args.setorId,
    funcao_id: args.funcaoId,
    dados: args.dados,
  };
  const patch: Record<string, unknown> = {
    draft_snapshot: snapshot,
    current_step: etapaAtual,
    last_modified_by: args.userId || null,
    nome_documento: `AEP/AET — ${args.dados.identificacao.setor_avaliado || "Setor"} — ${args.dados.identificacao.funcao_avaliada || "Função"}`,
  };
  if (args.marcarSalvo) patch.status = "salvo";
  if (args.marcarRascunho) patch.status = "rascunho";
  if (args.offlineClientId) {
    patch.offline_client_id = args.offlineClientId;
    patch.offline_device_id = args.offlineDeviceId || null;
    patch.offline_device_label = args.offlineDeviceLabel || null;
  }

  const { data, error } = await supabase
    .from("documentos")
    .update(patch as never)
    .eq("id", args.documentoId)
    .eq("tipo", TIPO_AEP_AET)
    .eq("empresa_id", args.empresaId)
    .select("id, status")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || "Avaliação não atualizada" };
  }
  return { ok: true, status: data.status };
}

export async function persistirAepAetOfflineLocal(args: {
  clientId: string;
  dados: AepAetDados;
  marcarSalvo?: boolean;
  marcarRascunho?: boolean;
  preferredMode?: AepAetModo;
}): Promise<{ ok: true; row: AepAetOfflineAvaliacao } | { ok: false; error: string }> {
  const current = await getAepAetOffline(args.clientId);
  if (!current) return { ok: false, error: "Avaliação offline não encontrada" };

  let status_doc = current.status_doc;
  if (args.marcarSalvo) status_doc = "salvo";
  if (args.marcarRascunho) status_doc = "rascunho";

  const next: AepAetOfflineAvaliacao = {
    ...current,
    dados: { ...args.dados, etapa_atual: args.dados.etapa_atual },
    status_doc,
    sync_status: "pending",
    error_message: null,
    updated_at: new Date().toISOString(),
    preferred_mode: args.preferredMode ?? current.preferred_mode ?? "offline",
  };
  await saveAepAetOffline(next);
  return { ok: true, row: next };
}

export async function garantirEspelhoOffline(args: {
  serverId: string;
  empresaId: string;
  empresaNome: string;
  contratoId: string;
  contratoNome: string;
  setorId: string;
  setorNome: string;
  funcaoId: string;
  funcaoNome: string;
  statusDoc: string;
  dados: AepAetDados;
  preferredMode: AepAetModo;
  markPending: boolean;
}): Promise<AepAetOfflineAvaliacao> {
  return upsertAepAetOfflineFromServer({
    serverId: args.serverId,
    empresaId: args.empresaId,
    empresaNome: args.empresaNome,
    contratoId: args.contratoId,
    contratoNome: args.contratoNome,
    setorId: args.setorId,
    setorNome: args.setorNome,
    funcaoId: args.funcaoId,
    funcaoNome: args.funcaoNome,
    statusDoc: args.statusDoc,
    dados: args.dados,
    preferredMode: args.preferredMode,
    markPending: args.markPending,
  });
}

export async function resolverClientIdParaServidor(serverId: string): Promise<string | null> {
  const row = await getAepAetOfflineByServerId(serverId);
  return row?.client_id || null;
}

export async function marcarPreferenciaModo(clientId: string, modo: AepAetModo) {
  await updateAepAetOffline(clientId, { preferred_mode: modo });
}
