// Contexto somente leitura para o "Gerar IA" do Formulário AEP:
// relatório Psicossocial salvo (mesma empresa+contrato, por setor/GHE/função) e
// formulários AEP salvos anteriormente da mesma empresa (mesmo contrato priorizado).
import { supabase } from "@/integrations/supabase/client";
import { carregarContextoPsicossocial } from "@/lib/psicoContexto";

type Marcas = Record<string, Record<string, string>>;

/** Resume um formulário salvo em fatores classificados (D/I/IDs) e atividades. */
export function resumirFormularioAep(dados: any) {
  const atividades = (Array.isArray(dados?.atividades) ? dados.atividades : [])
    .map((l: any, i: number) => ({ id: i + 1, texto: String(l?.texto || "").trim() }))
    .filter((l: any) => l.texto);
  const marcas: Marcas = dados?.reconhecimento?.marcas || {};
  const fatores = Object.entries(marcas).map(([codigo, m]) => {
    const ativos = Object.entries(m || {}).filter(([, v]) => v);
    const pega = (p: string) => ativos.filter(([k]) => k.startsWith(p)).map(([k]) => Number(k.slice(1)));
    return { codigo, duracao: pega("D")[0] || 0, intensidade: pega("I")[0] || 0, atividades_ids: pega("A") };
  }).filter((f) => f.duracao || f.intensidade || f.atividades_ids.length);
  return {
    funcoes_ids: Array.isArray(dados?.funcoes) ? dados.funcoes : [],
    descricao: String(dados?.ident?.descricao || "").slice(0, 1500),
    atividades,
    fatores,
  };
}

export async function carregarContextoFormularioAep(args: {
  empresaId: string; contratoId: string; formularioAtualId?: string;
  setores: { id: string; nome_setor: string; ghe_ges?: string | null; funcoes?: { id: string; nome_funcao: string }[] }[];
  funcoesSelecionadas: Set<string>;
}) {
  const psicossocial = (await Promise.all(args.setores.map(async (s) => {
    const funcoes = (s.funcoes || []).filter((f) => !args.funcoesSelecionadas.size || args.funcoesSelecionadas.has(f.id));
    const ctx = await carregarContextoPsicossocial({
      empresaId: args.empresaId, contratoId: args.contratoId, setorId: s.id,
      setorNome: s.nome_setor, ghe: s.ghe_ges, funcoes: funcoes.map((f) => f.nome_funcao),
    });
    return ctx.disponivel ? { setor: s.nome_setor, ghe_ges: s.ghe_ges, relatorio_id: ctx.relatorio_id, resumo: ctx.setor_resumo } : null;
  }))).filter(Boolean) as any[];

  let anteriores: any[] = [];
  try {
    const { data } = await supabase.from("formularios_aep")
      .select("id, contrato_id, setor_ids, dados, updated_at")
      .eq("empresa_id", args.empresaId)
      .order("updated_at", { ascending: false }).limit(20);
    anteriores = (data || [])
      .filter((f: any) => f.id !== args.formularioAtualId)
      .sort((a: any, b: any) => Number(b.contrato_id === args.contratoId) - Number(a.contrato_id === args.contratoId))
      .slice(0, 5)
      .map((f: any) => ({ id: f.id, mesmo_contrato: f.contrato_id === args.contratoId, atualizado_em: f.updated_at, ...resumirFormularioAep(f.dados) }));
  } catch (e) {
    console.warn("[formularioAepContexto] falha ao ler formulários anteriores", e);
  }
  return { psicossocial, formularios_anteriores: anteriores };
}
