import { supabase } from "@/integrations/supabase/client";

type DestTipo = "insalubridade" | "periculosidade";

/**
 * Clona um documento LTCAT em um novo documento do tipo destino.
 * - Para "insalubridade": clona avaliações + subtabelas + pareceres.
 * - Para "periculosidade": clona apenas dados QUALITATIVOS (avaliações sem
 *   medições, sem subtabelas de resultados/componentes/vibração/calor/equipamentos).
 *   Pareceres são copiados.
 *
 * Retorna o ID do novo documento criado.
 */
export async function cloneLtcatToTipo(
  ltcatDocumentoId: string,
  destino: DestTipo,
): Promise<string> {
  const tipoUpper = destino.toUpperCase();
  console.log(`🧬 [${tipoUpper}] Iniciando clonagem do LTCAT:`, ltcatDocumentoId);

  const { data: srcDoc, error: docErr } = await supabase
    .from("documentos").select("*").eq("id", ltcatDocumentoId).single();
  if (docErr || !srcDoc) throw new Error("LTCAT de origem não encontrado");

  const { data: newDoc, error: newDocErr } = await supabase
    .from("documentos")
    .insert({
      tipo: tipoUpper,
      empresa_id: srcDoc.empresa_id,
      empresa_nome: srcDoc.empresa_nome,
      template_id: srcDoc.template_id,
      status: "rascunho",
    })
    .select("id").single();
  if (newDocErr || !newDoc) throw new Error(`Falha ao criar documento de ${tipoUpper}`);
  const newDocId = newDoc.id;

  const { data: avaliacoes = [] } = await supabase
    .from("ltcat_avaliacoes").select("*").eq("documento_id", ltcatDocumentoId);

  if (!avaliacoes || avaliacoes.length === 0) return newDocId;

  const oldAvIds = avaliacoes.map((a: any) => a.id);

  // Inserir avaliações novas
  const idMap: Record<string, string> = {};
  for (const av of avaliacoes) {
    const { id: _i, created_at: _c, ...rest } = av as any;

    // Para periculosidade: força qualitativa + tipo_agente ACIDENTE e zera medições
    const payload = destino === "periculosidade"
      ? {
          ...rest,
          documento_id: newDocId,
          tipo_documento: "periculosidade",
          tipo_avaliacao: "qualitativa",
          tipo_agente: "Acidente",
          resultado: null,
          unidade_resultado_id: null,
          limite_tolerancia: null,
          unidade_limite_id: null,
          tempo_coleta: null,
          unidade_tempo_coleta: null,
          dose_percentual: null,
          tecnica_id: null,
          equipamento_id: null,
        }
      : { ...rest, documento_id: newDocId, tipo_documento: "insalubridade" };

    const { data: inserted, error } = await supabase
      .from("ltcat_avaliacoes").insert(payload).select("id").single();
    if (error || !inserted) {
      console.warn(`🧬 [${tipoUpper}] Falha ao clonar avaliação`, av.id, error);
      continue;
    }
    idMap[av.id] = inserted.id;
  }

  // Subtabelas: somente para insalubridade
  if (destino === "insalubridade") {
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

    const cloneSub = async (table: string, rows: any[]) => {
      if (!rows || rows.length === 0) return;
      const payload = rows.map((r: any) => {
        const newAvId = idMap[r.avaliacao_id];
        if (!newAvId) return null;
        const { id: _i, created_at: _c, ...rest } = r;
        return { ...rest, avaliacao_id: newAvId, tipo_documento: "insalubridade" };
      }).filter(Boolean);
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
  }

  // Pareceres
  if (srcDoc.empresa_id) {
    const { data: pareceres = [] } = await supabase
      .from("ltcat_pareceres").select("*")
      .eq("empresa_id", srcDoc.empresa_id).eq("tipo_documento", "ltcat");
    if (pareceres && pareceres.length > 0) {
      const payload = pareceres.map((p: any) => {
        const { id: _i, created_at: _c, updated_at: _u, ...rest } = p;
        return { ...rest, tipo_documento: destino };
      });
      const { error } = await supabase
        .from("ltcat_pareceres")
        .upsert(payload, { onConflict: "empresa_id,setor_id,funcao_id,agente_id,colaborador_nome" });
      if (error) console.warn(`🧬 [${tipoUpper}] Falha ao clonar pareceres:`, error);
    }
  }

  console.log(`🧬 [${tipoUpper}] Clonagem concluída. Novo documento:`, newDocId);
  return newDocId;
}
