import { describe, it, expect } from "vitest";
import { sincronizarGruposComCadastro, type GrupoRelatorio } from "@/lib/psicoRelatorio";

const g = (over: Partial<GrupoRelatorio>): GrupoRelatorio => ({
  id: "Adm||01", setor: "Adm", ghe: "01", funcoes: ["Auxiliar"], trabalhadores: 3,
  atividades: "Cadastro atual", jornada: "8h", organizacao: "Org", fatores: [], respondentes: 2, ...over,
});

describe("sincronizarGruposComCadastro", () => {
  it("usa identificação e atividades atuais quando o cadastro mudou", () => {
    const salvo = g({ funcoes: ["Antiga"], trabalhadores: 9, atividades: "Texto editado", atividadesBase: "Cadastro antigo", organizacao: "Editada" });
    const [r] = sincronizarGruposComCadastro([g({ funcoes: ["Auxiliar", "Nova"] })], [salvo]);
    expect(r.funcoes).toEqual(["Auxiliar", "Nova"]);
    expect(r.trabalhadores).toBe(3);
    expect(r.atividades).toBe("Cadastro atual");
    expect(r.organizacao).toBe("Editada");
  });
  it("mantém atividades editadas quando o cadastro não mudou", () => {
    const salvo = g({ atividades: "Texto editado", atividadesBase: "Cadastro atual" });
    expect(sincronizarGruposComCadastro([g({})], [salvo])[0].atividades).toBe("Texto editado");
  });
  it("remove grupos que não existem mais no cadastro", () => {
    const r = sincronizarGruposComCadastro([g({})], [g({ id: "Removido||02" })]);
    expect(r.map((x) => x.id)).toEqual(["Adm||01"]);
  });
});
