// Geração determinística da "Justificativa da Escolha das Ferramentas".
// Opcionalmente refinada por IA via Edge Function.
import type { FerramentaTipo } from "./types";
import { supabase } from "@/integrations/supabase/client";

const DESCRICOES: Record<FerramentaTipo, { foco: string; adequado_quando: string }> = {
  RULA: {
    foco: "avaliação de posturas estáticas e dinâmicas de membros superiores, pescoço e tronco",
    adequado_quando: "atividades predominantemente sentadas ou em pé com uso intenso dos membros superiores, típicas de trabalho administrativo, montagem fina e operação de comandos",
  },
  REBA: {
    foco: "análise postural global (corpo todo), com ênfase em cargas dinâmicas e imprevisíveis",
    adequado_quando: "atividades com manuseio de cargas, posturas variadas e movimentação corporal ampla, como cuidados, logística, construção e manutenção",
  },
  NIOSH: {
    foco: "avaliação de levantamento manual de cargas, calculando o Limite de Peso Recomendado e o Índice de Levantamento",
    adequado_quando: "tarefas envolvendo levantamento, abaixamento e transporte de cargas em duas mãos, com plano sagital predominante",
  },
  OCRA: {
    foco: "avaliação de risco por movimentos repetitivos dos membros superiores em ciclos de trabalho",
    adequado_quando: "atividades cíclicas de curta duração com alta frequência de movimentos, característica de linhas de montagem e embalagem",
  },
  OWAS: {
    foco: "amostragem de posturas de tronco, braços, pernas e carga em atividades dinâmicas",
    adequado_quando: "tarefas com grande variabilidade postural ao longo do turno, comuns na indústria pesada, agricultura e logística",
  },
  STRAIN_INDEX: {
    foco: "análise semiquantitativa de esforço distal (mão/punho) considerando intensidade, duração, frequência, postura, velocidade e jornada",
    adequado_quando: "atividades com esforço manual repetitivo distal, como acabamento, apertos, cortes e uso de ferramentas manuais",
  },
  ROSA: {
    foco: "avaliação ergonômica de postos administrativos (cadeira, monitor, teclado, mouse, telefone e acessórios)",
    adequado_quando: "postos com computador utilizados por período prolongado, escritórios e call centers",
  },
};

export function gerarJustificativaDeterministica(params: {
  funcao: string;
  descricao_atividade?: string;
  ferramentas: FerramentaTipo[];
}): string {
  const { funcao, descricao_atividade, ferramentas } = params;
  if (ferramentas.length === 0) return "";
  const introFuncao = funcao ? `para a função de ${funcao}` : "para a função analisada";
  const contexto = descricao_atividade?.trim()
    ? ` Considerando as atividades descritas — ${descricao_atividade.trim()} — `
    : " Considerando as exigências físicas, cognitivas, biomecânicas e organizacionais da atividade, ";
  const linhas = ferramentas.map((f) => {
    const d = DESCRICOES[f];
    return `• ${f}: selecionada por ser voltada à ${d.foco}, adequada a ${d.adequado_quando}.`;
  });
  return (
    `As ferramentas ergonômicas foram escolhidas ${introFuncao} com base na natureza das tarefas e na literatura técnica de referência.` +
    contexto +
    `optou-se pelo(s) instrumento(s) abaixo:\n\n` +
    linhas.join("\n") +
    `\n\nA combinação atende às diretrizes da NR-17 e às normas técnicas correlatas, permitindo caracterizar de forma objetiva o risco ergonômico predominante e subsidiar as recomendações do plano de ação.`
  );
}

export async function refinarJustificativaIA(params: {
  funcao: string;
  descricao_atividade?: string;
  ferramentas: FerramentaTipo[];
  texto_base: string;
}): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("aet-generate", {
      body: {
        modo: "justificativa_ferramentas",
        funcao: params.funcao,
        descricao_atividade: params.descricao_atividade || "",
        ferramentas: params.ferramentas,
        texto_base: params.texto_base,
      },
    });
    if (error) throw error;
    const t = (data as any)?.justificativa || (data as any)?.texto || "";
    return typeof t === "string" && t.trim() ? t.trim() : params.texto_base;
  } catch {
    return params.texto_base;
  }
}
