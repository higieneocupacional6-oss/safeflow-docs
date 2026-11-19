/**
 * Contexto somente leitura (Express): Formulário AEP/AET + avaliações ergonômicas.
 * Espelha a lógica de supabase/functions/_shared/contextoErgoIntegrado.ts.
 */
import type { Pool } from "pg";

export const FERRAMENTAS_ERGO_INTEGRADAS = [
  "ROSA", "OCRA", "RULA", "REBA", "OWAS", "NIOSH",
] as const;

export type EscopoErgoIntegrado = {
  empresaId: string;
  contratoId: string;
  setorId?: string | null;
  funcaoIds?: string[];
  funcaoNomes?: string[];
};

export type ResumoFormularioAepAet = {
  id: string;
  status: string;
  atualizado_em: string;
  setor_id: string;
  funcao_id: string;
  dados: Record<string, unknown>;
};

export type ResumoAvaliacaoErgonomica = {
  id: string;
  ferramenta: string;
  colaborador_nome: string | null;
  funcao: string | null;
  setor_ref: string | null;
  setor_nome: string | null;
  data_avaliacao: string | null;
  atividade: string | null;
  escore_final: number | null;
  classificacao: string | null;
  nivel_acao: string | null;
  recomendacoes: string | null;
  aet_documento_id: string | null;
  atualizado_em: string;
};

export type ContextoErgoIntegrado = {
  disponivel: boolean;
  formulario_aep_aet: ResumoFormularioAepAet[];
  avaliacoes_ergonomicas: ResumoAvaliacaoErgonomica[];
  observacao: string;
};

export const CONTEXTO_ERGO_INTEGRADO_VAZIO: ContextoErgoIntegrado = {
  disponivel: false,
  formulario_aep_aet: [],
  avaliacoes_ergonomicas: [],
  observacao: "Nenhum Formulário AEP/AET nem avaliação ergonômica correspondente à mesma empresa, contrato, setor e função.",
};

export const INSTRUCAO_CONTEXTO_ERGO_INTEGRADO =
  "FORMULÁRIO AEP/AET e FERRAMENTAS ERGONÔMICAS (ROSA, OCRA, RULA, REBA, OWAS, NIOSH): evidências somente leitura do mesmo escopo. Use resultados registrados como referência. Listas vazias → fluxo normal, sem inventar. Nunca altere registros de origem.";

function normTexto(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function resumirDadosAepAet(dados: any): Record<string, unknown> {
  if (!dados || typeof dados !== "object") return {};
  const semFotos = <T extends Record<string, unknown>>(obj: T | undefined | null) => {
    if (!obj || typeof obj !== "object") return null;
    const { fotos: _f, ...rest } = obj as T & { fotos?: unknown };
    return rest;
  };
  return {
    identificacao: dados.identificacao || null,
    variabilidade: dados.variabilidade || null,
    posturas: semFotos(dados.posturas),
    movimentos_repetitivos: semFotos(dados.movimentos_repetitivos),
    esforco_fisico: semFotos(dados.esforco_fisico),
    mobiliario_equipamentos: dados.mobiliario_equipamentos
      ? {
        mesa: semFotos(dados.mobiliario_equipamentos.mesa),
        cadeira: semFotos(dados.mobiliario_equipamentos.cadeira),
        monitor: semFotos(dados.mobiliario_equipamentos.monitor),
        observacoes: dados.mobiliario_equipamentos.observacoes || "",
      }
      : null,
    ferramentas_mobiliario: semFotos(dados.ferramentas_mobiliario),
    condicoes_ambientais: dados.condicoes_ambientais || null,
    organizacao_trabalho: dados.organizacao_trabalho || null,
    cronoanalise: dados.cronoanalise
      ? {
        linhas: Array.isArray(dados.cronoanalise.linhas)
          ? dados.cronoanalise.linhas.map((l: any) => ({
            tarefa: l?.tarefa || "",
            tempo_minutos: l?.tempo_minutos || "",
            frequencia: l?.frequencia || "",
          }))
          : [],
        observacoes: dados.cronoanalise.observacoes || "",
      }
      : null,
    dados_saude: dados.dados_saude || null,
    sugestoes_melhoria: dados.sugestoes_melhoria
      ? {
        sugestoes: dados.sugestoes_melhoria.sugestoes || "",
        observacoes: dados.sugestoes_melhoria.observacoes || "",
      }
      : null,
  };
}

export function filtrarDocumentosAepAet(
  docs: Array<{ id: string; status?: string | null; updated_at?: string | null; draft_snapshot?: any }>,
  escopo: EscopoErgoIntegrado,
): ResumoFormularioAepAet[] {
  const setorId = escopo.setorId || null;
  const funcaoIds = new Set((escopo.funcaoIds || []).filter(Boolean));
  return docs
    .filter((d) => {
      const snap = d.draft_snapshot;
      if (!snap || typeof snap !== "object") return false;
      if (String(d.status || "").toLowerCase() === "rascunho") return false;
      if (setorId && snap.setor_id !== setorId) return false;
      if (funcaoIds.size > 0 && (!snap.funcao_id || !funcaoIds.has(snap.funcao_id))) return false;
      return !!snap.dados;
    })
    .map((d) => ({
      id: d.id,
      status: String(d.status || ""),
      atualizado_em: String(d.updated_at || ""),
      setor_id: String(d.draft_snapshot?.setor_id || ""),
      funcao_id: String(d.draft_snapshot?.funcao_id || ""),
      dados: resumirDadosAepAet(d.draft_snapshot?.dados),
    }))
    .sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em))
    .slice(0, 8);
}

export function filtrarAvaliacoesErgonomicas(
  rows: Array<{
    id: string;
    ferramenta?: string | null;
    colaborador_nome?: string | null;
    funcao?: string | null;
    setor_ref?: string | null;
    setor_nome?: string | null;
    data_avaliacao?: string | null;
    atividade?: string | null;
    escore_final?: number | null;
    classificacao?: string | null;
    nivel_acao?: string | null;
    recomendacoes?: string | null;
    aet_documento_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  }>,
  escopo: EscopoErgoIntegrado,
): ResumoAvaliacaoErgonomica[] {
  const setorId = escopo.setorId || null;
  const nomes = new Set((escopo.funcaoNomes || []).map(normTexto).filter(Boolean));
  const ferramentas = new Set<string>(FERRAMENTAS_ERGO_INTEGRADAS);

  return rows
    .filter((r) => {
      const ferramenta = String(r.ferramenta || "").toUpperCase();
      if (!ferramentas.has(ferramenta)) return false;
      if (setorId) {
        if (!r.setor_ref || r.setor_ref !== setorId) return false;
      }
      if (nomes.size > 0) {
        const fn = normTexto(r.funcao);
        if (!fn || ![...nomes].some((n) => fn === n || fn.includes(n) || n.includes(fn))) return false;
      }
      return true;
    })
    .map((r) => ({
      id: r.id,
      ferramenta: String(r.ferramenta || "").toUpperCase(),
      colaborador_nome: r.colaborador_nome ?? null,
      funcao: r.funcao ?? null,
      setor_ref: r.setor_ref ?? null,
      setor_nome: r.setor_nome ?? null,
      data_avaliacao: r.data_avaliacao ?? null,
      atividade: r.atividade ?? null,
      escore_final: r.escore_final != null ? Number(r.escore_final) : null,
      classificacao: r.classificacao ?? null,
      nivel_acao: r.nivel_acao ?? null,
      recomendacoes: typeof r.recomendacoes === "string" ? r.recomendacoes.slice(0, 2000) : null,
      aet_documento_id: r.aet_documento_id ?? null,
      atualizado_em: String(r.updated_at || r.created_at || ""),
    }))
    .sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em))
    .slice(0, 24);
}

export function montarContextoErgoIntegrado(
  formulario_aep_aet: ResumoFormularioAepAet[],
  avaliacoes_ergonomicas: ResumoAvaliacaoErgonomica[],
): ContextoErgoIntegrado {
  const disponivel = formulario_aep_aet.length > 0 || avaliacoes_ergonomicas.length > 0;
  if (!disponivel) return { ...CONTEXTO_ERGO_INTEGRADO_VAZIO };
  const partes: string[] = [];
  if (formulario_aep_aet.length) partes.push(`${formulario_aep_aet.length} Formulário(s) AEP/AET`);
  if (avaliacoes_ergonomicas.length) partes.push(`${avaliacoes_ergonomicas.length} avaliação(ões) ergonômica(s)`);
  return {
    disponivel: true,
    formulario_aep_aet,
    avaliacoes_ergonomicas,
    observacao: `${partes.join(" e ")} da mesma empresa, contrato, setor e função — somente leitura.`,
  };
}

export async function carregarContextoErgoIntegradoPg(
  pool: Pool,
  escopo: EscopoErgoIntegrado,
): Promise<ContextoErgoIntegrado> {
  if (!escopo.empresaId || !escopo.contratoId) return { ...CONTEXTO_ERGO_INTEGRADO_VAZIO };

  const params: unknown[] = [escopo.empresaId, escopo.contratoId];
  let sql = `
    select id, status, updated_at, draft_snapshot
    from documentos
    where tipo = 'AEP-AET'
      and empresa_id = $1
      and contrato_id = $2
      and coalesce(status, '') <> 'rascunho'`;
  if (escopo.setorId) {
    params.push(escopo.setorId);
    sql += ` and draft_snapshot->>'setor_id' = $${params.length}`;
  }
  sql += ` order by updated_at desc nulls last limit 40`;

  const docsQ = await pool.query(sql, params);
  const formulario_aep_aet = filtrarDocumentosAepAet(docsQ.rows || [], escopo);

  let avaliacoes_ergonomicas: ResumoAvaliacaoErgonomica[] = [];
  if (escopo.setorId) {
    const ergoQ = await pool.query(
      `select id, ferramenta, colaborador_nome, funcao, setor_ref, setor_nome,
              data_avaliacao, atividade, escore_final, classificacao, nivel_acao,
              recomendacoes, aet_documento_id, created_at
       from ergonomia_avaliacoes
       where setor_ref = $1
         and upper(ferramenta) = any($2::text[])
       order by created_at desc nulls last
       limit 80`,
      [escopo.setorId, [...FERRAMENTAS_ERGO_INTEGRADAS]],
    );
    avaliacoes_ergonomicas = filtrarAvaliacoesErgonomicas(ergoQ.rows || [], escopo);
  }

  return montarContextoErgoIntegrado(formulario_aep_aet, avaliacoes_ergonomicas);
}
