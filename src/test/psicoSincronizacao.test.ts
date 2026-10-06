import { describe, it, expect } from "vitest";
import { construirGrupos, sincronizarGruposComCadastro, type GrupoRelatorio, type VinculoFuncao } from "@/lib/psicoRelatorio";

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
  it("inclui GERE 08 e 09 sem inventar fatores na ausência de respostas", () => {
    const cadastro = new Map<string, VinculoFuncao>([
      ["sst", { funcaoId: "sst", funcaoNome: "Técnico em Segurança do Trabalho", setor: "SESMT/SST", ghe: "GERE 08", expostos: 2, atividades: "Inspeções" }],
      ["adm", { funcaoId: "adm", funcaoNome: "Auxiliar Administrativo", setor: "Administrativo", ghe: "GERE 09", expostos: 3, atividades: "Registros" }],
    ]);
    const grupos = construirGrupos([], cadastro, "8h");
    expect(grupos.map((g) => g.ghe)).toEqual(["GERE 08", "GERE 09"]);
    expect(grupos.map((g) => g.funcoes)).toEqual([["Técnico em Segurança do Trabalho"], ["Auxiliar Administrativo"]]);
    expect(grupos.every((g) => !g.fatores.length && g.respondentes === 0)).toBe(true);
  });
  it("usa IDs para nomes repetidos e não recupera ID excluído pelo nome", () => {
    const cadastro = new Map<string, VinculoFuncao>([
      ["1", { funcaoId: "1", funcaoNome: "Analista", setor: "A", ghe: "01", expostos: 1, atividades: "Nova" }],
      ["2", { funcaoId: "2", funcaoNome: "Analista", setor: "B", ghe: "02", expostos: 2, atividades: "Outra" }],
    ]);
    const grupos = construirGrupos([
      { funcao_id: "2", funcao_nome: "Nome antigo", respostas: {} },
      { funcao_id: "removida", funcao_nome: "Analista", respostas: {} },
      { funcao_nome: "Analista", respostas: {} },
    ], cadastro, "8h");
    expect(grupos.map((g) => g.respondentes)).toEqual([0, 1]);
    expect(grupos[1].funcoes).toEqual(["Analista"]);
  });
  it("não recupera fatores salvos de grupo agora sem respostas", () => {
    const atual = g({ respondentes: 0 });
    const salvo = g({ atividadesBase: "Outra", fatores: [{ key: "exigencias" } as any] });
    expect(sincronizarGruposComCadastro([atual], [salvo])[0].fatores).toEqual([]);
  });
});
