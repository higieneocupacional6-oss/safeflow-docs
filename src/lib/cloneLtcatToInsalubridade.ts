import { supabase } from "@/integrations/supabase/client";

/**
 * Clona TODOS os dados de um documento LTCAT em registros novos marcados como
 * tipo_documento = 'insalubridade'. Cria um novo registro em `documentos` do
 * tipo "Insalubridade" e duplica avaliações + subtabelas + pareceres.
 *
 * Retorna o ID do novo documento de Insalubridade criado.
 *
 * IMPORTANTE: nenhuma alteração é feita nos registros LTCAT originais.
 */
export async function cloneLtcatToInsalubridade(ltcatDocumentoId: string): Promise<string> {
  console.log("🧬 [INSALUBRIDADE] Iniciando clonagem do LTCAT:", ltcatDocumentoId);

  // 1. Carregar documento LTCAT origem
  const { data: srcDoc, error: docErr } = await supabase
    .from("documentos")
    .select("*")
    .eq("id", ltcatDocumentoId)
    .single();
  if (docErr || !srcDoc) throw new Error("LTCAT de origem não encontrado");

  // 2. Criar novo documento de Insalubridade (rascunho)
  const { data: newDoc, error: newDocErr } = await supabase
    .from("documentos")
    .insert({
      tipo: "INSALUBRIDADE",
      empresa_id: srcDoc.empresa_id,
      empresa_nome: srcDoc.empresa_nome,
      template_id: srcDoc.template_id,
      status: "rascunho",
    })
    .select("id")
    .single();
  if (newDocErr || !newDoc) throw new Error("Falha ao criar documento de Insalubridade");
  const newDocId = newDoc.id;

  // 3. Buscar avaliações do LTCAT
  const { data: avaliacoes = [] } = await supabase
    .from("ltcat_avaliacoes")
    .select("*")
    .eq("documento_id", ltcatDocumentoId);

  console.log("🧬 [INSALUBRIDADE] Avaliações a clonar:", avaliacoes?.length || 0);

  if (!avaliacoes || avaliacoes.length === 0) {
    console.log("🧬 [INSALUBRIDADE] Documento criado sem avaliações");
    return newDocId;
  }

  const oldAvIds = avaliacoes.map((a: any) => a.id);

  // 4. Buscar subtabelas vinculadas
  const [
    { data: componentes = [] },
    { data: calor = [] },
    { data: vibracao = [] },
    { data: resultados = [] },
    { data: equipamentos = [] },
    { data: epiEpc = [] },
  ] = await Promise.all([
    supabase.from("ltcat_av_componentes").select("*").in("avaliacao_id", oldAvIds),
    supabase.from("ltcat_av_calor").select("*").in("avaliacao_id", oldAvIds),
    supabase.from("ltcat_av_vibracao").select("*").in("avaliacao_id", oldAvIds),
    supabase.from("ltcat_av_resultados").select("*").in("avaliacao_id", oldAvIds),
    supabase.from("ltcat_av_equipamentos").select("*").in("avaliacao_id", oldAvIds),
    supabase.from("ltcat_av_epi_epc").select("*").in("avaliacao_id", oldAvIds),
  ]);

  // 5. Inserir avaliações novas e mapear old_id → new_id
  const idMap: Record<string, string> = {};
  for (const av of avaliacoes) {
    const { id: _ignore, created_at: _c, ...rest } = av as any;
    const { data: inserted, error } = await supabase
      .from("ltcat_avaliacoes")
      .insert({ ...rest, documento_id: newDocId, tipo_documento: "insalubridade" })
      .select("id")
      .single();
    if (error || !inserted) {
      console.warn("🧬 [INSALUBRIDADE] Falha ao clonar avaliação", av.id, error);
      continue;
    }
    idMap[av.id] = inserted.id;
  }

  // 6. Clonar subtabelas mapeando para novos avaliacao_id
  const cloneSub = async (table: string, rows: any[]) => {
    if (!rows || rows.length === 0) return;
    const payload = rows
      .map((r: any) => {
        const newAvId = idMap[r.avaliacao_id];
        if (!newAvId) return null;
        const { id: _i, created_at: _c, ...rest } = r;
        return { ...rest, avaliacao_id: newAvId, tipo_documento: "insalubridade" };
      })
      .filter(Boolean);
    if (payload.length === 0) return;
    const { error } = await supabase.from(table as any).insert(payload as any);
    if (error) console.warn(`🧬 [INSALUBRIDADE] Falha ao clonar ${table}:`, error);
  };

  await Promise.all([
    cloneSub("ltcat_av_componentes", componentes),
    cloneSub("ltcat_av_calor", calor),
    cloneSub("ltcat_av_vibracao", vibracao),
    cloneSub("ltcat_av_resultados", resultados),
    cloneSub("ltcat_av_equipamentos", equipamentos),
    cloneSub("ltcat_av_epi_epc", epiEpc),
  ]);

  // 7. Clonar pareceres da empresa marcando como insalubridade
  if (srcDoc.empresa_id) {
    const { data: pareceres = [] } = await supabase
      .from("ltcat_pareceres")
      .select("*")
      .eq("empresa_id", srcDoc.empresa_id)
      .eq("tipo_documento", "ltcat");

    if (pareceres && pareceres.length > 0) {
      const payload = pareceres.map((p: any) => {
        const { id: _i, created_at: _c, updated_at: _u, ...rest } = p;
        return { ...rest, tipo_documento: "insalubridade" };
      });
      const { error } = await supabase
        .from("ltcat_pareceres")
        .upsert(payload, { onConflict: "empresa_id,setor_id,funcao_id,agente_id,colaborador_nome" });
      if (error) console.warn("🧬 [INSALUBRIDADE] Falha ao clonar pareceres:", error);
    }
  }

  console.log("🧬 [INSALUBRIDADE] Clonagem concluída. Novo documento:", newDocId);
  return newDocId;
}
