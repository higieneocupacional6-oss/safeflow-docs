import { describe, expect, it } from "vitest";
import { selecionarGrupoPsicossocial } from "@/lib/psicoContexto";
import { selecionarSetorAep } from "@/lib/aepContexto";
import { extrairFocoAep } from "../../supabase/functions/_shared/aepAprofundamento";

describe("contextos Psicossocial → AEP → AET", () => {
  it("rejeita setor e GHE conflitantes mesmo com nome ou função iguais", () => {
    const docs = [{ setores: [{ setor_id: "outro", setor_nome: "Produção", ges: "02", funcoes_selecionadas: [{ id: "f1", nome: "Operador" }] }] }];
    expect(selecionarSetorAep(docs, { setorId: "s1", setorNome: "Produção", ghe: "02", funcoes: ["Operador"] })).toBeNull();
    expect(selecionarSetorAep(docs, { setorId: "outro", ghe: "01", funcoes: ["Operador"] })).toBeNull();
  });

  it("prioriza IDs de função e exige cobertura de todas as funções do alvo", () => {
    const docs = [{ setores: [{ setor_id: "s1", funcoes_selecionadas: [{ id: "f1", nome: "Operador" }] }] }];
    expect(selecionarSetorAep(docs, { setorId: "s1", funcaoIds: ["removida"], funcoes: ["Operador"] })).toBeNull();
    expect(selecionarSetorAep(docs, { setorId: "s1", funcaoIds: ["f1"], funcoes: ["Nome atualizado"] })).not.toBeNull();
    expect(selecionarSetorAep(docs, { setorId: "s1", funcoes: ["Operador", "Supervisor"] })).toBeNull();
  });

  it("seleciona a AEP compatível mais recente sem alterar a fonte", () => {
    const setor = { setor_id: "s1", ges: "01", funcoes_selecionadas: [{ id: "f1" }] };
    const docs = [{ id: "antiga", updated_at: "2026-01-01", setores: [setor] }, { id: "nova", updated_at: "2026-10-06", setores: [setor] }];
    const antes = JSON.stringify(docs);
    expect(selecionarSetorAep(docs, { setorId: "s1", ghe: "01", funcaoIds: ["f1"] })?.documento.id).toBe("nova");
    expect(JSON.stringify(docs)).toBe(antes);
  });

  it("interpreta NÃO como ausência de solução rápida e mantém o motivo registrado", () => {
    const s = { conduta_1: "SIM", conduta_2: "NÃO", parecer_conduta_2: "Investigar repetitividade e ausência de pausas", riscos_lista: [{ fator: "Repetitividade" }], checklist: { organizacao: { condicao: "Inadequado" } } };
    const antes = JSON.stringify(s);
    const foco = extrairFocoAep(s);
    expect(foco.indicacao_aet).toBe("recomendada");
    expect(foco.motivo_registrado).toBe(s.parecer_conduta_2);
    expect(foco.fatores_identificados).toEqual(s.riscos_lista);
    expect(JSON.stringify(s)).toBe(antes);
    expect(extrairFocoAep({ conduta_2: "SIM" }).indicacao_aet).toBe("solucao_preliminar_indicada");
    expect(extrairFocoAep({}).indicacao_aet).toBe("nao_informada");
  });
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