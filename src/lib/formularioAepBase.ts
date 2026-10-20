// Base de referência do Formulário AEP: até 4 arquivos (PDF, DOCX, XLSX) por empresa.
// Usada pela IA como instrução prioritária para critérios, matriz e regras de preenchimento.
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

export const BUCKET_FORM_AEP_BASE = "formulario-aep-base";
export const MAX_ARQUIVOS_BASE = 4;
export const EXTENSOES_BASE = [".pdf", ".docx", ".xlsx"];

export type ArquivoBase = { nome: string; caminho: string; tamanho?: number };
export type BaseParaIa = { nome: string; tipo: "pdf" | "texto"; data: string };

export async function listarBase(empresaId: string): Promise<ArquivoBase[]> {
  const { data, error } = await supabase.storage.from(BUCKET_FORM_AEP_BASE).list(empresaId, { limit: 20 });
  if (error) throw error;
  return (data || [])
    .filter((f) => f.name && f.id)
    .map((f) => ({ nome: f.name.replace(/^[0-9a-f-]{36}__/, ""), caminho: `${empresaId}/${f.name}`, tamanho: (f.metadata as any)?.size }));
}

export async function enviarBase(empresaId: string, file: File) {
  const nomeSeguro = file.name.replace(/[^\w.\-]+/g, "_");
  const { error } = await supabase.storage
    .from(BUCKET_FORM_AEP_BASE)
    .upload(`${empresaId}/${crypto.randomUUID()}__${nomeSeguro}`, file, { contentType: file.type || undefined });
  if (error) throw error;
}

export async function removerBase(caminho: string) {
  const { error } = await supabase.storage.from(BUCKET_FORM_AEP_BASE).remove([caminho]);
  if (error) throw error;
}

export async function urlVisualizacao(caminho: string) {
  const { data, error } = await supabase.storage.from(BUCKET_FORM_AEP_BASE).createSignedUrl(caminho, 600);
  if (error) throw error;
  return data.signedUrl;
}

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Baixa a base e prepara para a IA: PDF em base64; DOCX/XLSX como texto extraído. */
export async function carregarBaseParaIa(empresaId: string): Promise<BaseParaIa[]> {
  const arquivos = await listarBase(empresaId);
  const out: BaseParaIa[] = [];
  for (const a of arquivos.slice(0, MAX_ARQUIVOS_BASE)) {
    const { data: blob } = await supabase.storage.from(BUCKET_FORM_AEP_BASE).download(a.caminho);
    if (!blob) continue;
    const buf = await blob.arrayBuffer();
    const ext = a.nome.toLowerCase();
    try {
      if (ext.endsWith(".pdf")) out.push({ nome: a.nome, tipo: "pdf", data: toBase64(buf) });
      else if (ext.endsWith(".docx")) {
        const zip = await JSZip.loadAsync(buf);
        const xml = (await zip.file("word/document.xml")?.async("string")) || "";
        const texto = xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab\/>/g, "\t").replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
        out.push({ nome: a.nome, tipo: "texto", data: texto });
      } else if (ext.endsWith(".xlsx")) {
        const wb = XLSX.read(buf, { type: "array" });
        const texto = wb.SheetNames.map((n) => `## Planilha ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n])}`).join("\n\n");
        out.push({ nome: a.nome, tipo: "texto", data: texto });
      }
    } catch (e) {
      console.warn("[formularioAepBase] falha ao ler", a.nome, e);
    }
  }
  return out;
}
