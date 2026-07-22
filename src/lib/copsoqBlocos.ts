// Constante isolada em módulo-folha para evitar dependência circular entre
// PsicossocialModal.tsx → PsicossocialImportModal.tsx → psicoImport.ts →
// (voltando para) PsicossocialModal.tsx. O ciclo causava TDZ:
// "Cannot access 'BLOCOS_COPSOQ' before initialization" e deixava a Homepage em branco.

export const BLOCOS_COPSOQ: { key: string; titulo: string; perguntas: string[] }[] = [
  {
    key: "exigencias",
    titulo: "Exigências",
    perguntas: [
      "O ritmo de trabalho é elevado?",
      "Há acúmulo de tarefas?",
      "Você precisa trabalhar muito rápido?",
      "Há sobrecarga emocional na função?",
    ],
  },
  {
    key: "controle",
    titulo: "Controle",
    perguntas: [
      "Você tem autonomia sobre o ritmo de trabalho?",
      "Pode decidir como executar suas tarefas?",
      "Pode fazer pausas quando precisa?",
    ],
  },
  {
    key: "apoio",
    titulo: "Apoio",
    perguntas: [
      "Recebe apoio dos colegas quando precisa?",
      "Recebe apoio da liderança?",
      "Sente-se parte da equipe?",
    ],
  },
  {
    key: "reconhecimento",
    titulo: "Reconhecimento",
    perguntas: [
      "Seu trabalho é reconhecido pela liderança?",
      "Recebe feedback construtivo?",
      "Sua remuneração é compatível com a função?",
    ],
  },
  {
    key: "seguranca",
    titulo: "Segurança",
    perguntas: [
      "Sente-se seguro quanto à manutenção do emprego?",
      "Há clareza sobre as mudanças na empresa?",
      "Há previsibilidade na rotina de trabalho?",
    ],
  },
  {
    key: "conflitos",
    titulo: "Conflitos",
    perguntas: [
      "Existem conflitos interpessoais frequentes?",
      "Já sofreu ou presenciou assédio moral?",
      "Sente conflito entre vida pessoal e trabalho?",
    ],
  },
  {
    key: "sintomas",
    titulo: "Sintomas",
    perguntas: [
      "Sente cansaço excessivo após o trabalho?",
      "Tem dificuldade para dormir por causa do trabalho?",
      "Sente irritabilidade ou ansiedade frequente?",
      "Tem dores de cabeça relacionadas à rotina?",
    ],
  },
];
