import { describe, expect, it } from "vitest";
import { calcularNivelRiscoAep, nivelRiscoAepApresentacao } from "@/lib/aepRisco";

describe("classificação apresentada dos riscos da AEP", () => {
  it("preserva a matriz interna e agrupa somente a apresentação", () => {
    expect(calcularNivelRiscoAep("Baixa", "Leve")).toBe("Trivial");
    expect(calcularNivelRiscoAep("Média", "Leve")).toBe("Moderado");
    expect(calcularNivelRiscoAep("Alta", "Grave")).toBe("Crítico");

    expect(nivelRiscoAepApresentacao("Trivial")).toBe("Baixo");
    expect(nivelRiscoAepApresentacao("Moderado")).toBe("Médio");
    expect(nivelRiscoAepApresentacao("Alto")).toBe("Alto");
    expect(nivelRiscoAepApresentacao("Crítico")).toBe("Alto");
  });
});