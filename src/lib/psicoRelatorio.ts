// Motor de consolidação do Relatório Técnico Psicossocial (NR-01 / NR-17)
// Reutiliza integralmente a metodologia COPSOQ já existente no sistema.
import { BLOCOS_COPSOQ, valorRiscoPergunta } from "@/lib/copsoqBlocos";
import { sortGroupsNumerically } from "@/lib/sortGes";

export type NivelRisco = "Baixo" | "Médio" | "Alto" | "Crítico";

export const NIVEIS: NivelRisco[] = ["Baixo", "Médio", "Alto", "Crítico"];
export const FREQUENCIAS_PSICOSSOCIAIS = ["Eventual", "Intermitente", "Habitual"] as const;

/** Corrige nomenclaturas legadas antes de exibir, salvar ou exportar o relatório. */
export function normalizarTextoPsicossocial(value: unknown): string {
  return String(value ?? "")
    .replace(/investigado,\s*sem evidências? suficientes?/gi, "Investigado, considerado em conformidade")
    .replace(/não identificado/gi, "Baixo");
}

export function normalizarFrequenciaPsicossocial(value: unknown, media = 0): typeof FREQUENCIAS_PSICOSSOCIAIS[number] {
  const texto = String(value ?? "").trim().toLowerCase();
  if (/habitual|permanente|frequente/.test(texto)) return "Habitual";
  if (/intermitente/.test(texto)) return "Intermitente";
  if (/eventual|ocasional|pontual/.test(texto)) return "Eventual";
  return media >= 62 ? "Habitual" : media >= 50 ? "Intermitente" : "Eventual";
}

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

/** Interpretação técnica de fator investigado sem evidência de agravamento. */
const investigadoTexto = (titulo: string, media: number, houveResposta: boolean) =>
  houveResposta
    ? `Investigado, considerado em conformidade: as respostas coletadas apresentaram índice consolidado de risco de ${media}/100, inferior ao limiar técnico de ${LIMIAR_FATOR}/100, sem indicação de exposição psicossocial relevante no grupo avaliado.`
    : `Investigado, considerado em conformidade nesta avaliação: não houve respostas válidas suficientes no grupo avaliado que indicassem exposição psicossocial relevante em ${titulo.toLowerCase()}.`;

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
  /** Texto de atividades gerado do cadastro no momento do salvamento (detecta mudanças). */
  atividadesBase?: string;
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
  /** Preenchido manualmente pelo profissional após a emissão — inicia em branco. */
  status: string;
  evidencia?: string;
};

export type VinculoFuncao = {
  funcaoId?: string;
  funcaoNome?: string;
  setorId?: string;
  ambiente?: string;
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
  const mapa = new Map<string, { setor: string; ghe: string; funcoes: Set<string>; itens: any[]; vinculos: Map<string, VinculoFuncao> }>();
  const atuais = Array.from(new Set(vinculos.values()));
  for (const v of atuais) {
    const id = `${v.setor}||${v.ghe || "—"}`;
    const g = mapa.get(id) || { setor: v.setor, ghe: v.ghe || "—", funcoes: new Set<string>(), itens: [], vinculos: new Map<string, VinculoFuncao>() };
    const nome = v.funcaoNome || Array.from(vinculos.entries()).find(([, value]) => value === v)?.[0] || "";
    g.funcoes.add(nome);
    g.vinculos.set(normalizarFuncao(nome), v);
    mapa.set(id, g);
  }
  for (const r of respostas) {
    // Um ID removido nunca é recuperado pelo nome; legados sem ID exigem nome único.
    const candidatos = atuais.filter((v) => normalizarFuncao(v.funcaoNome || "") === normalizarFuncao(r.funcao_nome));
    const v = r.funcao_id
      ? atuais.find((v) => v.funcaoId === r.funcao_id)
      : candidatos.length === 1 ? candidatos[0] : candidatos.length === 0 ? vinculos.get(normalizarFuncao(r.funcao_nome)) : undefined;
    if (!v) continue;
    const id = `${v.setor}||${v.ghe || "—"}`;
    const g = mapa.get(id);
    if (!g) continue;
    g.itens.push(r);
    mapa.set(id, g);
  }

  const grupos = Array.from(mapa.entries()).map(([id, g]) => {
    const funcoes = Array.from(g.funcoes);
    const trabalhadores = funcoes.reduce(
      (a, f) => a + (g.vinculos.get(normalizarFuncao(f))?.expostos || 0), 0,
    );
    const atividades = descreverAtividades(g.setor, g.ghe, funcoes, g.vinculos);

    const acc = mediasPorBloco(g.itens);
    const medias: Record<string, number | null> = {};
    for (const b of BLOCOS_COPSOQ) {
      if (!g.itens.length) continue;
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

      // Resultado abaixo do limiar técnico → registrado como Baixo (rastreabilidade).
      const probabilidade = !sustentado ? 1 : media < 62 ? 2 : media < 75 ? 3 : 4;
      const severidade = !sustentado
        ? Math.min(2, meta.severidadeBase)
        : Math.min(4, meta.severidadeBase + (media >= 75 ? 1 : 0));
      const frequencia = normalizarFrequenciaPsicossocial("", media);
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
      organizacao: g.itens.length
        ? descreverOrganizacao(g.setor, g.ghe, funcoes, jornadaEmpresa, medias)
        : "Não há respostas vinculadas às funções atuais deste grupo; não é possível concluir sobre os fatores psicossociais. " + Array.from(new Set(Array.from(g.vinculos.values()).map((v) => v.ambiente).filter(Boolean))).join(" "),
      fatores,
      respondentes: g.itens.length,
    };
  });
  return sortGroupsNumerically(grupos);
}


/**
 * Combina os grupos recalculados a partir do cadastro ATUAL de Setores e Funções com
 * os textos já editados de um relatório salvo. Identificação (setor, GHE, funções,
 * trabalhadores, jornada) vem sempre do cadastro; grupos/funções removidos somem.
 * As atividades editadas só são mantidas se o cadastro não mudou desde o salvamento.
 */
export function sincronizarGruposComCadastro(
  gruposBase: GrupoRelatorio[],
  salvos: GrupoRelatorio[] | undefined,
): GrupoRelatorio[] {
  const lista = Array.isArray(salvos) ? salvos : [];
  return gruposBase.map((g) => {
    const old = lista.find((x) => x.id === g.id);
    const base = { ...g, atividadesBase: g.atividades };
    if (!old) return base;
    const cadastroIgual = old.atividadesBase !== undefined && old.atividadesBase === g.atividades;
    const fatores = cadastroIgual && old.fatores?.length
      ? old.fatores
          .filter((f) => g.fatores.some((b) => b.key === f.key))
          .map((f) => ({ ...f, expostos: g.trabalhadores }))
      : g.fatores;
    return {
      ...old,
      id: g.id,
      setor: g.setor,
      ghe: g.ghe,
      funcoes: g.funcoes,
      trabalhadores: g.trabalhadores,
      jornada: g.jornada,
      respondentes: g.respondentes,
      atividades: cadastroIgual && old.atividades ? old.atividades : g.atividades,
      atividadesBase: g.atividades,
      organizacao: cadastroIgual ? old.organizacao : g.organizacao,
      fatores: fatores.length ? fatores : g.fatores,
    };
  });
}

export function medidasDosGrupos(grupos: GrupoRelatorio[]): MedidaControle[] {
  const out = new Map<string, MedidaControle>();
  for (const g of grupos) {
    for (const f of g.fatores) {
      if (f.sustentado === false || (f.nivel !== "Médio" && f.nivel !== "Alto")) continue;
      const meta = META[f.key];
      if (!meta) continue;
      const key = `${g.id}::${f.key}`;
      out.set(key, {
        key,
        grupo: `${g.setor} — ${g.ghe}`,
        risco: f.fator,
        medida: meta.medida,
        tipo: meta.tipoControle,
        responsavel: "",
        prazo: f.nivel === "Alto" ? "60 dias" : "90 dias",
        prioridade: f.nivel === "Alto" ? "Alta" : "Média",
        status: "",
      });
    }
  }
  return Array.from(out.values());
}

/** Mescla ações elegíveis com edições salvas e respeita exclusões persistidas. */
export function mesclarMedidasPlano(
  grupos: GrupoRelatorio[],
  salvas: MedidaControle[] = [],
  excluidas: string[] = [],
): MedidaControle[] {
  const salvasPorChave = new Map(salvas.map((medida) => [medida.key, medida]));
  const chavesExcluidas = new Set(excluidas);
  return medidasDosGrupos(grupos)
    .filter((medida) => !chavesExcluidas.has(medida.key))
    .map((medida) => ({ ...medida, ...(salvasPorChave.get(medida.key) || {}) }));
}


/** Fator caracterizado como risco (investigado + sustentado + acima de Baixo). */
export const fatorCaracterizado = (f: FatorRisco) => f.sustentado !== false && f.nivel !== "Baixo";

export function resumoPorGrupo(g: GrupoRelatorio) {
  const cont: Record<NivelRisco, number> = { Baixo: 0, "Médio": 0, Alto: 0, "Crítico": 0 };
  g.fatores.forEach((f) => {
    if (f.sustentado === false) { cont.Baixo += 1; return; }
    cont[f.nivel] += 1;
  });
  const ordenado = Object.entries(cont).sort((a, b) => b[1] - a[1]);
  const predominante = (ordenado[0]?.[1] ? ordenado[0][0] : "Baixo") as string;
  const criticos = g.fatores.filter((f) => f.nivel === "Alto" || f.nivel === "Crítico").map((f) => f.fator);
  return {
    cont,
    investigados: g.fatores.length,
    caracterizados: g.fatores.filter(fatorCaracterizado).length,
    predominante: g.fatores.length ? predominante : "—",
    criticos,
  };
}

/**
 * Ocupação da matriz de risco. Por definição metodológica, a matriz representa
 * apenas os riscos que demandam representação; fatores de nível Baixo são excluídos.
 */
export function matrizOcupada(grupos: GrupoRelatorio[]) {
  const m: Record<string, number> = {};
  for (const g of grupos) for (const f of g.fatores) {
    if (!fatorCaracterizado(f)) continue;
    const k = `${f.probabilidade}-${f.severidade}`;
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}

export type LinhaPgr = {
  setor: string;
  ghe: string;
  fator: string;
  nivel: NivelRisco;
  resultado: string;
  intervencao: string;
  justificativa: string;
};

/**
 * Rastreabilidade completa: todos os fatores investigados são listados,
 * diferenciando resultado da avaliação e necessidade de intervenção.
 */
export function riscosParaPgr(grupos: GrupoRelatorio[]): LinhaPgr[] {
  const out: LinhaPgr[] = [];
  for (const g of grupos) for (const f of g.fatores) {
    const emConformidade = f.sustentado === false;
    const caracterizado = fatorCaracterizado(f);
    const resultado = emConformidade
      ? "Baixo (investigado, considerado em conformidade)"
      : f.nivel === "Baixo"
        ? "Baixo (fator caracterizado em nível não prioritário)"
        : `${f.nivel} (P${f.probabilidade} x S${f.severidade})`;
    const intervencao = caracterizado
      ? (f.nivel === "Crítico" || f.nivel === "Alto"
        ? "Sim — intervenção prioritária"
        : "Sim — medidas de melhoria contínua")
      : "Não — manutenção e monitoramento";
    out.push({
      setor: g.setor,
      ghe: g.ghe,
      fator: f.fator,
      nivel: f.nivel,
      resultado,
      intervencao,
      justificativa: caracterizado
        ? `Nível ${f.nivel} (P${f.probabilidade} × S${f.severidade}) sustentado pelas respostas da avaliação; requer inclusão no inventário de riscos e no plano de ação do PGR (NR-01, item 1.5.3.2) e adequação da organização do trabalho (NR-17).`
        : `Dimensão investigada e registrada no inventário para fins de rastreabilidade, sem caracterização de exposição psicossocial que demande medida corretiva específica; mantém-se o monitoramento periódico previsto na NR-01.`,
    });
  }
  return out;
}

export function conclusaoTecnica(grupos: GrupoRelatorio[], empresaNome: string) {
  if (!grupos.length) return "Não foram identificados grupos homogêneos com avaliações válidas para análise.";

  const investigados = grupos.flatMap((g) => g.fatores);
  const caracterizados = investigados.filter(fatorCaracterizado);
  const baixos = investigados.filter((f) => f.sustentado !== false && f.nivel === "Baixo");
  const baixosEmConformidade = investigados.filter((f) => f.sustentado === false);
  const dimensoes = Array.from(new Set(investigados.map((f) => f.fator)));
  const criticos = caracterizados.filter((f) => f.nivel === "Crítico");
  const altos = caracterizados.filter((f) => f.nivel === "Alto");
  const medios = caracterizados.filter((f) => f.nivel === "Médio");
  const totalTrab = grupos.reduce((a, g) => a + (g.trabalhadores || 0), 0);
  const nomeGrupo = (g: GrupoRelatorio) => `${g.setor}${g.ghe && g.ghe !== "—" ? ` (${g.ghe})` : ""}`;
  const termo = (quantidade: number, singular: string, plural: string) => quantidade === 1 ? singular : plural;

  const partes: string[] = [];

  // Situação geral
  partes.push(
    `A avaliação dos fatores de risco psicossocial de ${empresaNome} abrangeu ${grupos.length} ${termo(grupos.length, "grupo homogêneo", "grupos homogêneos")} de exposição, ${totalTrab || 0} ${termo(totalTrab, "trabalhador envolvido", "trabalhadores envolvidos")} e ${dimensoes.length} ${termo(dimensoes.length, "dimensão", "dimensões")} do instrumento aplicado (${dimensoes.join("; ")}). Dos ${investigados.length} ${termo(investigados.length, "fator investigado", "fatores investigados")}, ${caracterizados.length} ${termo(caracterizados.length, "foi caracterizado", "foram caracterizados")} como risco psicossocial que demanda gestão e ${baixos.length + baixosEmConformidade.length} ${termo(baixos.length + baixosEmConformidade.length, "foi classificado", "foram classificados")} em nível Baixo.`,
  );

  // Principais resultados
  if (criticos.length || altos.length) {
    const dimAlt = Array.from(new Set([...criticos, ...altos].map((f) => f.fator)));
    partes.push(
      `Os principais resultados concentram-se em ${dimAlt.join("; ")}, com ${criticos.length} ${termo(criticos.length, "fator", "fatores")} em nível Crítico e ${altos.length} em nível Alto, o que caracteriza a necessidade de adoção prioritária de medidas de prevenção e controle, nos termos da NR-01 (gerenciamento de riscos ocupacionais) e da NR-17 (adequação da organização do trabalho às características psicofisiológicas dos trabalhadores).`,
    );
  } else if (medios.length) {
    partes.push(
      `Os fatores caracterizados situam-se em nível Médio (${Array.from(new Set(medios.map((f) => f.fator))).join("; ")}), demandando medidas de melhoria contínua da organização do trabalho e acompanhamento sistemático, sem configurar situação de prioridade imediata.`,
    );
  } else {
    partes.push(
      "Não foi caracterizado fator de risco psicossocial que demande medidas corretivas específicas no momento, prevalecendo condições organizacionais avaliadas como adequadas nos grupos analisados.",
    );
  }

  // Fatores classificados em nível Baixo
  if (baixos.length) {
    partes.push(
      `Os fatores classificados em nível Baixo (${Array.from(new Set(baixos.map((f) => f.fator))).join("; ")}) permanecem registrados no relatório, indicando condições atualmente controladas cuja manutenção depende da preservação das práticas organizacionais vigentes.`,
    );
  }
  if (baixosEmConformidade.length) {
    partes.push(
      `Os fatores ${Array.from(new Set(baixosEmConformidade.map((f) => f.fator))).join("; ")} foram investigados e considerados em conformidade, com classificação Baixa, permanecendo registrados para assegurar a rastreabilidade metodológica.`,
    );
  }

  // Análise por setor/GHE
  const linhas = grupos.map((g) => {
    const r = resumoPorGrupo(g);
    const pri = g.fatores.filter((f) => f.nivel === "Alto" || f.nivel === "Crítico").map((f) => f.fator);
    if (pri.length) {
      return `em ${nomeGrupo(g)}, com ${g.trabalhadores || 0} ${termo(g.trabalhadores || 0, "trabalhador", "trabalhadores")}, destacam-se ${pri.join(" e ")} em nível de maior atenção`;
    }
    if (r.caracterizados) {
      return `em ${nomeGrupo(g)}, com ${g.trabalhadores || 0} ${termo(g.trabalhadores || 0, "trabalhador", "trabalhadores")}, os fatores caracterizados situam-se em níveis intermediários, com predominância ${r.predominante}`;
    }
    return `em ${nomeGrupo(g)}, com ${g.trabalhadores || 0} ${termo(g.trabalhadores || 0, "trabalhador", "trabalhadores")}, não houve caracterização de fator que demande intervenção corretiva`;
  });
  partes.push(`Na análise por grupo homogêneo, ${linhas.join("; ")}.`);

  // Setores prioritários e comparação
  const prioritarios = grupos.filter((g) => g.fatores.some((f) => f.nivel === "Alto" || f.nivel === "Crítico"));
  if (prioritarios.length) {
    partes.push(
      `Constituem setores prioritários para intervenção: ${prioritarios.map(nomeGrupo).join("; ")}. Na comparação entre os grupos avaliados, esses setores apresentam maior concentração de fatores caracterizados em relação aos demais, o que orienta a sequência de execução do plano de ação.`,
    );
  } else if (grupos.length > 1) {
    partes.push(
      "Na comparação entre os grupos avaliados não se observa concentração de fatores em setor específico, indicando homogeneidade das condições psicossociais entre os grupos analisados.",
    );
  }

  // Controles, acompanhamento e reavaliação
  partes.push(
    caracterizados.length
      ? "Verifica-se a necessidade de implementação dos controles previstos no plano de ação deste relatório, com registro das evidências de execução, além da manutenção dos controles organizacionais já existentes que se mostraram eficazes."
      : "Verifica-se a necessidade de manutenção dos controles organizacionais existentes, responsáveis pelos resultados favoráveis observados, sem demanda de implantação de novas medidas corretivas no momento.",
  );
  partes.push(
    `Recomenda-se o acompanhamento contínuo dos indicadores organizacionais (absenteísmo, afastamentos, rotatividade, horas extras e queixas), a verificação periódica da eficácia das medidas adotadas e a reavaliação dos fatores psicossociais em prazo não superior a ${criticos.length ? "6 (seis)" : altos.length ? "9 (nove)" : "12 (doze)"} meses, ou sempre que houver alteração relevante na organização do trabalho, nos processos ou no quadro de pessoal.`,
  );

  return partes.join(" ");
}

/** Texto técnico do plano de ação, adaptado aos resultados reais da avaliação. */
export function planoAcaoTexto(grupos: GrupoRelatorio[], empresaNome: string) {
  const fatores = grupos.flatMap((g) => g.fatores);
  const priorizaveis = fatores.filter(
    (f) => f.sustentado !== false && (f.nivel === "Médio" || f.nivel === "Alto"),
  );
  const nomeGrupo = (g: GrupoRelatorio) => `${g.setor}${g.ghe && g.ghe !== "—" ? ` (${g.ghe})` : ""}`;

  if (priorizaveis.length) {
    const prio = grupos.filter((g) => g.fatores.some((f) => f.sustentado !== false && f.nivel === "Alto"));
    return [
      `O plano de ação a seguir consolida exclusivamente as medidas corretivas e preventivas que exigem priorização, decorrentes de ${priorizaveis.length} ${priorizaveis.length === 1 ? "fator classificado" : "fatores classificados"} em nível Médio ou Alto na avaliação de ${empresaNome}, com definição de responsável, prazo e prioridade; o campo de status é preenchido pela empresa ao longo da execução.`,
      prio.length
        ? `A execução deve ser priorizada nos grupos ${prio.map(nomeGrupo).join("; ")}, em razão do nível de risco identificado.`
        : "As medidas apresentadas correspondem aos grupos com classificação Média e exigem tratamento preventivo planejado.",
    ].join(" ");
  }

  return `Considerando os resultados obtidos em ${empresaNome}, não foram identificados fatores classificados em nível Médio ou Alto que exijam inclusão no Plano de Ação neste momento.`;
}

export function metodologiaTexto(opts: {
  periodo: string;
  participacao: string;
  observacao: string;
  respondentes: number;
  empresaNome?: string;
  grupos?: GrupoRelatorio[];
}) {
  const grupos = opts.grupos || [];
  const empresa = opts.empresaNome || "a empresa avaliada";
  const totalTrab = grupos.reduce((a, g) => a + (g.trabalhadores || 0), 0);
  const funcoes = Array.from(new Set(grupos.flatMap((g) => g.funcoes)));
  const listaGrupos = grupos
    .map((g) => `${g.setor}${g.ghe && g.ghe !== "—" ? ` (GHE/GES ${g.ghe})` : ""}`)
    .join("; ");
  const dimensoes = Array.from(new Set(grupos.flatMap((g) => g.fatores.map((f) => f.fator))));
  const dimensoesTxt = dimensoes.length
    ? dimensoes.join("; ")
    : "Exigências do Trabalho; Controle e Autonomia; Apoio Social; Reconhecimento e Recompensa; Segurança; Conflitos e Assédio; Saúde e Bem-Estar; Qualidade da Liderança";

  const p1 =
    `A avaliação dos fatores de risco psicossocial de ${empresa} foi realizada mediante aplicação do questionário COPSOQ (Copenhagen Psychosocial Questionnaire), instrumento validado para a investigação de fatores psicossociais no trabalho, complementada por entrevistas com os trabalhadores, observação direta das atividades nos postos de trabalho e análise documental das informações cadastrais de setores, grupos homogêneos, funções, descrição das atividades e jornada praticada. ` +
    (opts.observacao ? `A observação das atividades foi conduzida da seguinte forma: ${opts.observacao}. ` : "") +
    (opts.participacao ? `Quanto à participação dos trabalhadores: ${opts.participacao}. ` : "");

  const p2 =
    (grupos.length
      ? `A abrangência da avaliação compreendeu ${grupos.length} ${grupos.length === 1 ? "grupo homogêneo" : "grupos homogêneos"} de exposição, ${grupos.length === 1 ? "correspondente" : "correspondentes"} a ${listaGrupos}, envolvendo ${funcoes.length} ${funcoes.length === 1 ? "função" : "funções"} — ${funcoes.join(", ")}. `
      : "A abrangência da avaliação compreendeu os setores e grupos homogêneos de exposição registrados no cadastro da empresa. ") +
    (totalTrab
      ? `A população avaliada totaliza ${totalTrab} ${totalTrab === 1 ? "trabalhador envolvido" : "trabalhadores envolvidos"} nas funções analisadas. `
      : "A população avaliada corresponde aos trabalhadores das funções analisadas. ") +
    `A coleta de respostas ocorreu de forma individual, voluntária e anônima${opts.periodo ? `, no período de ${opts.periodo}` : ""}, sendo os dados tratados exclusivamente de forma agregada por grupo homogêneo, preservando a confidencialidade dos participantes.`;

  const p3 =
    "Os critérios de avaliação adotam matriz de risco que combina Probabilidade × Severidade, resultando no nível de risco de cada fator. As respostas de cada dimensão foram convertidas em índice de risco de 0 a 100, considerando a polaridade de cada questão; a probabilidade decorre do índice consolidado da dimensão e a severidade decorre da natureza do agravo potencial associado, obtendo-se os níveis Baixo, Médio, Alto e Crítico. " +
    `Dimensões com índice igual ou superior a ${LIMIAR_FATOR} são caracterizadas como fatores de risco psicossocial; abaixo desse limiar, o fator é registrado como investigado, considerado em conformidade e classificado em nível Baixo, assegurando a rastreabilidade integral da avaliação. Fator investigado não se confunde com fator de risco caracterizado, nem a classificação Baixa equivale à ausência de avaliação.`;

  const p4 =
    `Foram investigadas as seguintes categorias de fatores psicossociais: ${dimensoesTxt}. Cada categoria foi analisada à luz das condições de organização do trabalho de cada grupo homogêneo, considerando jornada, ritmo, autonomia, apoio social, relações interpessoais e liderança, em conformidade com a NR-01 (Gerenciamento de Riscos Ocupacionais) e a NR-17 (Ergonomia).`;

  return [p1.trim(), p2, p3, p4].join("\n\n");
}

export const INDICADORES_CAMPOS = [
  { key: "absenteismo", label: "Absenteísmo (%)", cor: "#2563eb" },
  { key: "afastamentos", label: "Afastamentos relacionados ao trabalho", cor: "#dc2626" },
  { key: "rotatividade", label: "Rotatividade (%)", cor: "#7c3aed" },
  { key: "horas_extras", label: "Horas extras (h/mês)", cor: "#ea580c" },
  { key: "queixas", label: "Queixas / reclamações", cor: "#0891b2" },
  { key: "acidentes", label: "Acidentes/incidentes ligados a fatores organizacionais", cor: "#b91c1c" },
  { key: "pesquisas", label: "Resultados de pesquisas/questionários", cor: "#059669" },
  { key: "outros", label: "Outros indicadores relevantes", cor: "#475569" },
];

export type IndicadorGrafico = { key: string; label: string; valor: number; cor: string; texto: string };

/** Somente indicadores preenchidos; separa os numéricos (graficáveis) dos qualitativos. */
export function indicadoresPreenchidos(dados: Record<string, string> | undefined) {
  const numericos: IndicadorGrafico[] = [];
  const qualitativos: { key: string; label: string; texto: string }[] = [];
  for (const c of INDICADORES_CAMPOS) {
    const bruto = (dados?.[c.key] || "").trim();
    if (!bruto) continue;
    const m = bruto.replace(/\./g, "").match(/-?\d+(?:[.,]\d+)?/);
    const v = m ? parseFloat(m[0].replace(",", ".")) : NaN;
    if (Number.isFinite(v)) numericos.push({ key: c.key, label: c.label, valor: v, cor: c.cor, texto: bruto });
    else qualitativos.push({ key: c.key, label: c.label, texto: bruto });
  }
  return { numericos, qualitativos };
}

/** Texto técnico interpretativo dos indicadores organizacionais informados. */
export function interpretarIndicadores(
  dados: Record<string, string> | undefined,
  grupos: GrupoRelatorio[],
): string {
  const { numericos, qualitativos } = indicadoresPreenchidos(dados);
  if (!numericos.length && !qualitativos.length) {
    return "Não foram informados indicadores organizacionais para esta avaliação. A ausência desses dados limita a análise de tendências e a correlação entre a organização do trabalho e os desfechos de saúde e de gestão de pessoas, recomendando-se seu registro sistemático para as próximas avaliações.";
  }

  const val = (k: string) => numericos.find((n) => n.key === k)?.valor;
  const partes: string[] = [];

  partes.push(
    `Foram considerados ${numericos.length + qualitativos.length} ${(numericos.length + qualitativos.length) === 1 ? "indicador organizacional informado" : "indicadores organizacionais informados"} pela empresa, apresentados de forma agregada: ${[...numericos.map((n) => `${n.label}: ${n.texto}`), ...qualitativos.map((q) => `${q.label}: ${q.texto}`)].join("; ")}.`,
  );

  const atencao: string[] = [];
  const favoraveis: string[] = [];
  const abs = val("absenteismo");
  if (abs !== undefined) {
    (abs >= 4 ? atencao : favoraveis).push(
      abs >= 4
        ? `o absenteísmo de ${abs}% situa-se em patamar elevado para fins de gestão ocupacional, constituindo ponto de atenção`
        : `o absenteísmo de ${abs}% mantém-se em patamar administrável`,
    );
  }
  const rot = val("rotatividade");
  if (rot !== undefined) {
    (rot >= 15 ? atencao : favoraveis).push(
      rot >= 15
        ? `a rotatividade de ${rot}% indica baixa retenção, o que pode estar associado a condições de organização do trabalho`
        : `a rotatividade de ${rot}% sugere estabilidade do quadro de pessoal`,
    );
  }
  const he = val("horas_extras");
  if (he !== undefined) {
    (he >= 20 ? atencao : favoraveis).push(
      he >= 20
        ? `a média de ${he} ${he === 1 ? "hora extra" : "horas extras"} por mês sinaliza prolongamento habitual da jornada`
        : `a média de ${he} ${he === 1 ? "hora extra" : "horas extras"} por mês indica jornada predominantemente regular`,
    );
  }
  const afa = val("afastamentos");
  if (afa !== undefined) {
    (afa > 0 ? atencao : favoraveis).push(
      afa > 0
        ? afa === 1 ? "registra-se 1 afastamento relacionado ao trabalho no período" : `registram-se ${afa} afastamentos relacionados ao trabalho no período`
        : "não há registro de afastamentos relacionados ao trabalho no período",
    );
  }
  const qx = val("queixas");
  if (qx !== undefined) {
    (qx > 0 ? atencao : favoraveis).push(
      qx > 0 ? qx === 1 ? "foi registrada 1 queixa ou reclamação" : `foram registradas ${qx} queixas ou reclamações` : "não foram registradas queixas ou reclamações",
    );
  }
  const ac = val("acidentes");
  if (ac !== undefined) {
    (ac > 0 ? atencao : favoraveis).push(
      ac > 0
        ? ac === 1 ? "há 1 acidente ou incidente associado a fatores organizacionais" : `há ${ac} acidentes ou incidentes associados a fatores organizacionais`
        : "não há acidentes ou incidentes associados a fatores organizacionais",
    );
  }

  if (favoraveis.length) partes.push(`Entre os resultados favoráveis, ${favoraveis.join("; ")}.`);
  if (atencao.length) partes.push(`Constituem pontos de atenção: ${atencao.join("; ")}.`);

  const caracterizados = grupos.flatMap((g) => g.fatores).filter(fatorCaracterizado);
  if (atencao.length && caracterizados.length) {
    partes.push(
      `Os indicadores acima são convergentes com os fatores caracterizados na avaliação psicossocial (${Array.from(new Set(caracterizados.map((f) => f.fator))).join("; ")}), sugerindo relação com aspectos da organização do trabalho. A convergência observada é indicativa e não estabelece relação causal, cuja verificação depende de investigação específica dos casos.`,
    );
  } else if (atencao.length) {
    partes.push(
      "Os indicadores em atenção não encontram, nesta avaliação, correspondência em fatores psicossociais caracterizados, não sendo possível estabelecer relação com a organização do trabalho a partir dos dados disponíveis.",
    );
  } else if (caracterizados.length) {
    partes.push(
      "Os indicadores informados não evidenciam desfechos desfavoráveis no período, ainda que tenham sido caracterizados fatores psicossociais na avaliação; recomenda-se o acompanhamento da sua evolução para verificar eventual agravamento.",
    );
  } else {
    partes.push(
      "Os indicadores informados são coerentes com o resultado da avaliação psicossocial, que não caracterizou fatores demandantes de medidas corretivas específicas.",
    );
  }

  partes.push(
    "Recomenda-se o monitoramento contínuo destes indicadores, com apuração periódica e comparação entre ciclos de avaliação, de modo a identificar tendências antes da ocorrência de agravos.",
  );

  return partes.join(" ");
}

