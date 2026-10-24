import { describe, expect, it } from "vitest";
import { aplicarPropostaVale, fatoresVale, exigeDiagnostico, etapa2Vazia, type PropostaVale } from "../../supabase/functions/_shared/aetValeIa";
const alvo = { setorId: "s1", funcaoId: "f1", funcaoNome: "Operador", setorNome: "Setor" };
describe("AET VALE IA", () => {
  it("lê a tabela persistida e mantém diagnóstico após reordenar cenários", () => {
    const linhas = [{ cenario: "1", circunstancia: "Carga", situacao: "Movimentação", exigencia: "Esforço", classificacao: "Alto" }, { cenario: "2", circunstancia: "Postura", situacao: "Em pé", exigencia: "Estática", classificacao: "Médio" }];
    const doc = (rs: typeof linhas) => [{ id: "apr", draft_snapshot: { setor_id: "s1", funcao_id: "f1", tabela: { linhas: rs } } }];
    const antes = fatoresVale(doc(linhas), [], alvo);
    const depois = fatoresVale(doc([...linhas].reverse().map((r,i) => ({ ...r, cenario: String(i+1) }))), [], alvo);
    expect(antes).toHaveLength(2);
    expect(depois.find(f => f.circunstancia === "Carga")?.id).toBe(antes[0].id);
  });
  it("não limita cenários fundamentados a três por função", () => {
    const linhas = Array.from({ length: 14 }, (_,i) => ({ circunstancia: `Condição técnica ${i}`, situacao: "Postura" }));
    expect(fatoresVale([{ id: "apr", draft_snapshot: { setor_id: "s1", funcao_id: "f1", tabela: { linhas } } }], [], alvo)).toHaveLength(14);
  });
  it("somente riscos da função e setor exatos", () => {
    const docs = [{ id: "d1", draft_snapshot: { setor_id: "s1", funcao_id: "f1", linhas: [{ cenario: "1", circunstancia: "Transporte", classificacao: "Alto" }, { cenario: "2", funcao_id: "f2", circunstancia: "Inspeção" }] } }, { id: "d2", draft_snapshot: { setor_id: "s2", funcao_id: "f1", linhas: [{ circunstancia: "Outra" }] } }];
    expect(fatoresVale(docs, [], alvo).map(f => f.circunstancia)).toEqual(["Transporte"]);
  });
  it("preserva classificações e perfil original da APR", () => {
    const fatores = fatoresVale([{ id: "d1", draft_snapshot: { setor_id: "s1", funcao_id: "f1", linhas: [{ perfil: "12", severidade: "D", classificacao: "Muito Alto" }] } }], [], alvo);
    expect(fatores[0]).toMatchObject({ perfil: "12", severidade: "D", classificacao: "Muito Alto" });
  });
  it("diagnóstico para Médio Alto Muito Alto, não Baixo", () => {
    expect(["Médio", "Alto", "Muito Alto", "Baixo"].map(exigeDiagnostico)).toEqual([true, true, true, false]);
  });
  const proposta: PropostaVale = { etapa1: { descricao_cargo: "Proposto" }, origens: [], etapa2: { ...etapa2Vazia(), textos: { posto: "Novo", mobiliario: "Bancada" }, diagnosticos: { r1: "Novo diagnóstico" }, plano: [{ fator_id: "r1", o_que: "Elevador", por_que: "Reduzir esforço", onde: "Posto", quem: "Engenharia", quando: "Proposto", como: "Instalar", quanto: "A orçar" }] }, confirmacoes: [] };
  it("preenche todas as etapas sem sobrescrever manual ou fotos", () => {
    const atual = { descricao_cargo: "Manual", origens: [], etapa2: { ...etapa2Vazia(), textos: { posto: "Manual posto" }, fotos: [{ imagem: "foto", descricao: "Minha foto" }], diagnosticos: { r1: "Manual diagnóstico" } } };
    const resultado = aplicarPropostaVale(atual, proposta, false);
    expect(resultado.descricao_cargo).toBe("Manual"); expect(resultado.etapa2.textos).toEqual({ posto: "Manual posto", mobiliario: "Bancada" });
    expect(resultado.etapa2.diagnosticos.r1).toBe("Manual diagnóstico"); expect(resultado.etapa2.plano).toHaveLength(1); expect(resultado.etapa2.fotos).toEqual(atual.etapa2.fotos);
    expect(atual.etapa2.textos).toEqual({ posto: "Manual posto" });
  });
  it("autorização substitui somente textos sem perder fotos", () => {
    const atual = { descricao_cargo: "Manual", origens: [], etapa2: { ...etapa2Vazia(), fotos: [{ imagem: "foto", descricao: "descrição" }] } };
    const r = aplicarPropostaVale(atual, proposta, true);
    expect(r.descricao_cargo).toBe("Proposto"); expect(r.etapa2.fotos).toEqual(atual.etapa2.fotos);
  });
});