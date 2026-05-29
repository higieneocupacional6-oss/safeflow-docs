import { supabase } from "@/integrations/supabase/client";

// ============ Tipos PCMSO ============
export type PcmsoExame = {
  tipo_exame: string;
  cod_esocial: string;
  descricao_esocial: string;
  admissional: boolean;
  periodico: boolean;
  periodo: string;
  retorno_trabalho: boolean;
  mudanca_funcao: boolean;
  demissional: boolean;
  observacao: string;
};

export type PcmsoSetor = {
  setor_id?: string;
  nome_setor: string;
  funcoes: string;
  agentes_fisicos: string[];
  agentes_quimicos: string[];
  agentes_biologicos: string[];
  agentes_ergonomicos: string[];
  agentes_acidentes: string[];
  agentes_psicossociais: string[];
  exames: PcmsoExame[];
};

export type PcmsoRevisao = {
  revisao: string;
  data: string;
  motivo: string;
  responsavel: string;
};

export type PcmsoEpiItem = {
  id: string;
  nome_epi: string;
  ca: string;
  uso: string;
  observacao: string;
};
export type PcmsoEpiBloco = {
  id: string;
  funcao_ids: string[];
  epis: PcmsoEpiItem[];
};

export type PcmsoTreinItem = {
  id: string;
  nome_treinamento: string;
  carga_horaria: string;
  periodicidade: string;
  observacao: string;
};
export type PcmsoTreinBloco = {
  id: string;
  funcao_ids: string[];
  treinamentos: PcmsoTreinItem[];
};

export type PcmsoCronoItem = {
  id: string;
  item: string;
  acao: string;
  responsavel: string;
  prazo: string;
  situacao: string;
  observacao: string;
};

export const emptyExame = (): PcmsoExame => ({
  tipo_exame: "",
  cod_esocial: "",
  descricao_esocial: "",
  admissional: false,
  periodico: false,
  periodo: "",
  retorno_trabalho: false,
  mudanca_funcao: false,
  demissional: false,
  observacao: "",
});

export const emptyEpiItem = (): PcmsoEpiItem => ({
  id: crypto.randomUUID(), nome_epi: "", ca: "", uso: "", observacao: "",
});
export const emptyEpiBloco = (): PcmsoEpiBloco => ({
  id: crypto.randomUUID(), funcao_ids: [], epis: [emptyEpiItem()],
});
export const emptyTreinItem = (): PcmsoTreinItem => ({
  id: crypto.randomUUID(), nome_treinamento: "", carga_horaria: "", periodicidade: "", observacao: "",
});
export const emptyTreinBloco = (): PcmsoTreinBloco => ({
  id: crypto.randomUUID(), funcao_ids: [], treinamentos: [emptyTreinItem()],
});
export const emptyCronoItem = (): PcmsoCronoItem => ({
  id: crypto.randomUUID(), item: "", acao: "", responsavel: "", prazo: "", situacao: "", observacao: "",
});

const TIPO_MAP: Record<string, keyof PcmsoSetor> = {
  fisico: "agentes_fisicos", fisicos: "agentes_fisicos", físico: "agentes_fisicos",
  químico: "agentes_quimicos", quimico: "agentes_quimicos", quimicos: "agentes_quimicos",
  biologico: "agentes_biologicos", biológico: "agentes_biologicos", biologicos: "agentes_biologicos",
  ergonomico: "agentes_ergonomicos", ergonômico: "agentes_ergonomicos", ergonomicos: "agentes_ergonomicos",
  acidente: "agentes_acidentes", acidentes: "agentes_acidentes",
  mecanico: "agentes_acidentes", mecânico: "agentes_acidentes",
  psicossocial: "agentes_psicossociais", psicossociais: "agentes_psicossociais",
};

export async function buildSetoresFromEmpresa(empresaId: string): Promise<PcmsoSetor[]> {
  const [{ data: setores = [] }, { data: funcoes = [] }] = await Promise.all([
    supabase.from("setores").select("id,nome_setor").eq("empresa_id", empresaId).order("nome_setor"),
    supabase.from("funcoes").select("setor_id,nome_funcao"),
  ]);
  const funcMap: Record<string, string[]> = {};
  (funcoes as any[]).forEach((f) => {
    funcMap[f.setor_id] = funcMap[f.setor_id] || [];
    funcMap[f.setor_id].push(f.nome_funcao);
  });
  return (setores as any[]).map((s) => ({
    setor_id: s.id,
    nome_setor: s.nome_setor,
    funcoes: (funcMap[s.id] || []).join(", "),
    agentes_fisicos: [], agentes_quimicos: [], agentes_biologicos: [],
    agentes_ergonomicos: [], agentes_acidentes: [], agentes_psicossociais: [],
    exames: [],
  }));
}

async function getLatestPgrSnapshot(empresaId: string): Promise<any | null> {
  const { data } = await supabase
    .from("documentos").select("id,draft_snapshot")
    .eq("empresa_id", empresaId).eq("tipo", "PGR")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data?.draft_snapshot || null;
}

export async function copyPgrSnapshotIntoSetores(
  empresaId: string, base: PcmsoSetor[]
): Promise<PcmsoSetor[]> {
  const snap = await getLatestPgrSnapshot(empresaId);
  if (!snap) return base;
  const pgrSetores = snap?.setores || {};
  return base.map((s) => {
    const riscos = pgrSetores[s.setor_id || ""]?.riscos || [];
    const copy = { ...s };
    riscos.forEach((r: any) => {
      const key = TIPO_MAP[String(r.tipo_agente || r.tipo || "").toLowerCase().trim()];
      if (!key) return;
      const arr = copy[key] as string[];
      const nome = r.agente_nome || r.nome;
      if (nome && !arr.includes(nome)) arr.push(nome);
    });
    return copy;
  });
}

export async function copyPgrEpiBlocos(empresaId: string): Promise<PcmsoEpiBloco[]> {
  const snap = await getLatestPgrSnapshot(empresaId);
  const blocos = (snap?.epi_blocos || []) as any[];
  return blocos.map((b) => ({
    id: crypto.randomUUID(),
    funcao_ids: Array.isArray(b.funcao_ids) ? b.funcao_ids : [],
    epis: (b.epis || []).map((e: any) => ({
      id: crypto.randomUUID(),
      nome_epi: e.nome_epi || "",
      ca: e.ca || "",
      uso: e.uso || "",
      observacao: "",
    })),
  }));
}

export async function copyPgrTreinBlocos(empresaId: string): Promise<PcmsoTreinBloco[]> {
  const snap = await getLatestPgrSnapshot(empresaId);
  const blocos = (snap?.treinamento_blocos || []) as any[];
  return blocos.map((b) => ({
    id: crypto.randomUUID(),
    funcao_ids: Array.isArray(b.funcao_ids) ? b.funcao_ids : [],
    treinamentos: (b.treinamentos || []).map((t: any) => ({
      id: crypto.randomUUID(),
      nome_treinamento: t.nome_treinamento || "",
      carga_horaria: "",
      periodicidade: "",
      observacao: "",
    })),
  }));
}
