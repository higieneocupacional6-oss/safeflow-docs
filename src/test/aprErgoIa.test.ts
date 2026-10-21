import { describe, expect, it } from "vitest";
import { aplicarPropostaApr, aplicarResumoApr, contarConflitosResumoApr, condutaApr, contarConflitosApr, formulariosCompativeisApr, CAMPOS_APR, MAX_BASE_APR } from "../../supabase/functions/_shared/aprErgoIa";
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
  it("aplica apenas a conduta da Base correspondente ao risco calculado", () => {
    const condutas = { BAIXO: "Conduta baixa do arquivo", "MÉDIO": "Conduta média do arquivo", ALTO: "Conduta alta do arquivo", "MUITO ALTO": "Conduta muito alta do arquivo" };
    for (const nivel of ["BAIXO", "MÉDIO", "ALTO", "MUITO ALTO"]) expect(condutaApr(nivel, condutas)).toBe(condutas[nivel as keyof typeof condutas]);
    expect(condutaApr("", condutas)).toBe("");
    expect(condutaApr("ALTO", {})).toBe("");
    expect(condutaApr("CRÍTICO", condutas)).toBe("");
  });
});