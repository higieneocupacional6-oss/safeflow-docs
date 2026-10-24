import { describe, expect, it } from "vitest";
import {
  ORIGENS_DEMANDA, criarRegistroAetVale, dadosVaziosAetVale,
  funcaoDoRegistroAetVale, riscosAepAltos, setorDoRegistroAetVale, type AetValeSetor,
} from "@/lib/aetVale";

const setor: AetValeSetor = {
  id: "s1",
  empresa_id: "e1",
  contrato_id: "c1",
  nome_setor: "GERE 01",
  ghe_ges: "GHE 01",
  funcoes: [
    { id: "f1", nome_funcao: "Operador" },
    { id: "f2", nome_funcao: "Supervisor" },
  ],
};

describe("criarRegistroAetVale", () => {
  it("rejeita setor de outra empresa ou contrato", () => {
    expect(() => criarRegistroAetVale(setor, "outra", "c1", "Empresa", "r1", "f1")).toThrow();
    expect(() => criarRegistroAetVale(setor, "e1", "outro", "Empresa", "r1", "f1")).toThrow();
  });

  it("rejeita função que não pertence ao setor", () => {
    expect(() => criarRegistroAetVale(setor, "e1", "c1", "Empresa", "r1", "fX")).toThrow();
  });

  it("cria registro vinculado a empresa, contrato, setor e função", () => {
    const r = criarRegistroAetVale(setor, "e1", "c1", "Empresa", "r1", "f2");
    expect(r.tipo).toBe("AET-VALE");
    expect(r.status).toBe("rascunho");
    expect(r.empresa_id).toBe("e1");
    expect(r.contrato_id).toBe("c1");
    expect(setorDoRegistroAetVale(r.draft_snapshot)).toBe("s1");
    expect(funcaoDoRegistroAetVale(r.draft_snapshot)).toBe("f2");
    expect(r.nome_documento).toContain("Supervisor");
    expect(r.draft_snapshot.dados.cargo).toBe("Supervisor");
  });
});

describe("riscosAepAltos", () => {
  const riscos = [
    { tipo_agente: "Físico", fator_risco: "Postura", nivel_risco: "Trivial", justificativa: "j1", medidas: "m1" },
    { tipo_agente: "Físico", fator_risco: "Esforço", nivel_risco: "Moderado", justificativa: "j2", medidas: "m2" },
    { tipo_agente: "Cognitivo", fator_risco: "Atenção", nivel_risco: "Alto", justificativa: "j3", medidas: "m3" },
    { tipo_agente: "Psicossocial", fator_risco: "Prazos", nivel_risco: "Crítico", justificativa: "j4", medidas: "m4" },
    { tipo_agente: "", fator_risco: "", nivel_risco: "", justificativa: "", medidas: "" },
  ];

  it("mantém apenas Alto e Crítico (Muito Alto), preservando os campos originais", () => {
    const altos = riscosAepAltos(riscos);
    expect(altos).toHaveLength(2);
    expect(altos[0]).toEqual(riscos[2]);
    expect(altos[1]).toEqual(riscos[3]);
  });

  it("não inventa dados quando não há registros", () => {
    expect(riscosAepAltos(undefined)).toEqual([]);
    expect(riscosAepAltos("texto")).toEqual([]);
  });
});

describe("configuração do formulário", () => {
  it("origens de demanda seguem a lista definida", () => {
    expect(ORIGENS_DEMANDA).toEqual(["Gestor", "Gestão de mudanças", "Inspeção", "Incidente", "SST", "Jurídica", "Outros"]);
  });

  it("dados vazios começam com dois espaços de foto", () => {
    expect(dadosVaziosAetVale().fotos).toEqual([{ imagem: "", descricao: "" }, { imagem: "", descricao: "" }]);
  });
});
