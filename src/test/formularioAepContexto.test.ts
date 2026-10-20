import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { resumirFormularioAep } from "@/lib/formularioAepContexto";
import { INTENSIDADE } from "@/components/formulario-aep/EtapaReconhecimento";

describe("Formulário AEP", () => {
  it("intensidade incerta é nível 5", () => {
    expect(INTENSIDADE[4].startsWith("5 - Quando não é possível")).toBe(true);
  });
  it("resume classificações de formulário salvo", () => {
    const r = resumirFormularioAep({
      funcoes: ["f1"], atividades: [{ texto: "Op – corte" }, { texto: "" }],
      reconhecimento: { marcas: { "04.05.001": { D3: "X", I4: "X", A1: "X" }, "04.01.002": {} } },
    });
    expect(r.fatores).toEqual([{ codigo: "04.05.001", duracao: 3, intensidade: 4, atividades_ids: [1] }]);
    expect(r.atividades).toEqual([{ id: 1, texto: "Op – corte" }]);
  });
});
