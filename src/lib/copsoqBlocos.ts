// Constante isolada em módulo-folha (evita ciclo com PsicossocialModal / PsicossocialImportModal / psicoImport).
// Cada pergunta possui polaridade explícita:
//   "pos" → resposta alta (Sempre/Frequentemente) é POSITIVA (reduz risco).
//   "neg" → resposta alta é NEGATIVA (aumenta risco).
// Isso é necessário porque, no novo questionário, dentro do mesmo bloco existem perguntas
// com sentidos opostos (ex.: em "Segurança", "estou satisfeito" é positivo e
// "estou preocupado com mudanças" é negativo).

export type BlocoCopsoq = {
  key: string;
  titulo: string;
  perguntas: string[];
  polaridades: ("pos" | "neg")[];
};

export const BLOCOS_COPSOQ: BlocoCopsoq[] = [
  {
    key: "exigencias",
    titulo: "Exigências no trabalho",
    perguntas: [
      "Seu trabalho exige que você trabalhe muito rápido?",
      "Seu trabalho exige prazos muito curtos?",
      "Você precisa tomar decisões difíceis?",
      "Você precisa controlar suas emoções durante o trabalho?",
      "Seu trabalho exige lidar com conflitos entre pessoas?",
    ],
    polaridades: ["neg", "neg", "neg", "neg", "neg"],
  },
  {
    key: "controle",
    titulo: "Controle e autonomia",
    perguntas: [
      "Você pode decidir como realizar seu trabalho?",
      "Você tem influência sobre seu ritmo de trabalho?",
      "Você pode fazer pausas quando necessário?",
    ],
    polaridades: ["pos", "pos", "pos"],
  },
  {
    key: "apoio",
    titulo: "Apoio social",
    perguntas: [
      "Você recebe ajuda dos colegas quando precisa?",
      "Os colegas compartilham conhecimentos entre si?",
      "Seu líder apoia você no trabalho?",
    ],
    polaridades: ["pos", "pos", "pos"],
  },
  {
    key: "reconhecimento",
    titulo: "Reconhecimento e recompensa",
    perguntas: [
      "Você acredita que seu trabalho é justamente recompensado?",
      "Você se sente reconhecido pelo que faz?",
      "Você recebe feedback sobre seu desempenho?",
    ],
    polaridades: ["pos", "pos", "pos"],
  },
  {
    key: "seguranca",
    titulo: "Segurança e estabilidade",
    perguntas: [
      "Você se sente seguro quanto à manutenção do seu emprego?",
      "Você está satisfeito com seu trabalho?",
      "Você está preocupado com mudanças que possam afetar sua função?",
    ],
    polaridades: ["pos", "pos", "neg"],
  },
  {
    key: "conflitos",
    titulo: "Conflitos e conduta",
    perguntas: [
      "Você presencia conflitos frequentes no trabalho?",
      "O trabalho interfere na sua vida pessoal?",
      "Você já foi tratado(a) de forma desrespeitosa por um colega/líder?",
      "Você se sente seguro(a) para relatar situações de assédio?",
    ],
    polaridades: ["neg", "neg", "neg", "pos"],
  },
  {
    key: "sintomas",
    titulo: "Sintomas de estresse e fadiga",
    perguntas: [
      "Você tem dificuldade para dormir por causa do trabalho?",
      "Com que frequência você sente fadiga?",
      "Você se sente emocionalmente esgotado após o trabalho?",
      "Você se sente exausto no início da jornada?",
    ],
    polaridades: ["neg", "neg", "neg", "neg"],
  },
  {
    key: "lideranca",
    titulo: "Qualidade da liderança",
    perguntas: [
      "Seu líder trata todos de maneira imparcial?",
      "Seu líder ouve a opinião dos trabalhadores?",
      "Seu líder incentiva o desenvolvimento da equipe?",
    ],
    polaridades: ["pos", "pos", "pos"],
  },
];

/** Retorna a polaridade da pergunta (default "neg" para trás-compatibilidade). */
export function polaridadePergunta(blocoKey: string, perguntaIdx: number): "pos" | "neg" {
  const b = BLOCOS_COPSOQ.find((x) => x.key === blocoKey);
  return b?.polaridades?.[perguntaIdx] || "neg";
}

/** Converte um valor 0–100 para "valor de risco" considerando polaridade. */
export function valorRiscoPergunta(valor: number, blocoKey: string, perguntaIdx: number): number {
  return polaridadePergunta(blocoKey, perguntaIdx) === "pos" ? 100 - valor : valor;
}

/** Retorna as perguntas sem resposta (valor < 0 ou ausente) de uma avaliação. */
export function perguntasPendentes(respostas: Record<string, number[]> | undefined): { blocoKey: string; perguntaIdx: number }[] {
  const out: { blocoKey: string; perguntaIdx: number }[] = [];
  for (const b of BLOCOS_COPSOQ) {
    const arr = respostas?.[b.key] || [];
    for (let i = 0; i < b.perguntas.length; i++) {
      const v = arr[i];
      if (typeof v !== "number" || v < 0) out.push({ blocoKey: b.key, perguntaIdx: i });
    }
  }
  return out;
}

/** Avaliação está completa quando todas as perguntas de todos os blocos foram respondidas. */
export function avaliacaoCompleta(respostas: Record<string, number[]> | undefined): boolean {
  return perguntasPendentes(respostas).length === 0;
}

