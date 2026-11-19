// Persistência de avaliações ergonômicas e upload do PDF.
// IMPORTANTE: o salvamento é INDEPENDENTE da AET. Se a AET ainda não existir,
// a avaliação é gravada sem `aet_documento_id` e será vinculada automaticamente
// mais tarde pelo trigger `link_ergonomia_to_aet` quando a AET for criada.
// Offline: IndexedDB local + PDF no dispositivo; sync manual depois.
import { supabase } from "@/integrations/supabase/client";
import type { AvaliacaoErgonomica } from "./types";
import { gerarPdfErgonomia } from "./pdf";
import { saveAs } from "file-saver";
import {
  getErgoDeviceLabel,
  getErgoOffline,
  getOrCreateErgoDeviceId,
  isErgoOfflineNow,
  newErgoClientId,
  saveErgoOffline,
  type ErgoOfflineAvaliacao,
} from "./offlineDb";

export async function salvarAvaliacaoOfflineLocal(
  av: AvaliacaoErgonomica,
  opts: {
    aetDocumentoId?: string | null;
    setorRef?: string | null;
    empresaId?: string | null;
    contratoId?: string | null;
    clientId?: string | null;
  } = {},
): Promise<{ id: string; pdf_path: string; offline: true; client_id: string }> {
  const blob = gerarPdfErgonomia(av);
  const timestamp = Date.now();
  const safeFerr = av.ferramenta.toLowerCase();
  const safeName = (av.cabecalho.colaborador_nome || av.cabecalho.funcao || "avaliacao")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "avaliacao";
  const filename = `${safeFerr}-${safeName}-${timestamp}.pdf`;
  const pdfBuf = await blob.arrayBuffer();
  const now = new Date().toISOString();
  const client_id = opts.clientId || newErgoClientId();
  const existing = await getErgoOffline(client_id);

  const row: ErgoOfflineAvaliacao = {
    client_id,
    device_id: existing?.device_id || getOrCreateErgoDeviceId(),
    device_label: existing?.device_label || getErgoDeviceLabel(),
    ferramenta: av.ferramenta,
    empresa_id: opts.empresaId ?? existing?.empresa_id ?? null,
    empresa_nome: av.cabecalho.empresa_nome || "",
    contrato_id: opts.contratoId ?? existing?.contrato_id ?? null,
    setor_ref: opts.setorRef ?? null,
    setor_nome: av.cabecalho.setor_nome || "",
    colaborador_nome: av.cabecalho.colaborador_nome || "",
    funcao: av.cabecalho.funcao,
    atividade: av.atividade || null,
    data_avaliacao: av.cabecalho.data_avaliacao,
    respostas: {
      ...av.respostas,
      _offline_client_id: client_id,
    },
    resultado: av.resultado,
    aet_documento_id: opts.aetDocumentoId ?? null,
    pdf_blob: pdfBuf,
    pdf_filename: filename,
    sync_status: "pending",
    error_message: null,
    server_id: existing?.server_id ?? null,
    pdf_path: null,
    created_at: existing?.created_at || now,
    updated_at: now,
    synced_at: null,
  };

  await saveErgoOffline(row);
  saveAs(blob, filename);
  return { id: client_id, pdf_path: `offline://${client_id}/${filename}`, offline: true, client_id };
}

/**
 * Salva online quando há rede (modo online); caso contrário grava no IndexedDB.
 */
export async function salvarAvaliacaoEGerarPdf(
  av: AvaliacaoErgonomica,
  opts: {
    aetDocumentoId?: string | null;
    setorRef?: string | null;
    empresaId?: string | null;
    contratoId?: string | null;
    forceOffline?: boolean;
    clientId?: string | null;
  } = {}
): Promise<{ id: string; pdf_path: string; offline?: boolean; client_id?: string }> {
  if (opts.forceOffline || isErgoOfflineNow()) {
    return salvarAvaliacaoOfflineLocal(av, opts);
  }
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new Error("Usuário não autenticado");

    // Vincula à AET APENAS se ela realmente existir no banco. Caso contrário,
    // grava a avaliação como órfã (aet_documento_id = null).
    let aetDocumentoId: string | null = null;
    if (opts.aetDocumentoId) {
      const { data: aetRow } = await supabase
        .from("aet_documentos")
        .select("id")
        .eq("id", opts.aetDocumentoId)
        .maybeSingle();
      if (aetRow) aetDocumentoId = aetRow.id;
    }

    const blob = gerarPdfErgonomia(av);
    const timestamp = Date.now();
    const safeFerr = av.ferramenta.toLowerCase();
    const safeName = (av.cabecalho.colaborador_nome || av.cabecalho.funcao || "avaliacao")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "avaliacao";
    const filename = `${safeFerr}-${safeName}-${timestamp}.pdf`;
    const pdfPath = `${userId}/${filename}`;

    const uploadRes = await supabase.storage
      .from("ergonomia-relatorios")
      .upload(pdfPath, blob, { contentType: "application/pdf", upsert: false });
    if (uploadRes.error) throw uploadRes.error;

    const { data: inserted, error: insErr } = await supabase
      .from("ergonomia_avaliacoes")
      .insert({
        ferramenta: av.ferramenta,
        colaborador_nome: av.cabecalho.colaborador_nome || null,
        funcao: av.cabecalho.funcao,
        empresa_nome: av.cabecalho.empresa_nome,
        setor_nome: av.cabecalho.setor_nome,
        data_avaliacao: av.cabecalho.data_avaliacao,
        atividade: av.atividade || null,
        respostas: av.respostas as any,
        escore_final: av.resultado.escore_final,
        classificacao: av.resultado.classificacao,
        nivel_acao: av.resultado.nivel_acao,
        recomendacoes: av.resultado.recomendacoes,
        pdf_path: pdfPath,
        aet_documento_id: aetDocumentoId,
        setor_ref: opts.setorRef ?? null,
      } as any)
      .select("id, pdf_path")
      .single();
    if (insErr) throw insErr;

    saveAs(blob, filename);

    return { id: inserted.id, pdf_path: pdfPath };
  } catch (e) {
    // Rede instável / 5xx: não perde a avaliação — salva offline
    const msg = e instanceof Error ? e.message : String(e);
    if (/Failed to fetch|NetworkError|fetch|timeout|503|502|500|offline/i.test(msg)
      || (typeof navigator !== "undefined" && !navigator.onLine)) {
      return salvarAvaliacaoOfflineLocal(av, opts);
    }
    throw e;
  }
}

export async function baixarPdfAvaliacao(pdfPath: string, filename?: string) {
  if (pdfPath.startsWith("offline://")) {
    const clientId = pdfPath.replace(/^offline:\/\//, "").split("/")[0];
    const local = await getErgoOffline(clientId);
    if (!local?.pdf_blob) throw new Error("PDF offline não encontrado neste dispositivo");
    saveAs(
      new Blob([local.pdf_blob], { type: "application/pdf" }),
      filename || local.pdf_filename || "relatorio-ergonomico.pdf",
    );
    return;
  }
  const { data, error } = await supabase.storage.from("ergonomia-relatorios").download(pdfPath);
  if (error) throw error;
  saveAs(data, filename || pdfPath.split("/").pop() || "relatorio-ergonomico.pdf");
}
