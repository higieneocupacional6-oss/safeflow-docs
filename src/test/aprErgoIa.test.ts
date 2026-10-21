import { describe, expect, it } from "vitest";
import { aplicarPropostaApr, aplicarResumoApr, contarConflitosResumoApr, condutaApr, contarConflitosApr, formulariosCompativeisApr, recalcularLinhaApr, CAMPOS_APR, MAX_BASE_APR } from "../../supabase/functions/_shared/aprErgoIa";
import { ESTIMATIVAS_APR as E, INTENSIDADES_APR as I, SEVERIDADES_APR as S } from "../../supabase/functions/_shared/aprErgoPlanilha";
const linha = (patch = {}) => ({ ...Object.fromEntries(CAMPOS_APR.map((k) => [k, ""])), fotos: [], ...patch }) as Parameters<typeof aplicarPropostaApr>[0][number];
describe("APR-ERGO IA", () => {
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
  it("conduta acompanha a classificação recalculada e preserva o texto restante", () => {
    const alta = recalcularLinhaApr(linha({ estimativa: E[4][0], intensidade: I[3][0], severidade: S[4][1], recomendacoes: "Sugestão específica" }));
    expect(alta.classificacao).toBe("MUITO ALTO");
    expect(alta.recomendacoes).toBe(`${condutaApr("MUITO ALTO")}\nSugestão específica`);
    const baixa = recalcularLinhaApr({ ...alta, estimativa: E[0][0], intensidade: I[0][0], severidade: S[0][1] });
    expect(baixa.recomendacoes).toBe(`${condutaApr("BAIXO")}\nSugestão específica`);
    expect(recalcularLinhaApr({ ...baixa, severidade: "" }).recomendacoes).toBe("Sugestão específica");
  });
});