/**
 * ROSA — Rapid Office Strain Assessment (Sonne, Villalta & Andrews, 2012).
 * Tabelas A–E e pontuações de elementos conforme metodologia original /
 * Diego-Mas (Ergonautas, UPV).
 */
import type { ResultadoErgonomico } from "./types";

/** Tempo de uso diário: −1 / 0 / +1 (Tabela 7). */
export type RosaDuracao = -1 | 0 | 1;

export type RosaInput = {
  // Cadeira — altura do assento
  alturaAssento: 1 | 2 | 3; // 1: joelhos ~90°; 2: muito baixo ou muito alto; 3: pés sem contato
  alturaEspacoInsuficiente: boolean; // +1
  alturaNaoRegulavel: boolean; // +1

  // Profundidade
  profundidadeAssento: 1 | 2; // 1: ~8 cm; 2: muito longo ou muito curto
  profundidadeNaoRegulavel: boolean; // +1

  // Apoio de braços
  apoioBracos: 1 | 2; // 1: cotovelos alinhados; 2: muito altos ou muito baixos
  apoioMuitoSeparados: boolean; // +1
  apoioSuperficieDura: boolean; // +1
  apoioNaoAjustavel: boolean; // +1

  // Encosto
  encosto: 1 | 2; // 1: 95–110° + lombar; 2: ângulo inadequado, sem lombar ou sem uso
  encostoSuperficieAlta: boolean; // +1 ombros encolhidos
  encostoNaoAjustavel: boolean; // +1

  duracaoCadeira: RosaDuracao;

  // Monitor
  monitor: 1 | 2 | 3; // 1: 45–75 cm / topo ao nível dos olhos; 2: muito baixo; 3: muito alto
  monitorGiroPescoco: boolean; // +1
  monitorSemAtril: boolean; // +1
  monitorBrilho: boolean; // +1
  monitorMuitoLonge: boolean; // +1 só se monitor muito baixo
  duracaoMonitor: RosaDuracao;

  // Telefone
  telefone: 1 | 2; // 1: headset/uma mão + pescoço neutro ≤30 cm; 2: longe >30 cm
  telefoneOmbroPescoco: boolean; // +2
  telefoneSemMaosLivres: boolean; // +1
  duracaoTelefone: RosaDuracao;

  // Mouse
  mouse: 1 | 2; // 1: alinhado ao ombro; 2: desalinhado / longe
  mousePinça: boolean; // +1
  mouseAlturaDiferente: boolean; // +2
  mousePressao: boolean; // +1
  duracaoMouse: RosaDuracao;

  // Teclado
  teclado: 1 | 2; // 1: punhos retos; 2: extensão >15°
  tecladoDesvio: boolean; // +1
  tecladoMuitoAlto: boolean; // +1
  tecladoAlcanceAlto: boolean; // +1
  tecladoNaoAjustavel: boolean; // +1
  duracaoTeclado: RosaDuracao;
};

export const ROSA_DURACAO_LABELS: Record<RosaDuracao, string> = {
  [-1]: "Menos de 1 h no total ou menos de 30 min ininterruptos (−1)",
  0: "Entre 1 e 4 h no total ou entre 30 min e 1 h ininterrupta (0)",
  1: "Mais de 4 h ou mais de 1 h ininterrupta (+1)",
};

/** Tabela A — Altura+Prof. (linhas 2–8) × Apoios+Encosto (colunas 2–9). */
const TABELA_A: number[][] = [
  // cols: 2  3  4  5  6  7  8  9
  [2, 2, 3, 4, 5, 6, 7, 8], // 2
  [2, 2, 3, 4, 5, 6, 7, 8], // 3
  [3, 3, 3, 4, 5, 6, 7, 8], // 4
  [4, 4, 4, 4, 5, 6, 7, 8], // 5
  [5, 5, 5, 5, 6, 7, 8, 9], // 6
  [6, 6, 6, 7, 7, 8, 8, 9], // 7
  [7, 7, 7, 8, 8, 9, 9, 9], // 8
];

/** Tabela B — Telefone (0–6) × Monitor (0–7). */
const TABELA_B: number[][] = [
  [1, 1, 1, 2, 3, 4, 5, 6],
  [1, 1, 2, 2, 3, 4, 5, 6],
  [1, 2, 2, 3, 3, 4, 6, 7],
  [2, 2, 3, 3, 4, 5, 6, 8],
  [3, 3, 4, 4, 5, 6, 7, 8],
  [4, 4, 5, 5, 6, 7, 8, 9],
  [5, 5, 6, 7, 8, 8, 9, 9],
];

/** Tabela C — Mouse (0–7) × Teclado (0–7). */
const TABELA_C: number[][] = [
  [1, 1, 1, 2, 3, 4, 5, 6],
  [1, 1, 2, 3, 4, 5, 6, 7],
  [1, 2, 2, 3, 4, 5, 6, 7],
  [2, 3, 3, 3, 5, 6, 7, 8],
  [3, 4, 4, 5, 5, 6, 7, 8],
  [4, 5, 5, 6, 6, 7, 8, 9],
  [5, 6, 6, 7, 7, 8, 8, 9],
  [6, 7, 7, 8, 8, 9, 9, 9],
];

/** Tabela D — B (1–9) × C (1–9). */
const TABELA_D: number[][] = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [2, 2, 3, 4, 5, 6, 7, 8, 9],
  [3, 3, 3, 4, 5, 6, 7, 8, 9],
  [4, 4, 4, 4, 5, 6, 7, 8, 9],
  [5, 5, 5, 5, 5, 6, 7, 8, 9],
  [6, 6, 6, 6, 6, 6, 7, 8, 9],
  [7, 7, 7, 7, 7, 7, 7, 8, 9],
  [8, 8, 8, 8, 8, 8, 8, 8, 9],
  [9, 9, 9, 9, 9, 9, 9, 9, 9],
];

/** Tabela E — Silla (1–10) × Periféricos (1–10). */
const TABELA_E: number[][] = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [2, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [3, 3, 3, 4, 5, 6, 7, 8, 9, 10],
  [4, 4, 4, 4, 5, 6, 7, 8, 9, 10],
  [5, 5, 5, 5, 5, 6, 7, 8, 9, 10],
  [6, 6, 6, 6, 6, 6, 7, 8, 9, 10],
  [7, 7, 7, 7, 7, 7, 7, 8, 9, 10],
  [8, 8, 8, 8, 8, 8, 8, 8, 9, 10],
  [9, 9, 9, 9, 9, 9, 9, 9, 9, 10],
  [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
];

const cap = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function lookup2d(table: number[][], row: number, col: number, rowMin: number, colMin: number) {
  const r = cap(row, rowMin, rowMin + table.length - 1) - rowMin;
  const c = cap(col, colMin, colMin + table[0].length - 1) - colMin;
  return table[r][c];
}

export function calcularRosa(i: RosaInput): ResultadoErgonomico {
  let altura = i.alturaAssento;
  if (i.alturaEspacoInsuficiente) altura += 1;
  if (i.alturaNaoRegulavel) altura += 1;

  let profundidade = i.profundidadeAssento;
  if (i.profundidadeNaoRegulavel) profundidade += 1;

  let apoio = i.apoioBracos;
  if (i.apoioMuitoSeparados) apoio += 1;
  if (i.apoioSuperficieDura) apoio += 1;
  if (i.apoioNaoAjustavel) apoio += 1;

  let encosto = i.encosto;
  if (i.encostoSuperficieAlta) encosto += 1;
  if (i.encostoNaoAjustavel) encosto += 1;

  const eixoAltProf = altura + profundidade; // 2–8 típico
  const eixoApoioEnc = apoio + encosto; // 2–9 típico
  const tabelaA = lookup2d(TABELA_A, eixoAltProf, eixoApoioEnc, 2, 2);
  const pontuacaoSilla = cap(tabelaA + i.duracaoCadeira, 1, 10);

  let monitor = i.monitor;
  if (i.monitorGiroPescoco) monitor += 1;
  if (i.monitorSemAtril) monitor += 1;
  if (i.monitorBrilho) monitor += 1;
  if (i.monitorMuitoLonge && i.monitor === 2) monitor += 1;
  const pontMonitor = monitor + i.duracaoMonitor;

  let telefone = i.telefone;
  if (i.telefoneOmbroPescoco) telefone += 2;
  if (i.telefoneSemMaosLivres) telefone += 1;
  const pontTelefone = telefone + i.duracaoTelefone;

  const tabelaB = lookup2d(
    TABELA_B,
    cap(pontTelefone, 0, 6),
    cap(pontMonitor, 0, 7),
    0,
    0,
  );

  let mouse = i.mouse;
  if (i.mousePinça) mouse += 1;
  if (i.mouseAlturaDiferente) mouse += 2;
  if (i.mousePressao) mouse += 1;
  const pontMouse = mouse + i.duracaoMouse;

  let teclado = i.teclado;
  if (i.tecladoDesvio) teclado += 1;
  if (i.tecladoMuitoAlto) teclado += 1;
  if (i.tecladoAlcanceAlto) teclado += 1;
  if (i.tecladoNaoAjustavel) teclado += 1;
  const pontTeclado = teclado + i.duracaoTeclado;

  const tabelaC = lookup2d(
    TABELA_C,
    cap(pontMouse, 0, 7),
    cap(pontTeclado, 0, 7),
    0,
    0,
  );

  const periferico = lookup2d(TABELA_D, tabelaB, tabelaC, 1, 1);
  const escore = lookup2d(TABELA_E, pontuacaoSilla, periferico, 1, 1);

  const { classificacao, nivel_acao, recomendacoes } = classificarRosa(escore);

  return {
    escore_final: escore,
    classificacao,
    nivel_acao,
    recomendacoes,
    memoria_calculo: [
      { etapa: "Altura do assento (ajustada)", valor: altura },
      { etapa: "Profundidade do assento (ajustada)", valor: profundidade },
      { etapa: "Apoio para braços (ajustado)", valor: apoio },
      { etapa: "Encosto (ajustado)", valor: encosto },
      { etapa: "Eixo Altura+Profundidade", valor: eixoAltProf },
      { etapa: "Eixo Apoios+Encosto", valor: eixoApoioEnc },
      { etapa: "Tabela A (cadeira base)", valor: tabelaA },
      { etapa: "Duração cadeira", valor: i.duracaoCadeira },
      { etapa: "Pontuação da cadeira", valor: pontuacaoSilla },
      { etapa: "Monitor + duração", valor: pontMonitor },
      { etapa: "Telefone + duração", valor: pontTelefone },
      { etapa: "Tabela B (monitor/telefone)", valor: tabelaB },
      { etapa: "Mouse + duração", valor: pontMouse },
      { etapa: "Teclado + duração", valor: pontTeclado },
      { etapa: "Tabela C (mouse/teclado)", valor: tabelaC },
      { etapa: "Tabela D (periféricos)", valor: periferico },
      { etapa: "Pontuação final ROSA (Tabela E)", valor: escore },
    ],
  };
}

function classificarRosa(escore: number) {
  if (escore <= 1) {
    return {
      classificacao: "Risco inapreciável (Nível 0)",
      nivel_acao: "Nível 0 — não é necessária atuação.",
      recomendacoes: "Manter as condições atuais do posto e reavaliar em caso de alteração do mobiliário ou da jornada.",
    };
  }
  if (escore <= 4) {
    return {
      classificacao: "Risco melhorável (Nível 1)",
      nivel_acao: "Nível 1 — podem melhorar-se alguns elementos do posto.",
      recomendacoes:
        "Ajustar altura/profundidade da cadeira, apoio lombar, posição do monitor e periféricos. Documentar melhorias e reavaliar.",
    };
  }
  if (escore === 5) {
    return {
      classificacao: "Risco alto (Nível 2)",
      nivel_acao: "Nível 2 — é necessária a atuação.",
      recomendacoes:
        "Intervir no posto (cadeira, superfície, monitor e periféricos). Priorizar os elementos com maior pontuação parcial.",
    };
  }
  if (escore <= 8) {
    return {
      classificacao: "Risco muito alto (Nível 3)",
      nivel_acao: "Nível 3 — é necessária a atuação o quanto antes.",
      recomendacoes:
        "Redesenhar o posto com urgência: ajustar cadeira e periféricos, reduzir tempos contínuos e introduzir pausas ativas.",
    };
  }
  return {
    classificacao: "Risco extremo (Nível 4)",
    nivel_acao: "Nível 4 — é necessária a atuação urgentemente.",
    recomendacoes:
      "Intervenção imediata no posto de escritório. Suspender exposição prolongada até correção dos elementos críticos identificados.",
  };
}

export const ROSA_DEFAULT: RosaInput = {
  alturaAssento: 1,
  alturaEspacoInsuficiente: false,
  alturaNaoRegulavel: false,
  profundidadeAssento: 1,
  profundidadeNaoRegulavel: false,
  apoioBracos: 1,
  apoioMuitoSeparados: false,
  apoioSuperficieDura: false,
  apoioNaoAjustavel: false,
  encosto: 1,
  encostoSuperficieAlta: false,
  encostoNaoAjustavel: false,
  duracaoCadeira: 0,
  monitor: 1,
  monitorGiroPescoco: false,
  monitorSemAtril: false,
  monitorBrilho: false,
  monitorMuitoLonge: false,
  duracaoMonitor: 0,
  telefone: 1,
  telefoneOmbroPescoco: false,
  telefoneSemMaosLivres: false,
  duracaoTelefone: -1,
  mouse: 1,
  mousePinça: false,
  mouseAlturaDiferente: false,
  mousePressao: false,
  duracaoMouse: 0,
  teclado: 1,
  tecladoDesvio: false,
  tecladoMuitoAlto: false,
  tecladoAlcanceAlto: false,
  tecladoNaoAjustavel: false,
  duracaoTeclado: 0,
};
