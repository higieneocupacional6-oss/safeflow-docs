// Motor de consolidação do Relatório Técnico Psicossocial (NR-01 / NR-17)
// Reutiliza integralmente a metodologia COPSOQ já existente no sistema.
import { BLOCOS_COPSOQ, valorRiscoPergunta } from "@/lib/copsoqBlocos";

export type NivelRisco = "Baixo" | "Médio" | "Alto" | "Crítico";

export const NIVEIS: NivelRisco[] = ["Baixo", "Médio", "Alto", "Crítico"];

export const PROB_LABELS = ["Improvável", "Possível", "Provável", "Muito provável"];
export const SEV_LABELS = ["Leve", "Moderada", "Grave", "Muito grave"];

export function nivelDeRisco(p: number, s: number): NivelRisco {
  const r = p * s;
  if (r <= 4) return "Baixo";
  if (r <= 8) return "Médio";
  if (r <= 12) return "Alto";
  return "Crítico";
}

export function corNivel(n: NivelRisco) {
  switch (n) {
    case "Baixo": return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "Médio": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Alto": return "bg-orange-100 text-orange-800 border-orange-300";
    default: return "bg-red-100 text-red-800 border-red-300";
  }
}

export function hexNivel(n: NivelRisco): [number, number, number] {
  switch (n) {
    case "Baixo": return [16, 155, 105];
    case "Médio": return [217, 165, 15];
    case "Alto": return [226, 122, 22];
    default: return [204, 40, 40];
  }
}

/** Metadados técnicos por dimensão COPSOQ. */
const META: Record<string, {
  descricao: string;
  consequencias: string;
  severidadeBase: number;
  medida: string;
  tipoControle: string;
}> = {
  exigencias: {
    descricao: "Exigências quantitativas, cognitivas e emocionais do trabalho (ritmo, prazos, decisões difíceis e controle emocional).",
    consequencias: "Fadiga mental, erros operacionais, estresse ocupacional e aumento do risco de adoecimento relacionado ao trabalho.",
    severidadeBase: 3,
    medida: "Revisar dimensionamento de efetivo, metas e prazos; redistribuir demandas e instituir pausas conforme NR-17.",
    tipoControle: "Organizacional",
  },
  controle: {
    descricao: "Grau de autonomia e influência do trabalhador sobre o método, o ritmo e as pausas de trabalho.",
    consequencias: "Desmotivação, sofrimento psíquico, redução da capacidade de resposta a imprevistos e absenteísmo.",
    severidadeBase: 2,
    medida: "Ampliar a participação dos trabalhadores na definição de métodos e ritmos; permitir pausas autoadministradas.",
    tipoControle: "Organizacional",
  },
  apoio: {
    descricao: "Suporte social recebido de colegas e da chefia imediata durante a execução das atividades.",
    consequencias: "Isolamento, sobrecarga individual, aumento de conflitos e queda de desempenho coletivo.",
    severidadeBase: 2,
    medida: "Estruturar rotinas de suporte técnico entre pares, apoio da liderança e canais de ajuda no posto de trabalho.",
    tipoControle: "Administrativo",
  },
  reconhecimento: {
    descricao: "Percepção de justiça, reconhecimento e retorno sobre o desempenho (recompensa no trabalho).",
    consequencias: "Perda de engajamento, rotatividade, conflitos internos e desgaste da relação de trabalho.",
    severidadeBase: 2,
    medida: "Implantar processo formal de feedback periódico e critérios transparentes de reconhecimento.",
    tipoControle: "Administrativo",
  },
  seguranca: {
    descricao: "Estabilidade percebida no emprego e previsibilidade quanto a mudanças que afetem a função.",
    consequencias: "Ansiedade antecipatória, insegurança, queda de produtividade e presenteísmo.",
    severidadeBase: 3,
    medida: "Comunicar previamente mudanças organizacionais e esclarecer perspectivas de continuidade das funções.",
    tipoControle: "Organizacional",
  },
  conflitos: {
    descricao: "Conflitos interpessoais, condutas inadequadas, assédio e interferência do trabalho na vida pessoal.",
    consequencias: "Adoecimento mental, afastamentos, litígios trabalhistas e deterioração do clima organizacional.",
    severidadeBase: 4,
    medida: "Aplicar e divulgar política de prevenção ao assédio e à violência no trabalho, com canal de denúncia e apuração.",
    tipoControle: "Organizacional / Normativo",
  },
  sintomas: {
    descricao: "Manifestações de estresse, fadiga e esgotamento emocional associadas ao trabalho.",
    consequencias: "Burnout, transtornos do sono, afastamentos prolongados e agravos à saúde mental.",
    severidadeBase: 4,
    medida: "Encaminhar avaliação clínica no PCMSO, monitorar indicadores de saúde mental e atuar sobre as causas organizacionais.",
    tipoControle: "Saúde ocupacional",
  },
  lideranca: {
    descricao: "Qualidade da liderança: imparcialidade, escuta e desenvolvimento da equipe.",
    consequencias: "Conflitos, rotatividade, baixa adesão às normas de segurança e sofrimento no trabalho.",
    severidadeBase: 3,
    medida: "Capacitar lideranças em gestão de pessoas, comunicação não violenta e fatores psicossociais (NR-01/NR-17).",
    tipoControle: "Capacitação",
  },
};

export type FatorRisco = {
  key: string;
  fator: string;
  descricao: string;
  fonte: string;
  situacao: string;
  expostos: number;
  frequencia: string;
  probabilidade: number;
  severidade: number;
  nivel: NivelRisco;
  consequencias: string;
  controles: string;
  media: number;
};

export type GrupoRelatorio = {
  id: string;
  setor: string;
  ghe: string;
  funcoes: string[];
  trabalhadores: number;
  atividades: string;
  jornada: string;
  organizacao: string;
  fatores: FatorRisco[];
  respondentes: number;
};

export type MedidaControle = {
  key: string;
  grupo: string;
  risco: string;
  medida: string;
  tipo: string;
  responsavel: string;
  prazo: string;
  prioridade: string;
  status: string;
  evidencia: string;
};

export type VinculoFuncao = {
  setor: string;
  ghe: string;
  expostos: number;
  atividades: string;
};

export const normalizarFuncao = (s: string) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

/** Média de risco (0-100) por bloco, considerando polaridade das perguntas. */
function mediasPorBloco(respostas: any[]) {
  const acc: Record<string, { soma: number; n: number; porPergunta: { soma: number; n: number }[] }> = {};
  for (const b of BLOCOS_COPSOQ) {
    acc[b.key] = { soma: 0, n: 0, porPergunta: b.perguntas.map(() => ({ soma: 0, n: 0 })) };
  }
  for (const r of respostas) {
    for (const b of BLOCOS_COPSOQ) {
      const arr: number[] = (r.respostas as any)?.[b.key] || [];
      for (let i = 0; i < b.perguntas.length; i++) {
        const v = arr[i];
        if (typeof v !== "number" || v < 0) continue;
        const risco = valorRiscoPergunta(v, b.key, i);
        acc[b.key].soma += risco;
        acc[b.key].n += 1;
        acc[b.key].porPergunta[i].soma += risco;
        acc[b.key].porPergunta[i].n += 1;
      }
    }
  }
  return acc;
}

/** Limiar técnico: só é fator de risco quando sustentado pelas respostas. */
const LIMIAR_FATOR = 50;

export function construirGrupos(
  respostas: any[],
  vinculos: Map<string, VinculoFuncao>,
  jornadaEmpresa: string,
): GrupoRelatorio[] {
  const mapa = new Map<string, { setor: string; ghe: string; funcoes: Set<string>; itens: any[] }>();
  for (const r of respostas) {
    const v = vinculos.get(normalizarFuncao(r.funcao_nome));
    if (!v) continue;
    const id = `${v.setor}||${v.ghe || "—"}`;
    const g = mapa.get(id) || { setor: v.setor, ghe: v.ghe || "—", funcoes: new Set<string>(), itens: [] };
    g.funcoes.add(r.funcao_nome);
    g.itens.push(r);
    mapa.set(id, g);
  }

  return Array.from(mapa.entries()).map(([id, g]) => {
    const funcoes = Array.from(g.funcoes);
    const trabalhadores = funcoes.reduce(
      (a, f) => a + (vinculos.get(normalizarFuncao(f))?.expostos || 0), 0,
    );
    const atividades = funcoes
      .map((f) => {
        const d = vinculos.get(normalizarFuncao(f))?.atividades;
        return d ? `${f}: ${d}` : null;
      })
      .filter(Boolean)
      .join(" ") || "Atividades conforme descrição cadastrada no módulo Setores e Funções.";

    const acc = mediasPorBloco(g.itens);
    const fatores: FatorRisco[] = [];

    for (const b of BLOCOS_COPSOQ) {
      const a = acc[b.key];
      if (!a.n) continue; // sem respostas → não avaliado, não gera fator
      const media = Math.round(a.soma / a.n);
      if (media < LIMIAR_FATOR) continue; // não sustentado pelas respostas

      const criticas = b.perguntas
        .map((p, i) => ({ p, m: a.porPergunta[i].n ? a.porPergunta[i].soma / a.porPergunta[i].n : -1 }))
        .filter((x) => x.m >= LIMIAR_FATOR)
        .sort((x, y) => y.m - x.m)
        .slice(0, 3)
        .map((x) => x.p);

      const controlesEvid = b.perguntas
        .map((p, i) => ({ p, m: a.porPergunta[i].n ? a.porPergunta[i].soma / a.porPergunta[i].n : -1, pol: b.polaridades[i] }))
        .filter((x) => x.pol === "pos" && x.m >= 0 && x.m <= 25)
        .map((x) => x.p);

      const probabilidade = media < 62 ? 2 : media < 75 ? 3 : 4;
      const meta = META[b.key];
      const severidade = Math.min(4, meta.severidadeBase + (media >= 75 ? 1 : 0));
      const frequencia = media >= 75 ? "Habitual e permanente" : media >= 62 ? "Frequente" : "Intermitente";

      fatores.push({
        key: b.key,
        fator: b.titulo,
        descricao: meta.descricao,
        fonte: criticas.length
          ? `Respostas desfavoráveis em: ${criticas.join(" ")}`
          : "Resultado consolidado desfavorável na dimensão avaliada.",
        situacao: `Exposição durante a execução das atividades das funções ${funcoes.join(", ")} no setor ${g.setor}.`,
        expostos: trabalhadores,
        frequencia,
        probabilidade,
        severidade,
        nivel: nivelDeRisco(probabilidade, severidade),
        consequencias: meta.consequencias,
        controles: controlesEvid.length
          ? `Evidências favoráveis nas respostas: ${controlesEvid.join(" ")}`
          : "Não foram identificados controles existentes com evidência nas respostas e nos cadastros.",
        media,
      });
    }

    fatores.sort((a, b) => b.probabilidade * b.severidade - a.probabilidade * a.severidade);

    return {
      id,
      setor: g.setor,
      ghe: g.ghe,
      funcoes,
      trabalhadores,
      atividades,
      jornada: jornadaEmpresa || "Jornada conforme cadastro da empresa/contrato.",
      organizacao:
        "Organização do trabalho analisada a partir das respostas da avaliação psicossocial (ritmo, autonomia, apoio social, reconhecimento, liderança e conflitos), conforme metodologia COPSOQ adotada pelo sistema.",
      fatores,
      respondentes: g.itens.length,
    };
  }).sort((a, b) => a.setor.localeCompare(b.setor));
}

export function medidasDosGrupos(grupos: GrupoRelatorio[]): MedidaControle[] {
  const out: MedidaControle[] = [];
  for (const g of grupos) {
    for (const f of g.fatores) {
      const meta = META[f.key];
      const prioridade = f.nivel === "Crítico" ? "Imediata" : f.nivel === "Alto" ? "Alta" : f.nivel === "Médio" ? "Média" : "Baixa";
      const prazo = f.nivel === "Crítico" ? "30 dias" : f.nivel === "Alto" ? "60 dias" : f.nivel === "Médio" ? "90 dias" : "180 dias";
      out.push({
        key: `${g.id}::${f.key}`,
        grupo: `${g.setor} — ${g.ghe}`,
        risco: f.fator,
        medida: meta.medida,
        tipo: meta.tipoControle,
        responsavel: "",
        prazo,
        prioridade,
        status: "Pendente",
        evidencia: "",
      });
    }
  }
  return out;
}

export function resumoPorGrupo(g: GrupoRelatorio) {
  const cont: Record<NivelRisco, number> = { Baixo: 0, "Médio": 0, Alto: 0, "Crítico": 0 };
  g.fatores.forEach((f) => { cont[f.nivel] += 1; });
  const predominante = (Object.entries(cont).sort((a, b) => b[1] - a[1])[0]?.[1] ? Object.entries(cont).sort((a, b) => b[1] - a[1])[0][0] : "—") as string;
  const criticos = g.fatores.filter((f) => f.nivel === "Alto" || f.nivel === "Crítico").map((f) => f.fator);
  return { cont, predominante: g.fatores.length ? predominante : "—", criticos };
}

export function matrizOcupada(grupos: GrupoRelatorio[]) {
  const m: Record<string, number> = {};
  for (const g of grupos) for (const f of g.fatores) {
    const k = `${f.probabilidade}-${f.severidade}`;
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}

export function riscosParaPgr(grupos: GrupoRelatorio[]) {
  const out: { setor: string; ghe: string; fator: string; nivel: NivelRisco; justificativa: string }[] = [];
  for (const g of grupos) for (const f of g.fatores) {
    if (f.nivel === "Baixo") continue; // apenas os que demandam gerenciamento
    out.push({
      setor: g.setor,
      ghe: g.ghe,
      fator: f.fator,
      nivel: f.nivel,
      justificativa: `Nível ${f.nivel} (P${f.probabilidade} × S${f.severidade}) sustentado pelas respostas da avaliação; requer inclusão no inventário de riscos e no plano de ação do PGR (NR-01, item 1.5.3.2) e adequação da organização do trabalho (NR-17).`,
    });
  }
  return out;
}

export function conclusaoTecnica(grupos: GrupoRelatorio[], empresaNome: string) {
  if (!grupos.length) return "Não foram identificados grupos homogêneos com avaliações válidas para análise.";
  const todos = grupos.flatMap((g) => g.fatores);
  if (!todos.length) {
    return `A avaliação psicossocial realizada em ${empresaNome} não identificou fatores de risco psicossocial sustentados pelas respostas obtidas. Recomenda-se a manutenção das condições atuais de organização do trabalho e a reavaliação periódica conforme NR-01.`;
  }
  const criticos = todos.filter((f) => f.nivel === "Crítico");
  const altos = todos.filter((f) => f.nivel === "Alto");
  const prioritarios = grupos
    .filter((g) => g.fatores.some((f) => f.nivel === "Alto" || f.nivel === "Crítico"))
    .map((g) => `${g.setor} (${g.ghe})`);
  const dimensoes = Array.from(new Set(todos.map((f) => f.fator)));

  const partes: string[] = [];
  partes.push(
    `A avaliação dos fatores de risco psicossocial de ${empresaNome} abrangeu ${grupos.length} grupo(s) homogêneo(s) de exposição, resultando na identificação de ${todos.length} fator(es) de risco sustentado(s) pelas respostas coletadas.`,
  );
  partes.push(`As dimensões efetivamente afetadas foram: ${dimensoes.join("; ")}.`);
  if (criticos.length || altos.length) {
    partes.push(
      `Foram classificados ${criticos.length} fator(es) em nível Crítico e ${altos.length} em nível Alto, o que caracteriza a necessidade de adoção de medidas de prevenção e controle com prioridade, nos termos da NR-01 (gerenciamento de riscos ocupacionais) e da NR-17 (adequação da organização do trabalho às características psicofisiológicas dos trabalhadores).`,
    );
  } else {
    partes.push(
      "Os fatores identificados situam-se em níveis Baixo/Médio, demandando medidas de monitoramento e melhoria contínua da organização do trabalho.",
    );
  }
  partes.push(
    prioritarios.length
      ? `Constituem setores prioritários para intervenção: ${prioritarios.join("; ")}.`
      : "Não foram identificados setores em condição prioritária de intervenção.",
  );
  partes.push(
    `Recomenda-se a implementação do plano de ação apresentado neste relatório, o acompanhamento dos indicadores organizacionais e a reavaliação em prazo não superior a ${criticos.length ? "6 (seis)" : "12 (doze)"} meses ou sempre que houver alteração relevante na organização do trabalho.`,
  );
  return partes.join(" ");
}

export function metodologiaTexto(opts: {
  periodo: string;
  participacao: string;
  observacao: string;
  respondentes: number;
}) {
  return [
    "Método e instrumento: a avaliação dos fatores de risco psicossocial foi conduzida com base no questionário COPSOQ (Copenhagen Psychosocial Questionnaire), na versão adotada pelo sistema, contemplando as dimensões de exigências no trabalho, controle e autonomia, apoio social, reconhecimento, segurança e estabilidade, conflitos e conduta, sintomas de estresse e fadiga e qualidade da liderança.",
    `Entrevistas e questionários: as respostas foram coletadas de forma individual e anônima, por meio de questionário estruturado em escala de frequência (Nunca a Sempre), convertida em escala numérica de 0 a 100 para tratamento estatístico.`,
    `Observação das atividades: ${opts.observacao || "não informada"}.`,
    "Análise da organização do trabalho: foram consideradas as informações cadastrais de setores, GHE/GES, funções, descrição das atividades e jornada, além dos indicadores organizacionais informados.",
    `Participação dos trabalhadores: ${opts.participacao || "não informada"}.`,
    "Critérios de classificação: cada dimensão foi convertida em índice de risco de 0 a 100, considerando a polaridade de cada questão. Somente dimensões com índice igual ou superior a 50 foram consideradas fatores de risco aplicáveis, evitando a listagem automática de itens não sustentados pelas respostas.",
    "Escala de probabilidade e severidade: probabilidade de 1 (improvável) a 4 (muito provável), definida pelo índice de risco da dimensão; severidade de 1 (leve) a 4 (muito grave), definida pela natureza do agravo potencial. O nível de risco resulta do produto Probabilidade × Severidade (Baixo ≤ 4; Médio ≤ 8; Alto ≤ 12; Crítico > 12).",
    `Período da coleta: ${opts.periodo || "não informado"}.`,
  ].join("\n\n");
}

export const INDICADORES_CAMPOS = [
  { key: "absenteismo", label: "Absenteísmo (%)" },
  { key: "afastamentos", label: "Afastamentos relacionados ao trabalho" },
  { key: "rotatividade", label: "Rotatividade (%)" },
  { key: "horas_extras", label: "Horas extras (h/mês)" },
  { key: "queixas", label: "Queixas / reclamações" },
  { key: "acidentes", label: "Acidentes/incidentes ligados a fatores organizacionais" },
  { key: "pesquisas", label: "Resultados de pesquisas/questionários" },
  { key: "outros", label: "Outros indicadores relevantes" },
];
