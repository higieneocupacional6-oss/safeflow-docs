import { supabase } from "@/integrations/supabase/client";
import { dadosVaziosAetVale, funcaoDoRegistroAetVale, setorDoRegistroAetVale, type AetValeDados } from "./aetVale";
import { gerarPdfVale, nomePdfVale } from "./aetValePdf";
import { baixarBlobApr } from "./aprErgoPdf";
import { fatoresVale, riscosAprValeAltos, mesclarEtapa2 } from "../../supabase/functions/_shared/aetValeIa";

export async function baixarAetValeSalva(id: string, empresaId: string, contratoId: string) {
  const { data: doc, error } = await supabase.from("documentos").select("id, status, draft_snapshot, empresa_nome").eq("id", id).eq("tipo", "AET-VALE").eq("empresa_id", empresaId).eq("contrato_id", contratoId).single();
  if (error) throw error;
  if (doc.status !== "salvo") throw new Error("Salve a avaliação antes de baixar.");
  const setorId = setorDoRegistroAetVale(doc.draft_snapshot), funcaoId = funcaoDoRegistroAetVale(doc.draft_snapshot);
  if (!setorId || !funcaoId) throw new Error("Vínculo da avaliação indisponível.");
  const [s, f, apr, aep] = await Promise.all([
    supabase.from("setores").select("nome_setor, ghe_ges").eq("id",setorId).eq("empresa_id",empresaId).eq("contrato_id",contratoId).single(),
    supabase.from("funcoes").select("nome_funcao").eq("id",funcaoId).eq("setor_id",setorId).single(),
    supabase.from("documentos").select("id, draft_snapshot").eq("tipo","APR-ERGO").eq("status","salvo").eq("empresa_id",empresaId).eq("contrato_id",contratoId),
    supabase.from("aep_documentos").select("id, setores, updated_at").eq("empresa_id",empresaId).eq("contrato_id",contratoId).order("updated_at",{ascending:false}),
  ]);
  if (s.error || f.error || apr.error || aep.error) throw new Error("Não foi possível consultar os dados da avaliação.");
  const snap = doc.draft_snapshot as { dados?: Partial<AetValeDados> };
  const dados = { ...dadosVaziosAetVale(f.data.nome_funcao), ...snap.dados, etapa2: mesclarEtapa2(snap.dados?.etapa2) };
  const fatores = fatoresVale(apr.data || [], aep.data || [], { setorId, funcaoId, funcaoNome:f.data.nome_funcao, setorNome:s.data.nome_setor, ghe:s.data.ghe_ges || "" });
  const riscos = riscosAprValeAltos(apr.data || [], {setorId,funcaoId,funcaoNome:f.data.nome_funcao});
  baixarBlobApr(gerarPdfVale(dados,doc.empresa_nome,fatores,riscos),nomePdfVale(doc.empresa_nome,f.data.nome_funcao));
}