// Integração Psicossocial → AEP / AET. Usa exclusivamente o relatório salvo.
import { supabase } from "@/integrations/supabase/client";

export type PsicoFator = {
  bloco: string;
  titulo: string;
  media: number | null;
  classificacao: string;
  frequencia?: string;
  descricao?: string;
  situacao?: string;
  interpretacao?: string;
  consequencias?: string;
  controles?: string;
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
  atividades?: string;
  organizacao?: string;
  jornada?: string;
  medidas?: any[];
};

export type PsicoContextoIa = {
  disponivel: boolean;
  origem: "setor" | "empresa" | "nenhum";
  total_respostas_empresa: number;
  alvo: { setor: string; ghe: string; funcoes?: string[] };
  avaliacoes: { titulo: string; data: string }[];
  indicadores: Record<string, any>;
  setor_resumo: PsicoResumoEscopo | null;
  empresa_resumo: PsicoResumoEscopo | null;
  observacao: string;
  relatorio_id?: string;
  atualizado_em?: string;
};

const norm = (value: unknown) =>
  String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const nomes = (value: unknown): string[] =>
  (Array.isArray(value) ? value : []).map((v: any) => String(v?.nome ?? v ?? "").trim()).filter(Boolean);

export function selecionarGrupoPsicossocial(
  grupos: any[],
  alvo: { setorId?: string | null; setorNome?: string | null; ghe?: string | null; funcoes?: string[] },
): any | null {
  const funcoesAlvo = new Set((alvo.funcoes || []).map(norm).filter(Boolean));
  return grupos
    .map((grupo) => {
      let pontos = 0;
      if (alvo.setorId && grupo?.setor_id === alvo.setorId) pontos += 100;
      if (alvo.setorNome && norm(grupo?.setor) === norm(alvo.setorNome)) pontos += 30;
      if (alvo.ghe && norm(grupo?.ghe) === norm(alvo.ghe)) pontos += 20;
      const funcoesGrupo = nomes(grupo?.funcoes).map(norm); if (grupo?.funcao_ges) funcoesGrupo.push(norm(grupo.funcao_ges));
      const funcaoCompativel = !funcoesAlvo.size || funcoesGrupo.some((f) => funcoesAlvo.has(f));
      if (funcoesAlvo.size && funcaoCompativel) pontos += 10;
      return { grupo, pontos, funcaoCompativel };
    })
    .filter((x) => x.pontos >= 20 && x.funcaoCompativel)
    .sort((a, b) => b.pontos - a.pontos)[0]?.grupo || null;
}

function resumoGrupo(grupo: any, medidas: any[]): PsicoResumoEscopo {
  const fatores = (Array.isArray(grupo?.fatores) ? grupo.fatores : []).map((f: any) => ({
    bloco: String(f.key || f.fator_key || f.fator || ""),
    titulo: String(f.fator || f.titulo || f.descricao || "Fator psicossocial"),
    media: typeof f.media === "number" ? f.media : null,
    classificacao: String(f.nivel || f.classificacao || ""),
    frequencia: f.frequencia || "",
    descricao: f.descricao || "",
    situacao: f.situacao || "",
    interpretacao: f.interpretacao || "",
    consequencias: f.consequencias || "",
    controles: f.controles || "",
  }));
  return {
    escopo: "setor",
    setor: grupo?.setor || "",
    ghe: grupo?.ghe || "",
    respostas: Number(grupo?.trabalhadores || grupo?.respondentes || 0),
    funcoes: nomes(grupo?.funcoes),
    fatores,
    riscos: fatores.filter((f) => /alto|m[eé]dio|moderado|cr[ií]tico/i.test(f.classificacao)).map((f) => f.titulo),
    resumos: [grupo?.organizacao, grupo?.interpretacao].filter(Boolean),
    atividades: grupo?.atividades || "",
    organizacao: grupo?.organizacao || "",
    jornada: grupo?.jornada || "",
    medidas,
  };
}

export const PSICO_CONTEXTO_VAZIO: PsicoContextoIa = {
  disponivel: false,
  origem: "nenhum",
  total_respostas_empresa: 0,
  alvo: { setor: "", ghe: "", funcoes: [] },
  avaliacoes: [],
  indicadores: {},
  setor_resumo: null,
  empresa_resumo: null,
  observacao: "Nenhum relatório psicossocial salvo para esta empresa e contrato.",
};

export async function carregarContextoPsicossocial(args: {
  empresaId?: string | null;
  contratoId?: string | null;
  setorNome?: string | null;
  ghe?: string | null;
  setorId?: string | null;
  funcoes?: string[];
}): Promise<PsicoContextoIa> {
  const alvo = { setor: args.setorNome || "", ghe: args.ghe || "", funcoes: args.funcoes || [] };
  if (!args.empresaId || !args.contratoId) return { ...PSICO_CONTEXTO_VAZIO, alvo };
  try {
    const { data, error } = await supabase
      .from("psico_relatorios")
      .select("id, dados, updated_at, avaliacao_id")
      .eq("empresa_id", args.empresaId)
      .eq("contrato_id", args.contratoId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { ...PSICO_CONTEXTO_VAZIO, alvo };
    const dados: any = data.dados || {};
    const grupos = Array.isArray(dados.grupos) ? dados.grupos : [];
    const grupo = selecionarGrupoPsicossocial(grupos, {
      setorId: args.setorId, setorNome: args.setorNome,
      ghe: args.ghe,
      funcoes: args.funcoes,
    });
    if (!grupo) return { ...PSICO_CONTEXTO_VAZIO, alvo, observacao: "O relatório salvo não possui grupo correspondente ao setor/GHE e função avaliados." };
    const medidas = (Array.isArray(dados.medidas) ? dados.medidas : []).filter((m: any) =>
      !m?.grupo || norm(m.grupo) === norm(grupo.id) || norm(m.grupo) === norm(grupo.setor),
    );
    return {
      disponivel: true,
      origem: "setor",
      total_respostas_empresa: Number(grupo.trabalhadores || grupo.respondentes || 0),
      alvo,
      avaliacoes: [],
      indicadores: {},
      setor_resumo: resumoGrupo(grupo, medidas),
      empresa_resumo: null,
      observacao: "Relatório psicossocial salvo correspondente à mesma empresa, contrato, setor/GHE e função.",
      relatorio_id: data.id,
      atualizado_em: data.updated_at,
    };
  } catch (error) {
    console.warn("[psicoContexto] falha ao consultar relatório psicossocial:", error);
    return { ...PSICO_CONTEXTO_VAZIO, alvo };
  }
}