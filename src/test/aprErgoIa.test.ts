import { describe, expect, it } from "vitest";
import { aplicarPropostaApr, circunstanciaTecnicaApr, aplicarResumoApr, contarConflitosResumoApr, condutaApr, sincronizarCondutaApr, cenariosValidosApr, contarConflitosApr, formulariosCompativeisApr, recalcularLinhaApr, CAMPOS_APR, MAX_BASE_APR } from "../../supabase/functions/_shared/aprErgoIa";
import { ESTIMATIVAS_APR as E, INTENSIDADES_APR as I, SEVERIDADES_APR as S } from "../../supabase/functions/_shared/aprErgoPlanilha";
const linha = (patch = {}) => ({ ...Object.fromEntries(CAMPOS_APR.map((k) => [k, ""])), fotos: [], ...patch }) as Parameters<typeof aplicarPropostaApr>[0][number];
describe("APR-ERGO IA", () => {
  it("remove nomes de função somente do conteúdo gerado", () => {
    expect(circunstanciaTecnicaApr("Operador — Transporte manual com flexão do tronco", ["Operador"])).toBe("Transporte manual com flexão do tronco");
    expect(circunstanciaTecnicaApr("Operador", ["Operador"])).toBe("");
  });
  it("une cenário comum sem separação por função e preserva diferenças técnicas", () => {
    const a = { funcao_ids: ["f1", "f2"], setor_id: "s", circunstancia: "Transporte manual", situacao: "Cargas", exigencia: "Tronco" };
    const diferente = { ...a, funcao_ids: ["f2"], circunstancia: "Transporte acima dos ombros" };
    expect(cenariosValidosApr([a, { ...a, funcao_ids: ["f2"] }, diferente], "s", ["f1", "f2"])).toEqual([a, diferente]);
    expect(cenariosValidosApr([{ ...a, funcao_ids: ["f1", "outra"] }], "s", ["f1", "f2"])).toEqual([]);
    expect(aplicarPropostaApr([], [linha(a)], true)[0].funcao_ids).toEqual(["f1", "f2"]);
  });
  it("preserva texto manual e fotos ao preencher vazios", () => {
    const atual = linha({ circunstancia: "Manual", fotos: ["foto"] });
    expect(aplicarPropostaApr([atual], [linha({ circunstancia: "IA", tipo: "Fisico" })], false)[0]).toMatchObject({ circunstancia: "Manual", tipo: "Fisico", fotos: ["foto"] });
    expect(contarConflitosApr([atual], [linha({ circunstancia: "IA" })])).toBe(1);
  });
  it("substitui somente campos propostos após confirmação e mantém linhas adicionais", () => {
    expect(aplicarPropostaApr([linha({ circunstancia: "Manual", fotos: ["foto"] }), linha({ cenario: "2" })], [linha({ circunstancia: "IA" })], true)).toMatchObject([{ circunstancia: "IA", fotos: ["foto"] }, { cenario: "2" }]);
  });
  it("não atribui marcas de formulário multissetor ou de outra função", () => {
    const form = (setor_ids: string[], funcoes: string[]) => ({ setor_ids, dados: { funcoes } });
    expect(formulariosCompativeisApr([form(["s"], ["f"]), form(["s", "outro"], ["f"]), form(["s"], ["outra"]), form(["outro"], ["f"])], "s", ["f"])).toEqual([form(["s"], ["f"])]);
  });
  it("limita a Base APR a seis arquivos", () => expect(MAX_BASE_APR).toBe(6));
  it("preserva descrições manuais até confirmação de substituição", () => {
    const atual = { atividades: "Descrição manual", ambiente: "", cargo: "Cargo" };
    const proposta = { atividades: "Resumo do setor", ambiente: "Ambiente confirmado" };
    expect(contarConflitosResumoApr(atual, proposta)).toBe(1);
    expect(aplicarResumoApr(atual, proposta, false)).toEqual({ ...atual, ambiente: "Ambiente confirmado" });
    expect(aplicarResumoApr(atual, proposta, true)).toEqual({ ...proposta, cargo: "Cargo" });
  });
  it("conduta administrativa segue exatamente a matriz por nível", () => {
    expect(condutaApr("BAIXO")).toBe("Há medidas de controle eficientes. Devem ser gerenciadas na busca de melhorias contínuas.");
    expect(condutaApr("MÉDIO")).toBe("Devem ser gerenciadas na busca de melhorias contínuas e medidas de controle implementadas.");
    expect(condutaApr("ALTO")).toBe("Faz-se necessária recomendação para o controle da exposição, com investigação da ocorrência do risco e plano de ação (AET + Plano de ação).");
    expect(condutaApr("MUITO ALTO")).toBe(condutaApr("ALTO"));
    expect(condutaApr("SEM RISCO")).toBe("Nenhuma ação é requerida e nenhum registro documental precisa ser mantido.");
    expect(condutaApr("")).toBe("");
  });
  it("Muito Alto contém exclusivamente a conduta, inclusive após recalcular", () => {
    const alta = recalcularLinhaApr(linha({ estimativa: E[4][0], intensidade: I[3][0], severidade: S[4][1], recomendacoes: "Sugestão específica" }));
    expect(alta.classificacao).toBe("MUITO ALTO");
    expect(alta.recomendacoes).toBe(condutaApr("MUITO ALTO"));
    const baixa = recalcularLinhaApr({ ...alta, estimativa: E[0][0], intensidade: I[0][0], severidade: S[0][1] });
    expect(baixa.recomendacoes).toBe(condutaApr("BAIXO"));
    expect(recalcularLinhaApr({ ...baixa, severidade: "" }).recomendacoes).toBe("");
  });
  it("Alto remove qualquer recomendação extra", () => {
    expect(sincronizarCondutaApr("Texto manual e sugestões extras", "ALTO")).toBe(condutaApr("ALTO"));
  });
  it("demais níveis preservam recomendações específicas", () => {
    expect(sincronizarCondutaApr("Ajustar bancada", "MÉDIO")).toBe(`${condutaApr("MÉDIO")}\nAjustar bancada`);
  });
  it("não limita cenários a três por função ou oito por setor", () => {
    const cenarios = Array.from({ length: 30 }, (_, i) => ({ funcao_id: "f", setor_id: "s", circunstancia: `Tarefa real ${i}`, situacao: "Postura", exigencia: "Tronco" }));
    expect(cenariosValidosApr(cenarios, "s", ["f"])).toEqual(cenarios);
  });
  it("remove repetidos, sem fundamento ou vinculados a outra função/setor", () => {
    const c = { funcao_id: "f", setor_id: "s", circunstancia: "Tarefa real", situacao: "Postura", exigencia: "Tronco" };
    expect(cenariosValidosApr([c, { ...c, circunstancia: " TAREFA  REAL " }, { ...c, setor_id: "outro" }, { ...c, funcao_id: "outra" }, { ...c, circunstancia: "" }], "s", ["f"])).toEqual([c]);
  });
  it("preserva o vínculo de cenários e fotos após confirmação", () => {
    const proposta = linha({ funcao_id: "f", funcao_nome: "Operador", setor_id: "s", circunstancia: "Operador — tarefa" });
    expect(aplicarPropostaApr([linha({ fotos: ["foto"] })], [proposta], true)[0]).toMatchObject({ funcao_id: "f", setor_id: "s", fotos: ["foto"] });
  });
  it("não atribui função nova a circunstância manual preservada", () => {
    const atual = linha({ circunstancia: "Atividade manual existente" });
    const proposta = linha({ funcao_id: "f", setor_id: "s", circunstancia: "Outra tarefa" });
    expect(aplicarPropostaApr([atual], [proposta], false)[0].funcao_id).toBeUndefined();
  });
});