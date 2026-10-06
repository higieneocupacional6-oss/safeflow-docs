import { supabase } from "@/integrations/supabase/client";
import type { VinculoFuncao } from "@/lib/psicoRelatorio";

export async function carregarSetoresPsicossocial(empresaId: string, contratoId: string | null) {
  let query = supabase.from("setores")
    .select("id, empresa_id, nome_setor, ghe_ges, descricao_ambiente, contrato_id, funcoes(id, nome_funcao, expostos, descricao_atividades)")
    .eq("empresa_id", empresaId);
  query = contratoId ? query.eq("contrato_id", contratoId) : query.is("contrato_id", null);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function vinculosDoCadastro(setores: Awaited<ReturnType<typeof carregarSetoresPsicossocial>>) {
  const vinculos = new Map<string, VinculoFuncao>();
  for (const setor of setores) {
    for (const funcao of setor.funcoes || []) {
      vinculos.set(funcao.id, {
        funcaoId: funcao.id, funcaoNome: funcao.nome_funcao, setorId: setor.id,
        setor: setor.nome_setor, ghe: setor.ghe_ges || "—", ambiente: setor.descricao_ambiente || "",
        expostos: parseInt(String(funcao.expostos || "0").replace(/\D/g, "")) || 0,
        atividades: funcao.descricao_atividades || "",
      });
    }
  }
  return vinculos;
}