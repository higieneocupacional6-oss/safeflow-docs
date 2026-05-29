import type {
  PcmsoSetor,
  PcmsoRevisao,
  PcmsoEpiBloco,
  PcmsoTreinBloco,
  PcmsoCronoItem,
} from "./copyPgrToPcmso";

const MESES_PT = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "");
const yesNo = (v: boolean) => (v ? "Sim" : "Não");

export type BuildArgs = {
  empresa: any;
  identificacao: {
    responsavel_tecnico: string;
    crea: string;
    cargo: string;
    data_elaboracao?: string | null;
    vigencia_inicio?: string | null;
    vigencia_fim?: string | null;
  };
  revisoes: PcmsoRevisao[];
  setores: PcmsoSetor[];
  epi_blocos: PcmsoEpiBloco[];
  treinamento_blocos: PcmsoTreinBloco[];
  cronograma: PcmsoCronoItem[];
  funcoesEmpresa: any[];
};

export function buildPcmsoTemplateData(args: BuildArgs) {
  const { empresa, identificacao, revisoes, setores, epi_blocos, treinamento_blocos, cronograma, funcoesEmpresa } = args;
  const emp = empresa || {};

  const setoresArr = (setores || []).map((s) => ({
    nome_setor: s.nome_setor || "",
    funcoes: s.funcoes || "",
    agentes_fisicos: (s.agentes_fisicos || []).join("; "),
    agentes_quimicos: (s.agentes_quimicos || []).join("; "),
    agentes_biologicos: (s.agentes_biologicos || []).join("; "),
    agentes_ergonomicos: (s.agentes_ergonomicos || []).join("; "),
    agentes_acidentes: (s.agentes_acidentes || []).join("; "),
    agentes_psicossociais: (s.agentes_psicossociais || []).join("; "),
    exames: (s.exames || []).map((ex) => ({
      tipo_exame: ex.tipo_exame || "",
      cod_esocial: ex.cod_esocial || "",
      descricao_esocial: ex.descricao_esocial || "",
      admissional: yesNo(ex.admissional),
      periodico: yesNo(ex.periodico),
      periodo: ex.periodo || "",
      retorno_trabalho: yesNo(ex.retorno_trabalho),
      mudanca_funcao: yesNo(ex.mudanca_funcao),
      demissional: yesNo(ex.demissional),
      observacao: ex.observacao || "",
    })),
  }));

  // EPIs agrupados por função
  const epiPorFuncao = new Map<string, { nome_funcao: string; itens: { nome_epi: string; ca: string; uso: string }[] }>();
  (epi_blocos || []).forEach((b) => {
    const funcs = (funcoesEmpresa || []).filter((f: any) => b.funcao_ids.includes(f.id));
    funcs.forEach((f: any) => {
      if (!epiPorFuncao.has(f.id)) epiPorFuncao.set(f.id, { nome_funcao: f.nome_funcao || "", itens: [] });
      const bucket = epiPorFuncao.get(f.id)!;
      b.epis.forEach((e) => {
        const nome = (e.nome_epi || "").trim();
        if (!nome) return;
        if (!bucket.itens.some((i) => i.nome_epi === nome && i.ca === (e.ca || ""))) {
          bucket.itens.push({ nome_epi: nome, ca: e.ca || "", uso: e.uso || "" });
        }
      });
    });
  });
  const epis = Array.from(epiPorFuncao.values()).map((g) => ({
    funcao: g.nome_funcao,
    nome_funcao: g.nome_funcao,
    epis_funcao: g.itens.map((i) => `${i.nome_epi}${i.ca ? ` CA ${i.ca}` : ""}${i.uso ? ` – ${i.uso}` : ""}`).join("; "),
    itens_epi: g.itens.map((i, idx) => ({ ...i, index: idx + 1, is_first: idx === 0, is_rest: idx > 0 })),
    total_itens: g.itens.length,
  }));

  // Treinamentos agrupados por função
  const treinPorFuncao = new Map<string, { nome_funcao: string; itens: string[] }>();
  (treinamento_blocos || []).forEach((b) => {
    const funcs = (funcoesEmpresa || []).filter((f: any) => b.funcao_ids.includes(f.id));
    funcs.forEach((f: any) => {
      if (!treinPorFuncao.has(f.id)) treinPorFuncao.set(f.id, { nome_funcao: f.nome_funcao || "", itens: [] });
      const bucket = treinPorFuncao.get(f.id)!;
      b.treinamentos.forEach((t) => {
        const nome = (t.nome_treinamento || "").trim();
        if (nome && !bucket.itens.includes(nome)) bucket.itens.push(nome);
      });
    });
  });
  const treinamentos = Array.from(treinPorFuncao.values()).map((g) => ({
    funcao: g.nome_funcao,
    nome_funcao: g.nome_funcao,
    treinamentos_funcao: g.itens.join(", "),
    itens_treinamento: g.itens.map((nome, idx) => ({ nome_treinamento: nome, index: idx + 1, is_first: idx === 0, is_rest: idx > 0 })),
    total_itens: g.itens.length,
  }));

  // Cronograma
  const cronograma_arr = (cronograma || []).map((c) => {
    const mesNum = parseInt(c.prazo_mes || "0", 10);
    const mesLabel = mesNum >= 1 && mesNum <= 12 ? MESES_PT[mesNum] : "";
    const prazo = mesLabel && c.prazo_ano ? `${mesLabel}/${c.prazo_ano}` : (c.prazo_ano || "");
    return {
      item_cronograma: c.item || "",
      acao_cronograma: c.acao || "",
      responsavel_cronograma: c.responsavel || "",
      prazo_cronograma: prazo,
      situacao_cronograma: c.situacao || "",
    };
  });

  return {
    // Empresa
    empresa: emp.razao_social || emp.nome_fantasia || "",
    razao_social: emp.razao_social || "",
    nome_fantasia: emp.nome_fantasia || "",
    cnpj: emp.cnpj || "",
    cnae_principal: emp.cnae_principal || "",
    grau_risco: emp.grau_risco || "",
    endereco: emp.endereco || "",
    total_funcionarios: String(emp.total_funcionarios ?? 0),
    jornada_trabalho: emp.jornada_trabalho || "",
    // Identificação PCMSO
    responsavel_tecnico: identificacao.responsavel_tecnico || "",
    crea: identificacao.crea || "",
    cargo: identificacao.cargo || "",
    data_elaboracao: fmtDate(identificacao.data_elaboracao),
    vigencia_inicio: fmtDate(identificacao.vigencia_inicio),
    vigencia_fim: fmtDate(identificacao.vigencia_fim),
    // Loops
    revisoes: (revisoes || []).map((r) => ({
      revisao: r.revisao || "",
      data: fmtDate(r.data),
      motivo: r.motivo || "",
      responsavel: r.responsavel || "",
    })),
    setores: setoresArr,
    epis,
    treinamentos,
    cronograma: cronograma_arr,
  };
}
