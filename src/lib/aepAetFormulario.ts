/** Formulário AEP/AET — navegação, etapas de coleta e persistência. */

import { normalizeDateOnly, todayDateOnly } from "@/lib/dateOnly";

export const TIPO_AEP_AET = "AEP-AET" as const;

/** Etapas implementadas nesta versão (mais virão depois). */
export const AEP_AET_ETAPAS = [
  { id: 1, titulo: "Identificação" },
  { id: 2, titulo: "Variabilidade da tarefa" },
  { id: 3, titulo: "Posturas de trabalho" },
  { id: 4, titulo: "Movimentos repetitivos" },
  { id: 5, titulo: "Esforço físico" },
  { id: 6, titulo: "Mobiliário e equipamentos" },
  { id: 7, titulo: "Ferramentas e mobiliário operacional" },
  { id: 8, titulo: "Condições ambientais" },
  { id: 9, titulo: "Organização do trabalho" },
  { id: 10, titulo: "Cronoanálise" },
  { id: 11, titulo: "Dados de saúde" },
  { id: 12, titulo: "Sugestões de melhoria" },
] as const;

export const AEP_AET_TOTAL_ETAPAS = AEP_AET_ETAPAS.length;

export type SimNao = "sim" | "nao" | "";

export type AepAetFoto = {
  id: string;
  imagem: string;
  nome?: string;
};

export const POSTURAS_TRABALHO = [
  "Sentado",
  "Em pé",
  "Alternado",
  "Agachado",
  "Ajoelhado",
  "Curvado",
  "Flexão de punho",
  "Braços acima dos ombros",
  "Outros",
] as const;

export type PosturaTrabalho = (typeof POSTURAS_TRABALHO)[number];

export const ESFORCOS_FISICOS = [
  "Levantamento de carga",
  "Transporte de carga",
  "Empurrar",
  "Puxar",
] as const;

export type EsforcoFisicoOpcao = (typeof ESFORCOS_FISICOS)[number];

export const ESFORCO_SEM_ATIVIDADE = "A função não realiza atividades de esforço físico" as const;

export type UnidadePeso = "kg" | "g" | "";

export type AepAetIdentificacao = {
  data_avaliacao: string;
  colaborador_avaliado: string;
  setor_avaliado: string;
  funcao_avaliada: string;
  qtd_colaboradores_funcao: string;
};

export type AepAetVariabilidade = {
  atividade_sempre_igual: SimNao;
  atividades_diferentes_dia: SimNao;
  rodizio_atividades: SimNao;
  realiza_horas_extras: SimNao;
  frequencia_horas_extras: string;
  observacoes: string;
};

export type AepAetPosturas = {
  posturas: PosturaTrabalho[];
  outros_descricao: string;
  fotos: AepAetFoto[];
};

export type AepAetMovimentosRepetitivos = {
  existem_movimentos_repetitivos: SimNao;
  descricao_atividade: string;
  frequencia: string;
  fotos: AepAetFoto[];
};

export type AepAetEsforcoFisico = {
  opcoes: EsforcoFisicoOpcao[];
  sem_esforco: boolean;
  peso_estimado: string;
  unidade: UnidadePeso;
  caracteristicas_carga: string;
  frequencia: string;
  descricao_atividade: string;
  fotos: AepAetFoto[];
};

export type AepAetMobiliarioMesa = {
  altura_cm: string;
  comprimento_cm: string;
  largura_cm: string;
  cor: string;
  fotos: AepAetFoto[];
};

export type AepAetMobiliarioCadeira = {
  altura_assento_cm: string;
  profundidade_assento_cm: string;
  largura_assento_cm: string;
  fotos: AepAetFoto[];
};

export type AepAetMobiliarioMonitor = {
  altura_monitor: string;
  distancia_olhos: string;
  distancia_teclado_borda: string;
  fotos: AepAetFoto[];
};

export type AepAetMobiliarioEquipamentos = {
  /** Quando true, mesa/cadeira/monitor ficam dispensados. */
  sem_mobiliario: boolean;
  mesa: AepAetMobiliarioMesa;
  cadeira: AepAetMobiliarioCadeira;
  monitor: AepAetMobiliarioMonitor;
};

export const MOBILIARIO_OPERACIONAL_SUGESTOES = [
  "Bancadas de trabalho",
  "Bancadas de montagem",
  "Cavaletes",
  "Carrinhos",
  "Prateleiras",
  "Suportes",
  "Mesas operacionais",
  "Outros",
] as const;

export type MobiliarioOperacionalSugestao = (typeof MOBILIARIO_OPERACIONAL_SUGESTOES)[number];

export type AepAetFerramentasMobiliario = {
  sugestoes: MobiliarioOperacionalSugestao[];
  descricao: string;
  fotos: AepAetFoto[];
};

export type AepAetCondicoesAmbientais = {
  iluminacao_lux: string;
  ruido_dba: string;
  temperatura_c: string;
  fotos: AepAetFoto[];
  vibracao_exposicao: SimNao;
  vibracao_valor: string;
  vibracao_unidade: string;
};

export type AepAetOrganizacaoTrabalho = {
  meta_producao: SimNao;
  ritmo_maquina: SimNao;
  rodizio_tarefas: SimNao;
  rodizio_colaboradores: SimNao;
  pausas_atividade: SimNao;
  observacoes: string;
};

export type AepAetCronoLinha = {
  id: string;
  tarefa: string;
  tempo_minutos: string;
  frequencia: string;
};

export type AepAetCronoanalise = {
  linhas: AepAetCronoLinha[];
};

export const LOCAIS_DESCONFORTO = [
  "Cabeça",
  "Mãos",
  "Pescoço",
  "Ombros",
  "Coluna superior",
  "Coluna inferior",
  "Punhos e mãos",
  "Quadril",
  "Coxas",
  "Joelhos",
  "Tornozelos e pés",
] as const;

export type LocalDesconforto = (typeof LOCAIS_DESCONFORTO)[number];

export type AepAetDadosSaude = {
  sente_desconforto: SimNao;
  locais: LocalDesconforto[];
};

export type AepAetSugestoesMelhoria = {
  sugestoes: string;
  observacoes: string;
  fotos: AepAetFoto[];
};

export type AepAetDados = {
  identificacao: AepAetIdentificacao;
  variabilidade: AepAetVariabilidade;
  posturas: AepAetPosturas;
  movimentos_repetitivos: AepAetMovimentosRepetitivos;
  esforco_fisico: AepAetEsforcoFisico;
  mobiliario_equipamentos: AepAetMobiliarioEquipamentos;
  ferramentas_mobiliario: AepAetFerramentasMobiliario;
  condicoes_ambientais: AepAetCondicoesAmbientais;
  organizacao_trabalho: AepAetOrganizacaoTrabalho;
  cronoanalise: AepAetCronoanalise;
  dados_saude: AepAetDadosSaude;
  sugestoes_melhoria: AepAetSugestoesMelhoria;
  /** Última etapa visitada (1-based). */
  etapa_atual: number;
};

export function novaLinhaCronoanalise(): AepAetCronoLinha {
  return {
    id: `crono_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    tarefa: "",
    tempo_minutos: "",
    frequencia: "",
  };
}

export type AepAetDraftSnapshot = {
  setor_id: string;
  funcao_id: string;
  dados: AepAetDados;
};

export type AepAetDocumento = {
  id: string;
  tipo: typeof TIPO_AEP_AET;
  empresa_id: string;
  contrato_id: string | null;
  empresa_nome: string;
  status: string;
  draft_snapshot: AepAetDraftSnapshot | null;
  created_at: string;
  updated_at: string;
};

function lerSimNao(v: unknown): SimNao {
  if (v === "sim" || v === "nao") return v;
  return "";
}

function novaFotoId() {
  return `foto_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function criarFotoAepAet(imagem: string, nome?: string): AepAetFoto {
  return { id: novaFotoId(), imagem, nome };
}

function lerFotos(raw: unknown): AepAetFoto[] {
  if (!Array.isArray(raw)) return [];
  const fotos: AepAetFoto[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const f = item as Record<string, unknown>;
    const imagem = typeof f.imagem === "string" ? f.imagem : "";
    if (!imagem.startsWith("data:image/")) continue;
    fotos.push({
      id: typeof f.id === "string" && f.id ? f.id : novaFotoId(),
      imagem,
      nome: typeof f.nome === "string" ? f.nome : undefined,
    });
  }
  return fotos;
}

function lerPosturas(raw: unknown): PosturaTrabalho[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set(POSTURAS_TRABALHO);
  return raw.filter((p): p is PosturaTrabalho => typeof p === "string" && set.has(p as PosturaTrabalho));
}

function lerEsforcos(raw: unknown): EsforcoFisicoOpcao[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set(ESFORCOS_FISICOS);
  return raw.filter((p): p is EsforcoFisicoOpcao => typeof p === "string" && set.has(p as EsforcoFisicoOpcao));
}

function lerUnidade(v: unknown): UnidadePeso {
  if (v === "kg" || v === "g") return v;
  return "";
}

function lerTexto(v: unknown): string {
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

function lerSugestoesMobiliario(raw: unknown): MobiliarioOperacionalSugestao[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set(MOBILIARIO_OPERACIONAL_SUGESTOES);
  return raw.filter(
    (p): p is MobiliarioOperacionalSugestao =>
      typeof p === "string" && set.has(p as MobiliarioOperacionalSugestao),
  );
}

function lerLocaisDesconforto(raw: unknown): LocalDesconforto[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set(LOCAIS_DESCONFORTO);
  return raw.filter(
    (p): p is LocalDesconforto => typeof p === "string" && set.has(p as LocalDesconforto),
  );
}

function lerLinhasCrono(raw: unknown): AepAetCronoLinha[] {
  if (!Array.isArray(raw) || raw.length === 0) return [novaLinhaCronoanalise()];
  const linhas = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string, unknown>;
      return {
        id: typeof r.id === "string" && r.id ? r.id : novaLinhaCronoanalise().id,
        tarefa: lerTexto(r.tarefa),
        tempo_minutos: lerTexto(r.tempo_minutos),
        frequencia: lerTexto(r.frequencia),
      } satisfies AepAetCronoLinha;
    })
    .filter((l): l is AepAetCronoLinha => !!l);
  return linhas.length ? linhas : [novaLinhaCronoanalise()];
}

/** Número finito ≥ 0 (medidas e condições ambientais). */
export function numeroNaoNegativo(v: string): number | null {
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Número finito (permite negativo — ex.: temperatura). */
export function numeroFinito(v: string): number | null {
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

export function dadosVaziosAepAet(opts?: {
  setorNome?: string;
  funcaoNome?: string;
}): AepAetDados {
  return {
    identificacao: {
      data_avaliacao: todayDateOnly(),
      colaborador_avaliado: "",
      setor_avaliado: opts?.setorNome || "",
      funcao_avaliada: opts?.funcaoNome || "",
      qtd_colaboradores_funcao: "",
    },
    variabilidade: {
      atividade_sempre_igual: "",
      atividades_diferentes_dia: "",
      rodizio_atividades: "",
      realiza_horas_extras: "",
      frequencia_horas_extras: "",
      observacoes: "",
    },
    posturas: {
      posturas: [],
      outros_descricao: "",
      fotos: [],
    },
    movimentos_repetitivos: {
      existem_movimentos_repetitivos: "",
      descricao_atividade: "",
      frequencia: "",
      fotos: [],
    },
    esforco_fisico: {
      opcoes: [],
      sem_esforco: false,
      peso_estimado: "",
      unidade: "",
      caracteristicas_carga: "",
      frequencia: "",
      descricao_atividade: "",
      fotos: [],
    },
    mobiliario_equipamentos: {
      sem_mobiliario: false,
      mesa: { altura_cm: "", comprimento_cm: "", largura_cm: "", cor: "", fotos: [] },
      cadeira: {
        altura_assento_cm: "",
        profundidade_assento_cm: "",
        largura_assento_cm: "",
        fotos: [],
      },
      monitor: {
        altura_monitor: "",
        distancia_olhos: "",
        distancia_teclado_borda: "",
        fotos: [],
      },
    },
    ferramentas_mobiliario: {
      sugestoes: [],
      descricao: "",
      fotos: [],
    },
    condicoes_ambientais: {
      iluminacao_lux: "",
      ruido_dba: "",
      temperatura_c: "",
      fotos: [],
      vibracao_exposicao: "",
      vibracao_valor: "",
      vibracao_unidade: "",
    },
    organizacao_trabalho: {
      meta_producao: "",
      ritmo_maquina: "",
      rodizio_tarefas: "",
      rodizio_colaboradores: "",
      pausas_atividade: "",
      observacoes: "",
    },
    cronoanalise: {
      linhas: [novaLinhaCronoanalise()],
    },
    dados_saude: {
      sente_desconforto: "",
      locais: [],
    },
    sugestoes_melhoria: {
      sugestoes: "",
      observacoes: "",
      fotos: [],
    },
    etapa_atual: 1,
  };
}

export function lerDadosAepAet(
  raw: unknown,
  defaults?: { setorNome?: string; funcaoNome?: string },
): AepAetDados {
  const base = dadosVaziosAepAet(defaults);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const d = raw as Record<string, unknown>;
  const id =
    d.identificacao && typeof d.identificacao === "object" && !Array.isArray(d.identificacao)
      ? (d.identificacao as Record<string, unknown>)
      : {};
  const va =
    d.variabilidade && typeof d.variabilidade === "object" && !Array.isArray(d.variabilidade)
      ? (d.variabilidade as Record<string, unknown>)
      : {};
  const po =
    d.posturas && typeof d.posturas === "object" && !Array.isArray(d.posturas)
      ? (d.posturas as Record<string, unknown>)
      : {};
  const mr =
    d.movimentos_repetitivos && typeof d.movimentos_repetitivos === "object" && !Array.isArray(d.movimentos_repetitivos)
      ? (d.movimentos_repetitivos as Record<string, unknown>)
      : {};
  const ef =
    d.esforco_fisico && typeof d.esforco_fisico === "object" && !Array.isArray(d.esforco_fisico)
      ? (d.esforco_fisico as Record<string, unknown>)
      : {};
  const me =
    d.mobiliario_equipamentos && typeof d.mobiliario_equipamentos === "object" && !Array.isArray(d.mobiliario_equipamentos)
      ? (d.mobiliario_equipamentos as Record<string, unknown>)
      : {};
  const mesaRaw =
    me.mesa && typeof me.mesa === "object" && !Array.isArray(me.mesa)
      ? (me.mesa as Record<string, unknown>)
      : {};
  const cadRaw =
    me.cadeira && typeof me.cadeira === "object" && !Array.isArray(me.cadeira)
      ? (me.cadeira as Record<string, unknown>)
      : {};
  const monRaw =
    me.monitor && typeof me.monitor === "object" && !Array.isArray(me.monitor)
      ? (me.monitor as Record<string, unknown>)
      : {};
  const fm =
    d.ferramentas_mobiliario && typeof d.ferramentas_mobiliario === "object" && !Array.isArray(d.ferramentas_mobiliario)
      ? (d.ferramentas_mobiliario as Record<string, unknown>)
      : {};
  const ca =
    d.condicoes_ambientais && typeof d.condicoes_ambientais === "object" && !Array.isArray(d.condicoes_ambientais)
      ? (d.condicoes_ambientais as Record<string, unknown>)
      : {};
  const org =
    d.organizacao_trabalho && typeof d.organizacao_trabalho === "object" && !Array.isArray(d.organizacao_trabalho)
      ? (d.organizacao_trabalho as Record<string, unknown>)
      : {};
  const cr =
    d.cronoanalise && typeof d.cronoanalise === "object" && !Array.isArray(d.cronoanalise)
      ? (d.cronoanalise as Record<string, unknown>)
      : {};
  const ds =
    d.dados_saude && typeof d.dados_saude === "object" && !Array.isArray(d.dados_saude)
      ? (d.dados_saude as Record<string, unknown>)
      : {};
  const sm =
    d.sugestoes_melhoria && typeof d.sugestoes_melhoria === "object" && !Array.isArray(d.sugestoes_melhoria)
      ? (d.sugestoes_melhoria as Record<string, unknown>)
      : {};

  const setor =
    typeof id.setor_avaliado === "string" && id.setor_avaliado.trim()
      ? id.setor_avaliado
      : base.identificacao.setor_avaliado;
  const funcao =
    typeof id.funcao_avaliada === "string" && id.funcao_avaliada.trim()
      ? id.funcao_avaliada
      : base.identificacao.funcao_avaliada;

  const etapaRaw = typeof d.etapa_atual === "number" ? d.etapa_atual : 1;
  const etapa_atual = Math.min(AEP_AET_TOTAL_ETAPAS, Math.max(1, Math.floor(etapaRaw) || 1));

  const posturasSel = lerPosturas(po.posturas);
  const esforcoOpcoes = lerEsforcos(ef.opcoes);
  const semEsforcoFlag =
    ef.sem_esforco === true ||
    (Array.isArray(ef.opcoes) && ef.opcoes.includes(ESFORCO_SEM_ATIVIDADE));
  const sem_esforco = esforcoOpcoes.length === 0 && semEsforcoFlag;

  return {
    identificacao: {
      data_avaliacao:
        normalizeDateOnly(typeof id.data_avaliacao === "string" ? id.data_avaliacao : "") ||
        base.identificacao.data_avaliacao,
      colaborador_avaliado:
        typeof id.colaborador_avaliado === "string" ? id.colaborador_avaliado : "",
      setor_avaliado: setor,
      funcao_avaliada: funcao,
      qtd_colaboradores_funcao:
        id.qtd_colaboradores_funcao == null
          ? ""
          : String(id.qtd_colaboradores_funcao),
    },
    variabilidade: {
      atividade_sempre_igual: lerSimNao(va.atividade_sempre_igual),
      atividades_diferentes_dia: lerSimNao(va.atividades_diferentes_dia),
      rodizio_atividades: lerSimNao(va.rodizio_atividades),
      realiza_horas_extras: lerSimNao(va.realiza_horas_extras),
      frequencia_horas_extras:
        typeof va.frequencia_horas_extras === "string" ? va.frequencia_horas_extras : "",
      observacoes: typeof va.observacoes === "string" ? va.observacoes : "",
    },
    posturas: {
      posturas: posturasSel,
      outros_descricao: typeof po.outros_descricao === "string" ? po.outros_descricao : "",
      fotos: lerFotos(po.fotos),
    },
    movimentos_repetitivos: {
      existem_movimentos_repetitivos: lerSimNao(mr.existem_movimentos_repetitivos),
      descricao_atividade: typeof mr.descricao_atividade === "string" ? mr.descricao_atividade : "",
      frequencia: typeof mr.frequencia === "string" ? mr.frequencia : "",
      fotos: lerFotos(mr.fotos),
    },
    esforco_fisico: {
      opcoes: sem_esforco ? [] : esforcoOpcoes,
      sem_esforco,
      peso_estimado: typeof ef.peso_estimado === "string" ? ef.peso_estimado : ef.peso_estimado != null ? String(ef.peso_estimado) : "",
      unidade: lerUnidade(ef.unidade),
      caracteristicas_carga: typeof ef.caracteristicas_carga === "string" ? ef.caracteristicas_carga : "",
      frequencia: typeof ef.frequencia === "string" ? ef.frequencia : "",
      descricao_atividade: typeof ef.descricao_atividade === "string" ? ef.descricao_atividade : "",
      fotos: sem_esforco ? [] : lerFotos(ef.fotos),
    },
    mobiliario_equipamentos: {
      sem_mobiliario: me.sem_mobiliario === true,
      mesa: {
        altura_cm: lerTexto(mesaRaw.altura_cm),
        comprimento_cm: lerTexto(mesaRaw.comprimento_cm),
        largura_cm: lerTexto(mesaRaw.largura_cm),
        cor: lerTexto(mesaRaw.cor),
        fotos: lerFotos(mesaRaw.fotos),
      },
      cadeira: {
        altura_assento_cm: lerTexto(cadRaw.altura_assento_cm),
        profundidade_assento_cm: lerTexto(cadRaw.profundidade_assento_cm),
        largura_assento_cm: lerTexto(cadRaw.largura_assento_cm),
        fotos: lerFotos(cadRaw.fotos),
      },
      monitor: {
        altura_monitor: lerTexto(monRaw.altura_monitor),
        distancia_olhos: lerTexto(monRaw.distancia_olhos),
        distancia_teclado_borda: lerTexto(monRaw.distancia_teclado_borda),
        fotos: lerFotos(monRaw.fotos),
      },
    },
    ferramentas_mobiliario: {
      sugestoes: lerSugestoesMobiliario(fm.sugestoes),
      descricao: lerTexto(fm.descricao),
      fotos: lerFotos(fm.fotos),
    },
    condicoes_ambientais: {
      iluminacao_lux: lerTexto(ca.iluminacao_lux),
      ruido_dba: lerTexto(ca.ruido_dba),
      temperatura_c: lerTexto(ca.temperatura_c),
      fotos: lerFotos(ca.fotos),
      vibracao_exposicao: lerSimNao(ca.vibracao_exposicao),
      vibracao_valor: lerTexto(ca.vibracao_valor),
      vibracao_unidade: lerTexto(ca.vibracao_unidade),
    },
    organizacao_trabalho: {
      meta_producao: lerSimNao(org.meta_producao),
      ritmo_maquina: lerSimNao(org.ritmo_maquina),
      rodizio_tarefas: lerSimNao(org.rodizio_tarefas),
      rodizio_colaboradores: lerSimNao(org.rodizio_colaboradores),
      pausas_atividade: lerSimNao(org.pausas_atividade),
      observacoes: lerTexto(org.observacoes),
    },
    cronoanalise: {
      linhas: lerLinhasCrono(cr.linhas),
    },
    dados_saude: {
      sente_desconforto: lerSimNao(ds.sente_desconforto),
      locais: lerLocaisDesconforto(ds.locais),
    },
    sugestoes_melhoria: {
      sugestoes: lerTexto(sm.sugestoes),
      observacoes: lerTexto(sm.observacoes),
      fotos: lerFotos(sm.fotos),
    },
    etapa_atual,
  };
}

/** Normaliza exclusão mútua entre opções de esforço e "sem esforço". */
export function aplicarSelecaoEsforco(
  atual: AepAetEsforcoFisico,
  opcao: EsforcoFisicoOpcao | typeof ESFORCO_SEM_ATIVIDADE,
  marcado: boolean,
): AepAetEsforcoFisico {
  if (opcao === ESFORCO_SEM_ATIVIDADE) {
    if (!marcado) return { ...atual, sem_esforco: false };
    return {
      ...atual,
      sem_esforco: true,
      opcoes: [],
      peso_estimado: "",
      unidade: "",
      caracteristicas_carga: "",
      frequencia: "",
      descricao_atividade: "",
      fotos: [],
    };
  }
  const set = new Set(atual.opcoes);
  if (marcado) set.add(opcao);
  else set.delete(opcao);
  const opcoes = ESFORCOS_FISICOS.filter((o) => set.has(o));
  return {
    ...atual,
    sem_esforco: false,
    opcoes,
  };
}

export function lerSnapshotAepAet(raw: unknown): AepAetDraftSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const snap = raw as Record<string, unknown>;
  const setor_id = typeof snap.setor_id === "string" ? snap.setor_id : "";
  const funcao_id = typeof snap.funcao_id === "string" ? snap.funcao_id : "";
  if (!setor_id || !funcao_id) return null;
  return {
    setor_id,
    funcao_id,
    dados: lerDadosAepAet(snap.dados),
  };
}

export function validarEtapaIdentificacao(d: AepAetIdentificacao): string | null {
  if (!normalizeDateOnly(d.data_avaliacao)) return "Informe a data da avaliação.";
  if (!d.colaborador_avaliado.trim()) return "Informe o colaborador avaliado.";
  if (!d.setor_avaliado.trim()) return "Informe o setor avaliado.";
  if (!d.funcao_avaliada.trim()) return "Informe a função avaliada.";
  const qtd = Number(String(d.qtd_colaboradores_funcao).replace(",", "."));
  if (!Number.isFinite(qtd) || qtd < 1 || !Number.isInteger(qtd)) {
    return "Informe a quantidade de colaboradores (número inteiro ≥ 1).";
  }
  return null;
}

export function validarEtapaVariabilidade(d: AepAetVariabilidade): string | null {
  if (!d.atividade_sempre_igual) return "Responda: a atividade é sempre igual?";
  if (!d.atividades_diferentes_dia) return "Responda: existem atividades diferentes ao longo do dia?";
  if (!d.rodizio_atividades) return "Responda: existe rodízio de atividades?";
  if (!d.realiza_horas_extras) return "Responda: realiza horas extras?";
  if (d.realiza_horas_extras === "sim" && !d.frequencia_horas_extras.trim()) {
    return "Informe a frequência das horas extras.";
  }
  return null;
}

export function validarEtapaPosturas(d: AepAetPosturas): string | null {
  if (!d.posturas.length) return "Selecione pelo menos uma postura de trabalho.";
  if (d.posturas.includes("Outros") && !d.outros_descricao.trim()) {
    return "Descreva a postura em “Outros”.";
  }
  if (!d.fotos.length) return "Inclua pelo menos uma fotografia das posturas.";
  return null;
}

export function validarEtapaMovimentos(d: AepAetMovimentosRepetitivos): string | null {
  if (!d.existem_movimentos_repetitivos) {
    return "Responda: existem movimentos repetitivos?";
  }
  if (d.existem_movimentos_repetitivos === "nao") return null;
  if (!d.descricao_atividade.trim()) return "Descreva a atividade com movimentos repetitivos.";
  if (!d.fotos.length) return "Inclua pelo menos uma foto dos movimentos repetitivos.";
  if (!d.frequencia.trim()) return "Informe a frequência de realização.";
  return null;
}

export function validarEtapaEsforco(d: AepAetEsforcoFisico): string | null {
  if (!d.sem_esforco && d.opcoes.length === 0) {
    return "Selecione pelo menos uma opção de esforço físico.";
  }
  if (d.sem_esforco) return null;

  const peso = Number(String(d.peso_estimado).replace(",", "."));
  if (!Number.isFinite(peso) || peso <= 0) return "Informe o peso estimado da carga.";
  if (!d.unidade) return "Selecione a unidade (kg ou g).";
  if (!d.caracteristicas_carga.trim()) return "Informe as características da carga.";
  if (!d.fotos.length) return "Inclua pelo menos uma foto do esforço físico.";
  if (!d.frequencia.trim()) return "Informe a frequência do esforço físico.";
  if (!d.descricao_atividade.trim()) return "Descreva a atividade de esforço físico.";
  return null;
}

export function validarEtapaMobiliario(d: AepAetMobiliarioEquipamentos): string | null {
  if (d.sem_mobiliario) return null;

  if (numeroNaoNegativo(d.mesa.altura_cm) == null) return "Informe a altura da mesa (cm).";
  if (numeroNaoNegativo(d.mesa.comprimento_cm) == null) return "Informe o comprimento da mesa (cm).";
  if (numeroNaoNegativo(d.mesa.largura_cm) == null) return "Informe a largura da mesa (cm).";
  if (!d.mesa.cor.trim()) return "Informe a cor da mesa.";
  if (d.mesa.fotos.length < 1) return "Inclua pelo menos uma foto da mesa.";

  if (numeroNaoNegativo(d.cadeira.altura_assento_cm) == null) {
    return "Informe a altura do assento (cm).";
  }
  if (numeroNaoNegativo(d.cadeira.profundidade_assento_cm) == null) {
    return "Informe a profundidade do assento (cm).";
  }
  if (numeroNaoNegativo(d.cadeira.largura_assento_cm) == null) {
    return "Informe a largura do assento (cm).";
  }
  if (d.cadeira.fotos.length < 1) return "Inclua pelo menos uma foto da cadeira.";

  if (numeroNaoNegativo(d.monitor.altura_monitor) == null) return "Informe a altura do monitor.";
  if (numeroNaoNegativo(d.monitor.distancia_olhos) == null) {
    return "Informe a distância do monitor aos olhos.";
  }
  if (numeroNaoNegativo(d.monitor.distancia_teclado_borda) == null) {
    return "Informe a distância entre o teclado e a borda da mesa.";
  }
  if (d.monitor.fotos.length < 1) return "Inclua pelo menos uma foto do monitor e periféricos.";
  return null;
}

export function validarEtapaFerramentas(d: AepAetFerramentasMobiliario): string | null {
  if (!d.sugestoes.length && !d.descricao.trim()) {
    return "Selecione sugestões ou descreva as ferramentas/mobiliário operacional.";
  }
  if (d.sugestoes.includes("Outros") && !d.descricao.trim()) {
    return "Descreva o item em “Outros”.";
  }
  if (d.fotos.length < 1) return "Inclua pelo menos uma fotografia das ferramentas/mobiliário.";
  return null;
}

export function validarEtapaCondicoes(d: AepAetCondicoesAmbientais): string | null {
  if (numeroNaoNegativo(d.iluminacao_lux) == null) return "Informe a iluminação (lux).";
  if (numeroNaoNegativo(d.ruido_dba) == null) return "Informe o ruído (dB(A)).";
  if (numeroFinito(d.temperatura_c) == null) return "Informe a temperatura (°C).";
  if (d.fotos.length < 1) return "Inclua a foto do ambiente.";
  if (!d.vibracao_exposicao) return "Responda: existe exposição à vibração?";
  if (d.vibracao_exposicao === "sim") {
    if (numeroNaoNegativo(d.vibracao_valor) == null) return "Informe o valor medido da vibração.";
    if (!d.vibracao_unidade.trim()) return "Informe a unidade da vibração.";
  }
  return null;
}

export function validarEtapaOrganizacao(d: AepAetOrganizacaoTrabalho): string | null {
  if (!d.meta_producao) return "Responda: existe meta de produção?";
  if (!d.ritmo_maquina) return "Responda: existem atividades com ritmo imposto por máquina?";
  if (!d.rodizio_tarefas) return "Responda: existe rodízio de tarefas?";
  if (!d.rodizio_colaboradores) return "Responda: existe rodízio de colaboradores?";
  if (!d.pausas_atividade) return "Responda: existem pausas durante a atividade?";
  return null;
}

export function validarEtapaCronoanalise(d: AepAetCronoanalise): string | null {
  if (!d.linhas.length) return "Adicione pelo menos uma linha na cronoanálise.";
  for (let i = 0; i < d.linhas.length; i += 1) {
    const l = d.linhas[i];
    const n = i + 1;
    if (!l.tarefa.trim()) return `Informe a tarefa na linha ${n}.`;
    const tempo = numeroNaoNegativo(l.tempo_minutos);
    if (tempo == null || tempo <= 0) return `Informe o tempo (minutos) na linha ${n}.`;
    if (!l.frequencia.trim()) return `Informe a frequência na linha ${n}.`;
  }
  return null;
}

export function validarEtapaSaude(d: AepAetDadosSaude): string | null {
  if (!d.sente_desconforto) {
    return "Responda: o colaborador sente algum tipo de desconforto físico?";
  }
  if (d.sente_desconforto === "sim" && d.locais.length === 0) {
    return "Selecione pelo menos um local de desconforto.";
  }
  return null;
}

export function validarEtapaSugestoes(_d: AepAetSugestoesMelhoria): string | null {
  // Sugestões, observações e fotos são opcionais na etapa final.
  return null;
}

export function validarEtapaAepAet(etapa: number, dados: AepAetDados): string | null {
  if (etapa === 1) return validarEtapaIdentificacao(dados.identificacao);
  if (etapa === 2) return validarEtapaVariabilidade(dados.variabilidade);
  if (etapa === 3) return validarEtapaPosturas(dados.posturas);
  if (etapa === 4) return validarEtapaMovimentos(dados.movimentos_repetitivos);
  if (etapa === 5) return validarEtapaEsforco(dados.esforco_fisico);
  if (etapa === 6) return validarEtapaMobiliario(dados.mobiliario_equipamentos);
  if (etapa === 7) return validarEtapaFerramentas(dados.ferramentas_mobiliario);
  if (etapa === 8) return validarEtapaCondicoes(dados.condicoes_ambientais);
  if (etapa === 9) return validarEtapaOrganizacao(dados.organizacao_trabalho);
  if (etapa === 10) return validarEtapaCronoanalise(dados.cronoanalise);
  if (etapa === 11) return validarEtapaSaude(dados.dados_saude);
  if (etapa === 12) return validarEtapaSugestoes(dados.sugestoes_melhoria);
  return null;
}

/** Valida todas as etapas; retorna a primeira pendência. */
export function validarFormularioAepAetCompleto(dados: AepAetDados): { etapa: number; erro: string } | null {
  for (let s = 1; s <= AEP_AET_TOTAL_ETAPAS; s += 1) {
    const erro = validarEtapaAepAet(s, dados);
    if (erro) return { etapa: s, erro };
  }
  return null;
}

export function rotuloSimNao(v: SimNao): string {
  if (v === "sim") return "Sim";
  if (v === "nao") return "Não";
  return "—";
}

export const AEP_AET_FOTO_MAX_BYTES = 8 * 1024 * 1024;

export async function lerArquivoImagemAepAet(file: File): Promise<AepAetFoto> {
  const okType = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type)
    || file.type.startsWith("image/");
  if (!okType) throw new Error("Selecione uma imagem (JPEG, PNG ou WebP).");
  if (file.size > AEP_AET_FOTO_MAX_BYTES) throw new Error("A imagem deve ter no máximo 8 MB.");
  const imagem = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
  if (!imagem.startsWith("data:image/")) throw new Error("Arquivo de imagem inválido.");
  return criarFotoAepAet(imagem, file.name);
}

export function urlAepAetEmpresa(empresaId: string) {
  return `/formulario-aep-aet/${empresaId}`;
}

export function urlAepAetContrato(empresaId: string, contratoId: string) {
  return `/formulario-aep-aet/${empresaId}/${contratoId}`;
}

export function urlAepAetRegistro(empresaId: string, contratoId: string, avaliacaoId: string) {
  return `/formulario-aep-aet/${empresaId}/${contratoId}/funcao/${avaliacaoId}`;
}

export function urlAepAetOffline(empresaId: string, contratoId: string, clientId: string) {
  return `/formulario-aep-aet/${empresaId}/${contratoId}/offline/${clientId}`;
}

export function urlAepAetNovo(params?: { empresa?: string; contrato?: string }) {
  const q = new URLSearchParams();
  if (params?.empresa) q.set("empresa", params.empresa);
  if (params?.contrato) q.set("contrato", params.contrato);
  const s = q.toString();
  return s ? `/formulario-aep-aet/novo?${s}` : "/formulario-aep-aet/novo";
}
