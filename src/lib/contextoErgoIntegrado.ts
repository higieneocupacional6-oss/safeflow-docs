/**
 * Carrega Formulário AEP/AET + avaliações ergonômicas para geração com IA.
 * Somente leitura; escopo exato empresa/contrato/setor/função.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  CONTEXTO_ERGO_INTEGRADO_VAZIO,
  FERRAMENTAS_ERGO_INTEGRADAS,
  filtrarAvaliacoesErgonomicas,
  filtrarDocumentosAepAet,
  montarContextoErgoIntegrado,
  type ContextoErgoIntegrado,
  type EscopoErgoIntegrado,
} from "../../supabase/functions/_shared/contextoErgoIntegrado";

export type {
  ContextoErgoIntegrado,
  EscopoErgoIntegrado,
  ResumoAvaliacaoErgonomica,
  ResumoFormularioAepAet,
} from "../../supabase/functions/_shared/contextoErgoIntegrado";

export {
  CONTEXTO_ERGO_INTEGRADO_VAZIO,
  INSTRUCAO_CONTEXTO_ERGO_INTEGRADO,
  montarContextoErgoIntegrado,
  resumirDadosAepAet,
} from "../../supabase/functions/_shared/contextoErgoIntegrado";

export async function carregarContextoErgoIntegrado(
  escopo: EscopoErgoIntegrado,
): Promise<ContextoErgoIntegrado> {
  if (!escopo.empresaId || !escopo.contratoId) {
    return { ...CONTEXTO_ERGO_INTEGRADO_VAZIO };
  }

  try {
    const docs: any[] = [];
    for (let offset = 0; ; offset += 100) {
      let q = supabase
        .from("documentos")
        .select("id, status, updated_at, draft_snapshot")
        .eq("tipo", "AEP-AET")
        .eq("empresa_id", escopo.empresaId)
        .eq("contrato_id", escopo.contratoId)
        .neq("status", "rascunho")
        .order("updated_at", { ascending: false })
        .range(offset, offset + 99);
      if (escopo.setorId) {
        q = q.filter("draft_snapshot->>setor_id", "eq", escopo.setorId);
      }
      const { data, error } = await q;
      if (error) throw error;
      docs.push(...(data || []));
      if (!data || data.length < 100) break;
    }

    const formulario_aep_aet = filtrarDocumentosAepAet(docs, escopo);

    let avaliacoes_ergonomicas: ReturnType<typeof filtrarAvaliacoesErgonomicas> = [];
    if (escopo.setorId) {
      const { data: ergo, error: ergoErr } = await supabase
        .from("ergonomia_avaliacoes")
        .select(
          "id, ferramenta, colaborador_nome, funcao, setor_ref, setor_nome, data_avaliacao, atividade, escore_final, classificacao, nivel_acao, recomendacoes, aet_documento_id, created_at",
        )
        .eq("setor_ref", escopo.setorId)
        .in("ferramenta", [...FERRAMENTAS_ERGO_INTEGRADAS])
        .order("created_at", { ascending: false })
        .limit(80);
      if (ergoErr) throw ergoErr;
      avaliacoes_ergonomicas = filtrarAvaliacoesErgonomicas(ergo || [], escopo);
    }

    return montarContextoErgoIntegrado(formulario_aep_aet, avaliacoes_ergonomicas);
  } catch (error) {
    console.warn("[contextoErgoIntegrado] falha na consulta:", error);
    return { ...CONTEXTO_ERGO_INTEGRADO_VAZIO };
  }
}
