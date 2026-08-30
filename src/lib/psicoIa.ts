import { supabase } from "@/integrations/supabase/client";
import { BUCKET_BASE_TECNICA } from "@/components/psico/IaBaseTecnicaModal";
import type { GrupoRelatorio, MedidaControle } from "@/lib/psicoRelatorio";

export type SaidaIaPsico = {
  metodologia: string;
  conclusao: string;
  intro_plano_acao: string;
  lacunas: string[];
  grupos: {
    grupo_id: string;
    atividades: string;
    organizacao: string;
    fatores: {
      fator_key: string;
      descricao: string;
      fonte: string;
      situacao: string;
      interpretacao: string;
      consequencias: string;
      controles: string;
    }[];
  }[];
  medidas: {
    medida_key: string;
    medida: string;
    tipo: string;
    responsavel: string;
    prazo: string;
    prioridade: string;
  }[];
};

const toBase64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
};

/** Baixa os PDFs da base técnica cadastrada e converte para base64. */
export async function carregarBaseTecnica() {
  const { data: rows } = await supabase
    .from("psico_base_tecnica").select("nome, caminho").order("created_at", { ascending: false }).limit(6);
  const out: { name: string; data: string }[] = [];
  for (const r of (rows as any[]) || []) {
    const { data, error } = await supabase.storage.from(BUCKET_BASE_TECNICA).download(r.caminho);
    if (error || !data) continue;
    out.push({ name: r.nome, data: toBase64(await data.arrayBuffer()) });
  }
  return out;
}

export type ContextoIa = {
  empresa: any;
  contrato: any;
  avaliacao: any;
  setores: any[];
  indicadores: Record<string, string>;
  respondentes: number;
  grupos: {
    grupo_id: string;
    setor: string;
    ghe: string;
    funcoes: string[];
    atividades_cadastradas: string;
    jornada: string;
    trabalhadores: number;
    fatores: {
      fator_key: string;
      fator: string;
      nivel: string;
      sustentado: boolean;
      media: number | null;
      expostos: number;
      frequencia: string;
      controles_registrados: string;
    }[];
  }[];
  medidas: { medida_key: string; grupo: string; risco: string; nivel_sugerido: string }[];
  metodologia_info: Record<string, string>;
};

export function montarContexto(args: {
  empresa: any; contrato: any; avaliacao: any; setores: any[];
  indicadores: Record<string, string>; respondentes: number;
  grupos: GrupoRelatorio[]; medidas: MedidaControle[]; metInfo: Record<string, string>;
}): ContextoIa {
  return {
    empresa: args.empresa
      ? {
          razao_social: args.empresa.razao_social, nome_fantasia: args.empresa.nome_fantasia,
          cnpj: args.empresa.cnpj, cnae: args.empresa.cnae_principal,
          endereco: args.empresa.endereco, jornada: args.empresa.jornada_trabalho,
        }
      : null,
    contrato: args.contrato ? { numero: args.contrato.numero_contrato, objeto: args.contrato.objeto } : null,
    avaliacao: args.avaliacao ? { titulo: args.avaliacao.titulo, data: args.avaliacao.data_avaliacao } : null,
    setores: (args.setores || []).map((s: any) => ({
      setor: s.nome_setor,
      ghe: s.ghe_ges,
      funcoes: (s.funcoes || []).map((f: any) => ({
        funcao: f.nome_funcao, expostos: f.expostos, atividades: f.descricao_atividades,
      })),
    })),
    indicadores: args.indicadores || {},
    respondentes: args.respondentes,
    grupos: args.grupos.map((g) => ({
      grupo_id: g.id,
      setor: g.setor,
      ghe: g.ghe,
      funcoes: g.funcoes,
      atividades_cadastradas: g.atividades,
      jornada: g.jornada,
      trabalhadores: g.trabalhadores,
      fatores: g.fatores.map((f) => ({
        fator_key: f.key,
        fator: f.fator,
        nivel: f.nivel,
        sustentado: f.sustentado !== false,
        media: (f as any).media ?? null,
        expostos: f.expostos,
        frequencia: f.frequencia,
        controles_registrados: f.controles,
      })),
    })),
    medidas: args.medidas.map((m) => ({
      medida_key: m.key, grupo: m.grupo, risco: m.risco, nivel_sugerido: m.prioridade,
    })),
    metodologia_info: args.metInfo || {},
  };
}

export async function gerarTextosIa(contexto: ContextoIa): Promise<SaidaIaPsico> {
  const baseTecnica = await carregarBaseTecnica();
  const { data, error } = await supabase.functions.invoke("psico-generate", {
    body: { contexto, baseTecnica },
  });
  if (error) {
    const msg = (await (error as any)?.context?.json?.().catch(() => null))?.error;
    throw new Error(msg || error.message || "Falha ao consultar a IA.");
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any).output as SaidaIaPsico;
}
