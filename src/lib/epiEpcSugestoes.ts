// Biblioteca de sugestões automáticas de EPI/EPC por risco.
// Correlaciona riscos (por nome + tipo) aos equipamentos de proteção
// mais usados, permitindo preenchimento rápido no cadastro de EPI/EPC.

export type SugestaoEpiEpc = { tipo: "EPI" | "EPC"; nome: string };

type Regra = {
  match: (nomeNorm: string, tipoNorm: string) => boolean;
  itens: SugestaoEpiEpc[];
};

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const REGRAS: Regra[] = [
  // ----- FÍSICOS -----
  {
    match: (n) => n.includes("ruido"),
    itens: [
      { tipo: "EPI", nome: "Protetor Auricular Tipo Plug" },
      { tipo: "EPI", nome: "Protetor Auricular Tipo Concha" },
      { tipo: "EPC", nome: "Enclausuramento Acústico da Fonte" },
      { tipo: "EPC", nome: "Barreira Acústica" },
    ],
  },
  {
    match: (n) => n.includes("calor") || n.includes("ibutg"),
    itens: [
      { tipo: "EPI", nome: "Vestimenta Térmica / Refletiva" },
      { tipo: "EPI", nome: "Luva Térmica" },
      { tipo: "EPC", nome: "Ventilação / Exaustão de Calor" },
      { tipo: "EPC", nome: "Pausas em Ambiente Climatizado" },
    ],
  },
  {
    match: (n) => n.includes("frio"),
    itens: [
      { tipo: "EPI", nome: "Vestimenta Térmica para Baixa Temperatura" },
      { tipo: "EPI", nome: "Luva Térmica para Frio" },
      { tipo: "EPI", nome: "Calçado Térmico" },
    ],
  },
  {
    match: (n) => n.includes("umidade"),
    itens: [
      { tipo: "EPI", nome: "Bota Impermeável de PVC" },
      { tipo: "EPI", nome: "Vestimenta Impermeável" },
      { tipo: "EPI", nome: "Luva de PVC" },
    ],
  },
  {
    match: (n) => n.includes("vibra") && (n.includes("corpo") || n.includes("inteiro")),
    itens: [
      { tipo: "EPC", nome: "Banco / Assento Antivibratório" },
      { tipo: "EPC", nome: "Suspensão da Cabine" },
    ],
  },
  {
    match: (n) => n.includes("vibra"),
    itens: [
      { tipo: "EPI", nome: "Luva Antivibratória" },
      { tipo: "EPC", nome: "Punho / Cabo Antivibratório" },
    ],
  },
  {
    match: (n) => n.includes("radia") && (n.includes("ioniz") || n.includes("raio x") || n.includes("gama")),
    itens: [
      { tipo: "EPI", nome: "Avental Plumbífero" },
      { tipo: "EPI", nome: "Protetor de Tireoide Plumbífero" },
      { tipo: "EPI", nome: "Óculos Plumbíferos" },
      { tipo: "EPI", nome: "Dosímetro Individual" },
    ],
  },
  {
    match: (n) => n.includes("radia"),
    itens: [
      { tipo: "EPI", nome: "Óculos com Filtro UV/IR" },
      { tipo: "EPI", nome: "Vestimenta com Proteção UV" },
      { tipo: "EPI", nome: "Protetor Solar FPS 30+" },
    ],
  },
  {
    match: (n) => n.includes("press"),
    itens: [
      { tipo: "EPI", nome: "Capacete Pressurizado" },
      { tipo: "EPC", nome: "Câmara de Descompressão" },
    ],
  },

  // ----- QUÍMICOS -----
  {
    match: (n) => n.includes("benzeno"),
    itens: [
      { tipo: "EPI", nome: "Respirador Facial Inteira com Filtro VO" },
      { tipo: "EPI", nome: "Luva de Proteção Química (Nitrílica/Viton)" },
      { tipo: "EPI", nome: "Vestimenta de Proteção Química" },
      { tipo: "EPC", nome: "Sistema de Ventilação Local Exaustora" },
    ],
  },
  {
    match: (n) => n.includes("silica") || n.includes("sílica") || n.includes("poeira"),
    itens: [
      { tipo: "EPI", nome: "Respirador Semifacial PFF2/P2" },
      { tipo: "EPI", nome: "Respirador PFF3/P3" },
      { tipo: "EPI", nome: "Óculos de Proteção Ampla Visão" },
      { tipo: "EPC", nome: "Sistema de Aspiração / Umidificação" },
    ],
  },
  {
    match: (n) => n.includes("solvent") || n.includes("vapor") || n.includes("vo "),
    itens: [
      { tipo: "EPI", nome: "Respirador Semifacial com Filtro VO" },
      { tipo: "EPI", nome: "Luva Nitrílica" },
      { tipo: "EPI", nome: "Óculos de Proteção contra Respingos" },
      { tipo: "EPC", nome: "Ventilação Local Exaustora (VLE)" },
    ],
  },
  {
    match: (n) => n.includes("gas") || n.includes("gás") || n.includes("vapor"),
    itens: [
      { tipo: "EPI", nome: "Respirador Facial Inteira com Filtro Combinado" },
      { tipo: "EPC", nome: "Detector de Gases Fixo" },
      { tipo: "EPC", nome: "Sistema de Ventilação / Exaustão" },
    ],
  },
  {
    match: (_n, t) => t.includes("quimic"),
    itens: [
      { tipo: "EPI", nome: "Luva de Proteção Química" },
      { tipo: "EPI", nome: "Óculos de Proteção contra Respingos" },
      { tipo: "EPI", nome: "Avental Impermeável Químico" },
      { tipo: "EPI", nome: "Respirador com Filtro Apropriado" },
    ],
  },

  // ----- BIOLÓGICOS -----
  {
    match: (_n, t) => t.includes("biolog"),
    itens: [
      { tipo: "EPI", nome: "Luva de Procedimento (Látex/Nitrílica)" },
      { tipo: "EPI", nome: "Máscara Cirúrgica" },
      { tipo: "EPI", nome: "Respirador PFF2/N95" },
      { tipo: "EPI", nome: "Avental Descartável" },
      { tipo: "EPI", nome: "Óculos de Proteção / Face Shield" },
      { tipo: "EPI", nome: "Touca Descartável" },
    ],
  },

  // ----- ERGONÔMICOS -----
  {
    match: (_n, t) => t.includes("ergonom"),
    itens: [
      { tipo: "EPC", nome: "Mobiliário Ergonômico (Cadeira/Mesa Regulável)" },
      { tipo: "EPC", nome: "Apoio para Pés / Suporte de Monitor" },
      { tipo: "EPC", nome: "Pausas / Ginástica Laboral" },
    ],
  },

  // ----- ACIDENTES -----
  {
    match: (n) => n.includes("eletric") || n.includes("choque"),
    itens: [
      { tipo: "EPI", nome: "Luva Isolante de Borracha (Classe 0/1/2)" },
      { tipo: "EPI", nome: "Calçado Isolante" },
      { tipo: "EPI", nome: "Capacete Classe B" },
      { tipo: "EPI", nome: "Vestimenta Antiarco Elétrico" },
    ],
  },
  {
    match: (n) => n.includes("altura") || n.includes("queda"),
    itens: [
      { tipo: "EPI", nome: "Cinto de Segurança Tipo Paraquedista" },
      { tipo: "EPI", nome: "Talabarte Duplo com Absorvedor de Energia" },
      { tipo: "EPI", nome: "Trava-Quedas" },
      { tipo: "EPC", nome: "Linha de Vida" },
      { tipo: "EPC", nome: "Guarda-Corpo / Rodapé" },
    ],
  },
  {
    match: (n) => n.includes("confinado"),
    itens: [
      { tipo: "EPI", nome: "Conjunto Autônomo de Respiração" },
      { tipo: "EPI", nome: "Cinto de Resgate" },
      { tipo: "EPC", nome: "Detector Multigás" },
      { tipo: "EPC", nome: "Ventilação Forçada" },
    ],
  },
  {
    match: (n) => n.includes("corte") || n.includes("perfur") || n.includes("mecan"),
    itens: [
      { tipo: "EPI", nome: "Luva Anticorte" },
      { tipo: "EPI", nome: "Calçado de Segurança com Biqueira" },
      { tipo: "EPI", nome: "Óculos de Proteção" },
    ],
  },
  {
    match: (n) => n.includes("queda de objeto") || n.includes("impacto"),
    itens: [
      { tipo: "EPI", nome: "Capacete de Segurança Classe A" },
      { tipo: "EPI", nome: "Calçado com Biqueira de Composite" },
    ],
  },
  {
    match: (_n, t) => t.includes("acident"),
    itens: [
      { tipo: "EPI", nome: "Capacete de Segurança" },
      { tipo: "EPI", nome: "Óculos de Proteção" },
      { tipo: "EPI", nome: "Calçado de Segurança" },
      { tipo: "EPI", nome: "Luva de Segurança" },
    ],
  },
];

/**
 * Retorna lista única de EPI/EPC sugeridos a partir de um ou mais riscos.
 * Combina regras por nome e por tipo, removendo duplicatas.
 */
export function sugerirEpiEpcParaRiscos(
  riscos: Array<{ nome?: string | null; tipo?: string | null }>,
): SugestaoEpiEpc[] {
  const out = new Map<string, SugestaoEpiEpc>();
  for (const r of riscos) {
    const n = norm(r.nome || "");
    const t = norm(r.tipo || "");
    for (const regra of REGRAS) {
      if (regra.match(n, t)) {
        for (const it of regra.itens) {
          const key = `${it.tipo}::${norm(it.nome)}`;
          if (!out.has(key)) out.set(key, it);
        }
      }
    }
  }
  return Array.from(out.values());
}
