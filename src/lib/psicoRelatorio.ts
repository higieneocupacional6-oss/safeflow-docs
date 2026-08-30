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

/** Texto de manutenção/monitoramento específico por dimensão (usado quando o nível é Baixo). */
const MANUTENCAO: Record<string, string> = {
  exigencias:
    "Manter o dimensionamento atual de efetivo, metas e prazos, monitorando periodicamente o volume de demandas e o cumprimento das pausas previstas na NR-17, de modo a preservar o equilíbrio de carga verificado nesta avaliação.",
  controle:
    "Preservar a autonomia atualmente concedida quanto a método, ritmo e pausas, acompanhando eventuais mudanças de processo que possam reduzir a margem de decisão dos trabalhadores.",
  apoio:
    "Manter as práticas de cooperação entre pares e o suporte da chefia imediata, acompanhando periodicamente a percepção de apoio social por meio de reavaliações e do canal de comunicação interno.",
  reconhecimento:
    "Manter as rotinas de retorno de desempenho e os critérios de reconhecimento existentes, monitorando sua regularidade para que o resultado favorável observado se sustente ao longo do tempo.",
  seguranca:
    "Manter a comunicação antecipada de mudanças organizacionais e a previsibilidade quanto às funções, acompanhando a percepção de estabilidade em reavaliações periódicas.",
  conflitos:
    "Manter a política de convivência e de prevenção ao assédio, com divulgação periódica do canal de denúncia e acompanhamento de registros, preservando o clima organizacional identificado.",
  sintomas:
    "Manter o acompanhamento de saúde no âmbito do PCMSO e o monitoramento de indicadores de absenteísmo e fadiga, de forma a detectar precocemente qualquer alteração do quadro favorável observado.",
  lideranca:
    "Manter as práticas atuais de liderança e a capacitação periódica dos gestores em comunicação e fatores psicossociais, acompanhando a percepção da equipe em reavaliações.",
};

/** Interpretação técnica de fator investigado sem evidência de agravamento. */
const investigadoTexto = (titulo: string, media: number, houveResposta: boolean) =>
  houveResposta
    ? `Fator investigado por meio das respostas coletadas (índice consolidado de risco de ${media}/100, inferior ao limiar técnico de ${LIMIAR_FATOR}/100), sem evidências suficientes para caracterização de exposição psicossocial relevante no grupo avaliado.`
    : `Fator investigado no questionário aplicado, sem respostas válidas suficientes no grupo avaliado que sustentem a caracterização de exposição psicossocial relevante em ${titulo.toLowerCase()}.`;

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
  /** true quando as respostas sustentam a caracterização do fator como risco. */
  sustentado: boolean;
  /** Interpretação técnica do resultado do fator. */
  interpretacao: string;
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

/** Normaliza um trecho de atividade para comparação/deduplicação. */
const chaveAtividade = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/** Quebra as descrições cadastradas em itens de atividade individuais. */
function extrairAtividades(texto: string): string[] {
  return (texto || "")
    .split(/[\n;•·]|(?<=[a-zà-ú0-9\)])\s*[.]\s+|,\s+(?=[a-zà-ú])/i)
    .map((x) => x.replace(/^[-–\s]+/, "").replace(/[.;\s]+$/, "").trim())
    .filter((x) => x.length > 3);
}

/**
 * Gera descrição técnica consolidada das atividades do GHE/setor a partir das
 * descrições cadastradas em Setores e Funções (sem cópia literal e sem duplicidades).
 */
export function descreverAtividades(
  setor: string,
  ghe: string,
  funcoes: string[],
  vinculos: Map<string, VinculoFuncao>,
): string {
  const itens: string[] = [];
  const vistos = new Set<string>();
  const semDescricao: string[] = [];

  for (const f of funcoes) {
    const desc = vinculos.get(normalizarFuncao(f))?.atividades || "";
    const partes = extrairAtividades(desc);
    if (!partes.length) { semDescricao.push(f); continue; }
    for (const p of partes) {
      const k = chaveAtividade(p);
      if (!k || vistos.has(k)) continue;
      vistos.add(k);
      itens.push(p.charAt(0).toLowerCase() + p.slice(1));
    }
  }

  const listaFuncoes = funcoes.length > 1
    ? `${funcoes.slice(0, -1).join(", ")} e ${funcoes[funcoes.length - 1]}`
    : funcoes[0] || "—";

  const partes: string[] = [];
  partes.push(
    `O grupo homogêneo ${ghe && ghe !== "—" ? `${ghe} ` : ""}do setor ${setor} é composto ${funcoes.length > 1 ? "pelas funções" : "pela função"} ${listaFuncoes}.`,
  );

  if (itens.length) {
    const principais = itens.slice(0, 12);
    partes.push(
      funcoes.length > 1
        ? `A análise consolidada das atividades cadastradas para essas funções indica um conjunto de tarefas convergentes, compreendendo: ${principais.join("; ")}.`
        : `As atividades desenvolvidas compreendem: ${principais.join("; ")}.`,
    );
    if (itens.length > principais.length) {
      partes.push(
        `Além dessas, foram consideradas demais tarefas correlatas registradas no cadastro das funções, de mesma natureza técnica e executadas no mesmo ambiente.`,
      );
    }
    partes.push(
      "As tarefas são executadas de forma rotineira no ambiente do setor, com interação entre as funções do grupo e sujeição às mesmas condições de organização do trabalho.",
    );
  }

  if (semDescricao.length) {
    partes.push(
      `Para ${semDescricao.length > 1 ? "as funções" : "a função"} ${semDescricao.join(", ")} não há descrição de atividades registrada no módulo Setores e Funções; as atividades foram consideradas conforme a denominação da função e as condições de trabalho observadas no grupo, sem atribuição de tarefas não sustentadas pelos dados disponíveis.`,
    );
  }

  return partes.join(" ");
}

/**
 * Texto técnico específico sobre a organização do trabalho do GHE/setor,
 * combinando cadastro das funções com os índices obtidos na avaliação.
 */
function descreverOrganizacao(
  setor: string,
  ghe: string,
  funcoes: string[],
  jornada: string,
  medias: Record<string, number | null>,
): string {
  const nivelTexto = (v: number | null, alto: string, medio: string, baixo: string) =>
    v === null ? null : v >= 62 ? alto : v >= 40 ? medio : baixo;

  const partes: string[] = [];
  partes.push(
    `A organização do trabalho ${ghe && ghe !== "—" ? `do grupo ${ghe}` : ""} no setor ${setor} foi analisada a partir das informações cadastrais das funções ${funcoes.join(", ")} e das respostas obtidas na avaliação psicossocial.`,
  );
  partes.push(
    jornada
      ? `A jornada praticada é de ${jornada}, com distribuição das tarefas entre as funções do grupo.`
      : "A jornada praticada segue o regime registrado para o contrato, com distribuição das tarefas entre as funções do grupo.",
  );

  const add = (t: string | null) => { if (t) partes.push(t); };

  add(nivelTexto(medias.exigencias,
    "Verifica-se ritmo intenso de trabalho, com prazos curtos e demandas cognitivas e emocionais elevadas relatadas pelo grupo.",
    "O ritmo de trabalho e os prazos são compatíveis com a demanda na maior parte do tempo, com picos pontuais de exigência.",
    "O ritmo de trabalho e os prazos mostram-se compatíveis com a capacidade do grupo, sem relato de sobrecarga significativa."));

  add(nivelTexto(medias.controle,
    "A autonomia sobre o método, o ritmo e a realização de pausas é restrita, com baixa participação do trabalhador nas decisões operacionais.",
    "Há autonomia parcial sobre método e ritmo, com pausas condicionadas ao andamento das atividades.",
    "Os trabalhadores dispõem de autonomia sobre o método e o ritmo de execução, com possibilidade de pausas conforme a necessidade."));

  add(nivelTexto(medias.apoio,
    "O apoio de colegas e da chefia imediata é insuficiente durante a execução das tarefas, com sobrecarga individual.",
    "O apoio entre pares e da chefia ocorre de forma variável conforme a demanda.",
    "O trabalho é executado com cooperação entre pares e suporte da chefia imediata."));

  add(nivelTexto(medias.lideranca,
    "A atuação da liderança é percebida como pouco imparcial e com escuta limitada da equipe.",
    "A atuação da liderança é percebida de forma intermediária quanto à imparcialidade, escuta e desenvolvimento da equipe.",
    "A liderança é percebida como imparcial, acessível e voltada ao desenvolvimento da equipe."));

  add(nivelTexto(medias.reconhecimento,
    "As cobranças por resultado não são acompanhadas de retorno de desempenho e reconhecimento proporcionais.",
    "O retorno sobre o desempenho ocorre de maneira intermitente.",
    "Há retorno periódico sobre o desempenho e percepção de reconhecimento pelo trabalho realizado."));

  add(nivelTexto(medias.conflitos,
    "Registram-se conflitos interpessoais e interferência do trabalho na vida pessoal com frequência relevante.",
    "Os conflitos interpessoais ocorrem de forma pontual, sem caráter habitual.",
    "As relações interpessoais e a comunicação interna transcorrem sem conflitos relevantes relatados."));

  add(nivelTexto(medias.seguranca,
    "Há percepção de instabilidade e baixa previsibilidade quanto a mudanças que afetem as funções.",
    "A percepção de estabilidade é intermediária, com dúvidas pontuais sobre mudanças futuras.",
    "Há percepção de estabilidade e previsibilidade quanto à continuidade das funções."));

  partes.push(
    "As características descritas foram consideradas na classificação dos fatores de risco psicossocial deste grupo, nos termos da NR-01 e da NR-17.",
  );
  return partes.join(" ");
}

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
    const atividades = descreverAtividades(g.setor, g.ghe, funcoes, vinculos);

    const acc = mediasPorBloco(g.itens);
    const medias: Record<string, number | null> = {};
    for (const b of BLOCOS_COPSOQ) {
      medias[b.key] = acc[b.key].n ? Math.round(acc[b.key].soma / acc[b.key].n) : null;
    }
    const fatores: FatorRisco[] = [];

    for (const b of BLOCOS_COPSOQ) {
      const a = acc[b.key];
      const meta = META[b.key];
      const houveResposta = a.n > 0;
      const media = houveResposta ? Math.round(a.soma / a.n) : 0;
      const sustentado = houveResposta && media >= LIMIAR_FATOR;

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

      // Fator investigado e não caracterizado → registrado como Baixo (rastreabilidade).
      const probabilidade = !sustentado ? 1 : media < 62 ? 2 : media < 75 ? 3 : 4;
      const severidade = !sustentado
        ? Math.min(2, meta.severidadeBase)
        : Math.min(4, meta.severidadeBase + (media >= 75 ? 1 : 0));
      const frequencia = !sustentado
        ? "Não caracterizada"
        : media >= 75 ? "Habitual e permanente" : media >= 62 ? "Frequente" : "Intermitente";
      const interpretacao = sustentado
        ? `Fator caracterizado como risco psicossocial a partir das respostas coletadas (índice consolidado de ${media}/100), classificado no nível ${nivelDeRisco(probabilidade, severidade)}.`
        : investigadoTexto(b.titulo, media, houveResposta);

      fatores.push({
        key: b.key,
        fator: b.titulo,
        descricao: meta.descricao,
        fonte: sustentado
          ? (criticas.length
            ? `Respostas desfavoráveis em: ${criticas.join(" ")}`
            : "Resultado consolidado desfavorável na dimensão avaliada.")
          : interpretacao,
        situacao: sustentado
          ? `Exposição durante a execução das atividades das funções ${funcoes.join(", ")} no setor ${g.setor}.`
          : `Dimensão investigada nas funções ${funcoes.join(", ")} do setor ${g.setor}, sem caracterização de exposição psicossocial relevante.`,
        expostos: trabalhadores,
        frequencia,
        probabilidade,
        severidade,
        nivel: nivelDeRisco(probabilidade, severidade),
        consequencias: sustentado
          ? meta.consequencias
          : `Agravos potenciais associados à dimensão, não evidenciados nesta avaliação: ${meta.consequencias.toLowerCase()}`,
        controles: controlesEvid.length
          ? `Evidências favoráveis nas respostas: ${controlesEvid.join(" ")}`
          : (sustentado
            ? "Não foram identificados controles existentes com evidência nas respostas e nos cadastros."
            : "Condições organizacionais atuais avaliadas como adequadas para a dimensão investigada."),
        media,
        sustentado,
        interpretacao,
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
      organizacao: descreverOrganizacao(g.setor, g.ghe, funcoes, jornadaEmpresa, medias),
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
      const manutencao = !f.sustentado || f.nivel === "Baixo";
      const prioridade = manutencao
        ? "Manutenção"
        : f.nivel === "Crítico" ? "Imediata" : f.nivel === "Alto" ? "Alta" : "Média";
      const prazo = manutencao
        ? "Acompanhamento contínuo — reavaliação em até 12 meses"
        : f.nivel === "Crítico" ? "30 dias" : f.nivel === "Alto" ? "60 dias" : "90 dias";
      out.push({
        key: `${g.id}::${f.key}`,
        grupo: `${g.setor} — ${g.ghe}`,
        risco: f.fator,
        medida: manutencao
          ? (MANUTENCAO[f.key] || "Manter as medidas organizacionais existentes e realizar acompanhamento periódico das condições de trabalho, visando preservar os resultados favoráveis identificados na avaliação.")
          : meta.medida,
        tipo: manutencao ? "Manutenção/monitoramento" : meta.tipoControle,
        responsavel: "",
        prazo,
        prioridade,
        status: manutencao ? "Em acompanhamento" : "Pendente",
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
  const investigados = grupos.flatMap((g) => g.fatores);
  const todos = investigados.filter((f) => f.sustentado !== false);
  const investigadosSemRisco = investigados.filter((f) => f.sustentado === false);
  const dimensoesInvestigadas = Array.from(new Set(investigados.map((f) => f.fator)));
  if (!todos.length) {
    return `A avaliação psicossocial realizada em ${empresaNome} investigou ${dimensoesInvestigadas.length} dimensão(ões) do questionário aplicado (${dimensoesInvestigadas.join("; ")}) em ${grupos.length} grupo(s) homogêneo(s) de exposição. Todas as dimensões foram investigadas e classificadas em nível Baixo, não tendo sido caracterizado fator de risco psicossocial relevante conforme os critérios da metodologia adotada. Recomenda-se a manutenção das medidas organizacionais existentes, o monitoramento periódico das condições de trabalho e a reavaliação conforme a NR-01.`;
  }
  const criticos = todos.filter((f) => f.nivel === "Crítico");
  const altos = todos.filter((f) => f.nivel === "Alto");
  const prioritarios = grupos
    .filter((g) => g.fatores.some((f) => f.nivel === "Alto" || f.nivel === "Crítico"))
    .map((g) => `${g.setor} (${g.ghe})`);
  const dimensoes = Array.from(new Set(todos.map((f) => f.fator)));

  const partes: string[] = [];
  partes.push(
    `A avaliação dos fatores de risco psicossocial de ${empresaNome} abrangeu ${grupos.length} grupo(s) homogêneo(s) de exposição e investigou ${dimensoesInvestigadas.length} dimensão(ões) do instrumento aplicado, resultando na caracterização de ${todos.length} fator(es) de risco sustentado(s) pelas respostas coletadas.`,
  );
  partes.push(`As dimensões efetivamente afetadas foram: ${dimensoes.join("; ")}.`);
  if (investigadosSemRisco.length) {
    partes.push(
      `As demais dimensões foram igualmente investigadas e classificadas em nível Baixo, por ausência de evidências suficientes para caracterização de exposição psicossocial relevante, permanecendo registradas no relatório para fins de rastreabilidade da avaliação.`,
    );
  }

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
    "Critérios de classificação: cada dimensão foi convertida em índice de risco de 0 a 100, considerando a polaridade de cada questão. Todas as dimensões investigadas são registradas no relatório, assegurando a rastreabilidade da avaliação: dimensões com índice igual ou superior a 50 são caracterizadas como fatores de risco psicossocial, enquanto as dimensões com índice inferior a esse limiar são registradas como investigadas e classificadas em nível Baixo, por ausência de evidências suficientes de agravamento. Fator investigado não se confunde com fator de risco caracterizado.",
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
