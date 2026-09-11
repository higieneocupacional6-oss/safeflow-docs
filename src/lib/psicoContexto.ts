// Integração Psicossocial → AET / AEP.
// Consulta (somente leitura) as avaliações psicossociais já cadastradas para a
// empresa e monta um contexto correlacionável por Empresa → Setor → GHE → Função.
// Nunca altera dados do módulo Psicossocial.

import { supabase } from "@/integrations/supabase/client";
import { BLOCOS_COPSOQ, valorRiscoPergunta } from "@/lib/copsoqBlocos";

export type PsicoFator = {
  bloco: string;
  titulo: string;
  media: number | null;
  classificacao: string;
};

export type PsicoResumoEscopo = {
  escopo: "setor" | "empresa";
  setor?: string;
  ghe?: string;
  respostas: number;
  funcoes: string[];
  fatores: PsicoFator[];
  riscos: string[];
  resumos: string[];
};

export type PsicoContextoIa = {
  disponivel: boolean;
  origem: "setor" | "empresa" | "nenhum";
  total_respostas_empresa: number;
  alvo: { setor: string; ghe: string };
  avaliacoes: { titulo: string; data: string }[];
  indicadores: Record<string, any>;
  setor_resumo: PsicoResumoEscopo | null;
  empresa_resumo: PsicoResumoEscopo | null;
  observacao: string;
};

const norm = (v: any) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

function classificar(media: number): string {
  if (media >= 75) return "Crítico";
  if (media >= 50) return "Alto";
  if (media >= 25) return "Moderado";
  return "Baixo";
}

/** Média de risco por bloco a partir de `blocos` gravados ou, na falta, das respostas cruas. */
function fatoresDaResposta(row: any): Record<string, number> {
  const out: Record<string, number> = {};
  const blocos = row?.blocos && typeof row.blocos === "object" ? row.blocos : null;
  for (const b of BLOCOS_COPSOQ) {
    const gravado = blocos?.[b.key];
    if (gravado && typeof gravado.media === "number") {
      out[b.key] = gravado.media;
      continue;
    }
    const respostas: any[] = row?.respostas?.[b.key] || [];
    const validas = respostas
      .map((r, i) => ({ r, i }))
      .filter((x) => typeof x.r === "number" && x.r >= 0);
    if (!validas.length) continue;
    out[b.key] =
      validas.reduce((acc, x) => acc + valorRiscoPergunta(x.r, b.key, x.i), 0) / validas.length;
  }
  return out;
}

function resumirGrupo(
  rows: any[],
  escopo: "setor" | "empresa",
  info?: { setor?: string; ghe?: string },
): PsicoResumoEscopo {
  const acc: Record<string, number[]> = {};
  const funcoes = new Set<string>();
  const riscos = new Set<string>();
  const resumos = new Set<string>();

  for (const r of rows) {
    if (r.funcao_nome) funcoes.add(r.funcao_nome);
    const rs = r.copsoq_resultado_resumido || r.resultado_psicossocial;
    if (rs) resumos.add(String(rs).trim());
    const rk = r.copsoq_riscos_identificados || r.riscos_psicossociais;
    if (rk)
      String(rk)
        .split(/[,;]/)
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((x) => riscos.add(x));
    const f = fatoresDaResposta(r);
    for (const [k, v] of Object.entries(f)) (acc[k] ||= []).push(v);
  }

  const fatores: PsicoFator[] = BLOCOS_COPSOQ.filter((b) => acc[b.key]?.length).map((b) => {
    const media = acc[b.key].reduce((a, c) => a + c, 0) / acc[b.key].length;
    return {
      bloco: b.key,
      titulo: b.titulo,
      media: Math.round(media * 10) / 10,
      classificacao: classificar(media),
    };
  });

  return {
    escopo,
    setor: info?.setor,
    ghe: info?.ghe,
    respostas: rows.length,
    funcoes: Array.from(funcoes),
    fatores,
    riscos: Array.from(riscos).slice(0, 12),
    resumos: Array.from(resumos).slice(0, 4),
  };
}

export const PSICO_CONTEXTO_VAZIO: PsicoContextoIa = {
  disponivel: false,
  origem: "nenhum",
  total_respostas_empresa: 0,
  alvo: { setor: "", ghe: "" },
  avaliacoes: [],
  indicadores: {},
  setor_resumo: null,
  empresa_resumo: null,
  observacao: "Nenhum dado psicossocial cadastrado para esta empresa.",
};

/**
 * Carrega o contexto psicossocial da empresa priorizando o setor/GHE avaliado.
 * Falhas de consulta nunca bloqueiam a geração: retorna contexto vazio.
 */
export async function carregarContextoPsicossocial(args: {
  empresaId?: string | null;
  contratoId?: string | null;
  setorNome?: string | null;
  ghe?: string | null;
  setorId?: string | null;
}): Promise<PsicoContextoIa> {
  const { empresaId, contratoId, setorNome, ghe, setorId } = args;
  if (!empresaId) return PSICO_CONTEXTO_VAZIO;

  try {
    const { data: respostas } = await supabase
      .from("psico_respostas")
      .select(
        "id, funcao_id, funcao_nome, contrato_id, data_avaliacao, blocos, respostas, resultado_psicossocial, riscos_psicossociais, copsoq_resultado_resumido, copsoq_riscos_identificados",
      )
      .eq("empresa_id", empresaId)
      .order("data_avaliacao", { ascending: false })
      .limit(2000);

    const rows = (respostas as any[]) || [];
    if (!rows.length) return { ...PSICO_CONTEXTO_VAZIO, alvo: { setor: setorNome || "", ghe: ghe || "" } };

    // Mapa função → setor/GHE (para correlacionar respostas ao setor avaliado)
    const funcaoIds = Array.from(new Set(rows.map((r) => r.funcao_id).filter(Boolean)));
    const funcaoInfo = new Map<string, { setor_id: string; setor: string; ghe: string }>();
    if (funcaoIds.length) {
      const { data: funcoes } = await supabase
        .from("funcoes")
        .select("id, nome_funcao, setor_id, setores!inner(id, nome_setor, ghe_ges)")
        .in("id", funcaoIds as string[]);
      for (const f of ((funcoes as any[]) || [])) {
        const s: any = Array.isArray(f.setores) ? f.setores[0] : f.setores;
        funcaoInfo.set(f.id, {
          setor_id: s?.id || f.setor_id,
          setor: s?.nome_setor || "",
          ghe: s?.ghe_ges || "",
        });
      }
    }

    const alvoSetor = norm(setorNome);
    const alvoGhe = norm(ghe);
    const doSetor = rows.filter((r) => {
      const info = r.funcao_id ? funcaoInfo.get(r.funcao_id) : undefined;
      if (!info) return false;
      if (setorId && info.setor_id === setorId) return true;
      if (alvoSetor && norm(info.setor) === alvoSetor) return true;
      if (alvoGhe && info.ghe && norm(info.ghe) === alvoGhe) return true;
      return false;
    });

    const doContrato = contratoId ? rows.filter((r) => r.contrato_id === contratoId) : [];
    const baseEmpresa = doContrato.length ? doContrato : rows;

    const { data: avals } = await supabase
      .from("psico_avaliacoes")
      .select("titulo, data_avaliacao")
      .eq("empresa_id", empresaId)
      .order("data_avaliacao", { ascending: false })
      .limit(5);

    const { data: inds } = await supabase
      .from("psico_indicadores")
      .select("dados")
      .eq("empresa_id", empresaId)
      .order("updated_at", { ascending: false })
      .limit(1);

    const setorResumo = doSetor.length
      ? resumirGrupo(doSetor, "setor", { setor: setorNome || "", ghe: ghe || "" })
      : null;
    const empresaResumo = resumirGrupo(baseEmpresa, "empresa");

    return {
      disponivel: true,
      origem: setorResumo ? "setor" : "empresa",
      total_respostas_empresa: rows.length,
      alvo: { setor: setorNome || "", ghe: ghe || "" },
      avaliacoes: ((avals as any[]) || []).map((a) => ({
        titulo: a.titulo || "",
        data: a.data_avaliacao || "",
      })),
      indicadores: (inds as any[])?.[0]?.dados || {},
      setor_resumo: setorResumo,
      empresa_resumo: empresaResumo,
      observacao: setorResumo
        ? "Dados específicos do setor/GHE avaliado — prioridade máxima na correlação."
        : "Não há avaliação psicossocial específica deste setor. Os dados abaixo são GERAIS DA EMPRESA e só podem ser usados quando tecnicamente pertinentes, sinalizando que se trata de informação geral.",
    };
  } catch (e) {
    console.warn("[psicoContexto] falha ao consultar dados psicossociais:", e);
    return PSICO_CONTEXTO_VAZIO;
  }
}
