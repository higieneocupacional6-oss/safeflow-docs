import { describe, it, expect } from "vitest";
import { mapearProbabilidadeParaAep, mapearSeveridadeParaAep, mapearPsicoParaAep } from "../lib/psicoMapeamentoErgonomia";
import { type GrupoRelatorio, type FatorRisco } from "../lib/psicoRelatorio";

describe("Mapeamento Psicossocial -> AEP", () => {
  it("deve converter escalas 1-4 para 1-3 corretamente", () => {
    expect(mapearProbabilidadeParaAep(1)).toBe("Baixa");
    expect(mapearProbabilidadeParaAep(2)).toBe("Média");
    expect(mapearProbabilidadeParaAep(3)).toBe("Alta");
    expect(mapearProbabilidadeParaAep(4)).toBe("Alta");
    
    expect(mapearSeveridadeParaAep(1)).toBe("Leve");
    expect(mapearSeveridadeParaAep(2)).toBe("Moderada");
    expect(mapearSeveridadeParaAep(3)).toBe("Grave");
    expect(mapearSeveridadeParaAep(4)).toBe("Grave");
  });

  it("deve incluir todos os riscos sustentados, inclusive os baixos", () => {
    const mockFator: FatorRisco = {
      key: "exigencias",
      fator: "Exigências Quantitativas",
      descricao: "Desc",
      fonte: "Fonte X",
      situacao: "Sit Y",
      expostos: 10,
      frequencia: "Habitual",
      probabilidade: 3,
      severidade: 2,
      nivel: "Alto",
      consequencias: "Danos Z",
      controles: "Controles W",
      media: 70,
      sustentado: true,
      interpretacao: "Interp"
    };

    const mockGrupo: GrupoRelatorio = {
      id: "setor||ghe",
      setor: "Produção",
      ghe: "GHE 01",
      funcoes: ["Operador"],
      trabalhadores: 10,
      atividades: "Ativ",
      jornada: "44h",
      organizacao: "Org",
      fatores: [
        mockFator,
        { ...mockFator, fator: "Apoio social", probabilidade: 1, severidade: 1, sustentado: true, nivel: "Baixo" },
        { ...mockFator, fator: "Não sustentado", sustentado: false, nivel: "Baixo" },
      ],
      respondentes: 5
    };

    const resultado = mapearPsicoParaAep(mockGrupo, []);
    expect(resultado).toHaveLength(2);
    expect(resultado[0].fator_risco).toBe("Psicossocial: Exigências Quantitativas");
    expect(resultado[0].probabilidade).toBe("Alta");
    expect(resultado[0].severidade).toBe("Moderada");
    expect(resultado[0].nivel_risco).toBe("Alto");
    expect(resultado[0].justificativa).toContain("Sit Y");
    expect(resultado[1].fator_risco).toBe("Psicossocial: Apoio social");
    expect(resultado[1].nivel_risco).toBe("Trivial");
  });
});
