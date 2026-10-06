import { describe, expect, it } from "vitest";
import { calcularNivelRiscoAep, obterNivelApresentacao } from "@/lib/aepRisco";

describe("classificação apresentada dos riscos da AEP", () => {
  it("preserva a matriz interna e agrupa somente a apresentação", () => {
    expect(calcularNivelRiscoAep("Baixa", "Leve")).toBe("Trivial");
    expect(calcularNivelRiscoAep("Média", "Leve")).toBe("Moderado");
    expect(calcularNivelRiscoAep("Alta", "Grave")).toBe("Crítico");

    expect(obterNivelApresentacao("Trivial")).toBe("Baixo");
    expect(obterNivelApresentacao("Moderado")).toBe("Médio");
    expect(obterNivelApresentacao("Alto")).toBe("Alto");
    expect(obterNivelApresentacao("Crítico")).toBe("Alto");
  });
});