// Persistência de avaliações ergonômicas e upload do PDF.
// IMPORTANTE: o salvamento é INDEPENDENTE da AET. Se a AET ainda não existir,
// a avaliação é gravada sem `aet_documento_id` e será vinculada automaticamente
// mais tarde pelo trigger `link_ergonomia_to_aet` quando a AET for criada.
import { supabase } from "@/integrations/supabase/client";
import type { AvaliacaoErgonomica } from "./types";
import { gerarPdfErgonomia } from "./pdf";
import { saveAs } from "file-saver";

export async function salvarAvaliacaoEGerarPdf(
  av: AvaliacaoErgonomica,
  opts: { aetDocumentoId?: string | null; setorRef?: string | null } = {}
): Promise<{ id: string; pdf_path: string }> {
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
}

export async function baixarPdfAvaliacao(pdfPath: string, filename?: string) {
  const { data, error } = await supabase.storage.from("ergonomia-relatorios").download(pdfPath);
  if (error) throw error;
  saveAs(data, filename || pdfPath.split("/").pop() || "relatorio-ergonomico.pdf");
}
