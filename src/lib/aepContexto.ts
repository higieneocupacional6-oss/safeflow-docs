import { supabase } from "@/integrations/supabase/client";
import { extrairFocoAep } from "../../supabase/functions/_shared/aepAprofundamento";

export type AepContextoIa = {
  disponivel: boolean;
  origem: "setor" | "nenhum";
  documento_id: string;
  atualizado_em: string;
  alvo: { setor_id: string; setor: string; ghe: string; funcoes: string[] };
  setor: Record<string, unknown> | null;
  aprofundamento?: ReturnType<typeof extrairFocoAep>;
  observacao: string;
};

export const AEP_CONTEXTO_VAZIO: AepContextoIa = {
  disponivel: false,
  origem: "nenhum",
  documento_id: "",
  atualizado_em: "",
  alvo: { setor_id: "", setor: "", ghe: "", funcoes: [] },
  setor: null,
  observacao: "Nenhuma AEP correspondente foi encontrada.",
};

const norm = (value: unknown) =>
  String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const nomesFuncoes = (setor: any): string[] => {
  const nomes = (Array.isArray(setor?.funcoes_selecionadas) ? setor.funcoes_selecionadas : [])
    .map((f: any) => String(f?.nome ?? f ?? "").trim());
  if (setor?.funcao_ges) nomes.push(String(setor.funcao_ges).trim());
  return nomes.filter(Boolean);
};

export function selecionarSetorAep(
  documentos: any[],
  alvo: { setorId?: string | null; setorNome?: string | null; ghe?: string | null; funcoes?: string[]; funcaoIds?: string[] },
): { documento: any; setor: any } | null {
  const funcoesAlvo = new Set((alvo.funcoes || []).map(norm).filter(Boolean));
  const candidatos = documentos.flatMap((documento) =>
    (Array.isArray(documento?.setores) ? documento.setores : []).map((setor: any) => ({ documento, setor })),
  );
  
  const pontuar = ({ setor }: { setor: any }) => {
    // Qualquer identidade conflitante exclui o candidato, mesmo com nomes iguais.
    if (alvo.setorId && setor?.setor_id && setor.setor_id !== alvo.setorId) return { pontos: 0, temFuncaoCompativel: false };
    if (alvo.setorNome && norm(setor?.setor_nome) !== norm(alvo.setorNome)) return { pontos: 0, temFuncaoCompativel: false };
    if (alvo.ghe && norm(setor?.ges) !== norm(alvo.ghe)) return { pontos: 0, temFuncaoCompativel: false };
    let pontos = 0;
    // Matching por ID é o mais forte para evitar homônimos
    if (alvo.setorId && setor?.setor_id === alvo.setorId) pontos += 100;
    if (alvo.setorNome && norm(setor?.setor_nome) === norm(alvo.setorNome)) pontos += 30;
    if (alvo.ghe && norm(setor?.ges) === norm(alvo.ghe)) pontos += 20;
    
    const funcoes = nomesFuncoes(setor).map(norm);
    const ids = (setor?.funcoes_selecionadas || []).map((f: any) => f?.id).filter(Boolean);
    const temFuncaoCompativel = alvo.funcaoIds?.length && ids.length
      ? alvo.funcaoIds.every((id) => ids.includes(id))
      : [...funcoesAlvo].every((f) => funcoes.includes(f));
    if (funcoesAlvo.size && temFuncaoCompativel) pontos += 10;
    
    return { pontos, temFuncaoCompativel };
  };

  return candidatos
    .map((c) => {
      const { pontos, temFuncaoCompativel } = pontuar(c);
      return { ...c, pontos, temFuncaoCompativel };
    })
    // Exige score mínimo e compatibilidade de função se fornecida
    .filter((c) => c.pontos >= 20 && c.temFuncaoCompativel)
    .sort((a, b) => 
      b.pontos - a.pontos || 
      String(b.documento?.updated_at || "").localeCompare(String(a.documento?.updated_at || ""))
    )[0] || null;
}

export async function carregarContextoAep(args: {
  empresaId?: string | null;
  contratoId?: string | null;
  setorId?: string | null;
  setorNome?: string | null;
  ghe?: string | null;
  funcoes?: string[];
  funcaoIds?: string[];
}): Promise<AepContextoIa> {
  const alvo = {
    setor_id: args.setorId || "",
    setor: args.setorNome || "",
    ghe: args.ghe || "",
    funcoes: args.funcoes || [],
  };
  
  if (!args.empresaId || !args.contratoId) return { ...AEP_CONTEXTO_VAZIO, alvo };
  
  try {
    const documentos: any[] = [];
    for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase
      .from("aep_documentos")
      .select("id, setores, status, updated_at")
      .eq("empresa_id", args.empresaId)
      .eq("contrato_id", args.contratoId)
      .order("updated_at", { ascending: false })
      .range(offset, offset + 99);
      
    if (error) throw error;
    documentos.push(...(data || []));
    if (!data || data.length < 100) break;
    }
    
    const encontrado = selecionarSetorAep(documentos, args);
    if (!encontrado) return { ...AEP_CONTEXTO_VAZIO, alvo };
    
    const s = encontrado.setor;
    return {
      disponivel: true,
      origem: "setor",
      documento_id: encontrado.documento.id || "",
      atualizado_em: encontrado.documento.updated_at || "",
      aprofundamento: extrairFocoAep(s),
      alvo,
      setor: {
        setor_id: s.setor_id || "",
        setor: s.setor_nome || "",
        ghe: s.ges || "",
        funcoes: nomesFuncoes(s),
        atividade: s.descricao_atividade || "",
        turno: s.turno || "",
        descricao_ambiente: s.descricao_ambiente || "",
        checklist: s.checklist || {},
        riscos_lista: Array.isArray(s.riscos_lista) ? s.riscos_lista : [],
        parecer_ambiente: s.parecer_ambiente || "",
        parecer_ergonomia: s.parecer_ergonomia || "",
        conduta_1: s.conduta_1 || "",
        parecer_conduta_1: s.parecer_conduta_1 || "",
        conduta_2: s.conduta_2 || "",
        parecer_conduta_2: s.parecer_conduta_2 || "",
        plano_acao: Array.isArray(s.plano_acao) ? s.plano_acao : [],
      },
      observacao: "AEP salva correspondente à mesma empresa, contrato, setor/GHE e função.",
    };
  } catch (error) {
    console.warn("[aepContexto] falha ao consultar AEP:", error);
    return { ...AEP_CONTEXTO_VAZIO, alvo };
  }
}
