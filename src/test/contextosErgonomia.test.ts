import { describe, expect, it } from "vitest";
import { selecionarGrupoPsicossocial } from "@/lib/psicoContexto";
import { selecionarSetorAep } from "@/lib/aepContexto";

describe("contextos Psicossocial → AEP → AET", () => {
  it("seleciona grupo psicossocial por setor, GHE e função", () => {
    const grupos = [
      { setor: "Produção", ghe: "GHE 01", funcoes: ["Operador"] },
      { setor: "Produção", ghe: "GHE 02", funcoes: ["Supervisor"] },
    ];
    expect(selecionarGrupoPsicossocial(grupos, { setorNome: "produção", ghe: "ghe 02", funcoes: ["Supervisor"] }))
      .toEqual(grupos[1]);
  });

  it("não usa grupo de função diferente", () => {
    const grupos = [{ setor: "Produção", ghe: "GHE 01", funcoes: ["Operador"] }];
    expect(selecionarGrupoPsicossocial(grupos, { setorNome: "Produção", ghe: "GHE 01", funcoes: ["Analista"] }))
      .toBeNull();
  });

  it("prioriza na AEP o ID do setor e exige função correspondente", () => {
    const docs = [{ id: "doc", updated_at: "2026-01-01", setores: [
      { setor_id: "s1", setor_nome: "Produção", ges: "GHE 01", funcoes_selecionadas: [{ nome: "Operador" }] },
      { setor_id: "s2", setor_nome: "Produção", ges: "GHE 01", funcoes_selecionadas: [{ nome: "Analista" }] },
    ] }];
    expect(selecionarSetorAep(docs, { setorId: "s2", setorNome: "Produção", ghe: "GHE 01", funcoes: ["Analista"] })?.setor.setor_id)
      .toBe("s2");
    expect(selecionarSetorAep(docs, { setorId: "s2", funcoes: ["Médico"] })).toBeNull();
  });
});