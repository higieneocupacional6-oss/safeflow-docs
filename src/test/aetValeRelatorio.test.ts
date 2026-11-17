import { describe, expect, it } from "vitest";
import { diagnosticoVale, planoVale } from "../../supabase/functions/_shared/aetValeIa";

const f = (id: string, classificacao: string) => ({ id, classificacao });
describe("AET VALE — diagnóstico e plano", () => {
  it("diagnóstico só para fatores Alto", () => {
    expect([f("a","Alto"), f("b","Muito Alto"), f("c","Médio")].filter(diagnosticoVale).map(x => x.id)).toEqual(["a"]);
  });
  it("plano só para riscos Alto/Muito Alto dos Dados da AEP", () => {
    const aep = [f("a","Alto"), f("b","Muito Alto")];
    expect(planoVale([{ fator_id: "a" }, { fator_id: "b" }, { fator_id: "c" }], aep).map(x => x.fator_id)).toEqual(["a","b"]);
  });
});
