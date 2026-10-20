import { describe, expect, it } from "vitest";
import { aplicarPropostaApr, contarConflitosApr, formulariosCompativeisApr, CAMPOS_APR, MAX_BASE_APR } from "../../supabase/functions/_shared/aprErgoIa";
const linha = (patch = {}) => ({ ...Object.fromEntries(CAMPOS_APR.map((k) => [k, ""])), fotos: [], ...patch }) as Parameters<typeof aplicarPropostaApr>[0][number];
describe("APR-ERGO IA", () => {
  it("preserva texto manual e fotos ao preencher vazios", () => {
    const atual = linha({ circunstancia: "Manual", fotos: ["foto"] });
    expect(aplicarPropostaApr([atual], [linha({ circunstancia: "IA", tipo: "Físico" })], false)[0]).toMatchObject({ circunstancia: "Manual", tipo: "Físico", fotos: ["foto"] });
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
});