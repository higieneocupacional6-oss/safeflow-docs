import { describe, expect, it } from "vitest";
import { criarRegistroAprErgo, setoresAprErgoDoContrato, setorDoRegistroAprErgo } from "@/lib/aprErgo";

const setor = { id: "s1", empresa_id: "e1", contrato_id: "c1", nome_setor: "Operação", ghe_ges: "GHE 01", funcoes: [{ id: "f1", nome_funcao: "Operador" }, { id: "f2", nome_funcao: "Supervisor" }] };
describe("APR-ERGO — vínculos e registros", () => {
  it("seleciona somente setores da empresa e contrato exatos, preservando todas as funções", () => {
    expect(setoresAprErgoDoContrato([setor, { ...setor, id: "s2", empresa_id: "e2" }, { ...setor, id: "s3", contrato_id: "c2" }], "e1", "c1")).toEqual([setor]);
    expect(setoresAprErgoDoContrato([setor], "e1", "c1")[0].funcoes.map((f) => f.id)).toEqual(["f1", "f2"]);
  });
  it("permite mais de uma APR-ERGO no mesmo setor sem duplicar seu cadastro", () => {
    const a = criarRegistroAprErgo(setor, "e1", "c1", "Empresa", "r1", "f1");
    const b = criarRegistroAprErgo(setor, "e1", "c1", "Empresa", "r2", "f2");
    expect(a.id).not.toBe(b.id);
    expect(a.draft_snapshot).toEqual({ setor_id: "s1", funcao_id: "f1" });
    expect(b.draft_snapshot).toEqual({ setor_id: "s1", funcao_id: "f2" });
    expect(a.status).toBe("rascunho");
    expect(setorDoRegistroAprErgo(a.draft_snapshot)).toBe("s1");
  });
  it("rejeita função de outro setor", () => {
    expect(() => criarRegistroAprErgo(setor, "e1", "c1", "Empresa", "r1", "fx")).toThrow();
  });
  it("rejeita registro com empresa ou contrato incompatível", () => {
    expect(() => criarRegistroAprErgo(setor, "e2", "c1", "Empresa", "r1", "f1")).toThrow();
    expect(() => criarRegistroAprErgo(setor, "e1", "c2", "Empresa", "r1", "f1")).toThrow();
  });
});