import type { AprErgoSetor } from "@/lib/aprErgo";
import { funcaoDoRegistroAprErgo, setorDoRegistroAprErgo } from "@/lib/aprErgo";

/** Ação do plano consolidado 5W2H da APR-ERGO, vinculada ao registro de origem. */
export type AcaoPlanoApr = {
  id: string;
  documento_id: string;
  setor_id: string;
  setor: string;
  funcao_id: string;
  funcao: string;
  risco: string;
  prioridade: string;
  o_que: string;
  por_que: string;
  onde: string;
  quando: string;
  quem: string;
  como: string;
  quanto: string;
  resultado_esperado: string;
};

export const PRIORIDADES_PLANO_APR = ["Alta", "Média", "Baixa"] as const;

export const COLUNAS_PLANO_APR = [
  ["o_que", "What — O que será feito?"],
  ["por_que", "Why — Por que será feito?"],
  ["onde", "Where — Onde será feito?"],
  ["quando", "When — Quando será feito?"],
  ["quem", "Who — Quem será responsável?"],
  ["como", "How — Como será feito?"],
  ["quanto", "How much — Qual o custo estimado?"],
] as const;

export function novaAcaoPlanoApr(id: string): AcaoPlanoApr {
  return {
    id, documento_id: "", setor_id: "", setor: "", funcao_id: "", funcao: "",
    risco: "", prioridade: "", o_que: "", por_que: "", onde: "", quando: "",
    quem: "", como: "", quanto: "", resultado_esperado: "",
  };
}

/** Prioridade derivada da classificação da matriz APR; nunca inventada. */
export function prioridadeDaClassificacao(classificacao: string): string {
  const c = (classificacao || "").trim().toUpperCase();
  if (c === "MUITO ALTO" || c === "ALTO") return "Alta";
  if (c === "MÉDIO" || c === "MEDIO") return "Média";
  if (c === "BAIXO") return "Baixa";
  return "";
}

/** Risco identificado em uma linha da APR, pronto para vincular a uma ação. */
export type RiscoPlanoApr = {
  documento_id: string;
  setor_id: string;
  setor: string;
  funcao_id: string;
  funcao: string;
  risco: string;
  classificacao: string;
  recomendacoes: string;
};

type LinhaSnapshot = {
  circunstancia?: string; classificacao?: string; recomendacoes?: string;
  funcao_id?: string; funcao_ids?: string[]; funcao_nome?: string;
};

/**
 * Extrai os riscos das APR-ERGO do escopo para o plano, preservando o vínculo
 * exato com cada registro. Linhas sem circunstância ou classificação não entram.
 */
export function riscosAprParaPlano(
  registros: { id: string; draft_snapshot: unknown }[],
  setores: AprErgoSetor[],
): RiscoPlanoApr[] {
  const saida: RiscoPlanoApr[] = [];
  for (const reg of registros) {
    const snap = reg.draft_snapshot && typeof reg.draft_snapshot === "object"
      ? reg.draft_snapshot as Record<string, unknown> : {};
    const setorId = setorDoRegistroAprErgo(snap);
    const setor = setores.find((s) => s.id === setorId);
    if (!setor) continue;
    const funcaoRegistro = funcaoDoRegistroAprErgo(snap);
    const linhas = Array.isArray((snap.tabela as { linhas?: LinhaSnapshot[] } | undefined)?.linhas)
      ? (snap.tabela as { linhas: LinhaSnapshot[] }).linhas : [];
    linhas.forEach((linha) => {
      const risco = (linha.circunstancia || "").trim();
      const classificacao = (linha.classificacao || "").trim();
      if (!risco || !classificacao) return;
      const funcaoId = funcaoRegistro || linha.funcao_id || linha.funcao_ids?.[0] || "";
      const funcao = setor.funcoes.find((f) => f.id === funcaoId)?.nome_funcao || linha.funcao_nome || "";
      saida.push({
        documento_id: reg.id,
        setor_id: setor.id,
        setor: setor.nome_setor,
        funcao_id: funcaoId,
        funcao,
        risco,
        classificacao,
        recomendacoes: (linha.recomendacoes || "").trim(),
      });
    });
  }
  return saida;
}

/** Lê as ações salvas no snapshot do plano; qualquer formato inválido vira lista vazia. */
export function acoesDoPlano(snapshot: unknown): AcaoPlanoApr[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const acoes = (snapshot as Record<string, unknown>).acoes;
  if (!Array.isArray(acoes)) return [];
  return acoes.flatMap((a) => {
    if (!a || typeof a !== "object") return [];
    const reg = a as Record<string, unknown>;
    const base = novaAcaoPlanoApr(typeof reg.id === "string" && reg.id ? reg.id : crypto.randomUUID());
    for (const k of Object.keys(base) as (keyof AcaoPlanoApr)[]) {
      if (typeof reg[k] === "string") base[k] = reg[k] as string;
    }
    return [base];
  });
}

/**
 * Aplica a proposta da IA somente quando confirmada: substitui a lista atual
 * pelas ações válidas e sem duplicidades (mesmo documento, risco e "o quê").
 */
export function aplicarPropostaPlano(propostas: AcaoPlanoApr[]): AcaoPlanoApr[] {
  const vistos = new Set<string>();
  return propostas.flatMap((a) => {
    const assinatura = `${a.documento_id}|${a.risco.trim().toLowerCase()}|${a.o_que.trim().toLowerCase()}`;
    if (!a.o_que.trim() || vistos.has(assinatura)) return [];
    vistos.add(assinatura);
    return [a];
  });
}
