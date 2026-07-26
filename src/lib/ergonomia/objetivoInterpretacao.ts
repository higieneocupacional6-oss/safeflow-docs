// Geração automática de "Objetivo" e "Interpretação" das ferramentas ergonômicas.

const OBJETIVOS: Record<string, string> = {
  RULA: "Avaliar a sobrecarga biomecânica dos membros superiores e postura corporal.",
  REBA: "Avaliar o risco ergonômico decorrente das posturas adotadas durante a atividade.",
  OWAS: "Classificar as posturas corporais e determinar a necessidade de intervenção.",
  ROSA: "Avaliar o risco ergonômico em postos administrativos com computador.",
  NIOSH: "Avaliar o risco associado ao levantamento manual de cargas.",
  OCRA: "Avaliar a exposição aos movimentos repetitivos dos membros superiores.",
  "MOORE-GARG": "Avaliar o risco de distúrbios musculoesqueléticos distais por esforço e repetição.",
  "STRAIN_INDEX": "Avaliar o risco de distúrbios musculoesqueléticos distais por esforço e repetição.",
  "STRAIN INDEX": "Avaliar o risco de distúrbios musculoesqueléticos distais por esforço e repetição.",
};

export function objetivoFerramenta(tipo?: string): string {
  const key = String(tipo || "").trim().toUpperCase();
  return OBJETIVOS[key] || "Avaliar o risco ergonômico associado à atividade analisada.";
}

type NivelRisco = "baixo" | "moderado" | "alto" | "muito_alto" | "indefinido";

function classificarNivel(texto: string): NivelRisco {
  const t = texto.toLowerCase();
  if (/(muito alto|mui?to elevado|inaceit|imediat|urgente|nível 4|nivel 4|risco cr[ií]tico)/.test(t)) return "muito_alto";
  if (/(alto|elevado|substancial|curto prazo|nível 3|nivel 3)/.test(t)) return "alto";
  if (/(moderado|m[ée]dio|investig|nível 2|nivel 2)/.test(t)) return "moderado";
  if (/(baixo|aceit[áa]vel|insignificante|nenhuma|n[ãa]o.*necess|nível 0|nivel 0|nível 1|nivel 1)/.test(t)) return "baixo";
  return "indefinido";
}

const FRASES: Record<NivelRisco, string> = {
  baixo:
    "indica exposição a risco ergonômico baixo, sendo aceitável a condição atual, com manutenção das boas práticas e monitoramento periódico do posto de trabalho.",
  moderado:
    "indica exposição a risco ergonômico moderado, sendo recomendável a implementação de melhorias no posto de trabalho para redução da sobrecarga biomecânica.",
  alto:
    "indica exposição a risco ergonômico alto, sendo recomendada intervenção em curto prazo para adequação do posto de trabalho e redução da sobrecarga biomecânica.",
  muito_alto:
    "indica exposição a risco ergonômico muito alto, sendo necessária intervenção imediata no posto de trabalho e na organização da atividade.",
  indefinido:
    "requer análise complementar, recomendando-se a revisão das condições do posto de trabalho e da organização da atividade.",
};

export function interpretarFerramentaAuto(params: {
  tipo?: string;
  escore_final?: number | null;
  resultado?: string;
  classificacao?: string;
  nivel_acao?: string;
  funcao?: string;
}): string {
  const tipo = String(params.tipo || "").trim().toUpperCase();
  const classificacao = String(params.classificacao || "").trim();
  const nivelAcao = String(params.nivel_acao || "").trim();
  const resultado = String(params.resultado || "").trim();
  const escore = params.escore_final;

  const nivel = classificarNivel([classificacao, nivelAcao, resultado].join(" "));

  const partes: string[] = [];
  const escoreTxt =
    escore !== null && escore !== undefined && !Number.isNaN(Number(escore))
      ? `pontuação ${escore}`
      : resultado
        ? `resultado "${resultado}"`
        : "";

  partes.push(
    `A aplicação do método ${tipo || "ergonômico"}${params.funcao ? ` na função ${params.funcao}` : ""}` +
    `${escoreTxt ? ` resultou em ${escoreTxt}` : ""}${classificacao ? ` (${classificacao})` : ""}.`,
  );
  partes.push(`O resultado obtido ${FRASES[nivel]}`);
  if (nivelAcao) partes.push(`Nível de ação indicado: ${nivelAcao}.`);

  return partes.join(" ");
}
