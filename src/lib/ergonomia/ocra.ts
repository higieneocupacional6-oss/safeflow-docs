/**
 * OCRA — Occupational Repetitive Actions (Colombini & Occhipinti).
 *
 * Modalidades:
 * - Checklist: ICKL = (FR + FF + FFz + FP + FC) × MD
 *   Tabelas oficiais (versão clássica / Ergonautas — Diego-Mas, UPV).
 * - Índice: IE = ATA / RTA = Fobs / (CF × Ff × Fp × Fa × Fr × Fd)
 *   CF = 30 ações/min (ISO 11228-3 / EN 1005-5).
 */
import type { ResultadoErgonomico } from "./types";

export type OcraModalidade = "checklist" | "indice";

export type OcraLado = "direito" | "esquerdo" | "ambos_pior";

export type OcraChecklistInput = {
  modalidade: "checklist";
  lado: OcraLado;
  /** Duração do turno no posto (min). */
  duracaoTurnoMin: number;
  /** Trabalho não repetitivo (min). */
  trabalhoNaoRepetitivoMin: number;
  /** Pausas oficiais/não oficiais (min). */
  pausasMin: number;
  /** Almoço incluso no turno (min). */
  almocoMin: number;
  /** FR — cenários oficiais (0, 2, 3, 4, 6, 10). */
  fr: 0 | 2 | 3 | 4 | 6 | 10;
  /** ATD — ações dinâmicas (0–10). */
  atd: 0 | 1 | 3 | 4 | 6 | 8 | 10;
  /** ATE — ações estáticas (0, 2.5, 4.5). */
  ate: 0 | 2.5 | 4.5;
  /** Força moderada (Borg 3–4): 0 | 2 | 4 | 6 | 8 */
  forcaModerada: 0 | 2 | 4 | 6 | 8;
  /** Força intensa (Borg 5–7): 0 | 4 | 8 | 16 | 24 */
  forcaIntensa: 0 | 4 | 8 | 16 | 24;
  /** Força quase máxima (Borg ≥8): 0 | 6 | 12 | 24 | 32 */
  forcaQuaseMaxima: 0 | 6 | 12 | 24 | 32;
  /** Ombro PHo */
  ombro: 0 | 1 | 2 | 6 | 12 | 24;
  /** Mãos acima da cabeça → duplica ombro */
  maosAcimaCabeca: boolean;
  /** Cotovelo PCo */
  cotovelo: 0 | 2 | 4 | 8;
  /** Punho PMu */
  punho: 0 | 2 | 4 | 8;
  /** Mão (pinça/gancho/palmar) PMa */
  mao: 0 | 2 | 4 | 8;
  /** Estereotipia PEs */
  estereotipia: 0 | 1.5 | 3;
  /** Físico-mecânicos Ffm */
  fisicoMecanico: 0 | 2 | 3;
  /** Socio-organizativos Fso */
  socioOrganizativo: 0 | 1 | 2;
};

export type OcraIndiceInput = {
  modalidade: "indice";
  lado: OcraLado;
  /** Ações técnicas observadas no ciclo. */
  acoesTecnicasCiclo: number;
  /** Tempo de ciclo observado (s). */
  tempoCicloSeg: number;
  /** Tempo líquido de trabalho repetitivo (min). */
  tntrMin: number;
  /**
   * Multiplicadores oficiais (0–1), conforme ISO 11228-3 / Colombini.
   * Valor 1 = condição ideal (sem penalidade).
   */
  Ff: number; // força
  Fp: number; // postura
  Fa: number; // fatores adicionais
  Fr: number; // recuperação
  Fd: number; // duração do turno / repetitividade
};

export type OcraInput = OcraChecklistInput | OcraIndiceInput;

const CF = 30; // ações técnicas/min recomendadas (constante de frequência)

export function multiplicadorDuracao(tntrMin: number): number {
  const t = tntrMin;
  if (t <= 0) return 0;
  if (t <= 1.87) return 0.01;
  if (t <= 3.75) return 0.02;
  if (t <= 7.5) return 0.05;
  if (t <= 15) return 0.1;
  if (t <= 30) return 0.2;
  if (t <= 59) return 0.35;
  if (t <= 120) return 0.5;
  if (t <= 180) return 0.65;
  if (t <= 240) return 0.75;
  if (t <= 300) return 0.85;
  if (t <= 360) return 0.925;
  if (t <= 420) return 0.95;
  if (t <= 480) return 1;
  if (t <= 539) return 1.2;
  if (t <= 599) return 1.5;
  if (t <= 659) return 2;
  if (t <= 719) return 2.8;
  return 4;
}

function classificarChecklist(ickl: number) {
  if (ickl <= 5) {
    return {
      classificacao: "Ótimo",
      nivel_acao: "Não se requer intervenção.",
      recomendacoes: "Manter as condições atuais e monitorar alterações de ciclo, força ou organização das pausas.",
      ieEquiv: "≤ 1,5",
    };
  }
  if (ickl <= 7.5) {
    return {
      classificacao: "Aceitável",
      nivel_acao: "Não se requer intervenção.",
      recomendacoes: "Manter boas práticas e reavaliar se houver aumento de frequência, força ou redução de pausas.",
      ieEquiv: "1,6 – 2,2",
    };
  }
  if (ickl <= 11) {
    return {
      classificacao: "Incerto / muito leve",
      nivel_acao: "Recomenda-se nova análise ou melhoria do posto.",
      recomendacoes: "Revisar frequência, estereotipia e distribuição de pausas. Considerar Índice OCRA analítico se a exposição persistir.",
      ieEquiv: "2,3 – 3,5",
    };
  }
  if (ickl <= 14) {
    return {
      classificacao: "Inaceitável leve",
      nivel_acao: "Melhoria do posto, supervisão médica e treinamento.",
      recomendacoes: "Reduzir ações/minuto, eliminar posturas extremas e reforçar recuperação muscular a cada hora.",
      ieEquiv: "3,6 – 4,5",
    };
  }
  if (ickl <= 22.5) {
    return {
      classificacao: "Inaceitável médio",
      nivel_acao: "Melhoria do posto, supervisão médica e treinamento.",
      recomendacoes: "Redesenhar o ciclo (força, postura e fatores adicionais). Introduzir rodízio e pausas efetivas (≥8–10 min/h).",
      ieEquiv: "4,6 – 9",
    };
  }
  return {
    classificacao: "Inaceitável alto",
    nivel_acao: "Melhoria do posto, supervisão médica e treinamento — prioridade alta.",
    recomendacoes: "Intervenção imediata na organização do trabalho e nas exigências biomecânicas dos membros superiores.",
    ieEquiv: "> 9",
  };
}

function classificarIndice(ie: number) {
  if (ie <= 1.5) {
    return {
      classificacao: "Verde — aceitável",
      nivel_acao: "Não se requer intervenção.",
      recomendacoes: "Manter condições atuais e monitorar mudanças de produção.",
    };
  }
  if (ie <= 2.2) {
    return {
      classificacao: "Amarelo — muito baixo / limítrofe",
      nivel_acao: "Monitorar e considerar melhorias preventivas.",
      recomendacoes: "Avaliar pausas, força e posturas para evitar progressão do risco.",
    };
  }
  if (ie <= 3.5) {
    return {
      classificacao: "Vermelho leve — risco baixo",
      nivel_acao: "Melhorias recomendadas no posto e na organização.",
      recomendacoes: "Reduzir frequência efetiva e melhorar recuperação/postura.",
    };
  }
  if (ie <= 4.5) {
    return {
      classificacao: "Vermelho — risco médio",
      nivel_acao: "Intervenção, supervisão médica e treinamento.",
      recomendacoes: "Redesenhar ações técnicas, reduzir força e estereotipia, reforçar pausas.",
    };
  }
  if (ie <= 9) {
    return {
      classificacao: "Roxo — risco alto",
      nivel_acao: "Intervenção prioritária com acompanhamento médico.",
      recomendacoes: "Reprojetar o ciclo e a organização do turno; reduzir ATA ou elevar RTA via multiplicadores.",
    };
  }
  return {
    classificacao: "Roxo — risco muito alto",
    nivel_acao: "Intervenção imediata.",
    recomendacoes: "Suspender ou redesenhar a tarefa repetitiva até reduzir o índice para faixa aceitável.",
  };
}

function calcChecklist(i: OcraChecklistInput): ResultadoErgonomico {
  const tntr = Math.max(
    0,
    i.duracaoTurnoMin - i.trabalhoNaoRepetitivoMin - i.pausasMin - i.almocoMin,
  );
  const md = multiplicadorDuracao(tntr);
  const ff = Math.max(i.atd, i.ate);
  const ffz = i.forcaModerada + i.forcaIntensa + i.forcaQuaseMaxima;
  const pho = i.maosAcimaCabeca ? i.ombro * 2 : i.ombro;
  const fp = Math.max(pho, i.cotovelo, i.punho, i.mao) + i.estereotipia;
  const fc = i.fisicoMecanico + i.socioOrganizativo;
  const soma = i.fr + ff + ffz + fp + fc;
  const ickl = Math.round(soma * md * 100) / 100;
  const cls = classificarChecklist(ickl);

  return {
    escore_final: ickl,
    classificacao: cls.classificacao,
    nivel_acao: cls.nivel_acao,
    recomendacoes: `${cls.recomendacoes} Índice OCRA equivalente (correlação oficial): ${cls.ieEquiv}.`,
    memoria_calculo: [
      { etapa: "Modalidade", valor: "Checklist OCRA" },
      { etapa: "Lado avaliado", valor: i.lado },
      { etapa: "TNTR (min)", valor: tntr, detalhe: "DT − (TNR + pausas + almoço)" },
      { etapa: "MD (multiplicador de duração)", valor: md },
      { etapa: "FR (recuperação)", valor: i.fr },
      { etapa: "FF = max(ATD, ATE)", valor: ff, detalhe: `ATD=${i.atd}; ATE=${i.ate}` },
      { etapa: "FFz (força)", valor: ffz },
      { etapa: "FP (postura + estereotipia)", valor: fp, detalhe: `max(ombro,cotovelo,punho,mão)+PEs` },
      { etapa: "FC (complementares)", valor: fc },
      { etapa: "Soma dos fatores", valor: soma },
      { etapa: "ICKL = (FR+FF+FFz+FP+FC)×MD", valor: ickl },
      { etapa: "Índice OCRA equivalente", valor: cls.ieEquiv },
    ],
  };
}

function clampMul(n: number, max = 1) {
  if (!Number.isFinite(n) || n <= 0) return 0.01;
  return Math.min(max, n);
}

function calcIndice(i: OcraIndiceInput): ResultadoErgonomico {
  const Tc = Math.max(0.1, i.tempoCicloSeg);
  const nAT = Math.max(0, i.acoesTecnicasCiclo);
  const fObs = (nAT * 60) / Tc; // ações/min
  const Ff = clampMul(i.Ff);
  const Fp = clampMul(i.Fp);
  const Fa = clampMul(i.Fa);
  const Fr = clampMul(i.Fr);
  const Fd = clampMul(i.Fd, 1.5);
  const rtaMin = CF * Ff * Fp * Fa * Fr * Fd;
  const ie = rtaMin > 0 ? Math.round((fObs / rtaMin) * 100) / 100 : 99;
  const ata = Math.round(fObs * i.tntrMin);
  const rta = Math.round(rtaMin * i.tntrMin);
  const cls = classificarIndice(ie);

  return {
    escore_final: ie,
    classificacao: cls.classificacao,
    nivel_acao: cls.nivel_acao,
    recomendacoes: cls.recomendacoes,
    memoria_calculo: [
      { etapa: "Modalidade", valor: "Índice OCRA" },
      { etapa: "Lado avaliado", valor: i.lado },
      { etapa: "Ações técnicas / ciclo", valor: nAT },
      { etapa: "Tempo de ciclo (s)", valor: Tc },
      { etapa: "Frequência observada (ações/min)", valor: Math.round(fObs * 100) / 100 },
      { etapa: "CF (constante)", valor: CF },
      { etapa: "Ff (força)", valor: Ff },
      { etapa: "Fp (postura)", valor: Fp },
      { etapa: "Fa (adicionais)", valor: Fa },
      { etapa: "Fr (recuperação)", valor: Fr },
      { etapa: "Fd (duração)", valor: Fd },
      { etapa: "RTA por minuto", valor: Math.round(rtaMin * 100) / 100 },
      { etapa: "ATA (turno)", valor: ata },
      { etapa: "RTA (turno)", valor: rta },
      { etapa: "IE = ATA/RTA", valor: ie },
    ],
  };
}

export function calcularOcra(i: OcraInput): ResultadoErgonomico {
  if (i.modalidade === "indice") return calcIndice(i);
  return calcChecklist(i);
}

export const OCRA_CHECKLIST_DEFAULT: OcraChecklistInput = {
  modalidade: "checklist",
  lado: "direito",
  duracaoTurnoMin: 480,
  trabalhoNaoRepetitivoMin: 0,
  pausasMin: 30,
  almocoMin: 0,
  fr: 4,
  atd: 1,
  ate: 0,
  forcaModerada: 0,
  forcaIntensa: 0,
  forcaQuaseMaxima: 0,
  ombro: 0,
  maosAcimaCabeca: false,
  cotovelo: 0,
  punho: 0,
  mao: 0,
  estereotipia: 0,
  fisicoMecanico: 0,
  socioOrganizativo: 0,
};

export const OCRA_INDICE_DEFAULT: OcraIndiceInput = {
  modalidade: "indice",
  lado: "direito",
  acoesTecnicasCiclo: 20,
  tempoCicloSeg: 60,
  tntrMin: 420,
  Ff: 1,
  Fp: 1,
  Fa: 1,
  Fr: 1,
  Fd: 1,
};

/** Multiplicadores de força (Índice) — Borg CR-10 → Ff (Colombini / ISO 11228-3). */
export const OCRA_FF_OPTIONS: { label: string; value: number }[] = [
  { label: "Força leve / ausente (Borg ≤2) — Ff = 1,0", value: 1 },
  { label: "Força moderada ~1/3 do tempo (Borg 3–4) — Ff = 0,85", value: 0.85 },
  { label: "Força moderada ~½ do tempo — Ff = 0,65", value: 0.65 },
  { label: "Força moderada >½ do tempo — Ff = 0,35", value: 0.35 },
  { label: "Força intensa (Borg 5–6) — Ff = 0,2", value: 0.2 },
  { label: "Força quase máxima (Borg ≥7) — Ff = 0,01", value: 0.01 },
];

export const OCRA_FP_OPTIONS: { label: string; value: number }[] = [
  { label: "Posturas adequadas — Fp = 1,0", value: 1 },
  { label: "Postura inadequada ~1/3 do tempo — Fp = 0,7", value: 0.7 },
  { label: "Postura inadequada ~½ do tempo — Fp = 0,6", value: 0.6 },
  { label: "Postura inadequada >⅔ do tempo — Fp = 0,5", value: 0.5 },
  { label: "Postura extrema quase todo o tempo — Fp = 0,3", value: 0.3 },
];

export const OCRA_FA_OPTIONS: { label: string; value: number }[] = [
  { label: "Sem fatores adicionais — Fa = 1,0", value: 1 },
  { label: "Fator adicional presente ~1/3 do tempo — Fa = 0,95", value: 0.95 },
  { label: "Fator adicional ~½ do tempo — Fa = 0,9", value: 0.9 },
  { label: "Fatores adicionais quase todo o tempo — Fa = 0,8", value: 0.8 },
];

export const OCRA_FR_OPTIONS: { label: string; value: number }[] = [
  { label: "0 h sem recuperação adequada — Fr = 1,0", value: 1 },
  { label: "1 h sem recuperação — Fr = 0,90", value: 0.9 },
  { label: "2 h sem recuperação — Fr = 0,80", value: 0.8 },
  { label: "3 h sem recuperação — Fr = 0,70", value: 0.7 },
  { label: "4 h sem recuperação — Fr = 0,60", value: 0.6 },
  { label: "5 h sem recuperação — Fr = 0,45", value: 0.45 },
  { label: "6 h sem recuperação — Fr = 0,25", value: 0.25 },
  { label: "7–8 h sem recuperação — Fr = 0,10", value: 0.1 },
];

export const OCRA_FD_OPTIONS: { label: string; value: number }[] = [
  { label: "420–480 min repetitivos — Fd = 1,0", value: 1 },
  { label: "361–420 min — Fd = 0,925", value: 0.925 },
  { label: "301–360 min — Fd = 0,875", value: 0.875 },
  { label: "241–300 min — Fd = 0,75", value: 0.75 },
  { label: "181–240 min — Fd = 0,5", value: 0.5 },
  { label: "120–180 min — Fd = 0,5", value: 0.5 },
  { label: "< 120 min — Fd = 0,5", value: 0.5 },
  { label: "> 480 min — Fd = 1,5", value: 1.5 },
];
