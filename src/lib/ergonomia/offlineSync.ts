/**
 * Sincronização manual das avaliações ergonômicas pendentes no IndexedDB.
 * Evita duplicidade via `_offline_client_id` embutido em `respostas`.
 * Não remove o registro local — apenas marca synced após confirmação.
 */
import { supabase } from "@/integrations/supabase/client";
import { gerarPdfErgonomia } from "./pdf";
import type { AvaliacaoErgonomica } from "./types";
import {
  listErgoOffline,
  updateErgoOffline,
  type ErgoOfflineAvaliacao,
} from "./offlineDb";

export type ErgoSyncResult = {
  total: number;
  synced: number;
  duplicates: number;
  errors: number;
  items: Array<{
    client_id: string;
    status: "synced" | "error" | "duplicate";
    message?: string;
    server_id?: string | null;
    ferramenta?: string;
    funcao?: string;
  }>;
};

const OFFLINE_KEY = "_offline_client_id";

function withOfflineMeta(
  respostas: Record<string, unknown>,
  item: ErgoOfflineAvaliacao,
): Record<string, unknown> {
  return {
    ...respostas,
    [OFFLINE_KEY]: item.client_id,
    _offline_device_id: item.device_id,
    _offline_device_label: item.device_label,
  };
}

async function findExistingByClientId(clientId: string): Promise<{ id: string; pdf_path: string | null } | null> {
  // PostgREST: filtro em campo JSON
  const { data, error } = await supabase
    .from("ergonomia_avaliacoes")
    .select("id, pdf_path, respostas")
    .filter(`respostas->>${OFFLINE_KEY}`, "eq", clientId)
    .limit(5);

  if (!error && data && data.length > 0) {
    return { id: data[0].id, pdf_path: data[0].pdf_path };
  }

  // Fallback: busca recente do usuário e filtra no cliente
  const { data: recent } = await supabase
    .from("ergonomia_avaliacoes")
    .select("id, pdf_path, respostas")
    .order("created_at", { ascending: false })
    .limit(150);

  const match = (recent || []).find((row: any) => {
    const r = row.respostas;
    return r && typeof r === "object" && r[OFFLINE_KEY] === clientId;
  });
  return match ? { id: match.id, pdf_path: match.pdf_path } : null;
}

async function uploadPdf(
  userId: string,
  item: ErgoOfflineAvaliacao,
): Promise<{ pdfPath: string; blob: Blob }> {
  const av: AvaliacaoErgonomica = {
    ferramenta: item.ferramenta,
    cabecalho: {
      colaborador_nome: item.colaborador_nome,
      funcao: item.funcao,
      empresa_nome: item.empresa_nome,
      setor_nome: item.setor_nome,
      data_avaliacao: item.data_avaliacao,
    },
    atividade: item.atividade || undefined,
    respostas: item.respostas,
    resultado: item.resultado,
  };

  let blob: Blob;
  if (item.pdf_blob) {
    blob = new Blob([item.pdf_blob], { type: "application/pdf" });
  } else {
    blob = gerarPdfErgonomia(av);
  }

  const timestamp = Date.now();
  const safeFerr = item.ferramenta.toLowerCase();
  const safeName = (item.colaborador_nome || item.funcao || "avaliacao")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "avaliacao";
  const filename = item.pdf_filename || `${safeFerr}-${safeName}-${timestamp}.pdf`;
  const pdfPath = `${userId}/${filename}`;

  const uploadRes = await supabase.storage
    .from("ergonomia-relatorios")
    .upload(pdfPath, blob, { contentType: "application/pdf", upsert: false });

  if (uploadRes.error) {
    // Se já existe (retry), segue com o path
    if (!/already exists|Duplicate|409/i.test(uploadRes.error.message)) {
      throw uploadRes.error;
    }
  }

  return { pdfPath, blob };
}

async function syncOne(item: ErgoOfflineAvaliacao): Promise<{
  ok: boolean;
  duplicate?: boolean;
  id?: string;
  pdf_path?: string | null;
  error?: string;
}> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Usuário não autenticado" };

  const existing = await findExistingByClientId(item.client_id);
  if (existing) {
    return { ok: true, duplicate: true, id: existing.id, pdf_path: existing.pdf_path };
  }

  if (item.server_id) {
    return { ok: true, duplicate: true, id: item.server_id, pdf_path: item.pdf_path ?? null };
  }

  let aetDocumentoId: string | null = null;
  if (item.aet_documento_id) {
    const { data: aetRow } = await supabase
      .from("aet_documentos")
      .select("id")
      .eq("id", item.aet_documento_id)
      .maybeSingle();
    if (aetRow) aetDocumentoId = aetRow.id;
  }

  const { pdfPath } = await uploadPdf(userId, item);
  const respostas = withOfflineMeta(item.respostas, item);

  const { data: inserted, error: insErr } = await supabase
    .from("ergonomia_avaliacoes")
    .insert({
      ferramenta: item.ferramenta,
      colaborador_nome: item.colaborador_nome || null,
      funcao: item.funcao,
      empresa_nome: item.empresa_nome,
      setor_nome: item.setor_nome,
      data_avaliacao: item.data_avaliacao,
      atividade: item.atividade || null,
      respostas: respostas as any,
      escore_final: item.resultado.escore_final,
      classificacao: item.resultado.classificacao,
      nivel_acao: item.resultado.nivel_acao,
      recomendacoes: item.resultado.recomendacoes,
      pdf_path: pdfPath,
      aet_documento_id: aetDocumentoId,
      setor_ref: item.setor_ref ?? null,
    } as any)
    .select("id, pdf_path")
    .single();

  if (insErr) {
    // Possível corrida: recheca duplicata
    const again = await findExistingByClientId(item.client_id);
    if (again) return { ok: true, duplicate: true, id: again.id, pdf_path: again.pdf_path };
    return { ok: false, error: insErr.message };
  }

  return { ok: true, id: inserted.id, pdf_path: inserted.pdf_path };
}

export async function syncErgoOfflinePending(opts?: {
  ferramenta?: string;
  clientIds?: string[];
}): Promise<ErgoSyncResult> {
  const pending = await listErgoOffline({
    ferramenta: opts?.ferramenta,
    statuses: ["pending", "error", "syncing"],
  });

  const queue = pending.filter((item) => {
    if (opts?.clientIds?.length) return opts.clientIds.includes(item.client_id);
    return true;
  });

  const result: ErgoSyncResult = {
    total: queue.length,
    synced: 0,
    duplicates: 0,
    errors: 0,
    items: [],
  };

  for (const item of queue) {
    await updateErgoOffline(item.client_id, { sync_status: "syncing", error_message: null });
    try {
      const outcome = await syncOne(item);
      if (outcome.ok) {
        await updateErgoOffline(item.client_id, {
          sync_status: "synced",
          synced_at: new Date().toISOString(),
          server_id: outcome.id || null,
          pdf_path: outcome.pdf_path || null,
          error_message: null,
          // libera memória do blob após sync ok
          pdf_blob: null,
        });
        if (outcome.duplicate) {
          result.duplicates += 1;
          result.items.push({
            client_id: item.client_id,
            status: "duplicate",
            server_id: outcome.id,
            message: "Já sincronizada anteriormente",
            ferramenta: item.ferramenta,
            funcao: item.funcao,
          });
        } else {
          result.synced += 1;
          result.items.push({
            client_id: item.client_id,
            status: "synced",
            server_id: outcome.id,
            ferramenta: item.ferramenta,
            funcao: item.funcao,
          });
        }
      } else {
        await updateErgoOffline(item.client_id, {
          sync_status: "error",
          error_message: outcome.error || "Falha na sincronização",
        });
        result.errors += 1;
        result.items.push({
          client_id: item.client_id,
          status: "error",
          message: outcome.error,
          ferramenta: item.ferramenta,
          funcao: item.funcao,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha na sincronização";
      await updateErgoOffline(item.client_id, {
        sync_status: "error",
        error_message: message,
      });
      result.errors += 1;
      result.items.push({
        client_id: item.client_id,
        status: "error",
        message,
        ferramenta: item.ferramenta,
        funcao: item.funcao,
      });
    }
  }

  return result;
}
