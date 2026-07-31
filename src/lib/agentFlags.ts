/**
 * Identificação automática de agentes de risco para o gerador de documentos.
 *
 * Mesmo comportamento da variável {{#is_calor}}: cada agente cadastrado no
 * GHE/Setor liga uma flag booleana `is_*`. Quando o agente não existe, a flag
 * é `false` e o bloco correspondente não é renderizado no template.
 *
 * ESCALÁVEL: para adicionar um novo agente, basta incluir uma nova entrada em
 * AGENT_FLAG_MAP — nenhuma outra parte do sistema precisa mudar.
 */

export const normalizeAgente = (nome: any): string =>
  String(nome ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export interface AgentFlagDef {
  /** Nome da variável exposta ao template (sem acentos/espaços). */
  flag: string;
  /** Trechos que, se presentes no nome do agente, ativam a flag. */
  matchers: string[];
}

export const AGENT_FLAG_MAP: AgentFlagDef[] = [
  {
    flag: "is_poeirarespiravel_silicalivre",
    matchers: [
      "poeira respiravel",
      "silica livre",
      "silica livre cristalina",
      "silica cristalina",
      "silica",
    ],
  },
  { flag: "is_vaporesorganicos", matchers: ["vapores organicos", "vapor organico", "vapores organico"] },
  { flag: "is_solventesorganicos", matchers: ["solventes organicos", "solvente organico", "solventes"] },
  { flag: "is_acidosulfurico", matchers: ["acido sulfurico", "h2so4"] },
  { flag: "is_poeirademadeira", matchers: ["poeira de madeira", "poeira madeira", "po de madeira"] },
  { flag: "is_dioxidodetitanio", matchers: ["dioxido de titanio", "dioxido titanio", "tio2"] },
  {
    flag: "is_fumosmetalicos",
    matchers: ["fumos metalicos", "fumo metalico", "fumos metalico", "fumos de solda", "fumos metalurgicos"],
  },
  {
    flag: "is_poeirasmetalicas",
    matchers: ["poeiras metalicas", "poeira metalica", "poeiras metalica", "particulados metalicos", "po metalico"],
  },
];

export const AGENT_FLAG_KEYS = AGENT_FLAG_MAP.map((d) => d.flag);

/** Flags de um único agente (todas as chaves presentes: true/false). */
export const buildAgentFlags = (agenteNome: any): Record<string, boolean> => {
  const n = normalizeAgente(agenteNome);
  const compact = n.replace(/[^a-z0-9]/g, "");
  const out: Record<string, boolean> = {};
  for (const def of AGENT_FLAG_MAP) {
    out[def.flag] = def.matchers.some((m) => {
      const mn = normalizeAgente(m);
      return n.includes(mn) || compact.includes(mn.replace(/[^a-z0-9]/g, ""));
    });
  }
  return out;
};

/**
 * Agrega as flags de uma lista de riscos do GHE/Setor.
 * Retorna true para o agente que existir em pelo menos um risco do setor.
 */
export const aggregateAgentFlags = (riscos: any[]): Record<string, boolean> => {
  const out: Record<string, boolean> = {};
  AGENT_FLAG_KEYS.forEach((k) => (out[k] = false));
  (riscos || []).forEach((r: any) => {
    const flags = buildAgentFlags(r?.agente_nome ?? r?.agente ?? r);
    AGENT_FLAG_KEYS.forEach((k) => {
      if (flags[k] || r?.[k] === true) out[k] = true;
    });
  });
  return out;
};
