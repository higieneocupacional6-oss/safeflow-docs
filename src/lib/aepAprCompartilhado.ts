import { supabase } from "@/integrations/supabase/client";
import { CATEGORIAS } from "@/components/formulario-aep/EtapaReconhecimento";
import { ESTIMATIVAS_APR, INTENSIDADES_APR } from "../../supabase/functions/_shared/aprErgoPlanilha";

export type ExposicaoAtividade = { atividade_id: string; atividade_numero?: number; codigo_aep: string; duracao: number; intensidade: number };
export type EscopoExposicao = { empresa: string; contrato: string; setor: string; funcao: string };
const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\[\s*IA\s*[·-]?\s*validar\s*\]/gi, "").replace(/\s+/g, " ").trim().toLowerCase();
export function codigoFatorApr(l: any): string {
  if (l.codigo_aep && CATEGORIAS.some(([, itens]) => itens.some((i) => i.startsWith(`${l.codigo_aep}:`)))) return l.codigo_aep;
  // Workbook eSocial codes differ from Anexo 01; never join by those codes or fuzzy descriptions.
  return CATEGORIAS.flatMap(([, itens]) => itens).find((i) => normalizar(i.slice(i.indexOf(":") + 1)) === normalizar(l.exigencia || ""))?.split(":")[0] || "";
}
const unico = (m: Record<string, string>, prefixo: string) => {
  const ativos = Object.keys(m).filter((k) => new RegExp(`^${prefixo}[1-5]$`).test(k) && String(m[k]).trim());
  return ativos.length === 1 ? Number(ativos[0].slice(1)) : 0;
};
export function exposicoesAep(dados: any, registroId?: string): ExposicaoAtividade[] {
  return Object.entries(dados?.reconhecimento?.marcas || {}).flatMap(([codigo, marca]) => {
    const m = marca as Record<string, string>, numero = unico(m, "A");
    if (!numero) return [];
    const anterior = (dados.reconhecimento.compartilhado || []).find((e: ExposicaoAtividade) => e.codigo_aep === codigo && e.atividade_numero === numero);
    const atividade = dados.atividade_ids?.[numero - 1] || anterior?.atividade_id || (registroId ? `aep:${registroId}:atividade:${numero}` : "");
    if (!atividade) return [];
    return [{ atividade_id: atividade, atividade_numero: numero, codigo_aep: codigo, duracao: unico(m, "D"), intensidade: unico(m, "I") }];
  });
}
export function exposicoesApr(linhas: any[], registroId?: string): ExposicaoAtividade[] {
  return linhas.flatMap((l, i) => {
    const codigo = codigoFatorApr(l);
    const atividadeId = l.atividade_id || (registroId ? `apr:${registroId}:atividade:${i + 1}` : "");
    if (!codigo || !atividadeId) return [];
    return [{ atividade_id: atividadeId, atividade_numero: l.atividade_numero || (i < 5 ? i + 1 : undefined), codigo_aep: codigo,
      duracao: ESTIMATIVAS_APR.findIndex(([s]) => s === l.estimativa) + 1,
      intensidade: INTENSIDADES_APR.findIndex(([s]) => s === l.intensidade) + 1 }];
  });
}
/** Multiple contradictory sources must not silently win by row position or last fetch order. */
export function exposicaoUnica(fontes: ExposicaoAtividade[], codigo: string, atividade?: string): ExposicaoAtividade | undefined {
  const candidatas = fontes.filter((e) => e.codigo_aep === codigo && (!atividade || e.atividade_id === atividade));
  const distintas = [...new Map(candidatas.map((e) => [JSON.stringify([e.atividade_id, e.duracao, e.intensidade]), e])).values()];
  return distintas.length === 1 ? distintas[0] : undefined;
}
export function mesclarAprExposicoes<T extends Record<string, any>>(linhas: T[], fontes: ExposicaoAtividade[]): (T & { atividade_id?: string; atividade_numero?: number; codigo_aep?: string; exposicao_compartilhada?: ExposicaoAtividade })[] {
  return linhas.map((l) => {
    const e = exposicaoUnica(fontes, codigoFatorApr(l), l.atividade_id);
    if (!e) return l;
    const anterior = l.exposicao_compartilhada as ExposicaoAtividade | undefined;
    const alterar = (campo: "duracao" | "intensidade", atual: string, opcoes: [string, number][]) => {
      const antigo = anterior?.[campo] ? opcoes[(anterior[campo] || 1) - 1]?.[0] : "";
      return (!atual || atual === antigo) && e[campo] ? opcoes[e[campo] - 1]?.[0] || atual : atual;
    };
    return { ...l, atividade_id: l.atividade_id || e.atividade_id, atividade_numero: e.atividade_numero, codigo_aep: e.codigo_aep,
      estimativa: alterar("duracao", l.estimativa, ESTIMATIVAS_APR), intensidade: alterar("intensidade", l.intensidade, INTENSIDADES_APR), exposicao_compartilhada: e };
  });
}
export function mesclarAepExposicoes<T extends { marcas: Record<string, Record<string, string>>; compartilhado?: ExposicaoAtividade[] }>(rec: T, fontes: ExposicaoAtividade[]): T & { compartilhado: ExposicaoAtividade[] } {
  const marcas = structuredClone(rec.marcas), compartilhado = [...(rec.compartilhado || [])];
  for (const codigo of new Set(fontes.map((e) => e.codigo_aep))) {
    const m = marcas[codigo] || {}, antigo = compartilhado.find((e) => e.codigo_aep === codigo);
    const e = exposicaoUnica(fontes, codigo, antigo?.atividade_id);
    if (!e || !e.atividade_numero) continue;
    for (const [prefixo, campo] of [["D", "duracao"], ["I", "intensidade"], ["A", "atividade_numero"]] as const) {
      const ativos = Object.keys(m).filter((k) => k.startsWith(prefixo) && m[k]);
      const atual = unico(m, prefixo);
      if (e[campo] && (!ativos.length || (ativos.length === 1 && atual === antigo?.[campo]))) {
        ativos.forEach((k) => delete m[k]); m[`${prefixo}${e[campo]}`] = "X";
      }
    }
    marcas[codigo] = m;
    if (!antigo) compartilhado.push(e);
    else if (unico(m, "D") === e.duracao && unico(m, "I") === e.intensidade) compartilhado[compartilhado.indexOf(antigo)] = e;
  }
  return { ...rec, marcas, compartilhado };
}
export async function carregarExposicoes(escopo: EscopoExposicao, excluir?: string): Promise<ExposicaoAtividade[]> {
  if (!Object.values(escopo).every(Boolean)) return [];
  const [aep, apr] = await Promise.all([
    supabase.from("formularios_aep").select("id, dados, setor_ids").eq("empresa_id", escopo.empresa).eq("contrato_id", escopo.contrato).contains("setor_ids", [escopo.setor]),
    supabase.from("documentos").select("id, draft_snapshot").eq("empresa_id", escopo.empresa).eq("contrato_id", escopo.contrato).eq("tipo", "APR-ERGO").neq("status", "rascunho"),
  ]);
  if (aep.error || apr.error) throw new Error("Não foi possível consultar os campos compartilhados. Tente novamente.");
  return [
    ...(aep.data || []).flatMap((f) => {
      const d = f.dados as any;
      return f.id !== excluir && f.setor_ids.length === 1 && f.setor_ids[0] === escopo.setor && d?.funcoes?.length === 1 && d.funcoes[0] === escopo.funcao ? exposicoesAep(d, f.id) : [];
    }),
    ...(apr.data || []).flatMap((f) => {
      const s = f.draft_snapshot as any;
      if (f.id === excluir || s?.setor_id !== escopo.setor) return [];
      return exposicoesApr((s.tabela?.linhas || []).map((l: any, i: number) => ({ ...l, atividade_id: l.atividade_id || `apr:${f.id}:atividade:${i + 1}`, atividade_numero: l.atividade_numero || (i < 5 ? i + 1 : undefined) })).filter((l: any) => (l.setor_id || s.setor_id) === escopo.setor && (l.funcao_id === escopo.funcao || l.funcao_ids?.length === 1 && l.funcao_ids[0] === escopo.funcao || !l.funcao_id && !l.funcao_ids?.length && s.funcao_id === escopo.funcao)), f.id);
    }),
  ];
}