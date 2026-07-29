import { describe, it, expect } from "vitest";
import { riscoExiste, sanitizeRisco, sanitizeSetores } from "@/lib/riscoContext";

describe("riscoContext", () => {
  it("descarta risco sem avaliação e sem info técnica", () => {
    expect(riscoExiste({ agente_nome: "Calor", avaliacoes: [] })).toBe(false);
  });

  it("aceita risco qualitativo com info técnica", () => {
    expect(riscoExiste({ agente_nome: "Fungos", fonte_geradora: "Resíduos" })).toBe(true);
  });

  it("remove coleções vazias e flags falsas", () => {
    const r = sanitizeRisco({
      agente_nome: "Ruído",
      avaliacoes: [{ resultado: "85" }, {}],
      epis: [],
      is_calor: false,
      is_ruido: true,
      exibir_media_ibutg: false,
    } as any);
    expect((r as any).epis).toBeUndefined();
    expect((r as any).is_calor).toBeUndefined();
    expect((r as any).exibir_media_ibutg).toBeUndefined();
    expect((r as any).is_ruido).toBe(true);
    expect((r as any).avaliacoes).toHaveLength(1);
  });

  it("remove setor cujos riscos não existem", () => {
    const out = sanitizeSetores([
      { nome_setor: "GHE 1", riscos: [{ agente_nome: "Ruído", avaliacoes: [{ resultado: "85" }] }] },
      { nome_setor: "GHE 2", riscos: [{ agente_nome: "Calor", avaliacoes: [] }] },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].nome_setor).toBe("GHE 1");
  });
});
