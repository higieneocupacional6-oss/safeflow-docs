// Persistência de avaliações ergonômicas e upload do PDF.
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

  const aetDocumentoId = opts.aetDocumentoId ?? null;
  if (!aetDocumentoId) {
    throw new Error("Salve primeiro a AET deste setor antes de registrar avaliações ergonômicas.");
  }
  // Valida existência da AET (evita violação de FK)
  const { data: aetRow, error: aetErr } = await supabase
    .from("aet_documentos")
    .select("id")
    .eq("id", aetDocumentoId)
    .maybeSingle();
  if (aetErr) throw aetErr;
  if (!aetRow) {
    throw new Error("AET não encontrada no banco. Salve a AET novamente antes de registrar a avaliação.");
  }

  const blob = gerarPdfErgonomia(av);
  const timestamp = Date.now();
  const safeFerr = av.ferramenta.toLowerCase();
  const safeName = (av.cabecalho.colaborador_nome || "colaborador")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "colaborador";
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
      colaborador_nome: av.cabecalho.colaborador_nome,
      funcao: av.cabecalho.funcao,
      empresa_nome: av.cabecalho.empresa_nome,
      setor_nome: av.cabecalho.setor_nome,
      data_avaliacao: av.cabecalho.data_avaliacao,
      respostas: av.respostas as any,
      escore_final: av.resultado.escore_final,
      classificacao: av.resultado.classificacao,
      nivel_acao: av.resultado.nivel_acao,
      recomendacoes: av.resultado.recomendacoes,
      pdf_path: pdfPath,
      aet_documento_id: aetDocumentoId,
      setor_ref: opts.setorRef ?? null,
    })
    .select("id, pdf_path")
    .single();
  if (insErr) throw insErr;

  // Download automático
  saveAs(blob, filename);

  return { id: inserted.id, pdf_path: pdfPath };
}

export async function baixarPdfAvaliacao(pdfPath: string, filename?: string) {
  const { data, error } = await supabase.storage.from("ergonomia-relatorios").download(pdfPath);
  if (error) throw error;
  saveAs(data, filename || pdfPath.split("/").pop() || "relatorio-ergonomico.pdf");
}
