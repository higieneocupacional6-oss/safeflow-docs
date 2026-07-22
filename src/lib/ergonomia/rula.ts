// Cálculo RULA (McAtamney & Corlett, 1993). Tabelas de referência oficiais.
import type { ResultadoErgonomico } from "./types";

export type RulaInput = {
  braco: 1 | 2 | 3 | 4;              // 1: -20..20; 2: >20 ext/flex; 3: 20-45; 4: 45-90; (>90 => 4+1)
  bracoAdicionais: {
    ombroElevado: boolean;    // +1
    abduzido: boolean;        // +1
    apoiado: boolean;         // -1
    bracoMuitoAlto: boolean;  // +1 (se >90°)
  };
  antebraco: 1 | 2;           // 1: 60-100; 2: <60 ou >100
  antebracoAdicionais: { cruzaCorpo: boolean; foraLinhaMedia: boolean }; // +1 se algum
  punho: 1 | 2 | 3;           // 1: neutro; 2: 0-15; 3: >15
  punhoDesviado: boolean;     // +1
  torcaoPunho: 1 | 2;         // 1: meio; 2: extremo
  pescoco: 1 | 2 | 3 | 4;     // 1: 0-10; 2: 10-20; 3: >20; 4: extensão
  pescocoAdicionais: { torcido: boolean; inclinado: boolean };
  tronco: 1 | 2 | 3 | 4;      // 1: ereto; 2: 0-20; 3: 20-60; 4: >60
  troncoAdicionais: { torcido: boolean; inclinado: boolean };
  pernas: 1 | 2;              // 1: apoiadas; 2: sem apoio equilibrado
  usoMuscular: boolean;       // estático >1min ou >4x/min => +1
  carga: 0 | 1 | 2 | 3;       // 0:<2kg intermitente; 1:2-10kg intermitente; 2:2-10kg estático/repet; 3:>10kg/impacto
};

// Tabela A (Braço x Antebraço x Punho x Torção). Valores oficiais da metodologia RULA.
const TABLE_A: number[][][][] = [
  // braço 1
  [
    // antebraço 1
    [[1,2],[2,2],[2,3],[3,3]],
    // antebraço 2
    [[2,2],[2,2],[3,3],[3,3]],
    // antebraço 3
    [[2,3],[3,3],[3,3],[4,4]],
  ],
  // braço 2
  [
    [[2,3],[3,3],[3,4],[4,4]],
    [[3,3],[3,3],[3,4],[4,4]],
    [[3,4],[4,4],[4,4],[5,5]],
  ],
  // braço 3
  [
    [[3,3],[4,4],[4,4],[5,5]],
    [[3,4],[4,4],[4,4],[5,5]],
    [[4,4],[4,4],[4,5],[5,5]],
  ],
  // braço 4
  [
    [[4,4],[4,4],[4,5],[5,5]],
    [[4,4],[4,4],[4,5],[5,5]],
    [[4,4],[4,5],[5,5],[6,6]],
  ],
];

// Tabela B (Pescoço x Tronco x Pernas). Valores oficiais.
const TABLE_B: number[][][] = [
  // pescoço 1
  [
    [1,3],[2,3],[3,4],[5,5],[6,6],[7,7],
  ],
  // pescoço 2
  [
    [2,3],[2,3],[4,5],[5,5],[6,7],[7,7],
  ],
  // pescoço 3
  [
    [3,3],[3,4],[4,5],[5,6],[6,7],[7,7],
  ],
  // pescoço 4
  [
    [5,5],[5,6],[6,7],[7,7],[7,7],[8,8],
  ],
  // pescoço 5
  [
    [7,7],[7,7],[7,8],[8,8],[8,8],[8,8],
  ],
  // pescoço 6
  [
    [8,8],[8,8],[8,8],[8,9],[9,9],[9,9],
  ],
];

// Tabela C (Score C x Score D) -> escore final.
const TABLE_C: number[][] = [
  //D:1  2  3  4  5  6  7+
  [ 1, 2, 3, 3, 4, 5, 5 ], // C=1
  [ 2, 2, 3, 4, 4, 5, 5 ],
  [ 3, 3, 3, 4, 4, 5, 6 ],
  [ 3, 3, 3, 4, 5, 6, 6 ],
  [ 4, 4, 4, 5, 6, 7, 7 ],
  [ 4, 4, 5, 6, 6, 7, 7 ],
  [ 5, 5, 6, 6, 7, 7, 7 ],
  [ 5, 5, 6, 7, 7, 7, 7 ], // C=8+
];

const cap = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function calcularRula(i: RulaInput): ResultadoErgonomico {
  // Braço com ajustes
  let braco = i.braco + (i.bracoAdicionais.bracoMuitoAlto ? 1 : 0);
  braco += (i.bracoAdicionais.ombroElevado ? 1 : 0);
  braco += (i.bracoAdicionais.abduzido ? 1 : 0);
  braco -= (i.bracoAdicionais.apoiado ? 1 : 0);
  braco = cap(braco, 1, 4);

  let antebraco = i.antebraco + ((i.antebracoAdicionais.cruzaCorpo || i.antebracoAdicionais.foraLinhaMedia) ? 1 : 0);
  antebraco = cap(antebraco, 1, 3);

  let punho = i.punho + (i.punhoDesviado ? 1 : 0);
  punho = cap(punho, 1, 4);

  const posturaA = TABLE_A[braco - 1][antebraco - 1][punho - 1][i.torcaoPunho - 1];

  let pescoco = i.pescoco + (i.pescocoAdicionais.torcido ? 1 : 0) + (i.pescocoAdicionais.inclinado ? 1 : 0);
  pescoco = cap(pescoco, 1, 6);

  let tronco = i.tronco + (i.troncoAdicionais.torcido ? 1 : 0) + (i.troncoAdicionais.inclinado ? 1 : 0);
  tronco = cap(tronco, 1, 6);

  const posturaB = TABLE_B[pescoco - 1][tronco - 1][i.pernas - 1];

  const muscular = i.usoMuscular ? 1 : 0;
  const scoreC = cap(posturaA + muscular + i.carga, 1, 8);
  const scoreD = cap(posturaB + muscular + i.carga, 1, 7);

  const escore = TABLE_C[scoreC - 1][scoreD - 1];

  const { classificacao, nivel_acao, recomendacoes } = classificar(escore);

  return {
    escore_final: escore,
    classificacao,
    nivel_acao,
    recomendacoes,
    memoria_calculo: [
      { etapa: "Braço (ajustado)", valor: braco },
      { etapa: "Antebraço (ajustado)", valor: antebraco },
      { etapa: "Punho (ajustado)", valor: punho },
      { etapa: "Torção do punho", valor: i.torcaoPunho },
      { etapa: "Postura A (Tabela A)", valor: posturaA },
      { etapa: "Pescoço (ajustado)", valor: pescoco },
      { etapa: "Tronco (ajustado)", valor: tronco },
      { etapa: "Pernas", valor: i.pernas },
      { etapa: "Postura B (Tabela B)", valor: posturaB },
      { etapa: "Uso muscular (+)", valor: muscular },
      { etapa: "Carga/Força (+)", valor: i.carga },
      { etapa: "Score C", valor: scoreC },
      { etapa: "Score D", valor: scoreD },
      { etapa: "Escore RULA (Tabela C)", valor: escore },
    ],
  };
}

function classificar(escore: number) {
  if (escore <= 2) return {
    classificacao: "Risco aceitável (Nível 1)",
    nivel_acao: "Nível 1 — postura aceitável se não for mantida ou repetida por longos períodos.",
    recomendacoes: "Manter monitoramento periódico. Nenhuma intervenção imediata necessária.",
  };
  if (escore <= 4) return {
    classificacao: "Risco baixo — investigação necessária (Nível 2)",
    nivel_acao: "Nível 2 — é necessária investigação; podem ser requeridas alterações.",
    recomendacoes: "Reavaliar posto de trabalho, promover pausas ativas e ajustes posturais. Documentar reavaliação em 90 dias.",
  };
  if (escore <= 6) return {
    classificacao: "Risco moderado — investigação e mudanças em breve (Nível 3)",
    nivel_acao: "Nível 3 — investigação e alterações requeridas em breve.",
    recomendacoes: "Redesenhar o posto, revisar altura de trabalho, ferramentas e ciclo. Implementar rodízio e pausas obrigatórias.",
  };
  return {
    classificacao: "Risco muito alto — mudanças imediatas (Nível 4)",
    nivel_acao: "Nível 4 — investigação e mudanças imediatas são requeridas.",
    recomendacoes: "Interromper ou reprojetar imediatamente a atividade. Ajustes ergonômicos urgentes, treinamento e acompanhamento médico se aplicável.",
  };
}
