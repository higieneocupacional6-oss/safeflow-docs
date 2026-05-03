// Tipos canônicos de equipamentos de Higiene Ocupacional.
// Usado tanto pelo Cadastro quanto pelos wizards (LTCAT/Insalubridade)
// para filtrar dinamicamente os equipamentos disponíveis por agente.

export const EQUIPAMENTO_TIPOS = [
  "Dosímetro",
  "Bomba de Amostragem",
  "Termômetro de Globo - IBUTG",
  "Acelerômetro de Vibração Corpo Inteiro",
  "Acelerômetro de Vibração Mãos e Braços",
  "Outro",
] as const;

export type EquipamentoTipo = (typeof EQUIPAMENTO_TIPOS)[number];

/**
 * Retorna o(s) tipo(s) de equipamento esperado(s) para um agente/avaliação.
 * Usado para filtrar o dropdown "Nº de Série".
 */
export function tiposEquipamentoPorAgente(
  agenteNome: string | undefined | null,
  tipoAvaliacao?: string | null,
): EquipamentoTipo[] {
  const a = (agenteNome || "").toLowerCase();
  const tav = (tipoAvaliacao || "").toLowerCase();

  if (a.includes("ruído") || a.includes("ruido")) return ["Dosímetro"];
  if (a.includes("calor") || a.includes("ibutg")) return ["Termômetro de Globo - IBUTG"];
  if (a.includes("vibra") && (a.includes("corpo") || a.includes("inteiro")))
    return ["Acelerômetro de Vibração Corpo Inteiro"];
  if (a.includes("vibra") && (a.includes("mão") || a.includes("mao") || a.includes("braço") || a.includes("braco")))
    return ["Acelerômetro de Vibração Mãos e Braços"];

  // Agentes químicos quantitativos -> Bomba de Amostragem
  if (tav.includes("quanti")) return ["Bomba de Amostragem"];

  return [];
}
