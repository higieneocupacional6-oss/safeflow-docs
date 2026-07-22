// Cálculo REBA (Hignett & McAtamney, 2000). Tabelas oficiais.
import type { ResultadoErgonomico } from "./types";

export type RebaInput = {
  tronco: 1 | 2 | 3 | 4;      // 1: ereto; 2: 0-20; 3: 20-60; 4: >60
  troncoAjuste: { torcido: boolean; inclinado: boolean };
  pescoco: 1 | 2 | 3;         // 1: 0-20; 2: >20; 3: em extensão
  pescocoAjuste: { torcido: boolean; inclinado: boolean };
  pernas: 1 | 2;              // 1: bilateral; 2: unilateral/instável
  pernasFlexao: 0 | 1 | 2;    // +1 se 30-60°; +2 se >60°
  carga: 0 | 1 | 2;           // 0: <5kg; 1: 5-10kg; 2: >10kg
  cargaImpacto: boolean;      // +1
  bracoSup: 1 | 2 | 3 | 4;    // 1: -20..20; 2: 20-45 ou ext>20; 3: 45-90; 4: >90
  bracoAjuste: { ombroElevado: boolean; abduzido: boolean; apoiado: boolean };
  antebraco: 1 | 2;           // 1: 60-100; 2: <60 ou >100
  punho: 1 | 2;               // 1: 0-15; 2: >15
  punhoDesviado: boolean;
  acoplamento: 0 | 1 | 2 | 3; // 0: bom; 1: regular; 2: ruim; 3: inaceitável
  atividade: { estatico: boolean; repetitivo: boolean; instavel: boolean };
};

// Tabela A: tronco x pescoço x pernas
const TABLE_A: number[][][] = [
  // tronco 1
  [ [1,2,3,4],[1,2,3,4],[3,4,5,6] ],
  // tronco 2
  [ [2,3,4,5],[2,3,4,5],[4,5,6,7] ],
  // tronco 3
  [ [2,4,5,6],[3,4,5,6],[5,6,7,8] ],
  // tronco 4
  [ [3,5,6,7],[4,5,6,7],[6,7,8,9] ],
];

// Tabela B: braço x antebraço x punho
const TABLE_B: number[][][] = [
  [ [1,2,2],[1,2,3] ], // braço 1
  [ [1,2,3],[2,3,4] ], // braço 2
  [ [3,4,5],[4,5,5] ], // braço 3
  [ [4,5,5],[5,6,7] ], // braço 4
  [ [6,7,8],[7,8,8] ], // braço 5
  [ [7,8,8],[8,9,9] ], // braço 6
];

// Tabela C: A x B → C
const TABLE_C: number[][] = [
  [1,1,1,2,3,3,4,5,6,7,7,7],
  [1,2,2,3,4,4,5,6,6,7,7,8],
  [2,3,3,3,4,5,6,7,7,8,8,8],
  [3,4,4,4,5,6,7,8,8,9,9,9],
  [4,4,4,5,6,7,8,8,9,9,9,9],
  [6,6,6,7,8,8,9,9,10,10,10,10],
  [7,7,7,8,9,9,9,10,10,11,11,11],
  [8,8,8,9,10,10,10,10,10,11,11,11],
  [9,9,9,10,10,10,11,11,11,12,12,12],
  [10,10,10,11,11,11,11,12,12,12,12,12],
  [11,11,11,11,12,12,12,12,12,12,12,12],
  [12,12,12,12,12,12,12,12,12,12,12,12],
];

const cap = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function calcularReba(i: RebaInput): ResultadoErgonomico {
  const tronco = cap(i.tronco + (i.troncoAjuste.torcido ? 1 : 0) + (i.troncoAjuste.inclinado ? 1 : 0), 1, 4);
  const pescoco = cap(i.pescoco + (i.pescocoAjuste.torcido ? 1 : 0) + (i.pescocoAjuste.inclinado ? 1 : 0), 1, 3);
  const pernas = cap(i.pernas + i.pernasFlexao, 1, 4);

  const posturaA = TABLE_A[tronco - 1][pescoco - 1][pernas - 1];
  const cargaScore = i.carga + (i.cargaImpacto ? 1 : 0);
  const scoreA = posturaA + cargaScore;

  let bracoSup = i.bracoSup + (i.bracoAjuste.ombroElevado ? 1 : 0) + (i.bracoAjuste.abduzido ? 1 : 0);
  bracoSup -= (i.bracoAjuste.apoiado ? 1 : 0);
  bracoSup = cap(bracoSup, 1, 6);
  const punho = cap(i.punho + (i.punhoDesviado ? 1 : 0), 1, 3);
  const posturaB = TABLE_B[bracoSup - 1][i.antebraco - 1][punho - 1];
  const scoreB = posturaB + i.acoplamento;

  const rowC = cap(scoreA, 1, 12) - 1;
  const colC = cap(scoreB, 1, 12) - 1;
  const scoreC = TABLE_C[rowC][colC];

  const atividade = (i.atividade.estatico ? 1 : 0) + (i.atividade.repetitivo ? 1 : 0) + (i.atividade.instavel ? 1 : 0);
  const escore = scoreC + atividade;

  const { classificacao, nivel_acao, recomendacoes } = classificar(escore);

  return {
    escore_final: escore,
    classificacao,
    nivel_acao,
    recomendacoes,
    memoria_calculo: [
      { etapa: "Tronco (ajustado)", valor: tronco },
      { etapa: "Pescoço (ajustado)", valor: pescoco },
      { etapa: "Pernas (ajustadas)", valor: pernas },
      { etapa: "Postura A (Tabela A)", valor: posturaA },
      { etapa: "Carga (+ impacto)", valor: cargaScore },
      { etapa: "Score A", valor: scoreA },
      { etapa: "Braço (ajustado)", valor: bracoSup },
      { etapa: "Antebraço", valor: i.antebraco },
      { etapa: "Punho (ajustado)", valor: punho },
      { etapa: "Postura B (Tabela B)", valor: posturaB },
      { etapa: "Acoplamento", valor: i.acoplamento },
      { etapa: "Score B", valor: scoreB },
      { etapa: "Score C (Tabela C)", valor: scoreC },
      { etapa: "Atividade (+)", valor: atividade },
      { etapa: "Escore REBA", valor: escore },
    ],
  };
}

function classificar(escore: number) {
  if (escore === 1) return {
    classificacao: "Risco negligenciável",
    nivel_acao: "Nível 0 — nenhuma ação necessária.",
    recomendacoes: "Manter as condições atuais. Reavaliar caso a tarefa mude.",
  };
  if (escore <= 3) return {
    classificacao: "Risco baixo",
    nivel_acao: "Nível 1 — pode ser necessária ação.",
    recomendacoes: "Reforçar orientações posturais e realizar pausas curtas ao longo do turno.",
  };
  if (escore <= 7) return {
    classificacao: "Risco médio",
    nivel_acao: "Nível 2 — ação necessária.",
    recomendacoes: "Redesenhar o posto: ajuste de alturas, ferramentas, apoios e ciclo de trabalho. Reavaliar em 60 dias.",
  };
  if (escore <= 10) return {
    classificacao: "Risco alto",
    nivel_acao: "Nível 3 — ação necessária brevemente.",
    recomendacoes: "Implementar intervenção ergonômica corretiva imediata: rodízio, apoios mecanizados, reprojeto do posto.",
  };
  return {
    classificacao: "Risco muito alto",
    nivel_acao: "Nível 4 — ação imediata.",
    recomendacoes: "Interromper a atividade nas condições atuais até implementar mudanças estruturais no posto e no processo.",
  };
}
