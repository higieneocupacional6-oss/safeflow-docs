import { describe, expect, it } from "vitest";
import { limparSaidaTecnica, limparTextoTecnico } from "../../supabase/functions/_shared/redacaoTecnica";

describe("Redação técnica AEP/AET", () => {
  it("remove frases que expõem fonte ou pendência", () => {
    const t = "A atividade exige flexão de tronco recorrente. Não há avaliação de iluminância, sendo necessário avaliar. Conforme cadastro, o turno é diurno.";
    expect(limparTextoTecnico(t)).toBe("A atividade exige flexão de tronco recorrente.");
  });
  it("não esvazia o campo", () => {
    expect(limparTextoTecnico("Não informado.")).toBe("Não informado.");
  });
  it("percorre objetos e listas", () => {
    const o = limparSaidaTecnica({ a: ["Ritmo elevado imposto pela demanda. Deve ser avaliado em campo."], n: 3 });
    expect(o).toEqual({ a: ["Ritmo elevado imposto pela demanda."], n: 3 });
  });
});
