// Biblioteca "Conhecimento IA": pastas + arquivos técnicos usados como fonte
// COMPLEMENTAR de consulta pela IA na geração de AET e AEP.
// Somente leitura: os arquivos originais nunca são alterados.

import { supabase } from "@/integrations/supabase/client";

export const BUCKET_CONHECIMENTO = "ia-conhecimento";
export const MAX_ARQUIVOS_POR_PASTA = 5;

export type ConhecimentoTipo = "AET" | "AEP";

export type ConhecimentoAnexo = {
  name: string;
  mime: string;
  kind: "pdf";
  data: string;
  pasta: string;
};

export type ConhecimentoIa = {
  disponivel: boolean;
  tipo: ConhecimentoTipo;
  pastas: { nome: string; arquivos: string[] }[];
  anexos: ConhecimentoAnexo[];
};

const MAX_BYTES_TOTAL = 18 * 1024 * 1024; // limite prudente de payload por chamada

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/**
 * Carrega o conhecimento cadastrado para o tipo de documento informado.
 * Falhas nunca bloqueiam a geração: retorna conhecimento indisponível.
 */
export async function carregarConhecimentoIa(tipo: ConhecimentoTipo): Promise<ConhecimentoIa> {
  const vazio: ConhecimentoIa = { disponivel: false, tipo, pastas: [], anexos: [] };
  try {
    const { data: pastas } = await supabase
      .from("ia_conhecimento_pastas")
      .select("id, nome")
      .eq("tipo", tipo)
      .order("created_at", { ascending: true });

    const ps = (pastas as any[]) || [];
    if (!ps.length) return vazio;

    const { data: arqs } = await supabase
      .from("ia_conhecimento_arquivos")
      .select("id, pasta_id, nome, caminho, mime, tamanho")
      .in("pasta_id", ps.map((p) => p.id))
      .order("created_at", { ascending: true });

    const rows = (arqs as any[]) || [];
    const nomePasta = new Map(ps.map((p) => [p.id, p.nome as string]));

    const resumo = ps.map((p) => ({
      nome: p.nome as string,
      arquivos: rows.filter((a) => a.pasta_id === p.id).map((a) => a.nome as string),
    }));

    const anexos: ConhecimentoAnexo[] = [];
    let total = 0;
    for (const a of rows) {
      const ehPdf = (a.mime || "").includes("pdf") || String(a.nome).toLowerCase().endsWith(".pdf");
      if (!ehPdf) continue; // apenas PDFs podem ser lidos diretamente pelo modelo
      if (total + (a.tamanho || 0) > MAX_BYTES_TOTAL) continue;
      const { data: blob, error } = await supabase.storage.from(BUCKET_CONHECIMENTO).download(a.caminho);
      if (error || !blob) continue;
      const buf = await blob.arrayBuffer();
      total += buf.byteLength;
      anexos.push({
        name: a.nome,
        mime: a.mime || "application/pdf",
        kind: "pdf",
        data: toBase64(buf),
        pasta: nomePasta.get(a.pasta_id) || "",
      });
    }

    return { disponivel: resumo.some((r) => r.arquivos.length) || anexos.length > 0, tipo, pastas: resumo, anexos };
  } catch (e) {
    console.warn("[iaConhecimento] falha ao carregar base de conhecimento:", e);
    return vazio;
  }
}
