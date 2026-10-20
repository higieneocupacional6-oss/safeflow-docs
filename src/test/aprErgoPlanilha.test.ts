import { describe, expect, it } from "vitest";
import { perfilApr, classificacaoApr, ESTIMATIVAS_APR as E, INTENSIDADES_APR as I, SEVERIDADES_APR as S, TIPOS_APR, SITUACOES_APR } from "../../supabase/functions/_shared/aprErgoPlanilha";
import { classificacoesSalvasApr } from "../../supabase/functions/_shared/aprErgoIa";
describe("APR-ERGO conforme planilha Anexo 03", () => {
  it("perfil = tempo × intensidade na Tabela M:O", () => {
    expect(perfilApr(E[0][0], I[0][0])).toBe("Remota");
    expect(perfilApr(E[2][0], I[2][0])).toBe("Ocasional"); // 9
    expect(perfilApr(E[4][0], I[3][0])).toBe("Frequente"); // 20
    expect(perfilApr(E[4][0], I[4][0])).toBe("Frequente"); // incerta tem índice 4
    expect(perfilApr("", I[0][0])).toBe("");
  });
  it("classificação = perfil × severidade na Tabela U:V", () => {
    expect(classificacaoApr("Remota", S[0][1])).toBe("BAIXO");
    expect(classificacaoApr("Pouco Provável", S[4][1])).toBe("MÉDIO");
    expect(classificacaoApr("Ocasional", S[3][1])).toBe("MÉDIO");
    expect(classificacaoApr("Provável", S[4][1])).toBe("MUITO ALTO");
    expect(classificacaoApr("Frequente", S[2][1])).toBe("ALTO");
    expect(classificacaoApr("Remota", "")).toBe("");
  });
  it("mantém listas da planilha", () => {
    expect(TIPOS_APR).toEqual(["Fisico", "Organizacional", "Cognitivo", "Ambiental"]);
    expect(SITUACOES_APR).toHaveLength(12);
  });
  it("transfere apenas marcas AEP únicas para opções da planilha", () => {
    expect(classificacoesSalvasApr({ D2: "X", I5: "X", A1: "X" })).toEqual({ estimativa: E[1][0], intensidade: I[4][0] });
    expect(classificacoesSalvasApr({ D1: "X", D2: "X" }).estimativa).toBe("");
  });
});
