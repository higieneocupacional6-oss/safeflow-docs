import { type GrupoRelatorio, type FatorRisco, type MedidaControle } from "./psicoRelatorio";
import { type RiscoErgonomico, calcularNivelRiscoAep } from "./aepRisco";
import { PROBABILIDADE_LABELS, SEVERIDADE_LABELS } from "./pgrMatriz";

/** 
 * Converte a probabilidade 1-4 do Psicossocial para 1-3 da AEP.
 */
export function mapearProbabilidadeParaAep(p: number): string {
  if (p <= 1) return PROBABILIDADE_LABELS[1];
  if (p === 2) return PROBABILIDADE_LABELS[2];
  return PROBABILIDADE_LABELS[3]; // 3 e 4 -> Alta
}

/** 
 * Converte a severidade 1-4 do Psicossocial para 1-3 da AEP.
 */
export function mapearSeveridadeParaAep(s: number): string {
  if (s <= 1) return SEVERIDADE_LABELS[1];
  if (s === 2) return SEVERIDADE_LABELS[2];
  return SEVERIDADE_LABELS[3]; // 3 e 4 -> Grave
}

/**
 * Mapeia um grupo psicossocial para riscos ergonômicos da AEP.
 */
export function mapearPsicoParaAep(grupo: GrupoRelatorio, medidas: MedidaControle[]): RiscoErgonomico[] {
  return grupo.fatores
    .filter(f => f.sustentado && f.nivel !== "Baixo")
    .map(f => {
      const p = mapearProbabilidadeParaAep(f.probabilidade);
      const s = mapearSeveridadeParaAep(f.severidade);
      
      // Busca medidas específicas para este risco no plano de ação
      const medidasRisco = medidas
        .filter(m => m.grupo.includes(grupo.setor) && m.risco === f.fator)
        .map(m => m.medida)
        .join("; ");

      return {
        tipo_agente: "Ergonômico psicossocial",
        fator_risco: `Psicossocial: ${f.fator}`,
        fonte_geradora: f.fonte,
        possiveis_danos: f.consequencias,
        controle_existente: f.controles,
        probabilidade: p,
        severidade: s,
        nivel_risco: calcularNivelRiscoAep(p, s),
        medidas: medidasRisco || "Implementar recomendações do relatório psicossocial técnico.",
      };
    });
}

/**
 * Prepara o contexto organizacional do Psicossocial para a AET.
 */
export function prepararContextoPsicoParaAet(grupo: GrupoRelatorio) {
  return {
    analise_organizacional: grupo.organizacao,
    descricao_atividade: grupo.atividades,
    jornada_aspectos: grupo.jornada,
    riscos_identificados: grupo.fatores
      .filter(f => f.sustentado && f.nivel !== "Baixo")
      .map(f => `${f.fator} (${f.nivel}): ${f.interpretacao}`)
  };
}
