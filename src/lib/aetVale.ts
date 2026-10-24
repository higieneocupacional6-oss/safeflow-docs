import type { RiscoErgonomico } from "@/lib/aepRisco";
import { etapa2Vazia, type Etapa2Vale } from "../../supabase/functions/_shared/aetValeIa";

export type AetValeSetor = {
  id: string;
  empresa_id: string;
  contrato_id: string | null;
  nome_setor: string;
  ghe_ges: string | null;
  funcoes: { id: string; nome_funcao: string }[];
};

export const ORIGENS_DEMANDA = [
  "Gestor",
  "Gestão de mudanças",
  "Inspeção",
  "Incidente",
  "SST",
  "Jurídica",
  "Outros",
] as const;

export type AetValeFoto = import("../../supabase/functions/_shared/aetValeFotos").FotoVale;

export type AetValeDados = {
  gerencia_area: string;
  descricao_ambiente: string;
  data_avaliacao: string;
  revisao: string;
  nome_gere: string;
  jornada: string;
  cargo: string;
  descricao_cargo: string;
  tarefa_analisada: string;
  origens: string[];
  origem_detalhe: string;
  demanda_ergonomica: string;
  descricao_tarefa: string;
  analise_atividade: string;
  verbalizacao: string;
  fotos: AetValeFoto[];
  etapa2: Etapa2Vale;
};

export function dadosVaziosAetVale(cargo = ""): AetValeDados {
  return {
    gerencia_area: "",
    descricao_ambiente: "",
    data_avaliacao: "",
    revisao: "",
    nome_gere: "",
    jornada: "",
    cargo,
    descricao_cargo: "",
    tarefa_analisada: "",
    origens: [],
    origem_detalhe: "",
    demanda_ergonomica: "",
    descricao_tarefa: "",
    analise_atividade: "",
    verbalizacao: "",
    fotos: [{ imagem: "", descricao: "" }, { imagem: "", descricao: "" }],
    etapa2: etapa2Vazia(),
  };
}

export function criarRegistroAetVale(
  setor: AetValeSetor,
  empresaId: string,
  contratoId: string,
  empresaNome: string,
  registroId: string,
  funcaoId: string,
) {
  if (setor.empresa_id !== empresaId || setor.contrato_id !== contratoId) {
    throw new Error("O setor não pertence à empresa e ao contrato selecionados.");
  }
  const funcao = setor.funcoes.find((f) => f.id === funcaoId);
  if (!funcao) throw new Error("A função não pertence ao setor selecionado.");
  return {
    id: registroId,
    tipo: "AET-VALE",
    empresa_id: empresaId,
    contrato_id: contratoId,
    empresa_nome: empresaNome,
    nome_documento: `AET (VALE) — ${setor.nome_setor} — ${funcao.nome_funcao}`,
    status: "rascunho",
    draft_snapshot: { setor_id: setor.id, funcao_id: funcao.id, dados: dadosVaziosAetVale(funcao.nome_funcao) },
  };
}

export function setorDoRegistroAetVale(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object" || !("setor_id" in snapshot)) return null;
  return typeof snapshot.setor_id === "string" ? snapshot.setor_id : null;
}

export function funcaoDoRegistroAetVale(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object" || !("funcao_id" in snapshot)) return null;
  return typeof snapshot.funcao_id === "string" ? snapshot.funcao_id : null;
}

/**
 * Somente leitura: devolve os registros da AEP classificados como Alto ou
 * Muito Alto (nível interno "Crítico"), preservando todos os campos
 * originais, sem inventar dados.
 */
export function riscosAepAltos(riscos: unknown): RiscoErgonomico[] {
  if (!Array.isArray(riscos)) return [];
  return (riscos as RiscoErgonomico[]).filter(
    (r) => r && (r.nivel_risco === "Alto" || r.nivel_risco === "Crítico"),
  );
}
