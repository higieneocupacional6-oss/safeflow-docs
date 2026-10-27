import { gesOrder } from "@/lib/sortGes";

type UnidadeLtcat = { id: string; simbolo?: string | null; nome?: string | null };

export type SetorGheLtcat = { id?: string | null; ghe_ges?: string | null };

export type MedidaLtcatSalva = {
  resultado: string;
  unidade: string;
  conclusao: string;
  colaborador: string;
};

export type RiscoListagemLtcat = {
  entryId: string;
  itemId: string;
  agenteId: string;
  setorId: string;
  agenteNome: string;
  medidas: MedidaLtcatSalva[];
};

export type FuncaoListagemLtcat = {
  funcaoId: string;
  funcaoNome: string;
  riscos: RiscoListagemLtcat[];
};

export type SetorListagemLtcat = {
  setorId: string;
  setorNome: string;
  gheGes: string;
  funcoes: FuncaoListagemLtcat[];
};

const texto = (value: unknown) => (value == null ? "" : String(value).trim());

/** Título da caixa: "GHE 01: Administrativo" quando o setor tem código gravado. */
export function tituloSetorListagem(gheGes: string, setorNome: string) {
  const codigo = texto(gheGes);
  const nome = texto(setorNome) || "Setor não informado";
  return codigo ? `${codigo}: ${nome}` : nome;
}

const unidadeSalva = (id: unknown, unidades: UnidadeLtcat[], direto?: unknown) => {
  const literal = texto(direto);
  if (literal) return literal;
  const chave = texto(id);
  if (!chave) return "";
  const unidade = unidades.find((item) => item.id === chave);
  return texto(unidade?.simbolo || unidade?.nome);
};

const chaveMedida = (medida: MedidaLtcatSalva) =>
  [medida.resultado, medida.unidade, medida.conclusao, medida.colaborador].join("|");

const rowDaFuncao = (row: any, item: { id?: string; funcao_id?: string }, unico: boolean) => {
  const funcaoId = texto(row?.funcao_id);
  if (funcaoId && funcaoId !== texto(item.funcao_id)) return false;
  if (row?.id && item.id && row.id === item.id) return true;
  if (funcaoId && funcaoId === texto(item.funcao_id)) return true;
  return unico && !funcaoId;
};

const medidasDoItem = (risk: any, item: any, unidades: UnidadeLtcat[]): MedidaLtcatSalva[] => {
  const unico = (risk.items || []).length <= 1;
  const visto = new Set<string>();
  const saida: MedidaLtcatSalva[] = [];
  const add = (parcial: Partial<MedidaLtcatSalva>) => {
    const medida: MedidaLtcatSalva = {
      resultado: texto(parcial.resultado),
      unidade: texto(parcial.unidade),
      conclusao: texto(parcial.conclusao),
      colaborador: texto(parcial.colaborador),
    };
    if (!medida.resultado && !medida.unidade && !medida.conclusao) return;
    const chave = chaveMedida(medida);
    if (visto.has(chave)) return;
    visto.add(chave);
    saida.push(medida);
  };

  for (const row of risk.resultados_detalhados || []) {
    if (!rowDaFuncao(row, item, unico)) continue;
    add({
      resultado: texto(row.resultado),
      unidade: unidadeSalva(row.unidade_resultado_id, unidades, row.unidade || row.unidade_resultado),
      conclusao: texto(row.situacao),
      colaborador: texto(row.colaborador),
    });
  }
  for (const row of risk.resultados_calor || []) {
    if (!rowDaFuncao(row, item, unico)) continue;
    add({
      resultado: texto(row.ibutg_resultado ?? row.ibutg_medido ?? row.exposicao),
      unidade: unidadeSalva(row.unidade_resultado_id, unidades, row.unidade),
      conclusao: texto(row.situacao),
      colaborador: texto(row.colaborador),
    });
  }
  for (const row of risk.resultados_vibracao || []) {
    if (!rowDaFuncao(row, item, unico)) continue;
    const partes = [
      texto(row.aren_resultado ?? row.aren) ? `AREN ${texto(row.aren_resultado ?? row.aren)}` : "",
      texto(row.vdvr_resultado ?? row.vdvr) ? `VDVR ${texto(row.vdvr_resultado ?? row.vdvr)}` : "",
    ].filter(Boolean);
    add({
      resultado: partes.join(" · "),
      unidade: unidadeSalva(row.unidade_resultado_id, unidades, row.unidade),
      conclusao: texto(row.situacao),
      colaborador: texto(row.colaborador),
    });
  }
  for (const row of risk.resultados_componentes || []) {
    if (!rowDaFuncao(row, item, unico)) continue;
    const componentes = Array.isArray(row.componentes) && row.componentes.length ? row.componentes : [row];
    for (const componente of componentes) {
      const nome = texto(componente.componente || componente.componente_avaliado || row.componente);
      const resultado = texto(componente.resultado ?? row.resultado);
      if (!resultado && !texto(componente.situacao || row.situacao)) continue;
      add({
        resultado: nome && resultado ? `${nome}: ${resultado}` : resultado || nome,
        unidade: unidadeSalva(componente.unidade_resultado_id || row.unidade_resultado_id, unidades, componente.unidade || row.unidade),
        conclusao: texto(componente.situacao || row.situacao),
        colaborador: texto(row.colaborador),
      });
    }
  }
  if (!saida.length) {
    add({
      resultado: texto(risk.resultado),
      unidade: unidadeSalva(risk.unidade_resultado_id, unidades),
      conclusao: "",
      colaborador: texto(item.colaborador),
    });
  }
  return saida;
};

/** Caixas da listagem LTCAT: setor → função → riscos, só com valores já gravados. */
export function montarListagemLtcat(
  riscos: any[],
  unidades: UnidadeLtcat[] = [],
  setoresCadastro: SetorGheLtcat[] = [],
): SetorListagemLtcat[] {
  const ghePorSetor = new Map(setoresCadastro.map((setor) => [texto(setor.id), texto(setor.ghe_ges)]));
  const setores = new Map<string, SetorListagemLtcat>();
  for (const risk of riscos || []) {
    const setorId = texto(risk?.setor_id) || "sem-setor";
    const gheGes = ghePorSetor.get(setorId) || texto(risk?.ghe_ges);
    let setor = setores.get(setorId);
    if (!setor) {
      setor = { setorId, setorNome: texto(risk?.setor_nome) || "Setor não informado", gheGes, funcoes: [] };
      setores.set(setorId, setor);
    } else {
      if (setor.setorNome === "Setor não informado" && texto(risk?.setor_nome)) setor.setorNome = texto(risk.setor_nome);
      if (!setor.gheGes && gheGes) setor.gheGes = gheGes;
    }
    for (const item of risk?.items || []) {
      const funcaoId = texto(item?.funcao_id) || texto(item?.id) || "sem-funcao";
      let funcao = setor.funcoes.find((atual) => atual.funcaoId === funcaoId);
      if (!funcao) {
        funcao = { funcaoId, funcaoNome: texto(item?.funcao_nome) || "Função não informada", riscos: [] };
        setor.funcoes.push(funcao);
      } else if (funcao.funcaoNome === "Função não informada" && texto(item?.funcao_nome)) {
        funcao.funcaoNome = texto(item.funcao_nome);
      }
      funcao.riscos.push({
        entryId: texto(risk.id),
        itemId: texto(item?.id) || texto(risk.id),
        agenteId: texto(risk.agente_id),
        setorId,
        agenteNome: texto(risk.agente_nome) || "Risco não informado",
        medidas: medidasDoItem(risk, item, unidades),
      });
    }
  }
  const porNome = (a: string, b: string) => a.localeCompare(b, "pt-BR");
  return Array.from(setores.values())
    .map((setor) => ({
      ...setor,
      funcoes: setor.funcoes
        .map((funcao) => ({ ...funcao, riscos: [...funcao.riscos].sort((a, b) => porNome(a.agenteNome, b.agenteNome)) }))
        .sort((a, b) => porNome(a.funcaoNome, b.funcaoNome)),
    }))
    .sort((a, b) => gesOrder(a.gheGes) - gesOrder(b.gheGes) || porNome(a.setorNome, b.setorNome));
}
