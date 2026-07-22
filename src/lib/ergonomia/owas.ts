// OWAS — Ovako Working Posture Analysis System (Karhu et al., 1977).
// Implementação determinística conforme metodologia oficial.
import type { ResultadoErgonomico } from "./types";

export type OwasInput = {
  costas: 1 | 2 | 3 | 4;   // 1: retas; 2: flexionadas; 3: torcidas; 4: flexionadas e torcidas
  bracos: 1 | 2 | 3;       // 1: ambos abaixo do ombro; 2: um acima; 3: ambos acima
  pernas: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  // 1 sentado; 2 em pé com duas pernas retas; 3 em pé apoiado em uma perna reta;
  // 4 em pé/agachado com ambos joelhos flexionados; 5 em pé/agachado com um joelho flexionado;
  // 6 ajoelhado (um ou dois joelhos); 7 andando
  carga: 1 | 2 | 3;        // 1: ≤10kg; 2: 10-20kg; 3: >20kg
};

export const OWAS_LABELS = {
  costas: {
    1: "Costas retas",
    2: "Costas flexionadas",
    3: "Costas torcidas",
    4: "Costas flexionadas e torcidas",
  },
  bracos: {
    1: "Ambos os braços abaixo da linha dos ombros",
    2: "Um braço acima da linha dos ombros",
    3: "Ambos os braços acima da linha dos ombros",
  },
  pernas: {
    1: "Sentado",
    2: "Em pé com as duas pernas retas",
    3: "Em pé apoiado em uma perna reta",
    4: "Em pé ou agachado com os dois joelhos flexionados",
    5: "Em pé ou agachado com um joelho flexionado",
    6: "Ajoelhado (um ou os dois joelhos)",
    7: "Andando ou deslocando-se",
  },
  carga: {
    1: "Até 10 kg",
    2: "Entre 10 e 20 kg",
    3: "Acima de 20 kg",
  },
} as const;

// Tabela oficial OWAS de categoria de ação [costas][bracos][pernas][carga]
// Baseada em Karhu et al. (1977) — reproduzida em normas técnicas e literatura de ergonomia.
const TABELA: number[][][][] = [
  // costas 1 — retas
  [
    // braços 1
    [[1,1,1],[1,1,1],[1,1,1],[2,2,2],[2,2,2],[1,1,1],[1,1,1]],
    // braços 2
    [[1,1,1],[1,1,1],[1,1,1],[2,2,2],[2,2,2],[1,1,1],[1,1,1]],
    // braços 3
    [[1,1,1],[1,1,1],[1,1,1],[2,2,3],[2,2,3],[1,1,1],[1,1,1]],
  ],
  // costas 2 — flexionadas
  [
    [[2,2,3],[2,2,3],[2,2,3],[3,3,3],[3,3,3],[2,2,2],[2,3,3]],
    [[2,2,3],[2,2,3],[2,3,3],[3,4,4],[3,4,4],[3,3,4],[2,3,4]],
    [[3,3,4],[2,2,3],[3,3,4],[3,4,4],[4,4,4],[4,4,4],[2,3,4]],
  ],
  // costas 3 — torcidas
  [
    [[1,1,1],[1,1,1],[1,1,2],[3,3,3],[4,4,4],[1,1,1],[1,1,1]],
    [[2,2,3],[2,2,3],[2,3,3],[3,4,4],[4,4,4],[3,3,4],[2,3,4]],
    [[2,2,3],[3,3,4],[3,4,4],[4,4,4],[4,4,4],[4,4,4],[2,3,4]],
  ],
  // costas 4 — flexionadas e torcidas
  [
    [[2,3,3],[2,3,3],[3,3,4],[4,4,4],[4,4,4],[4,4,4],[2,3,4]],
    [[3,3,4],[3,3,4],[3,4,4],[4,4,4],[4,4,4],[4,4,4],[2,3,4]],
    [[4,4,4],[4,4,4],[4,4,4],[4,4,4],[4,4,4],[4,4,4],[3,3,4]],
  ],
];

export function calcularOwas(i: OwasInput): ResultadoErgonomico {
  const categoria = TABELA[i.costas - 1][i.bracos - 1][i.pernas - 1][i.carga - 1];
  const codigo = `${i.costas}${i.bracos}${i.pernas}${i.carga}`;

  let classificacao = "";
  let nivel_acao = "";
  let recomendacoes = "";
  switch (categoria) {
    case 1:
      classificacao = "Categoria 1 — Postura normal";
      nivel_acao = "Não são necessárias medidas corretivas.";
      recomendacoes =
        "A postura observada não representa risco relevante ao sistema musculoesquelético. " +
        "Manter as condições atuais do posto e reavaliar em caso de alteração do processo ou dos ciclos de trabalho.";
      break;
    case 2:
      classificacao = "Categoria 2 — Postura com risco leve";
      nivel_acao = "São necessárias medidas corretivas em um futuro próximo.";
      recomendacoes =
        "Planejar melhorias no posto de trabalho no médio prazo: ajuste de alturas, aproximação dos materiais, " +
        "revisão de acessos e introdução de pausas ativas. Reavaliar após implantação.";
      break;
    case 3:
      classificacao = "Categoria 3 — Postura com risco elevado";
      nivel_acao = "São necessárias medidas corretivas o mais rápido possível.";
      recomendacoes =
        "Implementar correções ergonômicas em curto prazo: mecanização de transporte, ajuste de bancadas, " +
        "eliminação de flexões e torções de tronco, revisão do ciclo e do rodízio. Reavaliar em até 60 dias.";
      break;
    default:
      classificacao = "Categoria 4 — Postura com risco muito elevado";
      nivel_acao = "São necessárias medidas corretivas imediatas.";
      recomendacoes =
        "Interromper a exposição às posturas críticas identificadas e redesenhar imediatamente o posto de trabalho: " +
        "eliminar torções e flexões extremas de tronco, prover meios mecânicos para movimentação de cargas e " +
        "revisar o processo produtivo. Acompanhar clinicamente os trabalhadores expostos.";
  }

  return {
    escore_final: categoria,
    classificacao,
    nivel_acao,
    recomendacoes,
    memoria_calculo: [
      { etapa: "Costas", valor: i.costas, detalhe: OWAS_LABELS.costas[i.costas] },
      { etapa: "Braços", valor: i.bracos, detalhe: OWAS_LABELS.bracos[i.bracos] },
      { etapa: "Pernas", valor: i.pernas, detalhe: OWAS_LABELS.pernas[i.pernas] },
      { etapa: "Carga manipulada", valor: i.carga, detalhe: OWAS_LABELS.carga[i.carga] },
      { etapa: "Código OWAS", valor: codigo, detalhe: "Costas • Braços • Pernas • Carga" },
      { etapa: "Categoria de ação", valor: categoria, detalhe: classificacao },
    ],
  };
}
